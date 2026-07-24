# [구현 계획서] Word(.docx) 내보내기 시 3x 초고화질 유지 & 높이 제한(Fit-to-Height) 고도화

사용자분의 요구사항(Word 문서 변환 시 3x 초고화질은 유지하면서 문서 내 표시 크기를 높이 기반으로 아담하고 예쁘게 조절)을 해결하기 위한 **High-DPI Word 이미지 스케일링 계획서**입니다.

---

## 💡 기술 원인 및 해결책

### 1. 원인
- 3배 초고화질(2400px 이상)로 캔버스를 인코딩했으나, `<img>` 태그에 원래 표시용 자연 너비/높이(`naturalWidth`/`naturalHeight`)와 높이 제한(`max-height: 560px`) 스타일을 명시하지 않아 Word가 3배 물리 픽셀 크기 그대로 거대하게 확대한 형태로 문서에 포함함.

### 2. 완벽 해결책
- **캔버스 화질**: 3x 초고화질 Retina 인코딩 유지 ➔ 폰트 및 선의 쨍함 보존.
- **Word HTML `<img>` 태그 스타일**:
  ```html
  <img class="mermaid-png-export" 
       src="data:image/png;base64,..." 
       style="max-width: 100%; max-height: 560px; width: ${cssWidth}px; height: auto; display: block; margin: 16px auto;" />
  ```
- **효과**: Word 문서 안에서 300 DPI 레벨의 쨍한 화질을 유지하면서도, A4 종이 높이(`max-height: 560px`) 및 원래 다이어그램 카드 비율에 맞춰 아담하고 깔끔하게 쏙 들어가서 저장됩니다.

---

## 🛠️ 상세 변경 계획

### [MODIFY] [app.js](file:///d:/2026.07_markdown_reader/app.js)
- `mermaidToPngImages(scaleFactor = 3)` 수정:
  - 캔버스는 3배 해상도로 인코딩하되, 생성되는 `imgEl` 스타일 및 HTML 인라인 스타일 속성에 `cssWidth`(원본 bbox 너비), `max-height: 560px`, `object-fit: contain` 적용.

---

## 🧪 검증 계획
1. Word (.docx) 내보내기 실행 후 생성된 문서 내 다이어그램이 거대하게 넘치지 않고 깔끔한 크기로 들어가며 화질이 쨍한지 검증.
2. Playwright 스크립트로 동작 검증.
