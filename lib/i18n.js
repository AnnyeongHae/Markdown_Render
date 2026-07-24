/**
 * MD Viewer & Converter - i18n Internationalization Module
 * Default Language: English ('en')
 * Supports: English (en), Korean (ko), Japanese (ja), Chinese (zh), Spanish (es)
 */

(function (window) {
  const translations = {
    en: {
      brandTitle: "MD Viewer & Converter",
      btnStripAbs: "Clean Paths",
      btnSide: "Toggle Sidebar",
      btnEdit: "Toggle Editor",
      btnTheme: "Theme",
      btnMd: "📥 Save .md",
      btnCopyRich: "📋 Copy Rich Text",
      btnPdf: "Save PDF",
      btnHtml: "Export HTML",
      btnDocx: "Word (.docx)",
      btnPng: "Export PNG",
      docListTitle: "Documents",
      tocListTitle: "Table of Contents",
      tocEmpty: "No headings (H1~H3) found",
      assetInfoTitle: "Image Assets",
      assetTitle: "Image Assets: ",
      assetMissing: "Missing: ",
      btnAddImg: "＋ Add Image Directly",
      bindHead: "🔗 Link Missing Images",
      bindCardDesc: "Drag image here or click to select",
      autoTagDetected: "Detected: ",
      dropTitle: "Drop Markdown (.md) or Diagram (.mmd) files here",
      dropDesc: "Drop Markdown (.md), Diagram (.mmd), image folders, or ZIP archives.<br>All processing happens 100% locally in your browser. No server uploads.",
      pickFolderBtn: "📂 Open Folder",
      pickFileBtn: ".md / .mmd File",
      pickZipBtn: "🗜️ ZIP File",
      newDocBtn: "✍️ New Document",
      newDocCaption: "Start a new doc to jump straight into the editor.",
      editorPlaceholder: "Type or paste your Markdown content here...",
      draftSaved: "Auto-saved",
      syntaxOk: "Syntax Valid",
      syntaxOkTitle: "Markdown, Math, and Code block syntaxes are valid.",
      syntaxWarn: "Syntax Warning",
      btnRestoreDraft: "Restore Draft",
      toastDraftRestored: "Restored previous draft!",
      diagramModalTitle: "🔍 Diagram Viewer",
      dividerTitle: "Drag to resize editor and preview panes",
      btnModalClose: "✕ Close (Esc)",
      zoomIn: "🔍 ＋ Zoom In",
      zoomOut: "🔍 － Zoom Out",
      zoomReset: "🔄 100% Reset",
      exportSvg: "📥 Export SVG",
      exportPngModal: "🖼️ Export PNG",
      toastMdSaved: "📥 Saved .md: ",
      toastCopySuccess: "📋 Formatted rich text copied to clipboard!",
      toastCopyFail: "Rich text copy failed: ",
      toastPngExporting: "Generating PNG... (1000px Wide 2x)",
      toastPngSaved: "PNG Saved (2x Ultra High-Res)",
      toastPngFail: "PNG export failed: ",
      toastDocxStart: "Converting to Word document (.docx)...",
      toastDocxSaved: "Word document saved! (.docx)",
      toastDocxFail: "Word conversion error: ",
      toastHtmlSaved: "HTML export completed! (.html)",
      toastPdfStart: "Opening print dialog for PDF saving...",
      toastAbsStripped: "Stripped local file:// paths into clean code badges!"
    },
    ko: {
      brandTitle: "MD Viewer & Converter",
      btnStripAbs: "절대경로 제거",
      btnSide: "사이드바 토글",
      btnEdit: "에디터 토글",
      btnTheme: "테마 변경",
      btnMd: "📥 .md 저장",
      btnCopyRich: "📋 서식 복사",
      btnPdf: "PDF 저장",
      btnHtml: "HTML 내보내기",
      btnDocx: "Word(.docx)",
      btnPng: "PNG 이미지화",
      docListTitle: "문서 목록",
      tocListTitle: "문서 목차 (TOC)",
      tocEmpty: "목차(H1~H3)가 없습니다.",
      assetInfoTitle: "이미지 자산 정보",
      assetTitle: "이미지 자산: ",
      assetMissing: "누락: ",
      btnAddImg: "＋ 이미지 직접 추가",
      bindHead: "🔗 누락 이미지 연결",
      bindCardDesc: "여기로 이미지 드래그 · 클릭해서 선택",
      autoTagDetected: "감지: ",
      dropTitle: "마크다운(.md) 및 다이어그램(.mmd) 파일을 끌어다 놓으세요",
      dropDesc: "마크다운(.md), 다이어그램(.mmd), 이미지가 든 폴더 또는 ZIP을 통째로 올리세요.<br>모든 처리는 브라우저 안에서만 일어납니다. 서버 업로드 없음.",
      pickFolderBtn: "📂 폴더 (이미지 포함)",
      pickFileBtn: ".md / .mmd 파일",
      pickZipBtn: "🗜️ ZIP",
      newDocBtn: "✍️ 새 문서로 시작",
      newDocCaption: "텍스트만 빠르게 쓰고 변환하려면 새 문서로 시작 → 바로 에디터가 열립니다.",
      editorPlaceholder: "여기에 마크다운을 입력하세요...",
      draftSaved: "자동 저장됨",
      syntaxOk: "문법 정상",
      syntaxOkTitle: "마크다운, 수식, 코드 블록 문법이 올바릅니다.",
      syntaxWarn: "문법 경고",
      btnRestoreDraft: "저장된 초안 복구",
      toastDraftRestored: "이전 저장된 초안이 복구되었습니다.",
      dividerTitle: "드래그하여 에디터와 미리보기 크기 조절",
      btnModalClose: "✕ 닫기 (Esc)",
      zoomIn: "🔍 ＋ 확대",
      zoomOut: "🔍 － 축소",
      zoomReset: "🔄 100% 원본",
      exportSvg: "📥 SVG 다운로드",
      exportPngModal: "🖼️ PNG 다운로드",
      toastMdSaved: "📥 .md 저장 완료: ",
      toastCopySuccess: "📋 서식 포함 리치 텍스트가 클립보드에 복사되었습니다!",
      toastCopyFail: "서식 복사 실패: ",
      toastPngExporting: "PNG 생성 중... (1000px 와이드 2x 인코딩)",
      toastPngSaved: "PNG 저장됨 (2x 초고화질 와이드)",
      toastPngFail: "PNG 변환 실패: ",
      toastDocxStart: "Word 문서 변환 시작...",
      toastDocxSaved: "Word 문서 저장 완료! (.docx)",
      toastDocxFail: "Word 변환 오류: ",
      toastHtmlSaved: "HTML 저장 완료! (.html)",
      toastPdfStart: "PDF 저장을 위한 인쇄 창을 엽니다...",
      toastAbsStripped: "로컬 file:// 경로를 깔끔한 인라인 코드 배지로 정리했습니다!"
    },
    ja: {
      brandTitle: "MD Viewer & Converter",
      btnStripAbs: "絶対パス除去",
      btnSide: "サイドバー切替",
      btnEdit: "エディター切替",
      btnTheme: "テーマ変更",
      btnMd: "📥 .md 保存",
      btnCopyRich: "📋 リッチテキストコピー",
      btnPdf: "PDF 保存",
      btnHtml: "HTML 出力",
      btnDocx: "Word (.docx)",
      btnPng: "PNG 画像化",
      docListTitle: "ドキュメント一覧",
      tocListTitle: "目次 (TOC)",
      assetInfoTitle: "画像アセット情報",
      dropTitle: "Markdown (.md) または図面 (.mmd) ファイルをドロップ",
      dropDesc: "すべての処理はブラウザ内でローカルに行われます。サーバー送信はありません。",
      pickFolderBtn: "📂 フォルダ (画像含む)",
      pickFileBtn: ".md / .mmd ファイル",
      pickZipBtn: "🗜️ ZIP アーカイブ",
      newDocBtn: "✍️ 新規作成",
      newDocCaption: "新規ドキュメントを作成してすぐにエディターを開きます。",
      editorPlaceholder: "ここに Markdown を入力...",
      draftSaved: "自動保存済み",
      syntaxOk: "🟢 文法正常",
      dividerTitle: "ドラッグして幅を調整",
      btnModalClose: "✕ 閉じる (Esc)",
      zoomIn: "🔍 ＋ 拡大",
      zoomOut: "🔍 － 縮小",
      zoomReset: "🔄 100% リセット",
      exportSvg: "📥 SVG DL",
      exportPngModal: "🖼️ PNG DL",
      toastMdSaved: "📥 .md 保存完了: ",
      toastCopySuccess: "📋 クリップボードにコピーしました！",
      toastCopyFail: "コピー失敗: ",
      toastPngExporting: "PNG 生成中...",
      toastPngSaved: "PNG 保存完了！",
      toastPngFail: "PNG 変換失敗: ",
      toastDocxStart: "Word 変換中...",
      toastDocxSaved: "Word 保存完了！ (.docx)",
      toastDocxFail: "Word 変換エラー: ",
      toastHtmlSaved: "HTML 保存完了！ (.html)",
      toastPdfStart: "PDF 印刷ダイアログを開きます...",
      toastAbsStripped: "ローカルパスを整形しました！"
    },
    zh: {
      brandTitle: "MD Viewer & Converter",
      btnStripAbs: "清除绝对路径",
      btnSide: "切换侧边栏",
      btnEdit: "切换编辑器",
      btnTheme: "切换主题",
      btnMd: "📥 保存 .md",
      btnCopyRich: "📋 复制富文本",
      btnPdf: "保存 PDF",
      btnHtml: "导出 HTML",
      btnDocx: "Word (.docx)",
      btnPng: "导出 PNG",
      docListTitle: "文档列表",
      tocListTitle: "目录 (TOC)",
      assetInfoTitle: "图片资源信息",
      dropTitle: "拖放 Markdown (.md) 或图表 (.mmd) 文件至此",
      dropDesc: "所有处理均在浏览器内部 100% 本地完成，无需上传至服务器。",
      pickFolderBtn: "📂 文件夹 (含图片)",
      pickFileBtn: ".md / .mmd 文件",
      pickZipBtn: "🗜️ ZIP 压缩包",
      newDocBtn: "✍️ 新建文档",
      newDocCaption: "新建文档即可直接进入编辑器。",
      editorPlaceholder: "在此输入 Markdown 文本...",
      draftSaved: "已自动保存",
      syntaxOk: "🟢 语法正常",
      dividerTitle: "拖动调节编辑器与预览区域宽度",
      btnModalClose: "✕ 关闭 (Esc)",
      zoomIn: "🔍 ＋ 放大",
      zoomOut: "🔍 － 缩小",
      zoomReset: "🔄 100% 重置",
      exportSvg: "📥 下载 SVG",
      exportPngModal: "🖼️ 下载 PNG",
      toastMdSaved: "📥 保存 .md 完成: ",
      toastCopySuccess: "📋 已复制富文本至剪贴板！",
      toastCopyFail: "复制失败: ",
      toastPngExporting: "正在生成 PNG...",
      toastPngSaved: "PNG 保存成功！",
      toastPngFail: "PNG 转换失败: ",
      toastDocxStart: "正在转换为 Word 文档...",
      toastDocxSaved: "Word 文档保存成功！ (.docx)",
      toastDocxFail: "Word 转换错误: ",
      toastHtmlSaved: "HTML 导出成功！ (.html)",
      toastPdfStart: "正在打开 PDF 打印窗口...",
      toastAbsStripped: "已清理本地 file:// 路径！"
    },
    es: {
      brandTitle: "MD Visor y Convertidor",
      btnStripAbs: "Limpiar Rutas",
      btnSide: "Alternar Barra Lateral",
      btnEdit: "Alternar Editor",
      btnTheme: "Tema",
      btnMd: "📥 Guardar .md",
      btnCopyRich: "📋 Copiar Formato",
      btnPdf: "Guardar PDF",
      btnHtml: "Exportar HTML",
      btnDocx: "Word (.docx)",
      btnPng: "Imagen PNG",
      docListTitle: "Lista de Documentos",
      tocListTitle: "Tabla de Contenidos (TOC)",
      assetInfoTitle: "Imágenes y Recursos",
      dropTitle: "Arrastre archivos Markdown (.md) o Diagramas (.mmd) aquí",
      dropDesc: "Todo el procesamiento se realiza 100% localmente en su navegador.",
      pickFolderBtn: "📂 Carpeta (con Imágenes)",
      pickFileBtn: "Archivo .md / .mmd",
      pickZipBtn: "Archivo ZIP",
      newDocBtn: "✍️ Nuevo Documento",
      newDocCaption: "Cree un nuevo documento para abrir el editor de inmediato.",
      editorPlaceholder: "Escriba texto en Markdown aquí...",
      draftSaved: "Guardado aut.",
      syntaxOk: "🟢 Sintaxis OK",
      dividerTitle: "Arrastre para redimensionar páneles",
      btnModalClose: "✕ Cerrar (Esc)",
      zoomIn: "🔍 ＋ Ampliar",
      zoomOut: "🔍 － Reducir",
      zoomReset: "🔄 100% Restablecer",
      exportSvg: "📥 Descargar SVG",
      exportPngModal: "🖼️ Descargar PNG",
      toastMdSaved: "📥 Guardado .md: ",
      toastCopySuccess: "📋 Texto con formato copiado al portapapeles!",
      toastCopyFail: "Error al copiar: ",
      toastPngExporting: "Generando PNG...",
      toastPngSaved: "PNG Guardado!",
      toastPngFail: "Error PNG: ",
      toastDocxStart: "Convirtiendo a Word (.docx)...",
      toastDocxSaved: "Documento Word guardado! (.docx)",
      toastDocxFail: "Error Word: ",
      toastHtmlSaved: "HTML exportado con éxito! (.html)",
      toastPdfStart: "Abriendo diálogo de impresión PDF...",
      toastAbsStripped: "Rutas locales limpiadas!"
    }
  };

  // Default language is strictly ENGLISH ('en')
  let currentLang = 'en';

  function getTranslation(key) {
    const langDict = translations[currentLang] || translations.en;
    return langDict[key] || translations.en[key] || key;
  }

  function applyLanguage(lang) {
    if (!translations[lang]) lang = 'en';
    currentLang = lang;

    try {
      localStorage.setItem('userLang', lang);
    } catch (e) {}

    // 1. Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = getTranslation(key);
      if (val) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = val;
        } else {
          el.innerHTML = val;
        }
      }
    });

    // 2. Update elements with data-i18n-title attribute
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      const val = getTranslation(key);
      if (val) el.title = val;
    });

    // 3. Update select dropdown if present
    const langSel = document.getElementById('langSel');
    if (langSel) langSel.value = lang;

    // 4. Update HTML lang tag
    document.documentElement.lang = lang;
  }

  function initI18n() {
    let savedLang = null;
    try {
      savedLang = localStorage.getItem('userLang');
    } catch (e) {}

    // Default to 'en' unless explicitly changed by user
    const initialLang = savedLang && translations[savedLang] ? savedLang : 'en';
    applyLanguage(initialLang);
  }

  window.i18n = {
    t: getTranslation,
    setLang: applyLanguage,
    getLang: () => currentLang,
    init: initI18n
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    initI18n();
  }
})(window);
