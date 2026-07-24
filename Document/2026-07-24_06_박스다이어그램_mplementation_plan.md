# [구현 계획서] ASCII / Box Drawing 박스 다이어그램 정밀 줄맞춤 (Monospace Box Alignment)

사용자분의 질문(상자 그리기 문자 `┌─┬─┐`로 작성된 텍스트 아키텍처 다이어그램이 선이 지그재그로 흐트러지는 현상)을 완벽 해결하기 위한 **ASCII Box Art 정밀 줄맞춤 고도화 계획서**입니다.

---

## 💡 원인 분석 및 해결책

### 1. 원인
- `┌─┬─┐` 상자 그리기 문자가 포함된 텍스트는 **한글(2글자 폭)과 알파벳/상자 기호(1글자 폭)의 2:1 비율 고정폭 폰트**가 적용되어야 선이 수직으로 일직선 정렬됨.
- 일반 가변 폰트(Noto Sans)나 자간(Letter Spacing)이 적용되어 선이 어긋나 박스가 무너진 형태로 노출됨.

### 2. 완벽 해결책
1. **ASCII Box Art 자동 감지**:
   - `┌`, `─`, `┬`, `│`, `└`, `┼`, `┤`, `┴`, `├` 박스 문자가 포함된 구역을 **`.ascii-diagram-block`**으로 자동 감지 및 래핑.
2. **동아시아 2:1 코딩 고정폭 폰트 & 픽셀 자간 보정**:
   - `font-family: 'D2Coding', 'Cascadia Code', 'Consolas', 'Courier New', monospace !important;`
   - `line-height: 1.25 !important;`
   - `letter-spacing: 0px !important;`
   - `font-variant-numeric: tabular-nums;`
3. **에디터 & 렌더링 뷰 동시 적용**:
   - CodeMirror 에디터와 오른쪽 미리보기 뷰 모두에서 박스 선이 단 1px의 오차도 없이 칼 같이 수직 정렬되도록 보정.

---

## 🛠️ 상세 변경 계획

### [MODIFY] [index.html](file:///d:/2026.07_markdown_reader/index.html)
- `.ascii-diagram-block` 및 CodeMirror pre 고정폭 줄맞춤 CSS 추가.

### [MODIFY] [app.js](file:///d:/2026.07_markdown_reader/app.js)
- `preprocessObsidian()` 또는 마크다운 렌더링 후처리 단계에서 Box Drawing 문자가 든 pre/p 블록을 감지하여 `.ascii-diagram-block` 클래스 자동 부여.

---

## 🧪 검증 계획
1. `D:\2026.07_markdown_reader\example\2026.05.04-v2-1_plan.md` 파일 로드.
2. `┌─┬─┐` 박스 아키텍처 다이어그램의 좌우/상하 테두리가 수직 일직선으로 딱 떨어지는지 검증.
3. Playwright 스크린샷 시각 검사 진행.
