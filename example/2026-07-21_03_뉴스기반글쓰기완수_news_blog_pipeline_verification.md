# 📰 뉴스 기반 블로그 자동 재가공 파이프라인 프로세스 다이어그램 & 검증 완수 보고서

## 1. 개요

뉴스 보도자료를 기반으로 고품질 블로그 원고를 자동 재가공하는 **"뉴스 기반 블로그 자동화 파이프라인(News-based Blog Automation Pipeline)"**의 전체 프로세스 다이어그램(`workflow.mmd`)이 작성되었으며, 파이프라인 구성 요소 간 연동 검증이 완료되었습니다.

---

## 2. 뉴스 파이프라인 워크플로우 다이어그램 (`workflow.mmd`)

```mermaid
graph TD
    %% Phase 1: News Mining
    subgraph P1["Phase 1: 뉴스 수집 및 메타데이터 추출 (News Mining)"]
        A1["Naver News Open API<br/>(/v1/search/news.json)"] --> A2["타깃 키워드 검색<br/>(이에프엠, TAPERO, 반도체 테이프 등)"]
        A2 --> A3["뉴스 기사 메타데이터 추출<br/>(제목, 언론사명, 발행일시, 기사 URL, 팩트 요약)"]
    end

    %% Phase 2: BSI Golden Keyword Mining
    subgraph P2["Phase 2: BSI 황금 키워드 마이닝 (blog-golden-keyword-miner)"]
        B1["뉴스 주제 기반 Root 키워드 추출"] --> B2["네이버 검색광고 API 연관검색어 수집"]
        B2 --> B3["네이버 검색 API 제한없는 포스트수(D_blog) 수집"]
        B3 --> B4["BSI 포화지수 계산 & SQLite DB 적재"]
        B4 --> B5["실효 검색량(V_total >= 300) & 부합도 필터링<br/>TOP 3 황금키워드 추출"]
    end

    %% Phase 3: Content Transformation & Insider Tone
    subgraph P3["Phase 3: 뉴스 본문 재가공 및 자사 관점 적용 (run_news_blog_workflow.py)"]
        C1["저작권 준수 출처 표기<br/>(> Blockquote 기사 인용)"] --> C2["자사(주식회사 이에프엠/TAPERO)<br/>1인칭 당사자/제조사 관점 적용"]
        C2 --> C3["사족/잡담 100% 제거<br/>(보도 팩트 & EFM 기술 중심 집중)"]
    end

    %% Phase 4: Humanizer Refinement & Linter Audit
    subgraph P4["Phase 4: Humanizer 가독성 다듬기 & Linter 검증"]
        D1["Humanizer 스킬 지침 적용<br/>(1~3문장 짤막한 호흡, AI 미사여구 배제)"] --> D2["Jaccard 유사도 분석 (< 0.40)"]
        D2 --> D3["금지어 Zero 검사 & 썸네일/이미지 매핑"]
    end

    %% Phase 5: Output Publishing & DB Sync
    subgraph P5["Phase 5: 산출물 저장 및 SQLite DB 동기화"]
        E1["마크다운 포스트 파일 생성<br/>(Output/YYYY.MM.DD_뉴스기사_.../post.md)"] --> E2["SQLite DB (content_marketing.db)<br/>posts 테이블 status='published' 적재"]
    end

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
```

---

## 3. 핵심 파이프라인 검증 항목 요약

| 검증 영역 | 사용 모듈/자산 | 검증 내용 및 반영 상태 |
| :--- | :--- | :--- |
| **1. 뉴스 수집** | [news_blog_miner.py](file:///D:/2026.06.21_Antigravity/2026.07.13_블로그글쓰기_TAPERO/2026.07.13_/1.Code/news_blog_miner.py) | 네이버 뉴스 Open API 연동으로 타깃 보도자료 실시간 수집 및 출처 메타데이터 확보 완료 |
| **2. BSI 키워드 마이닝** | `blog-golden-keyword-miner` | 뉴스 주제 연관 $V_{total} \ge 300$ 및 저포화 BSI TOP 3 키워드 자동 추출 |
| **3. 저작권 & 출처 표기** | `run_news_blog_workflow.py` | 언론사명 및 기사 본문을 `> Blockquote` 인용구로 명확히 표기하여 저작권 준수 |
| **4. 팩트 집중 & 톤앤매너** | `Strict News Focus` | 곁다리 사족(비하인드 스토리, 이사 이야기 등) 100% 제거하고 뉴스 보도 팩트 및 EFM 기술력에 100% 집중 |
| **5. 가독성 & 가독성** | `humanizer` 스킬 | 1~3문장 단위 짤막한 호흡, AI 미사여구 배제, 구어체적 문어체와 품격 있는 회사의 격식 조화 |
| **6. DB 및 이력 저장** | SQLite `content_marketing.db` | `posts` 테이블에 `status='published'` 소문자 동기화 적재 완료 (Post #52) |

---

## 4. 파이프라인 다이어그램 자산 파일 경로

- **Mermaid 파일**: [workflow.mmd](file:///d:/2026.06.21_Antigravity/2026.07.13_블로그글쓰기_TAPERO/.agents/skills/news-blog-pipeline/workflow.mmd)
- **1차 뉴스 블로그 포스트**: [post.md](file:///D:/2026.06.21_Antigravity/2026.07.13_블로그글쓰기_TAPERO/2026.07.13_/Output/2026.07.31_뉴스기사_베트남메가어스_이에프엠/post.md)
