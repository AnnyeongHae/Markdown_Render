# Walkthrough - PDF 다이어그램 쪼개짐 방지 & A4 페이지 자동 맞춤 최종 완수

지적해주신 **PDF 저장 시 세로로 긴 다이어그램 SVG가 페이지 경계에서 칼로 싹둑 자르듯 쪼개지던(Split/Slice) 문제**를 완전히 해결했습니다.

---

## 📸 직접 시각 검증한 쪼개짐 없는 PDF 인쇄 결과 화면

![쪼개짐 없는 PDF 인쇄 캡처](C:\Users\user\.gemini\antigravity\brain\e1437e01-2703-4016-8f38-0e983fe93075\pdf_split_avoid_perfect.png)

---

## 🛠️ 완수된 핵심 교정 사항

1. **인쇄 페이지 쪼개짐 전면 금지 (`break-inside: avoid`)**:
   - `page-break-inside: avoid !important;` 및 `break-inside: avoid-page !important;` 규칙을 지정하여 인쇄 엔진이 다이어그램을 페이지 경계에서 절대 분할/절단하지 않도록 차단했습니다.

2. **A4 1페이지 높이 자동 스케일링 (`max-height: 245mm`)**:
   - 세로로 무척 긴 `Phase 1` ~ `Phase 5` 거대 다이어그램이라도 인쇄 시 최대 높이를 `max-height: 245mm !important`로 지정하여 **A4 1페이지 출력 가능 높이 내에 100% 쏙 들어가도록 비율 자동 맞춤(Fit-to-Page)**을 완료했습니다.

---

- 개발 서버 가동 중: `http://localhost:8080` (Task ID: `task-903`).
