# Client-side Markdown Reader & Renderer Service Implementation Plan

## Project Overview
Build a high-performance, 100% client-side Markdown reader, editor, and converter web application designed for deployment on Cloudflare Pages.
Inspired by **MarkdownLivePreview**, the service features a minimalist, clean, dual-pane UI with maximum user convenience.

---

## 1. Core MVP Requirements (Current & Enhanced Status)
1. **Live Editing & Rendering**: Side-by-side live editor and preview pane with smooth synchronized scrolling and adjustable pane divider.
2. **Multi-Format Client-side Exports**:
   - **PDF**: Clean print-optimized output (`window.print()`).
   - **PNG Image**: Canvas-rendered high-DPI (2x) image of the document (`html-to-image`).
   - **Word (.docx)**: Formatted Microsoft Word document (`html-docx`).
   - **HTML**: Standalone HTML file with all CSS and inline base64 images embedded.
3. **Folder & ZIP Ingest with Relative Image Support**:
   - Drag & drop local folders or `.zip` files containing `.md` and images (`.png`, `.jpg`, `.svg`, `.webp`).
   - Automatic relative path matching (NFC unicode normalization for Mac/Win Korean filenames).
   - Fallback BaseName matching & missing image manual binding UI in sidebar.
4. **Rich Content Support**:
   - **Math / LaTeX**: KaTeX rendering (`$$...$$`, `$...$`, `\[...\]`, `\(...\)`).
   - **Diagrams**: Mermaid.js diagram rendering (```mermaid code fences).
   - **GitHub Flavored Markdown**: Footnotes, task lists, code block syntax highlighting (Highlight.js).

---

## 2. Proposed Client-side Feature Extensions (Value-Add Proposals)
To make this service stand out and maximize user convenience without needing any backend server:

1. **Obsidian & GitHub Callouts / Alerts Support**:
   - Support `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, `> [!IMPORTANT]`, `> [!CAUTION]` blockquotes with modern visual callout boxes.
   - Support Obsidian wikilinks `[[Link]]` gracefully.
2. **Auto-Generated Table of Contents (TOC)**:
   - Dynamic document structure outline in the sidebar or a collapsible overlay for quick header navigation.
3. **1-Click Copy as Rich Text / Formatted HTML**:
   - Copy rendered Markdown directly to clipboard as HTML/Rich Text, allowing instant pasting into **Google Docs, Notion, Slack, Medium, or Email**.
4. **Code Block Copy Button & Line Numbers**:
   - Add a subtle floating "Copy" button on every rendered code block.
5. **Local Draft Auto-Save (Offline Protection)**:
   - Save active markdown text in `localStorage` so users never lose their work on browser refresh or accidental tab closure.
6. **Cloudflare Pages & PWA Optimization**:
   - Add Cloudflare `_headers` (cache-control, security headers) and `_redirects`.
   - Update `sw.js` (Service Worker) for full offline PWA availability.
7. **Monetization & Ad-Ready Layout Slots**:
   - Add non-intrusive, clean container slots for future Google AdSense / EthicalAds / Carbon Ads placement (e.g. top banner, preview footer, sidebar bottom) that can be easily enabled/disabled via configuration.

---

## 3. Proposed File Changes

### [MODIFY] [index.html](file:///d:/2026.07_markdown_reader/index.html)
- Add Obsidian callout styling (`.callout-note`, `.callout-warning`, etc.).
- Add Table of Contents (TOC) sidebar section / modal.
- Add "Copy Rich Text" button to toolbar.
- Add code block copy button styles.
- Add subtle non-intrusive Ad placeholder slots (`#ad-slot-sidebar`, `#ad-slot-footer`).

### [MODIFY] [app.js](file:///d:/2026.07_markdown_reader/app.js)
- Add markdown-it custom plugin rule for Obsidian callouts (`> [!TYPE]`).
- Add TOC extractor and navigation generator.
- Implement `Copy Rich Text` to clipboard via `navigator.clipboard.write([new ClipboardItem(...)])`.
- Add code block hover copy button logic.
- Add automatic `localStorage` draft saving and restoration logic.
- Refine layout state handlers and export options.

### [NEW] [_headers](file:///d:/2026.07_markdown_reader/_headers)
- Cloudflare Pages HTTP header configuration for security and static asset caching.

### [NEW] [_redirects](file:///d:/2026.07_markdown_reader/_redirects)
- Single-page application route fallback configuration for Cloudflare Pages.

---

## 4. Verification Plan

### Automated / Syntax Verification
- Check code syntax using node script or browser syntax checks.

### Manual Verification
- Test dragging `.md` files, folder directories, and ZIP archives containing relative image assets.
- Test KaTeX math rendering (`$E=mc^2$` and block math).
- Test Mermaid diagram rendering (flowcharts, sequence diagrams).
- Test PDF, PNG, DOCX, and HTML export features.
- Test Copy as Rich Text into clipboard.
- Test Dark/Light theme switching and auto-save draft functionality.
