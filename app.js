"use strict";

// Main Application Controller & UI Event Handler
(function(window) {
  if (!window.MDCore || !window.MDRenderer || !window.MDExporter) {
    console.error("App initialization error: core modules missing");
    return;
  }

  const C = window.MDCore;
  const { esc, toast, ensureCss, loadOnce, fontsReady } = C;
  const { md, bindCarousels, processCallouts, renderMath, runMermaid } = window.MDRenderer;
  const { baseName, getExportCleanHtml, exportCopyRichText, exportPdf, exportHtml, exportDocx, exportPng } = window.MDExporter;

  function $(id) {
    return document.getElementById(id);
  }

  function updateStats(text) {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;
    const readTime = Math.max(1, Math.ceil(words / 200));

    if ($("statChars")) $("statChars").textContent = chars;
    if ($("statWords")) $("statWords").textContent = words;
    if ($("statLines")) $("statLines").textContent = lines;
    if ($("statReadTime")) $("statReadTime").textContent = readTime + "분";
  }

  // Global State
  const state = {
    docs: [
      { path: "README.md", text: "" }
    ],
    currIndex: 0,
    editor: null,
    dragIdx: null,
    assetFiles: []
  };
  window.state = state;

  function currentDoc() {
    return state.docs[state.currIndex];
  }
  window.currentDoc = currentDoc;

  // ---------- 1. Main Render Preview Pipeline ----------
  function renderPreview() {
    const doc = currentDoc();
    const text = doc ? doc.text : "";
    const preview = $("preview");
    if (!preview) return;

    preview.innerHTML = md.render(text);
    updateStats(text);

    // 1. Image local asset path resolution
    preview.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (src && !src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("data:")) {
        const found = state.assetFiles.find(
          (f) => f.name.toLowerCase() === src.toLowerCase() || f.name.toLowerCase() === src.split("/").pop().toLowerCase()
        );
        if (found) {
          const url = URL.createObjectURL(found);
          img.src = url;
        }
      }
    });

    // 2. Add copy button to code blocks
    preview.querySelectorAll('pre code').forEach((block) => {
      const pre = block.parentNode;
      if (pre && !pre.querySelector('.copy-code-btn')) {
        pre.style.position = 'relative';
        const btn = document.createElement('button');
        btn.className = 'copy-code-btn';
        btn.innerHTML = '📋 Copy';
        btn.onclick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            await navigator.clipboard.writeText(block.textContent);
            btn.innerHTML = '✅ Copied!';
            setTimeout(() => { btn.innerHTML = '📋 Copy'; }, 2000);
          } catch(err) {
            toast('복사 실패');
          }
        };
        pre.appendChild(btn);
      }
    });

    // 3. Process Callouts (1-column clean card design)
    processCallouts(preview);

    // 4. Bind Interactive Carousels
    bindCarousels();

    // 5. KaTeX Math rendering
    if (C.hasMath(text)) {
      renderMath();
    }

    // 6. Mermaid Diagrams rendering
    if (C.hasMermaid(text)) {
      runMermaid();
    }
  }
  window.renderPreview = renderPreview;

  // ---------- 2. Mermaid Popup Zoom Viewer ----------
  function openMermaidPopup(node) {
    let popup = $("mermaid-popup");
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'mermaid-popup';
      popup.className = 'mermaid-popup-overlay';
      popup.innerHTML = `
        <div class="mermaid-popup-container">
          <div class="mermaid-popup-toolbar">
            <span class="mermaid-popup-title">🔍 Mermaid Diagram Detailed Viewer</span>
            <div class="mermaid-popup-actions">
              <button id="mermaid-popup-fit" class="btn-tool">↔️ Fit</button>
              <button id="mermaid-popup-reset" class="btn-tool">↺ 100%</button>
              <button id="mermaid-popup-close" class="btn-tool btn-close">✕ Close</button>
            </div>
          </div>
          <div class="mermaid-popup-body">
            <div id="mermaid-popup-content" class="mermaid-popup-content"></div>
          </div>
        </div>
      `;
      document.body.appendChild(popup);

      const closeBtn = popup.querySelector('#mermaid-popup-close');
      const resetBtn = popup.querySelector('#mermaid-popup-reset');
      const fitBtn = popup.querySelector('#mermaid-popup-fit');
      const content = popup.querySelector('#mermaid-popup-content');

      const closePopup = () => { popup.classList.remove('active'); };
      closeBtn.onclick = closePopup;
      popup.onclick = (e) => { if (e.target === popup) closePopup(); };

      resetBtn.onclick = () => {
        content.style.transform = 'scale(1)';
      };
      fitBtn.onclick = () => {
        content.style.transform = 'scale(0.9)';
      };
    }

    const content = popup.querySelector('#mermaid-popup-content');
    content.innerHTML = node.innerHTML;
    popup.classList.add('active');
  }
  window.openMermaidPopup = openMermaidPopup;

  // ---------- 3. UI Tabs & State Synchronizer ----------
  function renderTabs() {
    const list = $("docTabs");
    if (!list) return;
    list.innerHTML = "";

    state.docs.forEach((doc, idx) => {
      const active = idx === state.currIndex;
      const li = document.createElement("li");
      li.className = `tab-item${active ? " active" : ""}`;
      li.draggable = true;

      const titleSpan = document.createElement("span");
      titleSpan.className = "tab-title";
      titleSpan.textContent = C.keyOf(doc.path);
      titleSpan.title = doc.path;
      li.appendChild(titleSpan);

      const closeBtn = document.createElement("button");
      closeBtn.className = "tab-close";
      closeBtn.innerHTML = "×";
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeDoc(idx);
      };
      li.appendChild(closeBtn);

      li.onclick = () => switchDoc(idx);

      li.ondragstart = (e) => { state.dragIdx = idx; e.dataTransfer.effectAllowed = "move"; };
      li.ondragover = (e) => { e.preventDefault(); };
      li.ondrop = (e) => {
        e.preventDefault();
        if (state.dragIdx === null || state.dragIdx === idx) return;
        const moved = state.docs.splice(state.dragIdx, 1)[0];
        state.docs.splice(idx, 0, moved);
        state.currIndex = idx;
        state.dragIdx = null;
        renderTabs();
      };

      list.appendChild(li);
    });
  }

  function switchDoc(idx) {
    if (idx < 0 || idx >= state.docs.length) return;
    state.currIndex = idx;
    if (state.editor) {
      state.editor.setValue(currentDoc().text);
    }
    renderTabs();
    renderPreview();
  }

  function closeDoc(idx) {
    if (state.docs.length === 1) {
      toast("최소 1개의 문서는 유지되어야 합니다.");
      return;
    }
    state.docs.splice(idx, 1);
    if (state.currIndex >= state.docs.length) {
      state.currIndex = state.docs.length - 1;
    }
    switchDoc(state.currIndex);
  }

  // ---------- 4. Draft Local Storage Auto-save ----------
  const DRAFT_KEY = "md_reader_draft_v2";

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state.docs));
    } catch (e) {}
  }

  function loadDraft() {
    try {
      const data = localStorage.getItem(DRAFT_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.docs = parsed;
          return true;
        }
      }
    } catch (e) {}
    return false;
  }

  // ---------- 5. App Initialization & Event Bindings ----------
  window.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize CodeMirror Editor
    const editorArea = $("editor");
    if (editorArea && typeof window.CodeMirror !== "undefined") {
      state.editor = window.CodeMirror.fromTextArea(editorArea, {
        mode: "markdown",
        theme: "dracula",
        lineNumbers: true,
        lineWrapping: true,
        autofocus: true
      });

      state.editor.on("change", () => {
        const doc = currentDoc();
        if (doc) {
          doc.text = state.editor.getValue();
          renderPreview();
          saveDraft();
        }
      });
    }

    // 2. Load Draft or Default Sample Document
    const hasDraft = loadDraft();
    if (!hasDraft) {
      state.docs = [{
        path: "README.md",
        text: `# Markdown Reader & Live Viewer

> [!NOTE]
> **환영합니다!** 다국어, KaTeX 수식, Mermaid 다이어그램, 캐러셀 슬라이드, 그리고 PDF / Word / HTML / PNG 내보내기를 완전하게 지원하는 웹 마크다운 리더입니다.

$$\\text{ROAS (\\%)} = \\left( \\frac{\\text{광고로 인한 총 매출액}}{\\text{총 광고 소진 비용}} \\right) \\times 100$$

\`\`\`carousel
### 🥇 01. 구매 의도 샌드위치 전략
- 인터랙티브 캐러셀 슬라이드가 깔끔하게 렌더링됩니다.

<!-- slide -->
### 🥈 02. 실속 순위 방어 전략
- 좌우 버튼 또는 하단 점(dot)으로 슬라이드를 넘길 수 있습니다.
\`\`\`
`
      }];
    }

    if (state.editor && currentDoc()) {
      state.editor.setValue(currentDoc().text);
    }

    renderTabs();
    renderPreview();

    // 3. UI Buttons Bindings
    const btnNew = $("newDocBtn");
    if (btnNew) {
      btnNew.onclick = () => {
        const newPath = `Untitled_${Date.now().toString().slice(-4)}.md`;
        state.docs.push({ path: newPath, text: `# ${newPath}\n\n새로운 마크다운 문서를 작성하세요.` });
        switchDoc(state.docs.length - 1);
        toast("새 문서 생성됨");
      };
    }

    const btnSave = $("saveDocBtn");
    if (btnSave) {
      btnSave.onclick = () => {
        const doc = currentDoc();
        if (!doc) return;
        C.download(new Blob([doc.text], { type: "text/markdown;charset=utf-8" }), baseName() + ".md");
        toast("마크다운 문서 저장 완료");
      };
    }

    // Export Buttons Bindings
    if ($("btnCopyRich")) $("btnCopyRich").onclick = exportCopyRichText;
    if ($("btnPdf")) $("btnPdf").onclick = exportPdf;
    if ($("btnHtml")) $("btnHtml").onclick = exportHtml;
    if ($("btnDocx")) $("btnDocx").onclick = exportDocx;
    if ($("btnPng")) $("btnPng").onclick = exportPng;

    // 4. Drag & Drop File Open Handler
    const dropZone = document.body;
    dropZone.ondragover = (e) => { e.preventDefault(); };
    dropZone.ondrop = (e) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const mdFiles = files.filter(f => f.name.match(/\.(md|markdown|txt)$/i));
      const imageFiles = files.filter(f => f.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        state.assetFiles.push(...imageFiles);
      }

      if (mdFiles.length > 0) {
        mdFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (evt) => {
            state.docs.push({ path: file.name, text: evt.target.result });
            switchDoc(state.docs.length - 1);
            toast(`문서 열기 성공: ${file.name}`);
          };
          reader.readAsText(file);
        });
      } else if (imageFiles.length > 0) {
        renderPreview();
        toast(`${imageFiles.length}개의 이미지 자산 등록됨`);
      }
    };

    // 5. Divider Resizer Drag Handler
    const divider = $("divider");
    const paneEditor = $("editor-pane");
    const panePreview = $("preview-pane");

    if (divider && paneEditor && panePreview) {
      let isDragging = false;

      divider.onmousedown = (e) => {
        isDragging = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      };

      document.onmousemove = (e) => {
        if (!isDragging) return;
        const containerW = $("panes").clientWidth;
        let leftW = e.clientX - $("panes").getBoundingClientRect().left;
        leftW = Math.max(280, Math.min(leftW, containerW - 320));

        paneEditor.style.width = leftW + 'px';
        paneEditor.style.flex = 'none';
        panePreview.style.flex = '1';
      };

      document.onmouseup = () => {
        if (isDragging) {
          isDragging = false;
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      };
    }
  });

})(window);