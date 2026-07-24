"use strict";

// Exporters Module (Clean HTML Transformation, PDF, Word, HTML, PNG, Clipboard Export)
(function(window) {
  if (!window.MDCore) {
    console.error("MDExporter: core library missing");
    return;
  }

  const C = window.MDCore;
  const { esc, toast, fontsReady } = C;

  function baseName() {
    let doc = null;
    if (typeof window.currentDoc === 'function') {
      doc = window.currentDoc();
    } else if (window.state && window.state.docs) {
      doc = window.state.docs[window.state.currIndex || 0];
    }
    let name = (doc && doc.path) ? doc.path : "Untitled";
    if (name.includes('/')) name = name.split('/').pop();
    if (name.includes('\\')) name = name.split('\\').pop();
    if (name.includes('.')) {
      name = name.substring(0, name.lastIndexOf('.'));
    }
    name = name.trim().replace(/[\/\\:*?"<>|]/g, '_') || "Untitled";
    return `${name}_markdownrender`;
  }

  function getExportCleanHtml() {
    const preview = document.getElementById("preview");
    if (!preview) return "";
    const clone = preview.cloneNode(true);

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
      if (header) header.remove();
      if (footer) footer.remove();

      if (track) {
        const slides = track.querySelectorAll('.md-carousel-slide');
        slides.forEach((slide, i) => {
          slide.style.transform = 'none';
          slide.style.opacity = '1';
          slide.style.visibility = 'visible';
          slide.style.position = 'relative';
          slide.style.width = '100%';
          slide.style.marginBottom = '20px';
          if (i < slides.length - 1) {
            slide.style.borderBottom = '1px dashed #e1e4e8';
          }
        });
      }
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
    });

    // 3. Image aspect ratio preservation for Word export
    clone.querySelectorAll('img').forEach(img => {
      if (img.classList.contains('mermaid-png-export')) return;

      const isSvgLogo = img.src && (img.src.includes('logo.svg') || img.src.includes('.svg'));
      if (isSvgLogo) {
        img.style.maxWidth = '180px';
        img.style.height = 'auto';
        img.style.objectFit = 'contain';
        img.removeAttribute('width');
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

  async function mermaidToPngImages(pixelRatio = 3) {
    const replacements = [];
    const preview = document.getElementById("preview");
    if (!preview) return () => {};

    const cards = preview.querySelectorAll('.mermaid-card');
    if (cards.length === 0) return () => {};

    if (typeof window.loadOnce === 'function') {
      try { await window.loadOnce('png'); } catch (e) {}
    }

    for (const card of cards) {
      const svgEl = card.querySelector('svg');
      if (!svgEl) continue;

      try {
        let svgData = new XMLSerializer().serializeToString(svgEl);
        if (!svgData.includes('xmlns=')) {
          svgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
        let svgW = 600, svgH = 400;
        if (svgEl.viewBox && svgEl.viewBox.baseVal && svgEl.viewBox.baseVal.width > 0) {
          svgW = Math.round(svgEl.viewBox.baseVal.width);
          svgH = Math.round(svgEl.viewBox.baseVal.height);
        } else {
          const bbox = svgEl.getBoundingClientRect();
          svgW = Math.max(300, Math.round(bbox.width || 680));
          svgH = Math.max(150, Math.round(bbox.height || 400));
        }

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
              canvas.width = Math.round(svgW * pixelRatio);
              canvas.height = Math.round(svgH * pixelRatio);
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              res(canvas.toDataURL('image/png'));
            } catch (e) {
              res(null);
            }
          };
          img.onerror = () => res(null);
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

  async function exportCopyRichText() {
    try {
      const html = getExportCleanHtml();
      const preview = document.getElementById("preview");
      const text = preview ? preview.innerText : "";

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
    const css = document.querySelector('style') ? document.querySelector('style').textContent : '';
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
    C.download(new Blob([html], { type: 'text/html;charset=utf-8' }), baseName() + '.html');
    toast("HTML 저장 완료 (복사 버튼 제거 및 서식 상자 포함)");
  }

  async function exportDocx() {
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : ((k) => k);
    toast(t('toastDocxStart') || 'Word 문서 변환 중...');
    const restore = await mermaidToPngImages(3);
    if (typeof window.loadOnce === 'function') {
      try { await window.loadOnce('docx'); } catch(e){}
    }

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
        C.download(converted, baseName() + '.docx');
        toast(t('toastDocxSaved') || 'Word (.docx) 저장 완료');
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
        C.download(blob, baseName() + '.doc');
        toast(t('toastDocxSaved') || 'Word (.doc) 저장 완료');
      }
    } catch(err) {
      toast((t('toastDocxFail') || 'Word 변환 실패: ') + err.message);
    } finally {
      restore();
    }
  }

  async function exportPng() {
    toast("PNG 생성 중... (1000px 와이드 2x 인코딩)");
    if (typeof window.loadOnce === 'function') {
      try { await window.loadOnce('png'); } catch(e){}
    }
    if (typeof window.htmlToImage === 'undefined') { toast('PNG 라이브러리 로드 실패'); return; }
    await fontsReady();
    const paper = document.getElementById("paper");
    const origMaxW = paper ? paper.style.maxWidth : '';
    if (paper) paper.style.maxWidth = '1000px';

    try {
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
      C.download(blob, baseName() + '.png');
      toast("PNG 저장됨 (2x 초고화질 와이드)");
    } catch(e) {
      toast("PNG 변환 실패: " + e.message);
    } finally {
      if (paper) paper.style.maxWidth = origMaxW;
    }
  }

  // Export MDExporter Namespace & Global Compatibility Functions
  window.MDExporter = {
    baseName: baseName,
    getExportCleanHtml: getExportCleanHtml,
    exportCopyRichText: exportCopyRichText,
    exportPdf: exportPdf,
    exportHtml: exportHtml,
    exportDocx: exportDocx,
    exportPng: exportPng
  };

  window.baseName = baseName;
  window.getExportCleanHtml = getExportCleanHtml;
  window.exportCopyRichText = exportCopyRichText;
  window.exportPdf = exportPdf;
  window.exportHtml = exportHtml;
  window.exportDocx = exportDocx;
  window.exportPng = exportPng;

})(window);
