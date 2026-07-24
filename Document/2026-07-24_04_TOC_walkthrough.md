# Walkthrough - TOC 목차 클릭 시 웹사이트 쏠림 결함 완전 해결

발견해주신 **TOC 목차 클릭 시 웹사이트 전체 레이아웃이 아래로 뚝 떨어지며 내려가는 심각한 UX 결함**을 완전히 해결했습니다.

---

## 📸 직접 시각 검증한 TOC 스크롤 해결 결과 화면

![TOC 스크롤 해결 캡처](C:\Users\user\.gemini\antigravity\brain\e1437e01-2703-4016-8f38-0e983fe93075\toc_fixed_perfect.png)

---

## 🛠️ 완수된 기술 교정 내역

1. **Window 스크롤 전면 락 (`window.scrollTo(0,0)`)**:
   - 기존 `scrollIntoView()` 브라우저 기본 동작이 웹사이트 전체 Window 스크롤을 강제 이동시켜 레이아웃이 뚝 떨어지던 현상을 제거했습니다.
2. **미리보기 패널 전용 부드러운 스크롤 (`#preview-pane.scrollTo`)**:
   - 웹사이트 상단 툴바, 브랜드, 사이드바, 에디터는 단 1px도 흔들리지 않고 **100% 고정**되며, 오직 **오른쪽 미리보기 패널(`#preview-pane`)만 지정한 H1~H3 제목 위치로 쓱 부드럽게 스크롤**되도록 오프셋 계산 알고리즘을 적용했습니다.

---

- 개발 서버 가동 중: `http://localhost:8080` (Task ID: `task-903`).
