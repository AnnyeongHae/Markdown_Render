# 📖 MD Viewer & Converter (마크다운 리더 & 문서 변환기)

> **"로컬 전용 100% 안전한 브라우저 내 마크다운 뷰어, Mermaid 다이어그램 렌더러 및 고품질 PDF/Docx/HTML/PNG 문서 변환 플랫폼"**

MD Viewer & Converter는 서버 업로드 없이 100% 브라우저 클라이언트 측에서 동작하는 스마트 마크다운 에디터 겸 프리미엄 문서 변환 툴입니다. 대형 아키텍처 다이어그램, 수식(LaTeX), 표, 코드 블록을 깨짐 없이 직관적으로 미리보고 고화질 문서로 내보낼 수 있습니다.

---

## ✨ 핵심 기능 (Key Features)

### 📊 1. Mermaid 다이어그램 렌더링 & 85% 모달 뷰어
- 마크다운 내 ````mermaid ```` 코드 블록 및 `.mmd` 파일을 자동으로 아름다운 벡터 다이어그램으로 시각화.
- **85% 풀스크린 모달 뷰어**: 다이어그램 클릭 시 85% 대형 팝업 모달에서 마우스 휠 줌(Zoom In/Out), 드래그 이동(Pan), 100% 리셋 제공.
- **다이어그램 단독 내보내기**: 모달 툴바에서 고화질 **SVG** 및 **PNG** 다운로드 지원.

### 📄 2. 멀티 포맷 문서 내보내기 (Document Exports)
- **PDF 저장**: `@media print` 페이지 쪼개짐 방지(`page-break-inside: avoid`) 및 A4 높이 비율 맞춤 적용.
- **Word(.docx) 저장**: MS Word MSO HTML 파서 호환 `width="520"` 가로 축소 듀얼 비율 계산 ➔ Word 본문 영역에 찌그러짐이나 오른쪽 짤림 없이 100% 쏙 안착.
- **HTML 내보내기**: 코드 복사 버튼 제거 및 GitHub 스타일 인라인 CSS가 포함된 독립형 `.html` 생성.
- **PNG 이미지화**: 1000px 와이드 2x 초고화질 캔버스로 자동 확장 캡처.

### 📐 3. ASCII & Box Drawing 아키텍처 다이어그램 수직 정렬
- `┌─┬─┐`, `│...│` 문자로 작성된 텍스트 아키텍처 박스를 자동 감지하여 `D2Coding`/`Consolas` 2:1 고정폭 코딩 폰트 적용.
- 가로/세로 스크롤바 100% 소멸 ➔ 단 1px의 오차도 없이 테두리 라인이 칼같이 수직 일직선으로 맞춰짐.

### ↔️ 4. 마우스 Drag & Drop 패널 리사이저 (Panel Resizer)
- 에디터 패널과 미리보기 렌더링 패널 사이에 분할 바(`#divider`) 위치.
- 마우스 드래그 앤 드롭으로 창 비율 자유 조절.
- **Min-Width Lock**: 에디터 280px / 미리보기 360px 이하로 무너지지 않는 미니멈 락 제공.

### 🛡️ 5. 100% 로컬 오프라인 데이터 보안 & 유틸리티
- **100% Local-First**: 사용자의 문서, 이미지, 작성 텍스트가 외부 서버로 절대 전송되지 않습니다.
- **절대경로 제거**: 클릭 1번으로 ugly한 `file:///D:/...` 절대경로를 깔끔한 인라인 코드 배지(``` `file.py` ```)로 전환.
- **TOC 목차 네비게이션**: 상단 탑바 이동 없이 미리보기 패널만 부드럽게 스크롤.

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: HTML5, CSS3 (Vanilla CSS Custom Properties, Responsive Design), Modern JavaScript (ES6+)
- **Markdown & Diagram Engine**: `markdown-it`, `mermaid.js`, `katex`, `CodeMirror`
- **Export & Conversion**: `html-docx-js`, `html-to-image`, `js-yaml`
- **Hosting & CI/CD**: Cloudflare Pages, GitHub Actions

---

## 🚀 빠른 시작 (Local Run)

별도의 복잡한 설치 과정 없이 웹 서버를 통해 실행할 수 있습니다:

```bash
# Python 내장 HTTP 서버로 실행
python -m http.server 8080

# 브라우저에서 접속
http://localhost:8080
```

---

## ☁️ Cloudflare Pages + GitHub Actions CI/CD 배포 안내

이 프로젝트는 GitHub `main` 브랜치에 `git push`가 발생할 때마다 **Cloudflare Pages**로 자동 빌드 및 배포되도록 GitHub Actions CI/CD 파이프라인이 설정되어 있습니다.

### 🔑 1. GitHub Repository Secrets 설정
GitHub 저장소의 `Settings` -> `Secrets and variables` -> `Actions` 메뉴에서 다음 2가지 Secret을 등록합니다:

1. `CLOUDFLARE_API_TOKEN`: Cloudflare 대시보드에서 생성한 API 토큰 (`Cloudflare Pages Edit` 권한 부여)
2. `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 우측 사이드바에 표시되는 Account ID

### 🔄 2. 자동 배포 동작 원리
- `.github/workflows/deploy-cloudflare.yml` 워크플로우에 의해 `main` 브랜치 커밋 시 Cloudflare Pages로 자동 배포됩니다.
