# 🛍️ 일반 자사 제품 소개 글쓰기 파이프라인 프로세스 다이어그램 & 가이드 완수 보고서

## 1. 개요

자사 제품(타페로 무잔사 양면테이프 등)의 개발 계기, 핵심 차별점, 사용 노하우 및 제조사의 진심을 1인칭 제조 당사자 관점(Owner Voice)으로 전달하는 **"일반 자사 제품 소개 글쓰기 파이프라인(Standard Company Product Pipeline)"**의 전체 프로세스 다이어그램(`workflow.mmd`) 작성이 완수되었습니다.

---

## 2. 제품 소개 파이프라인 워크플로우 다이어그램 (`workflow.mmd`)

```mermaid
graph TD
    %% Phase 1: Product Value Mining
    subgraph P1["Phase 1: 자사 제품 가치 및 해결 과제 정립 (Product Mining)"]
        A1["자사 제품 지정<br/>(TAPERO 무잔사 양면테이프 등)"] --> A2["고객 핵심 페인포인트 정립<br/>(벽지 찢김, 끈끈이 잔사, 원상복구 부담)"]
        A2 --> A3["제품 핵심 차별성 명확화<br/>(계면 박리 기술, 강력 부착 + 잔사 제로)"]
    end

    %% Phase 2: BSI Golden Keyword Mining
    subgraph P2["Phase 2: BSI 황금 키워드 마이닝 (blog-golden-keyword-miner)"]
        B1["제품 및 실생활 부착 관련 Root 키워드 추출"] --> B2["네이버 검색광고 API 연관검색어 수집"]
        B2 --> B3["네이버 검색 API 제한없는 포스트수(D_blog) 수집"]
        B3 --> B4["BSI 포화지수 계산 & SQLite DB 적재"]
        B4 --> B5["실효 검색량(V_total >= 300) & 실물 부합도 필터링<br/>TOP 3 황금키워드 추출"]
    end

    %% Phase 3: Owner Voice Storytelling
    subgraph P3["Phase 3: 제조 당사자 관점 4단 스토리라인 구성"]
        C1["1단: 제품 개발 계기 & 인사말<br/>(고객 스트레스 해결을 위한 개발 시작)"] --> C2["2단: 일반 테이프 vs 자사 제품 차별점<br/>(기존 폼 테이프 잔사 vs TAPERO 박리감)"]
        C2 --> C3["3단: 올바른 부착 & 떼어내기 노하우<br/>(표면 청소, 10초 밀착, 수평 당김)"]
        C3 --> C4["4단: 품질 약속 & Q&A 2종<br/>(제조사 안심 보장 & 자주 묻는 질문)"]
    end

    %% Phase 4: Humanizer Style Refinement & Linter Audit
    subgraph P4["Phase 4: Humanizer 가독성 다듬기 & Linter 검증"]
        D1["Humanizer 스킬 지침 적용<br/>(1~3문장 짤막한 호흡, AI 미사여구 배제)"] --> D2["자사 1인칭 품격 어조 유지<br/>(구어체적 문어체 + 회사를 대변하는 격식)"]
        D2 --> D3["Jaccard 유사도 분석 (< 0.40) & 금지어 Zero 검사"]
    end

    %% Phase 5: Output Publishing & DB Sync
    subgraph P5["Phase 5: 산출물 저장 및 SQLite DB 동기화"]
        E1["마크다운 포스트 파일 생성<br/>(Output/YYYY.MM.DD_제품소개_.../post.md)"] --> E2["SQLite DB (content_marketing.db)<br/>posts 테이블 status='published' 적재"]
    end

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
```

---

## 3. 핵심 파이프라인 구성 요소 요약

1. **Phase 1: 자사 제품 가치 및 해결 과제 정립**:
   - 기존 테이프 사용 시 고객이 겪는 페인포인트(벽지 찢김, 끈끈이 잔사, 원상복구 부담)와 자사 제품의 해결책(무잔사 계면 박리 기술)을 명확히 정의.
2. **Phase 2: BSI 황금 키워드 마이닝**:
   - `blog-golden-keyword-miner` 스킬을 활용하여 실생활 부착 문제 연관 $V_{total} \ge 300$ 및 저포화 BSI TOP 3 황금키워드 자동 추출.
3. **Phase 3: 제조 당사자 관점 4단 스토리라인**:
   - 주식회사 이에프엠(TAPERO) 1인칭 제조사/개발자 관점(Owner Voice) 적용.
   - 개발 계기 -> 제품 차별성 -> 올바른 부착/박리 노하우 -> 품질 약속 & Q&A 2종 스토리라인.
4. **Phase 4: Humanizer 가독성 다듬기 & Linter 검증**:
   - `humanizer` 스킬 준수 (1~3문장 짤막한 호흡, AI 특유 미사여구 배제, 다정하면서도 품격 있는 자사 구어체 문어체).
   - Jaccard 유사도 (< 0.40), 금지어 Zero, 단락 글자수 검증.
5. **Phase 5: 산출물 저장 및 SQLite DB 동기화**:
   - 마크다운 파일 저장 및 SQLite DB (`content_marketing.db`) 내 `status='published'` 소문자 동기화 등록.

---

## 4. 자산 파일 경로

- **Mermaid 파일 자산**: [workflow.mmd](file:///d:/2026.06.21_Antigravity/2026.07.13_블로그글쓰기_TAPERO/.agents/skills/standard-product-pipeline/workflow.mmd)
