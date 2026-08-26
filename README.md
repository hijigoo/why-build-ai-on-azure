# Why Build AI on Azure?

엔터프라이즈 의사결정자(C-Level·사업부 임원·팀장)를 위한 **Azure AI 기술 소개 온라인 덱**입니다.
"왜 지금, 왜 Azure에서 AI를 구축하는가"를 **신뢰 → 가치 → 플랫폼 → 실현**의 흐름으로 정리했습니다.

세로 스크롤 원페이지와 발표용 덱, 두 형태로 제공되며 **브라우저에서 바로 열립니다.**

## 온라인으로 바로 보기

| 형태 | 링크 | 조작·특징 |
|---|---|---|
| **원페이지** | **[열기 ↗](https://hijigoo.github.io/why-build-ai-on-azure/why-build-ai-on-azure-onepage.html)** | 세로 스크롤 · 좌측 목차 · `J`/`K` 이동 · `N` 설명란 전체 · 장표별 설명 접기 · `M` 목차 |
| **원고** | [`why-build-ai-on-azure.md`](./why-build-ai-on-azure.md) | Markdown · GitHub에서 Mermaid 다이어그램 20개 바로 렌더링 |

> 링크는 GitHub Pages로 호스팅됩니다. 저장소 최초 배포 직후에는 반영에 1~2분 걸릴 수 있습니다.

### 구성

| 파트 | 내용 |
|------|------|
| **Part 1. 왜 Microsoft인가** | 지금 AI를 해야 하는 이유, 과제, 4대 신뢰 근거, 우리의 관점 |
| **Part 2. AX 전략** | AI Transformation 3대 전략 |
| **Part 3. 완결 스택** | 핵심 서비스 6종, 전체 아키텍처, 계층별 해설, Agentic DevOps, Governance |
| **Part 4. 실현** | Personas, 도입 시나리오, 로드맵, 자주 묻는 질문 |

---

## 이 덱을 만든 스킬 — `deep-navy-md-to-html`

이 덱은 손으로 HTML을 짠 것이 아니라, **Copilot CLI 스킬**로 만들었습니다.
Markdown 원고를 **세로 스크롤형 HTML 슬라이드 문서**로 바꿔 주는 스킬입니다.

읽는 사람은 위에서 아래로 스크롤하고, 각 장은 발표 슬라이드처럼 독립적으로 보입니다.
슬라이드에 다 담지 못한 상세 설명은 **바로 아래 설명란**에 붙어, 발표 없이 혼자 읽어도 맥락이 이어집니다.
결과물은 **의존성 없는 단일 HTML 파일**이라 브라우저에서 바로 열립니다.

### 무엇에 맞는 스킬인가

Microsoft·Azure 제품을 다루는 **한국어 엔터프라이즈 기술 자료**에 최적화되어 있습니다.
고객 제안서, 아키텍처 소개, 도입 가이드, 기술 세미나 자료가 대상입니다.

그래서 다음이 이미 들어 있습니다.

- Azure·Microsoft·GitHub **공식 아이콘 21종**
- 딥네이비 + 코발트의 엔터프라이즈 톤 단일 테마
- **GA / Preview 성숙도 배지**
- 한글 조판(Pretendard) + 라틴 디스플레이(Manrope) 조합
- **한글 단어가 줄 끝에서 잘리지 않는 조판** (`word-break: keep-all`) — 줄바꿈은 어절 경계에서만
- **장표별 설명 접기** — 전체 on/off 버튼에 더해, 설명 헤더마다 토글 버튼이 하나씩

브랜드 아이덴티티가 따로 있거나, 비-Microsoft 제품 중심이거나, 캐주얼한 톤이 필요하다면 맞지 않습니다.
색상은 `assets/deck.css`의 `:root` 토큰에 모여 있어 테마 교체 자체는 어렵지 않습니다.

### 호출

Copilot CLI에서 스킬을 호출하고 무엇을 만들지 알려주면 됩니다.

```
/deep-navy-md-to-html  <원고.md 경로> 를 스크롤 덱으로 만들어줘
```

원고 파일이 없어도 됩니다. **주제만 말하면 원고부터 작성합니다.**

```
/deep-navy-md-to-html  Azure Foundry 네트워크 격리에 대한 덱을 만들어줘
```

이때 내용은 **공식 문서를 조회해 최신 정보로** 채웁니다. 제품명과 GA/Preview 상태는 기억에 의존하지 않고 확인합니다.

### 같은 디자인, 세 가지 스킬

**Deep Navy** 테마(딥네이비+코발트·공식 아이콘·GA/Preview 배지)를 공유하는
**세 개의 스킬**이 이 저장소에 함께 있습니다. 입력과 출력만 다릅니다.

이름은 `<테마>-<입력>-to-<출력>` 규칙을 따르므로, 이름만 보면 무엇을 넣어 무엇이 나오는지 알 수 있습니다.

| 스킬 | 입력 → 출력 | 언제 쓰나 |
|---|---|---|
| [`deep-navy-md-to-html`](./.github/skills/deep-navy-md-to-html/) | Markdown → 스크롤형 **HTML** | 링크로 공유하고 스스로 정독하는 웹 문서 |
| [`deep-navy-pptx-to-html`](./.github/skills/deep-navy-pptx-to-html/) | 기존 **.pptx** → 스크롤형 **HTML** | 예전 파워포인트를 같은 톤의 웹 문서로 재구성 |
| [`deep-navy-md-to-pptx`](./.github/skills/deep-navy-md-to-pptx/) | Markdown → **PowerPoint(.pptx)** | 발표자 노트가 있는 PowerPoint 덱이 필요할 때 |

```
/deep-navy-pptx-to-html  기존_제안서.pptx 를 스크롤 덱으로 만들어줘
/deep-navy-md-to-pptx    why-build-ai-on-azure.md 를 pptx 발표 덱으로 만들어줘
```

`deep-navy-pptx-to-html`은 원본 슬라이드의 텍스트·표·발표자 노트를 뽑아 재조판하고,
`deep-navy-md-to-pptx`는 원고를 슬라이드 데이터 스펙으로 옮겨 같은 톤의 .pptx를 생성합니다.
세 스킬 모두 **제품명·GA/Preview 상태를 공식 문서로 재확인**하는 원칙을 공유합니다.

세 스킬 모두 디자인을 `assets/` 폴더에 담고 다녀서, **스킬 폴더만 복사해도 결과물이 같습니다.**

| 스킬 | 디자인 자산 |
|---|---|
| `deep-navy-md-to-html` · `deep-navy-pptx-to-html` | `assets/deck.css` · `assets/deck.js` · `assets/icon-sprite.html` |
| `deep-navy-md-to-pptx` | `assets/theme.js` · `assets/icons/*.svg` |

테마를 바꾸려면 스크립트가 아니라 이 자산 파일만 고치면 됩니다.


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
python3 .github/skills/deep-navy-md-to-html/scripts/build.py slides.html \
  -o 결과.html \
  --title "문서 제목 — 부제" \
  --h1 "본문 큰 제목" \
  --kicker "브랜드 라벨" \
  --subtitle "사이드바 한 줄 부제" \
  --intro "이 문서가 무엇이고 어떻게 읽으면 되는지 2~3문장." \
  --meta "19 Sections|약 15분|v1.0"

# 검증 — 내용 넘침은 눈으로 안 보이므로 반드시 실행
bash .github/skills/deep-navy-md-to-html/scripts/serve.sh 결과.html
node .github/skills/deep-navy-md-to-html/scripts/verify.js http://localhost:8749/결과.html --density
```

검증은 내용 넘침, 16:9 유지, 아이콘 참조 누락, 콘솔 에러, 슬라이드별 글자 수를 확인합니다.
넘치면 폰트를 줄이지 말고 문장을 압축하거나 항목을 설명란으로 내립니다.

### 스킬 구성

| 파일 | 언제 보나 |
|---|---|
| [`SKILL.md`](./.github/skills/deep-navy-md-to-html/SKILL.md) | 진입점 — 워크플로·글쓰기 기준·자주 밟는 지뢰 |
| `templates/slide-patterns.html` | 슬라이드를 만들 때 — 10가지 패턴을 여기서 복사 |
| `components.md` | 컴포넌트 변형·밀도 기준이 필요할 때 |
| `icons.md` | 아이콘을 넣거나 추가할 때 |
| `structure.md` | 빌더 없이 직접 조립하거나 셸을 바꿔야 할 때 |
| `scripts/build.py` | 조각 → 완성 문서 조립 |
| `scripts/verify.js` | 넘침·16:9·아이콘·에러 검증 |
| `assets/` | `deck.css` · `deck.js` · `icon-sprite.html` |

---

## 완성된 샘플 + 만든 명령

이 스킬로 실제로 만든 결과물입니다. 각 문서 옆에 **어떤 명령으로 만들었는지** 함께 적었습니다.

### 1. Why Build AI on Azure? — 36장

이 저장소의 메인 덱(위 [온라인으로 바로 보기](#온라인으로-바로-보기))입니다. 기존 Markdown 원고에서 출발했습니다.

```
/deep-navy-md-to-html  why-build-ai-on-azure.md 를 스크롤 덱으로 만들어줘
```

- 온라인: [원페이지 ↗](https://hijigoo.github.io/why-build-ai-on-azure/why-build-ai-on-azure-onepage.html)

### 2. Microsoft Foundry 네트워크 격리 — 19장

보안·인프라 담당자와 클라우드 아키텍트를 위한 자료입니다.
Foundry를 사설 네트워크 경계 안에서 운영할 때의 선택지와 되돌릴 수 없는 제약을 정리했습니다.
**원고 파일 없이 주제만 주고** 스킬이 공식 문서를 조회해 원고부터 작성했습니다.

```
/deep-navy-md-to-html  Microsoft Foundry 네트워크 격리에 대한 덱을 만들어줘
```

- 온라인: [완성 문서 ↗](https://hijigoo.github.io/why-build-ai-on-azure/samples/foundry-network-isolation/foundry-network-isolation.html)
- 소스: [`samples/foundry-network-isolation/`](./samples/foundry-network-isolation/)
- 인바운드(공용 접근 정책·프라이빗 엔드포인트·DNS) → 아웃바운드(BYO 가상 네트워크와 관리형 가상 네트워크의 대비·방화벽) → 도구와 제약(도구별 지원 현황·배포 전 체크리스트) 순으로 구성했습니다.

### 3. GitHub Copilot Offering — 21장

개발 리더와 플랫폼팀을 위한 자료입니다. 기능을 나열하는 대신 **다섯 개 축**으로 나눠,
각 축에서 무엇을 고를 수 있고 무엇이 GitHub Enterprise Cloud 전제인지를 구분했습니다.
이 샘플만 **Blue Accent** 테마로, 같은 원고에서 HTML 과 PPTX 를 함께 뽑는 구성입니다.

```
/blue-accent-md-to-html  samples/github-offering/copilot-offering.md 로 덱을 만들어줘
```

- 온라인: [완성 문서 ↗](https://hijigoo.github.io/why-build-ai-on-azure/samples/github-offering/copilot-offering.html)
- 소스: [`samples/github-offering/`](./samples/github-offering/)
- 모델과 에이전트 → 개발자가 쓰는 도구 → Agentic SDLC → 거버넌스 → 도입 프로그램 순으로 구성했습니다.
- 원고의 GA/Preview 표기를 그대로 믿지 않고 재검증해, **BYOK 지원 범위**와 **샌드박스 성숙도** 두 건의 오류를 바로잡았습니다.

> 세 샘플 모두 **스킬의 표준 워크플로만으로** 만들었습니다. 원고 작성부터 검증까지 거친 결과물이라,
> 새 덱을 만들 때 참고 예시로 쓸 수 있습니다.

---

## 자료 수정하기

Deep Navy 문서(메인 덱 · Foundry 샘플)는 **`slides.html`을 고치고 `build.py`로 다시 빌드**합니다.
Blue Accent 샘플(`samples/github-offering/`)은 원고에서 HTML 을 바로 만들므로 이 절차가 적용되지 않습니다.

```bash
python3 .github/skills/deep-navy-md-to-html/scripts/build.py slides.html \
  -o why-build-ai-on-azure-onepage.html \
  --title "Why Build AI on Azure? — 원페이지" \
  --sb-title "Why Build AI<br>on Azure?" \
  --h1 "데이터에서 에이전트까지" --kicker "Why Build AI on Azure?" \
  --subtitle "데이터에서 에이전트까지" \
  --meta "36 Sections|약 30분 분량|v1.2|Microsoft Solution Engineer"
```

목차 그룹은 `data-part` 순서대로 `PART 1`, `PART 2`… 로 매겨집니다.
표지·마무리처럼 **파트로 세면 안 되는 그룹**은 `data-part-kicker="INTRO"` 로 라벨을 지정하면
번호에서 빠져 본문 파트 표지와 어긋나지 않습니다.

Part 3의 **Enterprise AI Platform 아키텍처 다이어그램**은 이미지가 아니라 HTML입니다.
`scripts/gen-eap-diagram.py`가 하나의 템플릿에서 **일반 버전(요구사항)** 과 **제품 버전(Microsoft 매핑)** 을
함께 생성하므로, 라벨을 고쳐도 두 장이 어긋나지 않습니다.

```bash
python3 scripts/gen-eap-diagram.py --check          # 두 버전의 구조 동일성 검증
python3 scripts/gen-eap-diagram.py --emit generic   # 일반 버전 마크업
python3 scripts/gen-eap-diagram.py --emit product   # 제품 버전 마크업
python3 scripts/gen-eap-diagram.py --emit css       # 다이어그램 CSS
```

성숙도(GA/Preview) 표기와 제품명은 **공식 문서로 확인한 뒤** 반영합니다.
이 영역은 빠르게 바뀌어서, 예전 표기를 그대로 두면 자료 전체의 신뢰가 떨어집니다.

---

## 저장소 구조

```
why-build-ai-on-azure-onepage.html        메인 덱 — Why Build AI on Azure? (36장, 원페이지)
slides.html                               메인 덱 소스 조각 (build.py 입력)
why-build-ai-on-azure.md                  메인 덱 원고
scripts/gen-eap-diagram.py                아키텍처 다이어그램 생성기 (일반/제품 2종)
build.js                                  PPTX 생성기
samples/foundry-network-isolation/        샘플 — Foundry 네트워크 격리 (19장)
samples/github-offering/                  샘플 — GitHub Copilot Offering (21장, Blue Accent)
.github/skills/deep-navy-md-to-html/      스킬 — Markdown → 스크롤형 HTML
.github/skills/deep-navy-pptx-to-html/    스킬 — .pptx → 스크롤형 HTML
.github/skills/deep-navy-md-to-pptx/      스킬 — Markdown → PowerPoint(.pptx)
```
