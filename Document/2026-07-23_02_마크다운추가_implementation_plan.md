# Advanced Client-Side Features Implementation Plan

## Overview
Implement 3 major enhancements to the pure client-side Markdown Reader & Renderer service:
1. **Advanced Code Editor Integration (CodeMirror)**: Replace basic textarea with line numbers, syntax highlighting, active line highlight, and seamless fallback.
2. **Direct Disk 2-Way Sync (Web File System Access API)**: Allow opening files/folders directly from local disk with debounced auto-saving back to the disk file (`showOpenFilePicker` / `showDirectoryPicker`).
3. **Marp-Style Slide Presentation Mode**: Render `---` slide dividers into an interactive full-screen slide deck with arrow key navigation.

---

## Proposed Changes

### 1. CodeMirror / Advanced Editor Integration
- Add CodeMirror 5/6 vendor scripts with markdown mode.
- Initialize CodeMirror on `#editor` with line numbers, markdown mode, and dark/light theme switching support.
- Maintain seamless fallback to standard `<textarea>` if CodeMirror fails to load offline.

### 2. File System Access API (Direct Disk 2-Way Sync)
- Add "📁 디스크 연동" button to landing page and toolbar.
- Use `window.showOpenFilePicker()` and `window.showDirectoryPicker()`.
- Keep file handles (`FileSystemFileHandle`) in state.
- When user edits markdown, automatically write back to local disk via `handle.createWritable()`.
- Show live status tag: `🟢 디스크 동기화 중 (filename.md)`.

### 3. Marp-Style Slide Presentation Mode
- Add "📽️ 슬라이드" button to toolbar.
- Create full-screen presentation overlay (`#presentationOverlay`) in `index.html`.
- Split markdown by `\n---\n` into individual slide pages.
- Render each slide with KaTeX math and Mermaid diagrams.
- Add keyboard controls: `Left/Right` arrow keys, `Space`, `Backspace`, and `Esc` to close.

---

## File Modifications

### [MODIFY] [index.html](file:///d:/2026.07_markdown_reader/index.html)
- Add CodeMirror CSS/JS CDN/vendor scripts.
- Add "📁 디스크 열기" & "📽️ 슬라이드" buttons to toolbar & landing page.
- Add Presentation Overlay modal structure and CSS styling.

### [MODIFY] [app.js](file:///d:/2026.07_markdown_reader/app.js)
- Initialize CodeMirror editor wrapper.
- Add File System Access API handle listeners and auto-save disk writer.
- Add presentation slide parser, slide renderer, and keydown listeners.

---

## Verification Plan

### Automated / Syntax Verification
- Run `node --check app.js` and `node --check lib/core.js`.

### Manual Verification
- Test CodeMirror line numbers, highlighting, and input sync.
- Test File System Access API disk open & auto-save.
- Test Presentation Mode (slide navigation with arrow keys, math, mermaid).
