# [구현 계획서] 내보내기/다운로드 문서화 고도화 및 표/다이어그램 뷰 정리

사용자분의 4가지 요구사항(툴바 정리, 표 테두리 선명화, PDF/Docx 다운로드 시 다이어그램 PNG 이미지 자동 변환, 클린 PDF 인쇄 전용 CSS)을 반영한 구현 계획서입니다.

---

## 🎯 4대 핵심 구현 목표

### 1. Mermaid 카드 뷰 툴바 정리 (줌 버튼 제거)
- 일반 미리보기 카드의 툴바에서 `🔍 ＋`, `🔍 －`, `🔄 100%` 버튼 제거.
- 확대/축소 기능은 **85% 팝업 크게보기 상단 툴바에서만 제공**하여 카드 뷰를 한층 더 깔끔하게 유지.
- 카드 툴바 구성: `🔍 팝업 크게보기` | `📥 SVG` | `🖼️ PNG`

### 2. 마크다운 표 (Table) 테두리 및 디자인 보정
- `index.html` CSS에 표(Table) 전용 테두리 및 가독성 디자인 스타일 적용:
  - `border-collapse: collapse; width: 100%;`
  - `th, td` 구분 테두리 `1px solid var(--border)`
  - 헤더 `th` 배경색 (`var(--accent-soft)` / `#f1f5f9`) 및 폰트 굵기 적용.
  - 짝수 행 자브라 배경색 (`tbody tr:nth-child(even)`) 추가.

### 3. PDF / Word (.docx) 다운로드 시 Mermaid 다이어그램 PNG 이미지 자동 변환
- `exportPdf()` 및 `exportDocx()` 실행 직전에 문서 내 모든 Mermaid SVG 다이어그램을 **고화질 PNG canvas dataURL (`<img src="data:image/png;base64,...">`)**로 자동 변환하여 문서에 주입.
- 변환 후 인쇄/다운로드가 완료되면 원본 SVG 카드로 안전 복원.

### 4. PDF 인쇄 전용 클린 CSS (`@media print`)
- `@media print` 전용 스타일을 구축하여:
  - 좌측 사이드바, 상단 툴바, 에디터 창, 광고 슬롯, 토스트 팝업 등 불필요한 UI **전면 숨김 (`display: none !important;`)**.
  - 오직 마크다운 종이 미리보기 영역 (`.paper` / `#preview`) 만 100% 백색 종이 서식으로 깔끔하게 출력.

---

## 🛠️ 상세 변경 계획

### [MODIFY] [index.html](file:///d:/2026.07_markdown_reader/index.html)
- 표(Table) 테두리 CSS 규칙 추가 (`.md-body table`, `th`, `td`).
- `@media print` 인쇄 전용 스타일 구축 (`body`, `#workspace`, `#previewWrap` 외 UI 전체 비활성화).

### [MODIFY] [app.js](file:///d:/2026.07_markdown_reader/app.js)
- 카드 뷰 툴바에서 `btn-zoom-in`, `btn-zoom-out`, `btn-zoom-reset` 마크업 제거.
- `mermaidToPngImages()` 헬퍼 함수 구현: `html-to-image` 또는 Canvas API로 모든 `.mermaid` SVG를 PNG dataURL로 일괄 동기화 변환.
- `exportPdf()` 및 `exportDocx()` 내부에 다이어그램 PNG 치환 후 인쇄/다운로드 처리 로직 추가.

---

## 🧪 검증 계획
1. 마크다운 표 포함 문서 로드 후 선명한 1px 테두리 및 헤더 디자인 확인.
2. PDF 저장 버튼 클릭 시 오직 미리보기 종이 서식만 인쇄 창에 출력되고 다이어그램이 PNG 이미지로 주입되어 인쇄되는지 검증.
3. Word(.docx) 다운로드 시 다이어그램이 PNG 이미지로 삽입되었는지 검증.
4. Playwright 스크린샷 시각 검사.
