# [구현 계획서] 코드 블록 줄바꿈 & 내보내기(PDF/Word/HTML/PNG) 서식 고도화

사용자분의 지적사항(PDF/PNG 저장 시 코드 블록 줄바꿈 미적용, HTML/Word 내보내기 시 복사 버튼 노출 및 코드 상자 서식 누락)을 100% 해결하기 위한 계획서입니다.

---

## 💡 원인 분석 및 해결책

### 1. 코드 블록 줄바꿈 미적용 (PDF & PNG)
- **원인**: `pre` 태그 기본 CSS인 `white-space: pre`로 인해 긴 구문(JSON, URL 등)이 가로 스크롤/종이 밖으로 잘림.
- **해결**: `@media print` 및 미리보기 CSS에 `white-space: pre-wrap !important; word-break: break-all !important;` 지정.

### 2. HTML / Word / PNG 내보내기 시 `📋 복사` 버튼 노출
- **원인**: 에디터 내 편리성을 위해 추가된 `.copy-code-btn` 마크업이 내보내기 시 함께 캡처됨.
- **해결**: 내보내기 시 DOM 복사본에서 `.copy-code-btn` 요소를 전면 자동 제거 처리.

### 3. Word(.docx) & HTML 내보내기 시 코드 블록 서식 누락
- **원인**: 내보내기 인라인 CSS에 `pre` 및 `code` 태그의 연회색 배경(`background-color: #f6f8fa`)과 1px 테두리(`border: 1px solid #d0d7de`) 스타일이 누락됨.
- **해결**: Word MSO 및 HTML 인라인 스타일 시트에 GitHub 표준 코드 상자 스타일을 내장 반영.

---

## 🛠️ 상세 변경 계획

### [MODIFY] [index.html](file:///d:/2026.07_markdown_reader/index.html)
- `@media print` 및 일반 CSS에 `pre, code` 줄바꿈 속성 추가:
  ```css
  pre, code, .code-block-wrapper pre {
    white-space: pre-wrap !important;
    word-break: break-all !important;
    word-wrap: break-word !important;
  }
  ```

### [MODIFY] [app.js](file:///d:/2026.07_markdown_reader/app.js)
- `exportHtml()`, `exportDocx()`, `exportPng()` 및 HTML 변환 로직에서 `.copy-code-btn` 버튼 제거 헬퍼 함수 구현 및 `pre/code` 인라인 스타일 강화.

---

## 🧪 검증 계획
1. 긴 JSON-LD / URL 코드가 포함된 마크다운 문서 준비.
2. PDF / PNG / Word / HTML 4가지 포맷 내보내기 실행.
3. PDF/PNG에서 코드 블록이 종이 밖으로 넘어가지 않고 자동 줄바꿈되는지 확인.
4. HTML/Word에서 `📋 복사` 버튼이 지워지고 연회색 코드 박스가 예쁘게 들어가는지 확인.
5. Playwright 스크립트로 동작 검증.
