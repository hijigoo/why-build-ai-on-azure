# Why Build AI on Azure?

엔터프라이즈 의사결정자(C-Level·사업부 임원·팀장)를 위한 **Azure AI 기술 소개 자료**입니다.
Microsoft Solution Engineer 관점에서 "왜 지금, 왜 Azure에서 AI를 구축하는가"를 신뢰 → 가치 → 플랫폼 → 실현의 흐름으로 정리했습니다.

## 📖 자료 보기

👉 **[Why Build AI on Azure? 전체 자료 열기](./why-build-ai-on-azure.md)**

> GitHub에서 Mermaid 다이어그램과 아키텍처 이미지가 그대로 렌더링됩니다.

### 웹 슬라이드 버전

같은 내용을 49장 슬라이드로 옮긴 HTML 문서입니다. 단일 파일이라 브라우저에서 바로 열립니다.

| 파일 | 형태 | 조작 |
|---|---|---|
| [`why-build-ai-on-azure-onepage.html`](./why-build-ai-on-azure-onepage.html) | 세로 스크롤 원페이지 (좌측 목차) | 스크롤 · `J`/`K` 이동 · `N` 설명란 · `M` 목차 |
| [`why-build-ai-on-azure-slides.html`](./why-build-ai-on-azure-slides.html) | 발표용 덱 | `←`/`→` 이동 · `N` 설명란 |

각 슬라이드 아래에는 **슬라이드 설명**이 붙어 있어, 발표 없이 혼자 읽어도 맥락이 이어집니다.

## 구성

| 파트 | 내용 |
|------|------|
| **Part 1. 왜 Microsoft인가** | 지금 AI를 해야 하는 이유, 과제, 4대 신뢰 근거, 우리의 관점 |
| **Part 2. AX 전략** | AI Transformation 3대 전략 |
| **Part 3. 완결 스택** | 핵심 서비스 6종, 전체 아키텍처, 계층별 해설, Agentic DevOps, Governance |
| **Part 4. 실현** | Personas, 도입 시나리오, 로드맵, 자주 묻는 질문 |

---

## 자료 수정하기

슬라이드를 고칠 때는 **덱 파일을 먼저 수정**합니다. 원페이지는 덱에서 파생되므로 직접 고치면 다음 재생성 때 덮어써집니다.

```bash
# 1. why-build-ai-on-azure-slides.html 수정
# 2. 원페이지 재생성
python3 build_onepage.py
```

성숙도(GA/Preview) 표기와 제품명은 **공식 문서로 확인한 뒤** 반영합니다. 이 영역은 빠르게 바뀌어, 예전 표기를 그대로 두면 자료의 신뢰가 떨어집니다.

슬라이드 제작 규칙과 검증 방법은 [`.github/skills/markdown-to-scroll-deck/`](./.github/skills/markdown-to-scroll-deck/)에 정리되어 있습니다.

---

*읽는 데 약 40분 소요. 20개의 Mermaid 다이어그램 + 아키텍처 개요 포함.*
