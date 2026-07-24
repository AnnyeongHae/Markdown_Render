"use strict";

// fail clearly if core engine didn't load (e.g., opened from file:// where a browser blocked vendor)
if(!window.markdownit || !window.MDCore){
  document.addEventListener('DOMContentLoaded',function(){ var t=document.getElementById('toast'); if(t){ t.textContent='엔진 로드 실패 — 로컬 서버(python -m http.server)로 실행하세요'; t.classList.add('show'); } });
  throw new Error('core libs missing');
}

// ---------- pure logic from lib/core.js ----------
const C = window.MDCore;
const { keyOf, pathKey, resolveImageSrc, preprocessObsidian, stripAbsolutePaths, detectEncoding, hasCodeFence, hasMath, hasMermaid } = C;

// ---------- lazy loader (vendor first, CDN fallback) ----------
const VENDOR = {
  hljs:'vendor/highlight.min.js', jszip:'vendor/jszip.min.js', docx:'vendor/html-docx.js', png:'vendor/html-to-image.js',
  katex:'vendor/katex/katex.min.js', katexAuto:'vendor/katex/auto-render.min.js', mermaid:'vendor/mermaid.min.js'
};
const CDN = {
  hljs:'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js',
  jszip:'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  docx:'https://cdn.jsdelivr.net/npm/html-docx-js@0.3.1/dist/html-docx.js',
  png:'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js',
  katex:'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js',
  katexAuto:'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js',
  mermaid:'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js'
};
function injectScript(src){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.async=true; s.onload=()=>res(); s.onerror=()=>rej(new Error('load fail '+src)); document.head.appendChild(s); }); }
function ensureCss(href,id){ if(document.getElementById(id))return; const l=document.createElement('link'); l.id=id; l.rel='stylesheet'; l.href = (href.indexOf('katex') !== -1) ? 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css' : href; document.head.appendChild(l); }
const _loaded={};
function loadOnce(key){
  if(_loaded[key]) return _loaded[key];
  if (['mermaid', 'katex', 'katexAuto', 'docx', 'png', 'jszip'].includes(key)) {
    _loaded[key] = injectScript(CDN[key]).catch(() => injectScript(VENDOR[key]));
  } else {
    _loaded[key] = injectScript(VENDOR[key]).catch(() => injectScript(CDN[key]));
  }
  return _loaded[key];
}

// ---------- math (KaTeX) & diagrams (Mermaid) — loaded only when present ----------
function ensureKatex(){ ensureCss('vendor/katex/katex.min.css','katex-css'); return loadOnce('katex').then(()=>loadOnce('katexAuto')); }
function renderMath(){
  ensureKatex().then(()=>{ 
    const preview = $("preview");
    if(!preview) return;

    // 1. Direct fallback katex.render for block formulas $$...$$ inside paragraphs (Auto-fixes unescaped % signs)
    if (typeof window.katex !== 'undefined' && typeof window.katex.render === 'function') {
      const ps = preview.querySelectorAll('p, div');
      ps.forEach(p => {
        const txt = p.textContent ? p.textContent.trim() : '';
        if (txt.startsWith('$$') && txt.endsWith('$$')) {
          let rawMathStr = txt.substring(2, txt.length - 2).trim();
          // Auto-fix unescaped % signs to \\% to prevent KaTeX line-comment ParseErrors
          rawMathStr = rawMathStr.replace(/(^|[^\\])%/g, '$1\\%');

          try {
            const mathContainer = document.createElement('div');
            mathContainer.className = 'katex-display-block';
            mathContainer.style.margin = '18px 0';
            mathContainer.style.textAlign = 'center';
            window.katex.render(rawMathStr, mathContainer, {
              displayMode: true,
              strict: false,
              trust: true,
              throwOnError: false
            });
            p.replaceWith(mathContainer);
          } catch(err) {
            console.warn('Direct katex render error:', err);
          }
        }
      });
    }

    // 2. renderMathInElement for remaining inline math
    if(typeof window.renderMathInElement==='function') {
      try {
        window.renderMathInElement(preview, { 
          delimiters:[
            {left:'$$',right:'$$',display:true},
            {left:'$',right:'$',display:false},
            {left:'\\[',right:'\\]',display:true},
            {left:'\\(',right:'\\)',display:false}
          ], 
          ignoredClasses:['mermaid', 'code-block-wrapper', 'hljs'], 
          strict: false,
          trust: true,
          throwOnError: false 
        }); 
      }catch(e){}
    }
  }).catch((err)=>console.warn('ensureKatex fail:', err));
}
function normalizeMermaidCode(code) {
  if (!code) return "";
  let s = String(code).trim();

  // 1. Unescape HTML entities if already escaped
  s = s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  // 2. Remove comments like %% ... if single-line
  s = s.replace(/%%\s*.*?(?=(subgraph|\b[A-Za-z0-9_]+\b\s*\[|\b[A-Za-z0-9_]+\b\s*-->|\bend\b|$))/gi, '\n');

  // 3. Force newlines around key structural delimiters even if single-line
  s = s.replace(/(\bgraph\s+[A-Za-z0-9_]+\b|\bsequenceDiagram\b|\bclassDiagram\b|\bstateDiagram\b|\berDiagram\b|\bgantt\b|\bpie\b|\bflowchart\s+[A-Za-z0-9_]+\b)/gi, '$1\n');
  s = s.replace(/;\s*/g, ';\n');
  s = s.replace(/\s*(\bclassDef\b)\s*/gi, '\n$1 ');
  s = s.replace(/\s*(\bsubgraph\b)\s*/gi, '\n$1 ');
  s = s.replace(/\s*(\bend\b)\s*/gi, '\nend\n');
  s = s.replace(/(\]:::[a-zA-Z0-9_-]+)\s*/g, '$1\n');
  s = s.replace(/(\]\s*)([A-Za-z0-9_]+\s*\[|[A-Za-z0-9_]+\s*-->|\s*-\.-\s*->|\s*==>|\b[A-Za-z0-9_]+\b\s*:::)/g, '$1\n$2');
  s = s.replace(/([a-zA-Z0-9_-]+)\s+([a-zA-Z0-9_-]+\s*-->)/g, '$1\n$2');
  s = s.replace(/(-->|-\.-\->|==>)\s*([a-zA-Z0-9_-]+)\s+([a-zA-Z0-9_-]+)/g, '$1 $2\n$3');

  // 4. Fix > and < inside node label quotes ["..."] so Mermaid parser doesn't break
  s = s.replace(/\["([^"]*?)"\]/g, function(match, label) {
    let cleanLabel = label
      .replace(/<br\s*\/?>/gi, '___BR___')
      .replace(/>/g, '&#62;')
      .replace(/</g, '&#60;')
      .replace(/___BR___/g, '<br/>');
    return '["' + cleanLabel + '"]';
  });

  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

let modalZoomScale = 1.0;
function openMermaidPopup(node) {
  const svgEl = node.querySelector('svg');
  if (!svgEl) return;
  const modal = $("mermaidModal");
  const modalContent = $("mermaidModalContent");
  const modalViewport = $("mermaidModalViewport");
  if (!modal || !modalContent || !modalViewport) return;

  modalContent.innerHTML = '';
  const clonedSvg = svgEl.cloneNode(true);
  
  clonedSvg.removeAttribute('style');
  clonedSvg.style.maxWidth = 'none';
  clonedSvg.style.maxHeight = 'none';
  clonedSvg.style.display = 'block';

  // Get viewBox natural dimensions
  const viewBox = clonedSvg.getAttribute('viewBox');
  let baseWidth = 900, baseHeight = 600;
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      baseWidth = parts[2];
      baseHeight = parts[3];
    }
  }

  clonedSvg.style.width = baseWidth + 'px';
  clonedSvg.style.height = baseHeight + 'px';

  modalContent.appendChild(clonedSvg);

  modalZoomScale = 1.0;
  const updateModalZoom = (scale) => {
    modalZoomScale = Math.max(0.4, Math.min(4.0, scale));
    const w = Math.round(baseWidth * modalZoomScale);
    const h = Math.round(baseHeight * modalZoomScale);
    clonedSvg.style.width = w + 'px';
    clonedSvg.style.height = h + 'px';
    modalContent.style.width = w + 'px';
    modalContent.style.height = h + 'px';
  };

  if ($("modalZoomIn")) $("modalZoomIn").onclick = () => updateModalZoom(modalZoomScale + 0.25);
  if ($("modalZoomOut")) $("modalZoomOut").onclick = () => updateModalZoom(modalZoomScale - 0.25);
  if ($("modalZoomReset")) $("modalZoomReset").onclick = () => updateModalZoom(1.0);

  if ($("modalExportSvg")) {
    $("modalExportSvg").onclick = () => {
      const svgEl = node.querySelector('svg');
      if (!svgEl) return;
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      download(svgBlob, (baseName() || 'diagram') + '.svg');
      toast('📥 다이어그램 SVG 내보내기 완료');
    };
  }

  if ($("modalExportPng")) {
    $("modalExportPng").onclick = () => {
      const svgEl = node.querySelector('svg');
      if (!svgEl) return;
      let svgData = new XMLSerializer().serializeToString(svgEl);
      if (!svgData.includes('xmlns=\"http://www.w3.org/2000/svg\"')) {
        svgData = svgData.replace('<svg', '<svg xmlns=\"http://www.w3.org/2000/svg\"');
      }
      const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const bbox = svgEl.getBoundingClientRect();
        canvas.width = Math.max(300, Math.round(bbox.width || 800)) * 3;
        canvas.height = Math.max(150, Math.round(bbox.height || 600)) * 3;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        fetch(dataUrl).then(r => r.blob()).then(blob => {
          download(blob, (baseName() || 'diagram') + '.png');
          toast('🖼️ 초고화질 PNG 내보내기 완료 (3x)');
        });
      };
      img.src = svgDataUrl;
    };
  }

  // Wheel zoom inside modal viewport
  modalViewport.onwheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    updateModalZoom(modalZoomScale + delta);
  };

  // Drag pan inside modal viewport
  let isDown = false, startX, startY, scrollLeft, scrollTop;
  modalViewport.onmousedown = (e) => {
    if (e.target.tagName.toLowerCase() === 'button') return;
    isDown = true;
    startX = e.pageX - modalViewport.offsetLeft;
    startY = e.pageY - modalViewport.offsetTop;
    scrollLeft = modalViewport.scrollLeft;
    scrollTop = modalViewport.scrollTop;
  };
  modalViewport.onmouseleave = () => { isDown = false; };
  modalViewport.onmouseup = () => { isDown = false; };
  modalViewport.onmousemove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - modalViewport.offsetLeft;
    const y = e.pageY - modalViewport.offsetTop;
    modalViewport.scrollLeft = scrollLeft - (x - startX) * 1.5;
    modalViewport.scrollTop = scrollTop - (y - startY) * 1.5;
  };

  updateModalZoom(1.0);
  modal.style.display = 'flex';
  modalViewport.scrollLeft = 0;
  modalViewport.scrollTop = 0;
}

function runMermaid(){
  if(typeof mermaid==='undefined' && !runMermaid._notified){
    runMermaid._notified=true;
    toast('다이어그램 엔진 로딩 중…(최초 1회)');
  }
  loadOnce('mermaid').then(()=>{
    if(typeof mermaid==='undefined') return;
    try{
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        htmlLabels: true,
        fontFamily: 'Noto Sans KR, sans-serif',
        theme: document.body.classList.contains('dark') ? 'dark' : 'default'
      });
    }catch(e){}

    const nodes = $("preview").querySelectorAll('.mermaid:not([data-processed])');
    nodes.forEach(async (node, idx) => {
      node.setAttribute('data-processed', 'true');
      const rawText = node.textContent;
      if (!rawText || !rawText.trim()) return;

      const code = normalizeMermaidCode(rawText);
      const id = 'mermaid-svg-' + Date.now() + '-' + Math.floor(Math.random() * 1000) + '-' + idx;

      // 1. Pre-flight Syntax Validation with mermaid.parse
      if (typeof mermaid.parse === 'function') {
        try {
          const isValid = await mermaid.parse(code, { suppressErrors: true });
          if (!isValid) {
            console.warn('Mermaid parse pre-flight failed:', code);
            node.innerHTML = `<div class="callout callout-warning"><div class="callout-title">⚠️ Mermaid 다이어그램 구문 오류</div><p style="margin-top:4px;font-size:11.5px;">구문에 불일치하는 기사나 괄호가 있습니다.</p><pre style="margin-top:6px;font-size:11px;background:none;padding:0;max-height:120px;overflow:auto;">${esc(rawText)}</pre></div>`;
            return;
          }
        } catch (parseErr) {
          console.warn('Mermaid parse exception:', parseErr);
        }
      }

      let card = node.closest('.mermaid-card');
      if (!card) {
        card = document.createElement('div');
        card.className = 'mermaid-card';
        card.style.cursor = 'pointer';
        card.title = '클릭 시 팝업 정밀 뷰어로 확대됩니다';
        card.innerHTML = `<div class="mermaid-viewport"></div>`;
        node.parentNode.insertBefore(card, node);
        const viewport = card.querySelector('.mermaid-viewport');
        viewport.appendChild(node);
        card.onclick = () => openMermaidPopup(node);
      }

      // 3. Render SVG safely (Mermaid v10+ async render)
      try {
        if (typeof mermaid.render === 'function') {
          const res = await mermaid.render(id, code);
          const svgHtml = (typeof res === 'string') ? res : (res && res.svg ? res.svg : '');
          const bindFn = (res && typeof res.bindFunctions === 'function') ? res.bindFunctions : null;
          if (svgHtml) {
            node.innerHTML = svgHtml;
            node.style.whiteSpace = 'normal';
            if (bindFn) bindFn(node);
          }
        } else if (typeof mermaid.run === 'function') {
          mermaid.run({ nodes: [node] });
        }
      } catch (err) {
        console.warn('Mermaid render warning:', err);
        const tempEl = document.getElementById(id);
        if (tempEl) tempEl.remove();
        node.innerHTML = `<div class="callout callout-warning"><div class="callout-title">⚠️ Mermaid 다이어그램 구문 경고</div><pre style="margin-top:6px;font-size:11.5px;background:none;padding:0;">${esc(rawText)}</pre></div>`;
      }
    });
  }).catch(()=>{});
}

// ---------- markdown-it ----------
const md = window.markdownit({
  html:true, linkify:true, typographer:true, breaks:false,
  highlight(str, lang){
    if(typeof hljs!=='undefined' && lang && hljs.getLanguage(lang)){
      try{ return '<pre><code class="hljs">'+hljs.highlight(str,{language:lang}).value+'</code></pre>'; }catch(e){}
    }
    if(typeof hljs!=='undefined'){ try{ return '<pre><code class="hljs">'+hljs.highlightAuto(str).value+'</code></pre>'; }catch(e){} }
    return '<pre><code class="hljs">'+md.utils.escapeHtml(str)+'</code></pre>';
  }
});
md.validateLink = (url)=>!/^\s*(javascript|vbscript):/i.test(String(url));
try{ if(window.markdownitFootnote) md.use(window.markdownitFootnote); }catch(e){}
try{ if(window.markdownitTaskLists) md.use(window.markdownitTaskLists,{label:true}); }catch(e){}
window.md = md;
const esc = (s)=>md.utils.escapeHtml(String(s));

// Global Carousel Navigation Handlers
window.setCarouselSlide = function(carouselId, targetIndex) {
  const wrapper = document.getElementById(carouselId);
  if (!wrapper) return;
  const track = wrapper.querySelector('.md-carousel-track');
  const slides = wrapper.querySelectorAll('.md-carousel-slide');
  const dots = wrapper.querySelectorAll('.md-carousel-dot');
  const currCounter = wrapper.querySelector('.carousel-curr');
  const btnPrev = wrapper.querySelector('.btn-prev');
  const btnNext = wrapper.querySelector('.btn-next');
  const total = slides.length;
  if (total === 0) return;

  const validIndex = Math.max(0, Math.min(total - 1, targetIndex));
  wrapper.setAttribute('data-current', validIndex);

  if (track) track.style.transform = `translateX(-${validIndex * 100}%)`;

  slides.forEach((slide, idx) => {
    slide.classList.toggle('active', idx === validIndex);
  });

  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === validIndex);
  });

  if (currCounter) currCounter.textContent = validIndex + 1;
  if (btnPrev) btnPrev.disabled = (validIndex === 0);
  if (btnNext) btnNext.disabled = (validIndex === total - 1);
};

window.moveCarouselSlide = function(carouselId, delta) {
  const wrapper = document.getElementById(carouselId);
  if (!wrapper) return;
  const curr = parseInt(wrapper.getAttribute('data-current') || '0', 10);
  window.setCarouselSlide(carouselId, curr + delta);
};

function bindCarousels() {
  const preview = $("preview");
  if (!preview) return;

  preview.querySelectorAll('.md-carousel-wrapper').forEach(wrapper => {
    const carouselId = wrapper.id;
    const btnPrev = wrapper.querySelector('.btn-prev');
    const btnNext = wrapper.querySelector('.btn-next');
    const dots = wrapper.querySelectorAll('.md-carousel-dot');

    if (btnPrev) {
      btnPrev.onclick = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        window.moveCarouselSlide(carouselId, -1);
      };
    }
    if (btnNext) {
      btnNext.onclick = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        window.moveCarouselSlide(carouselId, 1);
      };
    }
    dots.forEach((dot, idx) => {
      dot.onclick = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        window.setCarouselSlide(carouselId, idx);
      };
    });
  });
}

// render ```mermaid and ```carousel fences
const _origFence = md.renderer.rules.fence;
md.renderer.rules.fence = function(tokens, idx, options, env, self){
  const info = (tokens[idx].info || '').trim().toLowerCase();
  
  if (info === 'mermaid') { 
    return '<pre class="mermaid">' + md.utils.escapeHtml(tokens[idx].content) + '</pre>\n'; 
  }

  if (info === 'carousel') {
    if (env && env._inCarousel) {
      return _origFence ? _origFence(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);
    }
    const rawCode = tokens[idx].content || '';
    // Split by <!-- slide --> HTML comments with case & whitespace tolerance
    const slidesMarkdown = rawCode.split(/<!--\s*slide\s*-->/gi);
    const carouselId = 'carousel-' + Math.random().toString(36).substr(2, 9);
    const totalSlides = slidesMarkdown.length;

    const childEnv = Object.assign({}, env || {}, { _inCarousel: true });
    let slidesHtml = '';
    slidesMarkdown.forEach((slideMd, i) => {
      const activeClass = i === 0 ? ' active' : '';
      // Recursively render Markdown inside each slide with guard env!
      const renderedSlideHtml = md.render(slideMd.trim(), childEnv);
      slidesHtml += `<div class="md-carousel-slide${activeClass}" data-slide-index="${i}">
        <div class="md-carousel-slide-content">${renderedSlideHtml}</div>
      </div>`;
    });

    let dotsHtml = '';
    for (let i = 0; i < totalSlides; i++) {
      const activeDot = i === 0 ? ' active' : '';
      dotsHtml += `<button class="md-carousel-dot${activeDot}" onclick="window.setCarouselSlide('${carouselId}', ${i})" aria-label="Slide ${i + 1}"></button>`;
    }

    const prevDisabled = ' disabled';
    const nextDisabled = totalSlides <= 1 ? ' disabled' : '';

    return `<div class="md-carousel-wrapper" id="${carouselId}" data-current="0" data-total="${totalSlides}">
      <div class="md-carousel-header">
        <div class="md-carousel-badge">🎠 Interactive Slides</div>
        <div class="md-carousel-counter">
          <span class="carousel-curr">1</span> / <span class="carousel-total">${totalSlides}</span>
        </div>
      </div>
      <div class="md-carousel-viewport">
        <div class="md-carousel-track">
          ${slidesHtml}
        </div>
      </div>
      <div class="md-carousel-footer">
        <button class="md-carousel-nav btn-prev"${prevDisabled} onclick="window.moveCarouselSlide('${carouselId}', -1)" title="Previous Slide">‹ Prev</button>
        <div class="md-carousel-dots">
          ${dotsHtml}
        </div>
        <button class="md-carousel-nav btn-next"${nextDisabled} onclick="window.moveCarouselSlide('${carouselId}', 1)" title="Next Slide">Next ›</button>
      </div>
    </div>\n`;
  }

  return _origFence ? _origFence(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);
};

// ---------- state ----------
const state = { assets:new Map(), byBase:new Map(), overrides:new Map(), imgNames:[], docs:[], current:-1, missing:[] };
let bindTarget=null;

// ---------- helpers ----------
const $ = (id)=>document.getElementById(id);

function toast(msg){ const t=$("toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove("show"),2600); }
function lsGet(k){ try{return localStorage.getItem(k);}catch(e){return null;} }
function lsSet(k,v){ try{localStorage.setItem(k,v);}catch(e){} }
function mimeFor(name){ const e=name.split('.').pop().toLowerCase(); return ({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',svg:'image/svg+xml',webp:'image/webp',bmp:'image/bmp',avif:'image/avif'})[e]||'application/octet-stream'; }
function isImage(name){ return /\.(png|jpe?g|gif|svg|webp|bmp|avif)$/i.test(name); }
function isMd(name){ return /\.(md|markdown|txt|mmd|mermaid)$/i.test(name); }
function readBytes(file){ return file.arrayBuffer().then(b=>new Uint8Array(b)); }
function bytesToDataURL(u8, mime){ let bin=''; const CH=0x8000; for(let i=0;i<u8.length;i+=CH) bin+=String.fromCharCode.apply(null,u8.subarray(i,i+CH)); return 'data:'+mime+';base64,'+btoa(bin); }
// base64 encoding off the main thread (keeps UI responsive on big images). Falls back to sync.
let _b64w;
function b64Worker(){
  if(_b64w!==undefined) return _b64w;
  if(location.protocol==='file:' || typeof Worker==='undefined'){ return (_b64w=null); }
  try{
    const code="self.onmessage=function(e){var u8=e.data.u8,m=e.data.mime,id=e.data.id,bin='',CH=0x8000,i;for(i=0;i<u8.length;i+=CH){bin+=String.fromCharCode.apply(null,u8.subarray(i,i+CH));}self.postMessage({id:id,url:'data:'+m+';base64,'+self.btoa(bin)});};";
    _b64w=new Worker(URL.createObjectURL(new Blob([code],{type:'text/javascript'})));
    _b64w._cbs={}; _b64w._id=0;
    _b64w.onmessage=(e)=>{ const cb=_b64w._cbs[e.data.id]; if(cb){ delete _b64w._cbs[e.data.id]; cb(e.data.url); } };
    _b64w.onerror=()=>{ _b64w=null; };
  }catch(e){ _b64w=null; }
  return _b64w;
}
function bytesToDataURLAsync(u8, mime){
  const w=b64Worker();
  if(!w) return Promise.resolve(bytesToDataURL(u8, mime));
  return new Promise(res=>{ const id=++w._id; w._cbs[id]=res; try{ w.postMessage({id,u8,mime},[u8.buffer]); }catch(e){ res(bytesToDataURL(u8,mime)); } });
}
function decodeBytes(u8, enc){ try{ return new TextDecoder(enc,{fatal:false}).decode(u8); }catch(e){ return new TextDecoder('utf-8').decode(u8); } }
function encLabel(enc){ return ({'utf-8':'UTF-8','euc-kr':'EUC-KR','utf-16le':'UTF-16LE','utf-16be':'UTF-16BE','iso-8859-1':'Latin-1','windows-1252':'CP1252'})[enc]||enc; }

// ---------- ingest ----------
function reset(){ state.assets.clear(); state.byBase.clear(); state.overrides.clear(); state.imgNames=[]; state.docs=[]; state.current=-1; state.missing=[]; }
function addAsset(path, dataURL){ state.assets.set(pathKey(path), dataURL); state.byBase.set(keyOf(path), dataURL); const display=C.nfc(C.normPath(path)); if(!state.imgNames.includes(display)) state.imgNames.push(display); }

async function ingestFiles(fileList){
  reset();
  for(const f of Array.from(fileList)){
    const rel=f.webkitRelativePath||f.name;
    if(isImage(rel)){ try{ addAsset(rel, await bytesToDataURLAsync(await readBytes(f), mimeFor(rel))); }catch(e){} }
    else if(isMd(rel)){ const bytes=await readBytes(f); const detected=detectEncoding(bytes); state.docs.push({name:f.name,path:C.normPath(rel),bytes,encoding:detected,detected,text:null}); }
  }
  finishIngest();
}
async function ingestZip(file){
  reset();
  try{ await loadOnce('jszip'); }catch(e){}
  if(typeof JSZip==='undefined'){ toast('ZIP 라이브러리 로드 실패 — 인터넷 또는 vendor 확인'); return; }
  const zip=await JSZip.loadAsync(file);
  const entries=[]; zip.forEach((p,e)=>{ if(!e.dir)entries.push(e); });
  for(const e of entries){
    if(isImage(e.name)){ addAsset(e.name, await bytesToDataURLAsync(await e.async('uint8array'), mimeFor(e.name))); }
    else if(isMd(e.name)){ const bytes=await e.async('uint8array'); const detected=detectEncoding(bytes); state.docs.push({name:e.name.split('/').pop(),path:C.normPath(e.name),bytes,encoding:detected,detected,text:null}); }
  }
  finishIngest();
}
async function addImages(fileList){
  let n=0;
  for(const f of Array.from(fileList)){ if(isImage(f.name)){ addAsset(f.webkitRelativePath||f.name, await bytesToDataURLAsync(await readBytes(f), mimeFor(f.name))); n++; } }
  if(state.current>=0) renderPreview();
  toast(`이미지 ${n}개 추가됨 (총 ${state.assets.size}개)`);
}
async function bindImage(src, file){ const u8=await readBytes(file); state.overrides.set(keyOf(src), await bytesToDataURLAsync(u8, mimeFor(file.name))); renderPreview(); toast('이미지 연결됨: '+file.name); }

function pushWorkspaceState() {
  try {
    if (!history.state || history.state.page !== 'workspace') {
      history.pushState({ page: 'workspace' }, '', '#workspace');
    }
  } catch(e){}
}

function finishIngest(){
  if(state.docs.length===0){ toast("마크다운(.md) 파일을 찾지 못했어요."); return; }
  state.docs.sort((a,b)=>a.path.localeCompare(b.path));
  $("dropzone").style.display="none"; $("workspace").classList.add("active"); $("toolbar").style.display="flex";
  renderFileList(); selectDoc(0);
  pushWorkspaceState();
  toast(`문서 ${state.docs.length}개 · 이미지 ${state.assets.size}개 로드됨`);
}
function goHome(pushHistory = true){
  $("workspace").classList.remove('active');
  $("dropzone").style.display='';
  $("toolbar").style.display='none';
  if (pushHistory) {
    try { history.pushState({ page: 'home' }, '', location.pathname); } catch(e){}
  }
}
function newDoc(){
  reset();
  state.docs.push({name:'untitled.md',path:'untitled.md',bytes:new Uint8Array(),encoding:'utf-8',detected:'utf-8',text:''});
  state.docs.length && (function(){ state.docs.sort((a,b)=>a.path.localeCompare(b.path)); })();
  $("dropzone").style.display="none"; $("workspace").classList.add("active"); $("toolbar").style.display="flex";
  $("workspace").classList.remove('no-editor'); $("btnEdit").classList.add('on');
  renderFileList(); selectDoc(0);
  pushWorkspaceState();
  setTimeout(()=>$("editor").focus(),60);
  toast("New document created");
}

window.addEventListener('popstate', () => {
  const isWorkspaceActive = $("workspace") && $("workspace").classList.contains('active');
  if (isWorkspaceActive) {
    goHome(false);
  }
});

try {
  if (!history.state) {
    history.replaceState({ page: 'home' }, '', location.pathname);
  }
} catch(e){}
function renderFileList(){
  const list=$("fileList"); if (list) list.innerHTML="";
  const mobileSel = $("mobileDocSelect"); if (mobileSel) mobileSel.innerHTML = "";

  state.docs.forEach((d,i)=>{
    if (list) {
      const el=document.createElement("div"); el.className="file-item"+(i===state.current?" active":""); el.textContent=d.path; el.title=d.path; el.onclick=()=>selectDoc(i); list.appendChild(el);
    }
    if (mobileSel) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = d.path;
      if (i === state.current) opt.selected = true;
      mobileSel.appendChild(opt);
    }
  });
}

// ---------- CodeMirror Editor ----------
let cmEditor = null;
function initCodeMirror(){
  if(typeof window.CodeMirror !== 'undefined' && !cmEditor){
    try {
      cmEditor = window.CodeMirror.fromTextArea($("editor"), {
        lineNumbers: true,
        mode: 'markdown',
        lineWrapping: true,
        theme: document.body.classList.contains('dark') ? 'dracula' : 'default'
      });
      cmEditor.on('change', () => {
        const d = currentDoc();
        if(!d) return;
        d.text = cmEditor.getValue();
        updateCounts();
        saveDraft();
        clearTimeout(rt);
        rt = setTimeout(renderPreview, 200);
      });
    } catch(e) { cmEditor = null; }
  }
}

// ---------- editor / select / render ----------
function currentDoc(){ return state.docs[state.current]; }
function selectDoc(i){
  state.current=i; renderFileList();
  const doc=state.docs[i];
  $("encSel").value=doc.encoding;
  $("autoTag").textContent = (window.i18n ? window.i18n.t('autoTagDetected') : "Detected: ") + encLabel(doc.detected);
  if(doc.text==null) doc.text=decodeBytes(doc.bytes, doc.encoding);
  
  initCodeMirror();
  if(cmEditor) {
    cmEditor.setValue(doc.text);
    setTimeout(()=>cmEditor.refresh(), 30);
  } else {
    $("editor").value=doc.text;
  }
  
  $("previewWrap").scrollTop=0;
  renderPreview(); updateCounts();
}

function renderPreview(){
  try {
    window.state = state;
    window.renderPreview = renderPreview;
    const doc=currentDoc(); if(!doc) return;
    const text = doc.text || "";
    // lazy-load highlight.js only when the doc has code fences
    if(typeof hljs==='undefined' && hasCodeFence(text) && !renderPreview._hl){
      renderPreview._hl=true;
      loadOnce('hljs').then(()=>{ renderPreview._hl=false; renderPreview(); }).catch(()=>{ renderPreview._hl=false; });
    }
    state.missing=[];
    const docDir=doc.path.includes('/')?doc.path.slice(0,doc.path.lastIndexOf('/')):'';
    
    const rawHtml = md.render(preprocessObsidian(text, doc.name));
    const safeHtml = rawHtml.replace(/<img\s+([^>]*?)src=["']([^"']+)["']/gi, '<img $1data-src="$2"');
    
    const tmp=document.createElement('div');
    tmp.innerHTML=safeHtml;

    // External links target=_blank
    tmp.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });

    // Image path resolving
    tmp.querySelectorAll('img').forEach(img=>{
      const orig=img.getAttribute('data-src')||img.getAttribute('src')||'';
      const r=resolveImageSrc(orig,docDir,{assets:state.assets,byBase:state.byBase,overrides:state.overrides});
      if(r){ img.setAttribute('src',r); img.removeAttribute('data-src'); img.removeAttribute('loading'); }
      else{ state.missing.push(orig); const ph=document.createElement('span'); ph.className='img-missing'; ph.textContent='⚠ '+(keyOf(orig)||orig); img.replaceWith(ph); }
    });

    // Callouts (Obsidian & GitHub style)
    tmp.querySelectorAll('blockquote').forEach(bq => {
      const firstP = bq.querySelector('p');
      if(!firstP) return;
      const fullHtml = firstP.innerHTML.trim();
      const match = fullHtml.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO|TODO|FAQ|QUOTE)\](?:\s+([\s\S]*))?/i);
      if(match) {
        const type = match[1].toLowerCase();
        const contentAfterTag = match[2] ? match[2].trim() : '';
        const icons = { note: '📝', tip: '💡', important: '⚡', warning: '⚠️', caution: '🚨', info: 'ℹ️', todo: '☑️', faq: '❓', quote: '💬' };
        const icon = icons[type] || '📌';
        const typeDefaultTitle = type.toUpperCase();
        
        let titleHtml = '';
        let bodyHtml = '';
        
        // 1. Explicit line break <br>
        const brMatch = contentAfterTag.match(/<br\s*\/?>/i);
        if (brMatch) {
          const splitIdx = brMatch.index;
          titleHtml = contentAfterTag.substring(0, splitIdx).trim();
          bodyHtml = contentAfterTag.substring(splitIdx + brMatch[0].length).trim();
        } else if (contentAfterTag.length > 40 || contentAfterTag.includes('</')) {
          // 2. Long text without <br>: Treat type as title, and entire text as paragraph body
          titleHtml = typeDefaultTitle;
          bodyHtml = contentAfterTag;
        } else {
          titleHtml = contentAfterTag || typeDefaultTitle;
        }

        const calloutDiv = document.createElement('div');
        calloutDiv.className = `callout callout-${type}`;
        
        let headerHtml = `<div class="callout-title"><span class="callout-icon">${icon}</span> <span class="callout-title-text">${titleHtml}</span></div>`;
        if (bodyHtml) {
          headerHtml += `<div class="callout-body" style="margin-top:6px; font-size:13px; line-height:1.65; color:inherit;">${bodyHtml}</div>`;
        }

        firstP.innerHTML = headerHtml;

        while(bq.firstChild) {
          calloutDiv.appendChild(bq.firstChild);
        }
        bq.replaceWith(calloutDiv);
      }
    });

    // Wrap code blocks with copy button
    tmp.querySelectorAll('pre code').forEach(codeBlock => {
      const pre = codeBlock.parentElement;
      if(pre && pre.tagName.toLowerCase() === 'pre') {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-code-btn';
        copyBtn.textContent = '📋 복사';
        wrapper.appendChild(copyBtn);
      }
    });

    // Build TOC
    const tocList = $("tocList");
    if(tocList) {
      tocList.innerHTML = "";
      const headers = tmp.querySelectorAll('h1, h2, h3');
      if(!headers.length) {
        tocList.innerHTML = '<div style="font-size:11px;color:var(--text-muted);">' + (window.i18n ? window.i18n.t('tocEmpty') : 'No headings (H1~H3) found') + '</div>';
      } else {
        headers.forEach((h, idx) => {
          const id = 'heading-' + idx;
          h.id = id;
          const item = document.createElement('div');
          const tag = h.tagName.toLowerCase();
          item.className = `toc-item toc-${tag}`;
          item.textContent = h.textContent;
          item.title = h.textContent;
          item.onclick = (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            const target = $("preview").querySelector('#' + id);
            const previewPane = $("preview-pane") || $("previewWrap");
            if (target && previewPane) {
              const targetTop = target.getBoundingClientRect().top;
              const paneTop = previewPane.getBoundingClientRect().top;
              const targetOffset = targetTop - paneTop + previewPane.scrollTop - 20;
              previewPane.scrollTo({ top: Math.max(0, targetOffset), behavior: 'smooth' });
              window.scrollTo(0, 0);
            }
          };
          tocList.appendChild(item);
        });
      }
    }

    // Detect and apply ASCII Box Drawing Art Monospace Alignment
    const boxDrawingRegex = /[┌─┬─│└┼┤┴├]/;
    tmp.querySelectorAll('pre, p, code').forEach(el => {
      if (boxDrawingRegex.test(el.textContent)) {
        el.classList.add('ascii-diagram-block');
        if (el.tagName.toLowerCase() === 'pre') {
          const codeEl = el.querySelector('code');
          if (codeEl) {
            codeEl.style.whiteSpace = 'pre';
            codeEl.style.fontFamily = "'D2Coding', 'Cascadia Code', 'Consolas', 'Courier New', monospace";
          }
        }
      }
    });

    $("preview").innerHTML=tmp.innerHTML;
    bindCarousels();
    if(hasMermaid(text, doc.name)) runMermaid();
    renderMath();
    updateAssetInfo();
  } catch (err) {
    console.error('renderPreview error:', err);
    $("preview").innerHTML = `<div class="callout callout-warning"><div class="callout-title">⚠️ 마크다운 렌더링 오류 발생</div><p style="margin-top:6px;font-size:12px;">문서를 읽는 도중 오류가 발생했습니다: ${esc(err.message)}</p></div>`;
  }
}
// ---------- Syntax Health Inspector ----------
function inspectSyntaxHealth(text) {
  if (!text) return [];
  const issues = [];

  // 1. Unclosed code blocks (``` or ~~~)
  const fenceMatches = text.match(/(?:^|\n)\s*(```|~~~)/g);
  if (fenceMatches && fenceMatches.length % 2 !== 0) {
    issues.push('닫히지 않은 코드 블록 (```) 이 있습니다.');
  }

  // 2. Unclosed math blocks ($$)
  const mathMatches = text.match(/\$\$/g);
  if (mathMatches && mathMatches.length % 2 !== 0) {
    issues.push('닫히지 않은 수식 블록 ($$) 이 있습니다.');
  }

  // 3. Unclosed brackets
  const openBrackets = (text.match(/\[/g) || []).length;
  const closeBrackets = (text.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    issues.push(`대괄호 '[' 와 ']' 개수가 불일치합니다 (${openBrackets}개 / ${closeBrackets}개).`);
  }

  // 4. Broken tables
  const lines = text.split('\n');
  let inTable = false;
  let expectedCols = 0;
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cols = trimmed.split('|').length - 2;
      if (!inTable) {
        inTable = true;
        expectedCols = cols;
      } else if (cols !== expectedCols && !/^\|?\s*:?-+:?\s*\|/.test(trimmed)) {
        issues.push(`줄 ${idx + 1}: 표(Table) 열 개수 불일치 (${cols}열 vs ${expectedCols}열).`);
      }
    } else {
      inTable = false;
    }
  });

  return issues;
}

function updateSyntaxHealthUI(text) {
  const issues = inspectSyntaxHealth(text);
  const tag = $("syntaxHealthTag");
  if (!tag) return;

  if (issues.length === 0) {
    tag.className = "syntax-tag ok";
    tag.innerHTML = "🟢 " + i18n.t('syntaxOk');
    tag.title = i18n.t('syntaxOkTitle');
    tag.onclick = null;
  } else {
    tag.className = "syntax-tag warn";
    tag.innerHTML = `⚠️ ${i18n.t('syntaxWarn')} (${issues.length})`;
    tag.title = issues.join('\n');
    tag.onclick = () => {
      alert(`⚠️ ${i18n.t('syntaxWarn')}:\n\n` + issues.map((iss, i) => `${i + 1}. ${iss}`).join('\n'));
    };
  }
}

function updateCounts(){
  const t = cmEditor ? cmEditor.getValue() : $("editor").value;
  const wordCount = t.trim() ? t.trim().split(/\s+/).length : 0;
  if (window.i18n && window.i18n.getLang() === 'ko') {
    $("counts").textContent = t.length + '자 · ' + wordCount + '단어';
  } else {
    $("counts").textContent = t.length + ' chars · ' + wordCount + ' words';
  }
  updateSyntaxHealthUI(t);
}
function updateAssetInfo(){
  const info=$("assetInfo"); const miss=[...new Set(state.missing)];
  const assetTitleText = window.i18n ? window.i18n.t('assetTitle') : "Image Assets: ";
  const assetMissingText = window.i18n ? window.i18n.t('assetMissing') : "Missing: ";
  const btnAddImgText = window.i18n ? window.i18n.t('btnAddImg') : "＋ Add Image Directly";
  const bindHeadText = window.i18n ? window.i18n.t('bindHead') : "🔗 Link Missing Images";
  const bindCardDescText = window.i18n ? window.i18n.t('bindCardDesc') : "Drag image here or click to select";

  let h=`${assetTitleText}<b>${state.assets.size}</b>`;
  if(miss.length) h+=` · <span class="missing">${assetMissingText}${miss.length}</span>`;
  h+='<div class="imglist">';
  state.imgNames.slice(0,30).forEach(n=>{ h+='✔ '+esc(n.split('/').pop())+'<br/>'; });
  h+=`</div><button class="addimg btn" id="btnAddImg">${btnAddImgText}</button>`;
  if(miss.length){
    h+=`<div class="bindhead">${bindHeadText}</div>`;
    miss.forEach((m,idx)=>{ h+=`<div class="bindcard" data-idx="${idx}"><div class="bn">${esc(keyOf(m)||m)}</div><div class="bd">${bindCardDescText}</div></div>`; });
  }
  info.innerHTML=h;
  $("btnAddImg").onclick=()=>$("inImg").click();
  info.querySelectorAll('.bindcard').forEach(card=>{
    const src=miss[+card.dataset.idx];
    card.onclick=()=>{ bindTarget=src; $("inBind").click(); };
    ['dragenter','dragover'].forEach(ev=>card.addEventListener(ev,e=>{ e.preventDefault(); e.stopPropagation(); card.classList.add('over'); }));
    ['dragleave','drop'].forEach(ev=>card.addEventListener(ev,e=>{ e.preventDefault(); e.stopPropagation(); card.classList.remove('over'); }));
    card.addEventListener('drop',async e=>{ const f=e.dataTransfer.files&&e.dataTransfer.files[0]; if(f&&isImage(f.name)) await bindImage(src,f); else toast('이미지 파일을 드롭하세요'); });
  });
}

// ---------- exporters ----------
function baseName(){ return (currentDoc()?.name||'document').replace(/\.(md|markdown|txt)$/i,''); }
function download(blob, filename){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); }
function fontsReady(){ return (document.fonts && document.fonts.ready) ? document.fonts.ready.catch(()=>{}) : Promise.resolve(); }

function exportMd() {
  const doc = currentDoc();
  if (!doc) return;
  const text = cmEditor ? cmEditor.getValue() : doc.text;
  const filename = baseName() + '.md';
  download(new Blob([text], { type: 'text/markdown;charset=utf-8' }), filename);
  toast("📥 .md 저장 완료: " + filename);
}

async function mermaidToPngImages(scaleFactor = 3) {
  const cards = $("preview").querySelectorAll('.mermaid-card');
  if (!cards || !cards.length) return () => {};

  const replacements = [];

  for (const card of cards) {
    const svgEl = card.querySelector('svg');
    if (!svgEl) continue;

    try {
      let svgData = new XMLSerializer().serializeToString(svgEl);
      if (!svgData.includes('xmlns="http://www.w3.org/2000/svg"')) {
        svgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
      // SVG intrinsic viewBox vs bounding box measurement
      let svgW = 600, svgH = 400;
      if (svgEl.viewBox && svgEl.viewBox.baseVal && svgEl.viewBox.baseVal.width > 0) {
        svgW = Math.round(svgEl.viewBox.baseVal.width);
        svgH = Math.round(svgEl.viewBox.baseVal.height);
      } else {
        const bbox = svgEl.getBoundingClientRect();
        svgW = Math.max(300, Math.round(bbox.width || 680));
        svgH = Math.max(150, Math.round(bbox.height || 400));
      }

      // Word A4 용지 본문 가용 제한 (너비 max 520px, 높이 max 480px)
      const MAX_DOCX_W = 520;
      const MAX_DOCX_H = 480;

      const wRatio = svgW > MAX_DOCX_W ? MAX_DOCX_W / svgW : 1;
      const hRatio = svgH > MAX_DOCX_H ? MAX_DOCX_H / svgH : 1;
      const finalRatio = Math.min(wRatio, hRatio);

      const targetW = Math.round(svgW * finalRatio);
      const targetH = Math.round(svgH * finalRatio);

      const dataUrl = await new Promise((res) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const w = svgW * scaleFactor;
            const h = svgH * scaleFactor;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            res(canvas.toDataURL('image/png'));
          } catch(err) {
            console.warn('Canvas toDataURL exception:', err);
            res(null);
          }
        };
        img.onerror = (e) => {
          console.warn('Image SVG load error:', e);
          res(null);
        };
        img.src = svgDataUrl;
      });

      if (dataUrl) {
        const imgEl = document.createElement('img');
        imgEl.className = 'mermaid-png-export';
        imgEl.src = dataUrl;
        imgEl.setAttribute('width', targetW);
        imgEl.setAttribute('height', targetH);
        imgEl.style.cssText = `display: block !important; margin: 16px auto !important; width: ${targetW}px !important; height: ${targetH}px !important; max-width: 520px !important; max-height: 480px !important; object-fit: contain !important; page-break-inside: avoid !important;`;

        const parent = card.parentNode;
        const next = card.nextSibling;
        parent.removeChild(card);
        parent.insertBefore(imgEl, next);

        replacements.push({ parent, card, imgEl });
      }
    } catch (e) {
      console.warn('PNG conversion warning:', e);
    }
  }

  return () => {
    replacements.forEach(({ parent, card, imgEl }) => {
      if (imgEl.parentNode === parent) {
        parent.replaceChild(card, imgEl);
      }
    });
  };
}

function getExportCleanHtml() {
  const clone = $("preview").cloneNode(true);

  // 1. Remove copy buttons
  clone.querySelectorAll('.copy-code-btn').forEach(btn => btn.remove());

  // 1-2. Clean KaTeX MathML for Word & HTML Export (Prevent 3x duplicated text overlapping)
  clone.querySelectorAll('.katex-display-block, .katex-display, .katex').forEach(katexEl => {
    const mathMl = katexEl.querySelector('math');
    if (mathMl) {
      const cleanMath = mathMl.cloneNode(true);
      cleanMath.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');
      cleanMath.querySelectorAll('annotation').forEach(ann => ann.remove());
      
      const mathWrapper = document.createElement('div');
      mathWrapper.className = 'word-math-block';
      mathWrapper.style.textAlign = 'center';
      mathWrapper.style.margin = '16px 0';
      mathWrapper.appendChild(cleanMath);
      katexEl.replaceWith(mathWrapper);
    }
  });

  // 1-3. Flatten Carousel Slides for HTML / Word Exports (Show all slides sequentially)
  clone.querySelectorAll('.md-carousel-wrapper').forEach(wrapper => {
    const track = wrapper.querySelector('.md-carousel-track');
    const header = wrapper.querySelector('.md-carousel-header');
    const footer = wrapper.querySelector('.md-carousel-footer');
    
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';
    
    if (track) {
      track.style.display = 'block';
      track.style.transform = 'none';
      track.style.width = '100%';
    }

    const slides = wrapper.querySelectorAll('.md-carousel-slide');
    slides.forEach((slide, i) => {
      slide.style.display = 'block';
      slide.style.opacity = '1';
      slide.style.width = '100%';
      slide.style.padding = '16px';
      slide.style.boxSizing = 'border-box';
      if (i < slides.length - 1) {
        slide.style.borderBottom = '1px dashed #e1e4e8';
      }
    });
  });

  // 2. Inline code block styling for HTML/Word
  clone.querySelectorAll('pre').forEach(pre => {
    pre.style.backgroundColor = '#f6f8fa';
    pre.style.border = '1px solid #d0d7de';
    pre.style.borderRadius = '6px';
    pre.style.padding = '12px 16px';
    pre.style.fontFamily = "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace";
    pre.style.fontSize = '10pt';
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.wordBreak = 'break-all';
    pre.style.wordWrap = 'break-word';
    pre.style.margin = '14px 0';
  });

  clone.querySelectorAll('code').forEach(code => {
    code.style.fontFamily = "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace";
    code.style.fontSize = '9.5pt';
    if (code.parentNode && code.parentNode.tagName.toLowerCase() !== 'pre') {
      code.style.backgroundColor = 'rgba(175, 184, 193, 0.2)';
      code.style.padding = '2px 5px';
      code.style.borderRadius = '4px';
    }
  });

  // 3. Image aspect ratio protection for HTML/Word exports
  clone.querySelectorAll('img').forEach(img => {
    const isMermaid = img.closest && img.closest('.mermaid-card');
    img.removeAttribute('height'); // Remove fixed height attribute to preserve natural aspect ratio
    
    if (isMermaid) {
      img.setAttribute('width', '520');
      img.style.maxWidth = '520px';
      img.style.width = '100%';
      img.style.height = 'auto';
    } else {
      const natW = img.naturalWidth || 0;
      const natH = img.naturalHeight || 0;
      if (natW > 0 && natH > 0 && natW > 520) {
        img.setAttribute('width', '520');
        const calcH = Math.round((520 / natW) * natH);
        img.setAttribute('height', String(calcH));
      } else {
        img.removeAttribute('width');
      }
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.objectFit = 'contain';
      img.style.display = 'block';
      img.style.margin = '16px auto';
    }
  });

  return clone.innerHTML;
}

async function exportCopyRichText() {
  try {
    const html = getExportCleanHtml();
    const text = $("preview").innerText;

    if (navigator.clipboard && window.ClipboardItem) {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([text], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ]);
      toast('📋 서식 포함 복사 완료! (Doc/Notion/Medium에 붙여넣기)');
    } else {
      await navigator.clipboard.writeText(text);
      toast('📋 텍스트 복사 완료!');
    }
  } catch(e) {
    toast('복사 실패: ' + e.message);
  }
}

function baseName() {
  const doc = currentDoc();
  let name = (doc && doc.path) ? doc.path : "Untitled";
  if (name.includes('/')) name = name.split('/').pop();
  if (name.includes('\\')) name = name.split('\\').pop();
  if (name.includes('.')) {
    name = name.substring(0, name.lastIndexOf('.'));
  }
  name = name.trim().replace(/[\/\\:*?"<>|]/g, '_') || "Untitled";
  return `${name}_markdownrender`;
}

function exportPdf() {
  toast("PDF 인쇄 창 준비 중...");
  const origTitle = document.title;
  document.title = baseName();
  fontsReady().then(() => {
    let printContainer = document.getElementById('print-container');
    if (printContainer) printContainer.remove();

    printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    printContainer.className = 'md-body';
    printContainer.innerHTML = getExportCleanHtml();
    document.body.appendChild(printContainer);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (printContainer && printContainer.parentNode) {
          printContainer.parentNode.removeChild(printContainer);
        }
        document.title = origTitle;
      }, 1000);
    }, 250);
  });
}

function exportHtml() {
  const css = document.querySelector('style').textContent;
  const mdCss = css.split('/* Rendered markdown */')[1] ? css.split('/* Rendered markdown */')[1].split('/* Theme')[0] : '';
  const cleanBodyHtml = getExportCleanHtml();
  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>${esc(baseName())}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>:root{--border:#e3e6ea;--text:#1f2328;--accent:#2563eb;--accent-soft:#eff4ff;--code-bg:#f6f8fa;}
body{margin:0;background:#eceef1;font-family:'Noto Sans KR',sans-serif;}
.paper{max-width:820px;margin:24px auto;background:#fff;padding:56px 64px;box-shadow:0 8px 24px rgba(0,0,0,.08);border-radius:6px;}
table{border-collapse:collapse;width:100%;margin:20px 0;border:1px solid #e3e6ea;}th,td{border:1px solid #e3e6ea;padding:10px 14px;text-align:left;}th{background:#f8fafc;font-weight:600;}
img{max-width:100%;max-height:520px;height:auto;display:block;margin:16px auto;}
pre{background-color:#f6f8fa;border:1px solid #d0d7de;border-radius:6px;padding:12px 16px;white-space:pre-wrap;word-break:break-all;word-wrap:break-word;margin:14px 0;}
code{font-family:SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;font-size:12px;}
${mdCss}</style></head><body><div class="paper"><div class="md-body">${cleanBodyHtml}</div></div></body></html>`;
  download(new Blob([html], { type: 'text/html;charset=utf-8' }), baseName() + '.html');
  toast("HTML 저장 완료 (복사 버튼 제거 및 서식 상자 포함)");
}

async function exportDocx() {
  toast(i18n.t('toastDocxStart'));
  const restore = await mermaidToPngImages(3);
  try { await loadOnce('docx'); } catch(e){}

  const cleanBodyHtml = getExportCleanHtml();

  try {
    if (typeof window.htmlDocx !== 'undefined' && typeof window.htmlDocx.asBlob === 'function') {
      const content = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 11pt; line-height: 1.6; }
table { border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #cccccc; }
th, td { border: 1px solid #cccccc; padding: 8px 12px; text-align: left; }
th { background-color: #f1f5f9; font-weight: bold; }
img { max-width: 100%; max-height: 520px; height: auto; display: block; margin: 16px auto; }
pre { background-color: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px; padding: 10px 14px; white-space: pre-wrap; word-break: break-all; word-wrap: break-word; font-family: Consolas, monospace; font-size: 9.5pt; margin: 12px 0; }
code { font-family: Consolas, monospace; font-size: 9.5pt; background-color: #f1f5f9; padding: 2px 4px; }
</style></head><body><div class="paper"><div class="md-body">${cleanBodyHtml}</div></div></body></html>`;
      const converted = window.htmlDocx.asBlob(content);
      download(converted, baseName() + '.docx');
      toast(i18n.t('toastDocxSaved'));
    } else {
      const content = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${esc(baseName())}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 11pt; line-height: 1.6; }
table { border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #cccccc; }
th, td { border: 1px solid #cccccc; padding: 8px 12px; text-align: left; }
th { background-color: #f1f5f9; font-weight: bold; }
img { max-width: 100%; max-height: 520px; height: auto; display: block; margin: 16px auto; }
pre { background-color: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px; padding: 10px 14px; white-space: pre-wrap; word-break: break-all; word-wrap: break-word; font-family: Consolas, monospace; font-size: 9.5pt; margin: 12px 0; }
code { font-family: Consolas, monospace; font-size: 9.5pt; background-color: #f1f5f9; padding: 2px 4px; }
</style></head><body><div class="paper"><div class="md-body">${cleanBodyHtml}</div></div></body></html>`;
      const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
      download(blob, baseName() + '.doc');
      toast(i18n.t('toastDocxSaved'));
    }
  } catch(err) {
    toast(i18n.t('toastDocxFail') + err.message);
  } finally {
    restore();
  }
}
async function exportPng(){
  toast("PNG 생성 중... (1000px 와이드 2x 인코딩)");
  try{ await loadOnce('png'); }catch(e){}
  if(typeof window.htmlToImage==='undefined'){ toast('PNG 라이브러리 로드 실패'); return; }
  await fontsReady();
  const paper = $("paper");
  const origMaxW = paper ? paper.style.maxWidth : '';
  if (paper) paper.style.maxWidth = '1000px';

  try{
    const dataUrl = await window.htmlToImage.toPng(paper, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      fontEmbedCSS: '',
      skipFonts: true,
      filter: (node) => {
        return !(node.classList && node.classList.contains('copy-code-btn'));
      }
    });
    const blob = await (await fetch(dataUrl)).blob();
    download(blob, baseName() + '.png');
    toast("PNG 저장됨 (2x 초고화질 와이드)");
  } catch(e) {
    toast("PNG 변환 실패: " + e.message);
  } finally {
    if (paper) paper.style.maxWidth = origMaxW;
  }
}

// ---------- draft auto-save ----------
function saveDraft(){
  const doc = currentDoc();
  if(!doc) return;
  lsSet('md_reader_draft', JSON.stringify({
    name: doc.name || 'draft.md',
    text: doc.text,
    time: Date.now()
  }));
}

// ---------- wire up ----------
$("inFile").addEventListener("change",e=>e.target.files.length&&ingestFiles(e.target.files));
$("inFolder").addEventListener("change",e=>e.target.files.length&&ingestFiles(e.target.files));
$("inZip").addEventListener("change",e=>e.target.files.length&&ingestZip(e.target.files[0]));
$("inImg").addEventListener("change",e=>e.target.files.length&&addImages(e.target.files));
$("inBind").addEventListener("change",async e=>{ if(bindTarget&&e.target.files[0]) await bindImage(bindTarget,e.target.files[0]); bindTarget=null; e.target.value=''; });

$("pickFile").onclick=()=>$("inFile").click();
$("pickFolder").onclick=()=>$("inFolder").click();
$("pickZip").onclick=()=>$("inZip").click();
if($("btnOpen")) $("btnOpen").onclick=()=>$("inFolder").click();
$("newDocBtn").onclick=newDoc;
$("brandHome").onclick=goHome;

$("btnSide").onclick=()=>{ $("workspace").classList.toggle('no-sidebar'); $("btnSide").classList.toggle('on'); };
$("btnEdit").onclick=()=>{ $("workspace").classList.toggle('no-editor'); $("btnEdit").classList.toggle('on'); };

if ($("btnTabEdit") && $("btnTabPreview")) {
  $("btnTabEdit").onclick = () => {
    $("workspace").classList.remove("mobile-mode-preview");
    $("btnTabEdit").classList.add("active");
    $("btnTabPreview").classList.remove("active");
  };
  $("btnTabPreview").onclick = () => {
    $("workspace").classList.add("mobile-mode-preview");
    $("btnTabEdit").classList.remove("active");
    $("btnTabPreview").classList.add("active");
  };
}

if ($("langSel")) {
  $("langSel").addEventListener("change", (e) => {
    if (window.i18n) window.i18n.setLang(e.target.value);
  });
}

if ($("mobileDocSelect")) {
  $("mobileDocSelect").addEventListener("change", (e) => {
    selectDoc(+e.target.value);
  });
}
if ($("btnMobileAddImg")) {
  $("btnMobileAddImg").onclick = () => $("inImg").click();
}

if ($("btnMobileSettings")) {
  $("btnMobileSettings").onclick = () => {
    const m = $("mobileSettingsModal");
    if (m) m.style.display = 'flex';
  };
}
if ($("btnCloseMobileSettings")) {
  $("btnCloseMobileSettings").onclick = () => {
    const m = $("mobileSettingsModal");
    if (m) m.style.display = 'none';
  };
}

if ($("mSubLangSel")) {
  $("mSubLangSel").addEventListener("change", (e) => {
    if (window.i18n) window.i18n.setLang(e.target.value);
  });
}
if ($("mSubBtnTheme")) $("mSubBtnTheme").onclick = () => $("btnTheme").click();
if ($("mSubBtnMd")) $("mSubBtnMd").onclick = () => { $("mobileSettingsModal").style.display = 'none'; exportMd(); };
if ($("mSubBtnCopy")) $("mSubBtnCopy").onclick = () => { $("mobileSettingsModal").style.display = 'none'; exportCopyRichText(); };
if ($("mSubBtnPdf")) $("mSubBtnPdf").onclick = () => { $("mobileSettingsModal").style.display = 'none'; exportPdf(); };
if ($("mSubBtnHtml")) $("mSubBtnHtml").onclick = () => { $("mobileSettingsModal").style.display = 'none'; exportHtml(); };
if ($("mSubBtnDocx")) $("mSubBtnDocx").onclick = () => { $("mobileSettingsModal").style.display = 'none'; exportDocx(); };
if ($("mSubBtnPng")) $("mSubBtnPng").onclick = () => { $("mobileSettingsModal").style.display = 'none'; exportPng(); };

if($("btnMd")) $("btnMd").onclick = exportMd;
if($("btnCopyRich")) $("btnCopyRich").onclick=exportCopyRichText;
$("btnPdf").onclick=exportPdf;
$("btnHtml").onclick=exportHtml;
$("btnDocx").onclick=exportDocx;
$("btnPng").onclick=exportPng;
if($("btnCloseMermaidModal")) {
  $("btnCloseMermaidModal").onclick = () => {
    const m = $("mermaidModal");
    if (m) m.style.display = 'none';
  };
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const m = $("mermaidModal");
    if (m && m.style.display !== 'none') m.style.display = 'none';
  }
});

$("btnTheme").onclick=()=>{
  document.body.classList.toggle("dark");
  if (cmEditor) cmEditor.setOption("theme", document.body.classList.contains("dark") ? "dracula" : "default");
  $("hljs-theme").href=document.body.classList.contains("dark")?"vendor/styles/github-dark.min.css":"vendor/styles/github.min.css";
  if(state.current>=0 && hasMermaid(currentDoc().text, currentDoc().name)) renderPreview();
};

$("btnStripAbs").onclick=()=>{
  const d=currentDoc(); if(!d)return;
  d.text=stripAbsolutePaths(cmEditor ? cmEditor.getValue() : $("editor").value);
  if(cmEditor) cmEditor.setValue(d.text); else $("editor").value=d.text;
  renderPreview(); updateCounts(); toast("절대경로 접두어 제거 완료");
};

let rt;
$("editor").addEventListener("input",()=>{
  const d=currentDoc(); if(!d)return;
  d.text=$("editor").value;
  updateCounts(); saveDraft(); writeToDisk(d);
  clearTimeout(rt); rt=setTimeout(renderPreview,200);
});

// Code block copy button click delegation
$("preview").addEventListener('click', (e) => {
  if (e.target && e.target.classList.contains('copy-code-btn')) {
    const wrapper = e.target.closest('.code-block-wrapper');
    const code = wrapper ? wrapper.querySelector('code') : null;
    if (code) {
      navigator.clipboard.writeText(code.textContent).then(() => {
        e.target.textContent = '✓ 복사됨';
        setTimeout(() => { e.target.textContent = '📋 복사'; }, 2000);
      }).catch(() => toast('코드 복사 실패'));
    }
  }
});

// Presentation Keyboard Navigation Listener removed (slide feature deprecated)

let syncing=false;
$("editor").addEventListener("scroll",()=>{ if(syncing)return; syncing=true; const ed=$("editor"),pw=$("previewWrap"); const r=ed.scrollTop/((ed.scrollHeight-ed.clientHeight)||1); pw.scrollTop=r*((pw.scrollHeight-pw.clientHeight)||0); requestAnimationFrame(()=>syncing=false); });

$("encSel").addEventListener("change",e=>{
  if(state.current<0)return; const d=currentDoc(); d.encoding=e.target.value; d.text=decodeBytes(d.bytes,d.encoding);
  if(cmEditor) cmEditor.setValue(d.text); else $("editor").value=d.text;
  renderPreview(); updateCounts(); toast("인코딩: "+encLabel(e.target.value));
});

(function(){
  const saved = lsGet('editorW');
  if (saved) document.documentElement.style.setProperty('--editorW', saved);
  let dragging = false;
  const divider = $("divider");
  if (!divider) return;

  const MIN_EDITOR_PX = 280;  // 에디터 최소 너비 (px)
  const MIN_PREVIEW_PX = 360; // 미리보기 최소 너비 (px)

  divider.addEventListener("mousedown", (e) => {
    dragging = true;
    divider.classList.add("dragging");
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const panes = $("panes");
    if (!panes) return;
    const rect = panes.getBoundingClientRect();
    const sidebar = $("sidebar");
    const sidebarWidth = (sidebar && getComputedStyle(sidebar).display !== 'none') ? sidebar.offsetWidth : 0;

    const availableWidth = rect.width - sidebarWidth - 6;
    const mouseX = e.clientX - rect.left - sidebarWidth;

    let editorPx = Math.max(MIN_EDITOR_PX, Math.min(availableWidth - MIN_PREVIEW_PX, mouseX));
    let editorPct = (editorPx / availableWidth) * 100;

    document.documentElement.style.setProperty('--editorW', editorPct.toFixed(2) + '%');
  });

  window.addEventListener("mouseup", () => {
    if (dragging) {
      dragging = false;
      divider.classList.remove("dragging");
      document.body.style.userSelect = '';
      lsSet('editorW', getComputedStyle(document.documentElement).getPropertyValue('--editorW').trim());
    }
  });
})();

const dz=$("dropzone");
["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{ e.preventDefault(); dz.classList.add("drag"); }));
["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{ e.preventDefault(); dz.classList.remove("drag"); }));
document.addEventListener("dragover",e=>e.preventDefault());
document.addEventListener("drop",e=>e.preventDefault());

function readAllEntries(reader){ return new Promise(resolve=>{ const out=[]; const rd=()=>reader.readEntries(ents=>{ if(!ents.length)return resolve(out); out.push(...ents); rd(); },()=>resolve(out)); rd(); }); }
function walkEntry(entry,path,files){
  return new Promise(resolve=>{
    if(entry.isFile){ entry.file(f=>{ try{Object.defineProperty(f,'webkitRelativePath',{value:path+f.name});}catch(e){} files.push(f); resolve(); },()=>resolve()); }
    else if(entry.isDirectory){ const reader=entry.createReader(); readAllEntries(reader).then(async ents=>{ for(const en of ents) await walkEntry(en,path+entry.name+'/',files); resolve(); }); }
    else resolve();
  });
}
dz.addEventListener("drop",async e=>{
  const items=e.dataTransfer.items;
  if(items&&items.length&&items[0].webkitGetAsEntry){
    const roots=[]; for(const it of items){ const en=it.webkitGetAsEntry&&it.webkitGetAsEntry(); if(en)roots.push(en); }
    if(roots.length){ const files=[]; for(const r of roots) await walkEntry(r,'',files);
      if(files.length){ if(files.length===1&&/\.zip$/i.test(files[0].name))return ingestZip(files[0]); return ingestFiles(files); } }
  }
  const fl=e.dataTransfer.files;
  if(fl&&fl.length){ if(fl.length===1&&/\.zip$/i.test(fl[0].name))return ingestZip(fl[0]); return ingestFiles(fl); }
});

window.addEventListener("DOMContentLoaded",()=>{
  if(!window.markdownit||!window.MDCore) toast("코어 로드 실패 — vendor/ 또는 인터넷 연결 확인");
  initCodeMirror();
  // Check for auto-saved draft if any
  const saved = lsGet('md_reader_draft');
  if(saved) {
    try {
      const data = JSON.parse(saved);
      if(data && data.text && data.text.trim()) {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.style.borderColor = 'var(--accent)';
        btn.style.color = 'var(--accent)';
        btn.style.fontSize = '12px';
        btn.style.padding = '6px 14px';
        btn.textContent = '⏱️ ' + i18n.t('btnRestoreDraft');
        btn.onclick = () => {
          reset();
          state.docs.push({ name: data.name || 'draft.md', path: data.name || 'draft.md', bytes: new Uint8Array(), encoding: 'utf-8', detected: 'utf-8', text: data.text });
          $("dropzone").style.display = "none";
          $("workspace").classList.add("active");
          $("toolbar").style.display = "flex";
          renderFileList();
          selectDoc(0);
          toast(i18n.t('toastDraftRestored'));
        };
        let draftWrap = document.querySelector('#draftRestoreWrap');
        if (!draftWrap) {
          draftWrap = document.createElement('div');
          draftWrap.id = 'draftRestoreWrap';
          const dropzone = document.querySelector('#dropzone');
          if (dropzone) dropzone.appendChild(draftWrap);
        }
        draftWrap.innerHTML = '';
        draftWrap.appendChild(btn);
      }
    } catch(e){}
  }
});

// PWA: register service worker (http/https only; not file://)
if('serviceWorker' in navigator && location.protocol.indexOf('http')===0){
  window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}