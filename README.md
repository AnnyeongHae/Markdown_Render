<div align="center">

<img src="assets/logo.svg" width="128" height="128" alt="MD Viewer & Converter Logo" />

# 📖 MD Viewer & Converter

**English | [한국어](#-한국어-안내-korean-overview) | [日本語](#-live-website--online-testing) | [中文](#-live-website--online-testing) | [Español](#-live-website--online-testing)**

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-https%3A%2F%2Fmarkdownrender.pages.dev%2F-blue?style=for-the-badge&logo=cloudflare)](https://markdownrender.pages.dev/)
[![Report Issue](https://img.shields.io/badge/💬_Report_Issue-GitHub_Issues-green?style=for-the-badge&logo=github)](https://github.com/AnnyeongHae/Markdown_Render/issues)
[![GitHub Stars](https://img.shields.io/github/stars/AnnyeongHae/Markdown_Render?style=for-the-badge&color=gold&logo=github)](https://github.com/AnnyeongHae/Markdown_Render/stargazers)
[![License](https://img.shields.io/badge/License-Apache_2.0-red?style=for-the-badge)](LICENSE)

<br/>

> **⚡ 100% Client-Side Browser Markdown Editor, Mermaid Diagram Renderer & Document Converter (PDF, Word, HTML, PNG)**
> 
> **🌐 Try it Live Right Now: [https://markdownrender.pages.dev/](https://markdownrender.pages.dev/)**
> *(All features, exports, diagram rendering, and local folder ingestion are 100% testable on our live website with ZERO server uploads!)*

<br/>

### 🛠️ Tech Stack & Ecosystem

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white)
![Mermaid](https://img.shields.io/badge/Mermaid-FF3E00?style=flat-square&logo=mermaid&logoColor=white)
![CodeMirror](https://img.shields.io/badge/CodeMirror-2E3440?style=flat-square&logo=codemirror&logoColor=white)

</div>

---

## ✨ Key Features

### 📊 1. Mermaid Live Renderer & 85% Modal Viewer
- Real-time rendering for ```mermaid ``` code blocks and `.mmd` diagram files.
- **85% Screen Modal View**: Click any diagram to open an 85% full-screen modal with mouse wheel zoom in/out, pan dragging, and 100% reset.
- **Standalone Export**: Direct high-res **SVG** and **PNG** exports from the modal.

### 📄 2. Multi-Format Document Conversion
- **PDF Export**: Print-ready clean styling with `@media print` page-break avoidance (`page-break-inside: avoid`).
- **Word (.docx)**: MS Word MSO HTML compatibility with `width="520"` scaling for perfect A4 page fit without side clipping.
- **HTML Export**: Standalone HTML output with embedded CSS and copy-button stripping.
- **PNG Capture**: 2x high-resolution wide image capture canvas.

### 📐 3. Perfect ASCII & Box Drawing Alignment
- Auto-detects text architecture boxes (`┌─┬─┐`, `│...│`) and applies `D2Coding`/`Consolas` monospace fonts.
- Zero horizontal font-stretching ➔ Border lines align in a crisp vertical straight line.

### ↔️ 4. Responsive Mobile & Desktop Layout
- **Desktop**: Interactive `#divider` drag & drop panel resizer with 280px / 360px minimum width lock.
- **Smartphone (< 768px)**: 100% mobile-friendly **`✏️ Edit ↔ 👁️ View`** segmented tab switch and **`⚙️ Settings`** popup modal.

### 🛡️ 5. 100% Client-Side Local Privacy & Offline PWA
- **Zero Server Uploads**: Your files, images, and text never leave your browser.
- **Local Image Folder Ingestion**: Drop entire folders containing Markdown files and relative image assets. Blobs are resolved 100% locally.
- **Clean Absolute Paths**: 1-click cleanup of ugly `file:///D:/...` absolute path strings into clean inline code badges.

---

## 🌐 Live Website & Online Testing

You can test all features directly in your browser without installing anything:

👉 **[https://markdownrender.pages.dev/](https://markdownrender.pages.dev/)**

---

## 🇰🇷 한국어 안내 (Korean Overview)

**MD Viewer & Converter**는 외부 서버 업로드 없이 100% 웹 브라우저 클라이언트 측에서 동작하는 마크다운 에디터 겸 프리미엄 문서 변환 플랫폼입니다.

- **실시간 라이브 웹사이트**: [https://markdownrender.pages.dev/](https://markdownrender.pages.dev/)
- **에러 및 버그 제보**: [GitHub Issues 제보하기](https://github.com/AnnyeongHae/Markdown_Render/issues)

---

## 🚀 Quick Local Setup

Run locally with any standard HTTP server:

```bash
# Run with Python built-in server
python -m http.server 8080

# Open in browser
http://localhost:8080
```

---

## 💬 Community & Feedback

If you encounter a bug, have a feature suggestion, or want to contribute:

- **Report Bug / Feature Request**: [Open an Issue on GitHub](https://github.com/AnnyeongHae/Markdown_Render/issues)
- **Star this Repository**: If you find this project useful, please consider giving it a ⭐ **Star** to support open-source development!

---

## 📜 License

Distributed under the **Apache 2.0 License**. See [LICENSE](LICENSE) for details.
