# [전략 계획서] Mermaid Live Editor급 명확한 다이어그램 렌더링 엔진 재설계

Mermaid Live Editor (`https://mermaid.live`) 및 GitHub의 다이어그램 처리 방식을 분석하여, **어떠한 형태의 `.mmd` 또는 `.md` 문서도 100% 명확하고 오류 없이 렌더링하는 클라이언트 사이드 다이어그램 엔진 재설계 전략**을 제안합니다.

---

## 💡 웹 검색 기반 기술 분석 (Mermaid Live Editor 핵심 원리)

1. **사전 구문 검증 (Pre-flight Syntax Validation)**
   - Mermaid Live는 DOM을 직접 조작하기 전 `mermaid.parse(code, { suppressErrors: true })` API를 통해 구문 정확성을 사전 검증합니다.
   - 구문 에러 발생 시 렌더링을 시도하여 애플리케이션을 멈추게 하지 않고, 에러 라인과 메시지를 명확히 띄워줍니다.

2. **동적 샌드박스 렌더링 (Isolated SVG Generation)**
   - `mermaid.render(id, code)` 비동기 API를 사용하여 메모리 상의 임시 ID 컨테이너에 SVG를 생성한 뒤, 주입하는 방식을 취합니다.
   - CSS 및 기존 Markdown-it DOM과의 스타일 간섭을 100% 차단합니다.

3. **인터랙티브 캔버스 (Pan, Zoom, SVG/PNG Export)**
   - 시각적 다이어그램을 단순 이미지로 표시하지 않고, 마우스 휠 확대/축소(Zoom) 및 드래그(Pan)가 가능한 캔버스 뷰포트에 얹어 복잡한 구조도 한눈에 파악할 수 있게 합니다.

---

## 🚀 4대 고도화 전략

### 1단계: 사전 검증 & 스마트 구문 정제 엔진 (`core.js` / `app.js`)
- `mermaid.parse()`를 통한 1차 샌드박스 사전 검사 적용.
- 줄바꿈 소실, 부등호(`>`, `<`) 및 특수문자, 주석(`%%`) 처리, 한 줄 수식 붕괴를 완벽히 교정하는 **Mermaid Syntax Normalizer** 고도화.
- 파싱 실패 시 렌더링 중단 대신 **에러 위치 및 원인을 알려주는 마이크로 에러 오버레이** 표시.

### 2단계: 비동기 독립 SVG 렌더 파이프라인
- `markdown-it` 펜스 처리 시 다이어그램마다 유일한 `UUID` 부여.
- `mermaid.render()` 호출 시 독립된 캔버스 wrapper에 SVG 배치 및 텍스트 겹침 방지 (`htmlLabels: true`, `useMaxWidth: false`).

### 3단계: Mermaid Live급 인터랙티브 뷰포트 (Pan & Zoom & 캔버스)
- 캔버스 내 마우스 드래그 이동(Pan) 및 휠 확대/축소(Zoom) 엔진 구현.
- **전체 화면 모드 (Fullscreen Mode)** 및 **SVG/PNG 고화질 즉시 다운로드** 지원.

### 4단계: `.mmd` 및 `.md` 파일 자동 감지 및 맞춤형 워크스페이스
- `.mmd` 파일 단독 로드 시: 전체 화면이 Mermaid Live 스타일의 **다이어그램 전용 에디터 & 캔버스 워크스페이스**로 자동 전환.
- `.md` 파일 로드 시: 문서 내 모든 다이어그램 블록이 개별 인터랙티브 카드로 독립 렌더링.

---

## 🛠️ 상세 변경 계획

### [MODIFY] [lib/core.js](file:///d:/2026.07_markdown_reader/lib/core.js)
- `preprocessObsidian` 및 `normalizeMermaidCode` 로직 강화: 단독 `.mmd` 파일 및 복잡한 그래프의 부등호, 주석, 한 줄 뭉침 완벽 보정.

### [MODIFY] [app.js](file:///d:/2026.07_markdown_reader/app.js)
- `runMermaid()`를 `mermaid.parse()` pre-flight 검증 -> `mermaid.render()` 비동기 주입 -> Pan/Zoom 캔버스 이벤트 바인딩 파이프라인으로 전면 개편.
- Pan & Zoom (마우스 휠/드래그) 및 Fullscreen, SVG/PNG 수출 기능 추가.

### [MODIFY] [index.html](file:///d:/2026.07_markdown_reader/index.html)
- Mermaid Live급 캔버스 스타일(`mermaid-card`, `mermaid-viewport`, PanZoom 컨트롤 UI) 추가.

---

## 🧪 검증 계획

1. **단독 `.mmd` 파일 검증**: `2026.04.28-15.12-v3-2-retrieval-flow.mmd` 로드 후 Pan/Zoom 및 렌더링 확인.
2. **복잡한 `.md` 파일 검증**: 부등호(`>`), 주석(`%%`), 클래스 스타일(`classDef`)이 섞인 4종 예시 파일 정밀 테스트.
3. **구문 에러 복구력 검증**: 오타가 포함된 다이어그램 입력 시 에러 팝업 및 안전한 가이드 렌더링 확인.
