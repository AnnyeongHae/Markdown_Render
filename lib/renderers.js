"use strict";

// Renderers Module (markdown-it, Callouts, Carousel, KaTeX Math, Mermaid Diagrams)
(function(window) {
  if (!window.markdownit || !window.MDCore) {
    console.error("MDRenderer: core libraries missing");
    return;
  }

  const C = window.MDCore;
  const { esc, keyOf, hasCodeFence, hasMath, hasMermaid } = C;

  // ---------- 1. markdown-it Instance & Plugins ----------
  const md = window.markdownit({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false,
    highlight(str, lang) {
      if (typeof window.hljs !== 'undefined' && lang && window.hljs.getLanguage(lang)) {
        try { return '<pre><code class="hljs">' + window.hljs.highlight(str, { language: lang }).value + '</code></pre>'; } catch(e){}
      }
      if (typeof window.hljs !== 'undefined') {
        try { return '<pre><code class="hljs">' + window.hljs.highlightAuto(str).value + '</code></pre>'; } catch(e){}
      }
      return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
    }
  });

  md.validateLink = (url) => !/^\s*(javascript|vbscript):/i.test(String(url));
  try { if (window.markdownitFootnote) md.use(window.markdownitFootnote); } catch(e){}
  try { if (window.markdownitTaskLists) md.use(window.markdownitTaskLists, { label: true }); } catch(e){}

  window.md = md;

  // ---------- 2. Carousel Slide Global Handlers & Fence Parser ----------
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
    const validIndex = Math.max(0, Math.min(targetIndex, total - 1));

    wrapper.setAttribute('data-current', String(validIndex));
    if (track) {
      track.style.transform = `translateX(-${validIndex * 100}%)`;
    }

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
    const preview = document.getElementById("preview");
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

  // Fence Rules for Mermaid & Carousel
  const _origFence = md.renderer.rules.fence;
  md.renderer.rules.fence = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const info = token.info ? token.info.trim() : '';

    if (info === 'mermaid') {
      return '<div class="mermaid">' + md.utils.escapeHtml(token.content) + '</div>';
    }

    if (info === 'carousel' && !env._inCarousel) {
      const rawContent = token.content || '';
      const slideMds = rawContent.split(/<!--\s*slide\s*-->/i);
      const totalSlides = slideMds.length;
      const carouselId = 'carousel-' + Math.random().toString(36).substring(2, 11);

      let slidesHtml = '';
      let dotsHtml = '';

      slideMds.forEach((sMd, i) => {
        const renderedSlide = md.render(sMd.trim(), { ...env, _inCarousel: true });
        slidesHtml += `<div class="md-carousel-slide${i === 0 ? ' active' : ''}" data-slide-index="${i}">
        <div class="md-carousel-slide-content">${renderedSlide}</div>
      </div>`;
        dotsHtml += `<button class="md-carousel-dot${i === 0 ? ' active' : ''}" onclick="window.setCarouselSlide('${carouselId}', ${i})" aria-label="Slide ${i + 1}"></button>`;
      });

      return `
    <div class="md-carousel-wrapper" id="${carouselId}" data-current="0" data-total="${totalSlides}">
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
        <button class="md-carousel-nav btn-prev" disabled onclick="window.moveCarouselSlide('${carouselId}', -1)" title="Previous Slide">‹ Prev</button>
        <div class="md-carousel-dots">
          ${dotsHtml}
        </div>
        <button class="md-carousel-nav btn-next"${totalSlides <= 1 ? ' disabled' : ''} onclick="window.moveCarouselSlide('${carouselId}', 1)" title="Next Slide">Next ›</button>
      </div>
    </div>
    `;
    }

    if (_origFence) {
      return _origFence(tokens, idx, options, env, self);
    }
    return self.renderToken(tokens, idx, options);
  };

  // ---------- 3. Callout Parser (Obsidian & GitHub Style - Clean Vertical Card) ----------
  function processCallouts(container) {
    if (!container) return;
    container.querySelectorAll('blockquote').forEach(bq => {
      const firstP = bq.querySelector('p');
      if (!firstP) return;
      const fullHtml = firstP.innerHTML.trim();
      const match = fullHtml.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO|TODO|FAQ|QUOTE)\](?:\s+([\s\S]*))?/i);
      if (match) {
        const type = match[1].toLowerCase();
        const contentAfterTag = match[2] ? match[2].trim() : '';
        const icons = { note: '📝', tip: '💡', important: '⚡', warning: '⚠️', caution: '🚨', info: 'ℹ️', todo: '☑️', faq: '❓', quote: '💬' };
        const icon = icons[type] || '📌';
        const typeDefaultTitle = type.toUpperCase();

        let titleHtml = '';
        let bodyHtml = '';

        const brMatch = contentAfterTag.match(/<br\s*\/?>/i);
        if (brMatch) {
          const splitIdx = brMatch.index;
          titleHtml = contentAfterTag.substring(0, splitIdx).trim();
          bodyHtml = contentAfterTag.substring(splitIdx + brMatch[0].length).trim();
        } else if (contentAfterTag.length > 40 || contentAfterTag.includes('</')) {
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

        while (bq.firstChild) {
          calloutDiv.appendChild(bq.firstChild);
        }
        bq.replaceWith(calloutDiv);
      }
    });
  }

  // ---------- 4. KaTeX Math Renderer & Auto-Fix Sanitizer ----------
  function ensureKatex() {
    if (typeof window.ensureCss === 'function') {
      window.ensureCss('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css', 'katex-css');
    }
    if (typeof window.loadOnce === 'function') {
      return window.loadOnce('katex').then(() => window.loadOnce('katexAuto'));
    }
    return Promise.resolve();
  }

  function renderMath() {
    ensureKatex().then(() => {
      const preview = document.getElementById("preview");
      if (!preview) return;

      // 1. Direct fallback katex.render for block formulas $$...$$ inside paragraphs (Auto-fixes unescaped % signs)
      if (typeof window.katex !== 'undefined' && typeof window.katex.render === 'function') {
        const ps = preview.querySelectorAll('p, div');
        ps.forEach(p => {
          const txt = p.textContent ? p.textContent.trim() : '';
          if (txt.startsWith('$$') && txt.endsWith('$$')) {
            let rawMathStr = txt.substring(2, txt.length - 2).trim();
            // Auto-fix unescaped % signs to \% to prevent KaTeX line-comment ParseErrors
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
      if (typeof window.renderMathInElement === 'function') {
        try {
          window.renderMathInElement(preview, {
            delimiters: [
              {left: '$$', right: '$$', display: true},
              {left: '$', right: '$', display: false},
              {left: '\\[', right: '\\]', display: true},
              {left: '\\(', right: '\\)', display: false}
            ],
            ignoredClasses: ['mermaid', 'code-block-wrapper', 'hljs'],
            strict: false,
            trust: true,
            throwOnError: false
          });
        } catch(e){}
      }
    }).catch((err) => console.warn('ensureKatex fail:', err));
  }

  // ---------- 5. Mermaid Diagrams Renderer & Zoom Popup ----------
  function normalizeMermaidCode(code) {
    if (!code) return "";
    let s = String(code).trim();
    s = s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    s = s.replace(/```mermaid/gi, '').replace(/```/gi, '').trim();
    return s;
  }

  function runMermaid() {
    if (typeof window.loadOnce !== 'function') return;
    window.loadOnce('mermaid').then(() => {
      if (typeof window.mermaid === 'undefined') return;
      try {
        window.mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          htmlLabels: true,
          fontFamily: 'Noto Sans KR, sans-serif',
          theme: document.body.classList.contains('dark') ? 'dark' : 'default'
        });
      } catch(e){}

      const preview = document.getElementById("preview");
      if (!preview) return;

      const nodes = preview.querySelectorAll('.mermaid:not([data-processed])');
      nodes.forEach(async (node, idx) => {
        node.setAttribute('data-processed', 'true');
        const rawText = node.textContent;
        if (!rawText || !rawText.trim()) return;

        const code = normalizeMermaidCode(rawText);
        const id = 'mermaid-svg-' + Date.now() + '-' + Math.floor(Math.random() * 1000) + '-' + idx;

        if (typeof window.mermaid.parse === 'function') {
          try {
            const isValid = await window.mermaid.parse(code, { suppressErrors: true });
            if (!isValid) {
              node.innerHTML = `<div class="callout callout-warning"><div class="callout-title">⚠️ Mermaid 다이어그램 구문 오류</div><p style="margin-top:4px;font-size:11.5px;">구문에 불일치하는 기사나 괄호가 있습니다.</p><pre style="margin-top:6px;font-size:11px;background:none;padding:0;max-height:120px;overflow:auto;">${md.utils.escapeHtml(rawText)}</pre></div>`;
              return;
            }
          } catch (parseErr) {}
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
          card.onclick = () => {
            if (typeof window.openMermaidPopup === 'function') {
              window.openMermaidPopup(node);
            }
          };
        }

        try {
          if (typeof window.mermaid.render === 'function') {
            const res = await window.mermaid.render(id, code);
            const svgHtml = (typeof res === 'string') ? res : (res && res.svg ? res.svg : '');
            const bindFn = (res && typeof res.bindFunctions === 'function') ? res.bindFunctions : null;
            if (svgHtml) {
              node.innerHTML = svgHtml;
              node.style.whiteSpace = 'normal';
              if (bindFn) bindFn(node);
            }
          }
        } catch (renderErr) {
          console.warn('Mermaid render failure:', renderErr);
        }
      });
    }).catch(() => {});
  }

  // Export MDRenderer Namespace
  window.MDRenderer = {
    md: md,
    bindCarousels: bindCarousels,
    processCallouts: processCallouts,
    renderMath: renderMath,
    runMermaid: runMermaid,
    normalizeMermaidCode: normalizeMermaidCode
  };

})(window);
