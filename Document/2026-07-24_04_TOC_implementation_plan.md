# [구현 계획서] TOC 클릭 시 웹사이트 전체 쏠림 결함 완전 해결

사용자분이 발견해주신 **TOC 목차 클릭 시 웹사이트 전체(Window Body)가 아래로 뚝 떨어지며 내려가는 심각한 UX 결함**을 해결하기 위한 **`#previewWrap` 전용 상대 스크롤 알고리즘** 계획서입니다.

---

## 💡 원인 분석 및 해결책

### 1. 원인
- `target.scrollIntoView({ behavior: 'smooth' })` 기본 메서드는 클릭 시 최외곽 브라우저 창(`window`/`body`)의 스크롤까지 동시에 강제로 끌어당겨 앱 전체 헤더와 툴바 레이아웃을 무너뜨림.

### 2. 해결책
- `scrollIntoView()`를 완전히 제거하고, **오직 미리보기 패널(`$previewWrap`)만 정확한 상대 오프셋으로 부드럽게 스크롤하는 알고리즘** 구현:
  ```javascript
  const targetTop = target.getBoundingClientRect().top;
  const wrapTop = previewWrap.getBoundingClientRect().top;
  const targetOffset = targetTop - wrapTop + previewWrap.scrollTop - 20;
  previewWrap.scrollTo({ top: targetOffset, behavior: 'smooth' });
  ```
- **효과**: 웹사이트 전체 툴바, 사이드바, 에디터는 단 1px도 움직이지 않고 100% 고정 상태를 유지하며, 오른쪽 마크다운 본문만 원하는 제목 위치로 부드럽게 이동합니다.

---

## 🛠️ 상세 변경 계획

### [MODIFY] [app.js](file:///d:/2026.07_markdown_reader/app.js)
- TOC 아이템 클릭 이벤트 핸들러 교체: `previewWrap.scrollTo` 기반 전용 상대 위치 이동 적용.

---

## 🧪 검증 계획
1. 긴 마크다운 문서 로드 후 TOC 목록 항목 클릭.
2. 웹사이트 전체 헤더/툴바가 1px도 흔들리지 않고 고정되어 있는지 확인.
3. 오른쪽 미리보기 창만 지정한 H1~H3 제목으로 정밀하게 스크롤되는지 검증.
4. Playwright 자동화 테스트 스크립트로 동작 검증.
