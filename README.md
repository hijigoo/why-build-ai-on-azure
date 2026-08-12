# Markdown to Scroll Deck

Markdown 원고를 **세로 스크롤형 HTML 슬라이드 문서**로 바꾸는 Copilot CLI 스킬과, 그 스킬로 만든 샘플 프로젝트입니다.

읽는 사람은 위에서 아래로 스크롤하고, 각 장은 발표 슬라이드처럼 독립적으로 보입니다.
슬라이드에 다 담지 못한 상세 설명은 **바로 아래 설명란**에 붙어, 발표 없이 혼자 읽어도 맥락이 이어집니다.

결과물은 **의존성 없는 단일 HTML 파일**이라 브라우저에서 바로 열립니다.

---

## 샘플 프로젝트

스킬이 어떤 결과를 만드는지 보려면 아래 두 문서를 열어 보세요.

### Why Build AI on Azure? — 49장

엔터프라이즈 의사결정자(C-Level·사업부 임원·팀장)를 위한 **Azure AI 기술 소개 자료**입니다.
"왜 지금, 왜 Azure에서 AI를 구축하는가"를 신뢰 → 가치 → 플랫폼 → 실현의 흐름으로 정리했습니다.

| 파일 | 형태 | 조작 |
|---|---|---|
| [`why-build-ai-on-azure-onepage.html`](./why-build-ai-on-azure-onepage.html) | 세로 스크롤 원페이지 (좌측 목차) | 스크롤 · `J`/`K` 이동 · `N` 설명란 · `M` 목차 |
| [`why-build-ai-on-azure-slides.html`](./why-build-ai-on-azure-slides.html) | 발표용 덱 | `←`/`→` 이동 · `N` 설명란 |
| [`why-build-ai-on-azure.md`](./why-build-ai-on-azure.md) | 원고 (Mermaid 다이어그램 20개) | GitHub에서 바로 렌더링 |

| 파트 | 내용 |
|------|------|
| **Part 1. 왜 Microsoft인가** | 지금 AI를 해야 하는 이유, 과제, 4대 신뢰 근거, 우리의 관점 |
| **Part 2. AX 전략** | AI Transformation 3대 전략 |
| **Part 3. 완결 스택** | 핵심 서비스 6종, 전체 아키텍처, 계층별 해설, Agentic DevOps, Governance |
| **Part 4. 실현** | Personas, 도입 시나리오, 로드맵, 자주 묻는 질문 |

### Microsoft Foundry 네트워크 격리 — 19장

보안·인프라 담당자와 클라우드 아키텍트를 위한 자료입니다.
Foundry를 사설 네트워크 경계 안에서 운영할 때의 선택지와 되돌릴 수 없는 제약을 정리했습니다.

👉 [`samples/foundry-network-isolation/`](./samples/foundry-network-isolation/)

인바운드(공용 접근 정책·프라이빗 엔드포인트·DNS) → 아웃바운드(BYO 가상 네트워크와 관리형 가상 네트워크의 대비·방화벽) → 도구와 제약(도구별 지원 현황·배포 전 체크리스트) 순으로 구성했습니다.

> 이 문서는 **스킬의 표준 워크플로만으로** 만들었습니다. 원고 작성부터 검증까지 거친 결과물이라,
> 새 덱을 만들 때 참고 예시로 쓸 수 있습니다.

---

## 스킬 사용법

### 무엇에 맞는 스킬인가

Microsoft·Azure 제품을 다루는 **한국어 엔터프라이즈 기술 자료**에 최적화되어 있습니다.
고객 제안서, 아키텍처 소개, 도입 가이드, 기술 세미나 자료가 대상입니다.

그래서 다음이 이미 들어 있습니다.

- Azure·Microsoft·GitHub **공식 아이콘 21종**
- 딥네이비 + 코발트의 엔터프라이즈 톤 단일 테마
- **GA / Preview 성숙도 배지**
- 한글 조판(Pretendard) + 라틴 디스플레이(Manrope) 조합

브랜드 아이덴티티가 따로 있거나, 비-Microsoft 제품 중심이거나, 캐주얼한 톤이 필요하다면 맞지 않습니다.
색상은 `assets/deck.css`의 `:root` 토큰에 모여 있어 테마 교체 자체는 어렵지 않습니다.

### 호출

Copilot CLI에서 스킬을 호출하고 무엇을 만들지 알려주면 됩니다.

```
/markdown-to-scroll-deck  <원고.md 경로> 를 스크롤 덱으로 만들어줘
```

원고 파일이 없어도 됩니다. **주제만 말하면 원고부터 작성합니다.**

```
/markdown-to-scroll-deck  Azure Foundry 네트워크 격리에 대한 덱을 만들어줘
```

이때 내용은 **공식 문서를 조회해 최신 정보로** 채웁니다. 제품명과 GA/Preview 상태는 기억에 의존하지 않고 확인합니다.

### 동작 방식

HTML 문서 전체를 직접 쓰지 않습니다. 슬라이드 조각만 만들고 나머지는 빌더가 조립합니다.

```
templates/slide-patterns.html 에서 패턴 복사
        ↓  내용만 교체 → slides.html
scripts/build.py 실행
        ↓  CSS·JS·아이콘·목차·페이지번호 자동 삽입
결과.html  →  scripts/verify.js 로 검증
```

목차, 페이지 번호, 파트 그룹핑, 챕터 id는 **전부 자동**입니다.

### 직접 빌드하기

```bash
# 조각 → 완성 문서
python3 .github/skills/markdown-to-scroll-deck/scripts/build.py slides.html \
  -o 결과.html \
  --title "문서 제목 — 부제" \
  --h1 "본문 큰 제목" \
  --kicker "브랜드 라벨" \
  --subtitle "사이드바 한 줄 부제" \
  --intro "이 문서가 무엇이고 어떻게 읽으면 되는지 2~3문장." \
  --meta "19 Sections|약 15분|v1.0"

# 검증 — 내용 넘침은 눈으로 안 보이므로 반드시 실행
bash .github/skills/markdown-to-scroll-deck/scripts/serve.sh 결과.html
node .github/skills/markdown-to-scroll-deck/scripts/verify.js http://localhost:8749/결과.html --density
```

검증은 내용 넘침, 16:9 유지, 아이콘 참조 누락, 콘솔 에러, 슬라이드별 글자 수를 확인합니다.
넘치면 폰트를 줄이지 말고 문장을 압축하거나 항목을 설명란으로 내립니다.

### 스킬 구성

| 파일 | 언제 보나 |
|---|---|
| [`SKILL.md`](./.github/skills/markdown-to-scroll-deck/SKILL.md) | 진입점 — 워크플로·글쓰기 기준·자주 밟는 지뢰 |
| `templates/slide-patterns.html` | 슬라이드를 만들 때 — 10가지 패턴을 여기서 복사 |
| `components.md` | 컴포넌트 변형·밀도 기준이 필요할 때 |
| `icons.md` | 아이콘을 넣거나 추가할 때 |
| `structure.md` | 빌더 없이 직접 조립하거나 셸을 바꿔야 할 때 |
| `scripts/build.py` | 조각 → 완성 문서 조립 |
| `scripts/verify.js` | 넘침·16:9·아이콘·에러 검증 |
| `assets/` | `deck.css` · `deck.js` · `icon-sprite.html` |

---

## 자료 수정하기

**Why Build AI on Azure?** 는 덱과 원페이지 두 파일로 되어 있고, 원페이지는 덱에서 파생됩니다.
따라서 **덱 파일을 먼저 수정**해야 합니다. 원페이지를 직접 고치면 다음 재생성 때 덮어써집니다.

```bash
# 1. why-build-ai-on-azure-slides.html 수정
# 2. 원페이지 재생성
python3 build_onepage.py
```

샘플 프로젝트처럼 스킬로 만든 문서는 `slides.html`을 고치고 `build.py`로 다시 빌드합니다.

성숙도(GA/Preview) 표기와 제품명은 **공식 문서로 확인한 뒤** 반영합니다.
이 영역은 빠르게 바뀌어서, 예전 표기를 그대로 두면 자료 전체의 신뢰가 떨어집니다.

---

## 저장소 구조

```
.github/skills/markdown-to-scroll-deck/   스킬 본체
samples/foundry-network-isolation/        샘플 — Foundry 네트워크 격리 (19장)
why-build-ai-on-azure*.{md,html}          샘플 — Why Build AI on Azure? (49장)
build_onepage.py                          덱 → 원페이지 재생성기
build.js                                  PPTX 생성기
```
