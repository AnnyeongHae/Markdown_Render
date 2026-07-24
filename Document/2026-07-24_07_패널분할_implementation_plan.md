# [구현 계획서] 에디터/미리보기 패널 분할 바 위치 명확화 & 최소 너비(Min-Width) 제한

사용자분의 지적사항(사이드바는 고정폭 토글 전용, 에디터와 미리보기 패널 사이에 분할 바 배치, 최소 너비 제한 추가)을 해결하기 위한 계획서입니다.

---

## 💡 구현 변경 설계

### 1. 패널 배치 & 사이드바 역할 분리
- **사이드바 (`#sidebar`)**: 고정 폭 260px, 사이드바 토글 버튼으로만 In/Out (드래그 불가 고정)
- **분할 바 (`#divider`)**: 에디터 패널(`#editor-pane`)과 미리보기 패널(`#preview-pane`) 사이에 선명하게 위치하여 마우스 Drag & Drop 조절.

### 2. 에디터 / 미리보기 최소 너비(Minimum Width) 절대 락
- **에디터 패널 최소 너비**: `min-width: 280px !important;`
- **미리보기 패널 최소 너비**: `min-width: 360px !important;`
- **드래그 스크립트 보정**: 마우스 드래그 시 에디터 280px, 미리보기 360px 이하로 무너지지 않도록 절대 픽셀 계산으로 한계선 제어.

---

## 🛠️ 상세 변경 계획

### [MODIFY] [index.html](file:///d:/2026.07_markdown_reader/index.html)
- `#editor-pane` 에 `min-width: 280px`, `#preview-pane` 에 `min-width: 360px` CSS 속성 지정.

### [MODIFY] [app.js](file:///d:/2026.07_markdown_reader/app.js)
- `#divider` Drag & Drop 이벤트 핸들러 고도화 ➔ 사이드바 제외 실제 가용 영역 계산 및 `MIN_EDITOR_PX(280px)`, `MIN_PREVIEW_PX(360px)` 최소 폭 제한 적용.

---

## 🧪 검증 계획
1. 마우스로 분할 바(`#divider`)를 끝까지 왼쪽/오른쪽으로 Drag & Drop.
2. 에디터 패널이 280px 이하로 안 접히고, 미리보기 패널이 360px 이하로 안 접히는지 검증.
3. 사이드바 토글 버튼 클릭 시 사이드바만 260px 고정폭으로 숨겨졌다가 나타나는지 검증.
4. Playwright 자동화 테스트 스크립트 실행.
