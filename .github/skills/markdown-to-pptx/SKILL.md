---
name: markdown-to-pptx
description: 마크다운 원고를 PowerPoint(.pptx) 발표 덱으로 변환합니다. 원고를 슬라이드 데이터 스펙으로 옮긴 뒤, Why Build AI on Azure 덱과 동일한 디자인 시스템(딥네이비+코발트 테마, 공식 아이콘, GA/Preview 배지, 4구간 진행 표시줄, 발표자 노트)으로 .pptx 를 생성합니다. markdown-to-scroll-deck 과 같은 톤·색·아이콘을 PowerPoint 형식으로 뽑고 싶을 때 사용합니다. 사용자가 마크다운/원고를 pptx·파워포인트·발표 덱으로 만들어 달라고 하거나, Azure·Microsoft 주제의 PowerPoint 발표 자료를 요청할 때 사용합니다.
---

# Markdown to PPTX

**마크다운 원고** → **PowerPoint(.pptx) 발표 덱**.
원고를 **슬라이드 데이터 스펙**(JS)으로 옮긴 뒤, 제너레이터가 프로젝트 표준 디자인으로 .pptx 를 만든다.

> **디자인은 `Why Build AI on Azure` 덱(루트 `build.js`)과 동일하다.** 팔레트·헬퍼·
> 슬라이드 레이아웃을 그대로 보존한다. 이 스킬은 `build.js` 를 콘텐츠 무관 제너레이터로
> 일반화한 것이라, 완성품의 색·타이포·아이콘·진행 표시줄이 그 덱과 똑같이 나온다.
> (스크롤형 HTML 이 필요하면 `markdown-to-scroll-deck` 을 쓴다. 이 스킬은 .pptx 전용.)

## 이 스킬의 범위

**최적화된 대상** — Microsoft·Azure 제품을 다루는 **한국어 엔터프라이즈 기술 발표 덱**.
고객 제안, 아키텍처 소개, 도입 가이드, 기술 세미나.

그래서 이런 것들이 이미 들어 있다:

- 딥네이비 + 코발트의 **엔터프라이즈 톤** 팔레트(`C`)
- Azure·Microsoft·GitHub **공식 아이콘 44종**(react-icons 래스터화)
- **GA / Preview 성숙도 배지**(초록 / 골드 pill)
- 상단 **4구간 "you are here" 진행 표시줄**
- 슬라이드별 **발표자 노트(스피커 노트)** 주입
- 표지·간지·카드·표·흐름·스택·2단·이미지·마무리 **11가지 슬라이드 레이아웃**

**맞지 않는 경우** — 강한 브랜드 아이덴티티가 필요한 덱, 비-Microsoft 제품 중심,
영어권·캐주얼 톤. 이럴 땐 색만 `C` 토큰에서 바꾸거나 사용자에게 알린다.

## 작업 방식 (중요)

**pptxgenjs 코드를 직접 쓰지 않는다.** 원고를 **데이터 스펙**으로만 옮기고,
슬라이드 렌더링은 `scripts/build-pptx.js` 에 맡긴다.

```
마크다운 원고
    ↓  Phase 1: 슬라이드 단위로 쪼개고 kind 선택
deck.data.js  (슬라이드 데이터 스펙)
    ↓  Phase 2: node scripts/build-pptx.js deck.data.js
<version>-<file>.pptx   (발표자 노트 포함)
    ↓  Phase 3: soffice→pdftoppm 로 렌더 QA
```

페이지 번호·진행 표시줄·아이콘 색조·노트 주입은 **전부 자동**이다.

---

## 준비 (한 번)

```bash
cd .github/skills/markdown-to-pptx
npm install        # pptxgenjs · react · react-dom · react-icons · sharp
```

> 프로젝트 루트에 이미 같은 의존성이 설치돼 있으면(이 리포처럼) node 가 상위
> `node_modules` 를 찾으므로 별도 설치 없이 루트에서 실행해도 된다.

---

## Phase 0 — 원고 준비 & 사실 확인 (건너뛰지 않는다)

발표 덱은 **원고의 정확성이 곧 신뢰**다. 스펙으로 옮기기 전에 확인한다.

- 제품·기능의 **GA / Preview 상태** — 가장 자주, 가장 빨리 바뀐다. `microsoft_docs_search`
  로 시작하고, 성숙도처럼 경계가 중요한 항목은 `microsoft_docs_fetch` 로 원문까지 본다.
- **제품명은 풀네임 · 현재 이름** — 아래 개명표 참고.
- **"전부 GA"·"전부 Preview"로 뭉뚱그리지 않는다.** 한 제품 안에서 기능별로 갈리면 나눠 표기.

원고가 없으면 먼저 마크다운으로 쓴다(사용자에게 초안 확인). 있으면 그 내용을 재료로 삼는다.

---

## Phase 1 — 원고 → 슬라이드 데이터 스펙

원고를 슬라이드 단위로 쪼개고, 각 조각에 맞는 **kind** 를 고른다.
kind 별 필드는 **[PATTERNS.md](PATTERNS.md)**, 실동작 예시는 **[examples/deck.data.js](examples/deck.data.js)**.

| 원고가 이런 내용이면 | 이 kind |
|---|---|
| 표지 / 파트 전환 | `cover` / `divider` |
| 목차·아젠다 | `agenda` |
| 아이콘 + 항목 3~6개 | `cards` (가장 많이 씀) |
| 설명이 긴 번호 목록 | `numbered` |
| 비교표·매핑표 | `table` |
| 화살표로 이어진 단계 | `flow` |
| 위→아래 계층 | `stack` |
| 좌우 2단 대비 | `twocol` |
| 다이어그램 한 장 | `image` |
| 마무리 선언·다음 단계 | `quote` |

**구성 원칙**

- 표지(`cover`) → 아젠다(`agenda`) → (`divider` → 내용 N장) × 파트 → 마무리(`quote`).
- 각 파트 첫 `divider` 에 `part:1..4` 를 주면 상단 진행 표시줄이 그 파트를 강조한다.
- **슬라이드는 한눈에** — 원고 문단을 통째로 넣지 않는다. 핵심만 카드/표로, 부연은 `note` 로.
- **`note`(발표자 노트)는 하나의 흐름으로** 이어지게 쓴다. 앞뒤 슬라이드로 자연스럽게 연결.

```js
// deck.data.js
module.exports = {
  title: "발표 제목", file: "my-deck", version: "v1",
  cover: { icon:"cloud", kicker:"...", title:"...", subtitle:"...", meta:"...", note:"..." },
  slides: [
    { kind:"agenda", title:"...", items:[ ... ], note:"..." },
    { kind:"divider", part:1, label:"Part 1", title:"...", icon:"compass" },
    { kind:"cards", part:1, kicker:"1. ...", title:"...", cards:[ ... ], note:"..." },
    // ...
    { kind:"quote", part:4, big:"한 문장 결론", sub:"다음 단계", cards:[ ... ], note:"..." },
  ],
};
```

---

## Phase 2 — 빌드

```bash
cd .github/skills/markdown-to-pptx
DECK_VERSION=v1 node scripts/build-pptx.js path/to/deck.data.js
# → v1-<file>.pptx  (발표자 노트 포함)
```

버전은 `DECK_VERSION` 환경변수 또는 스펙의 `version`. 반복 시 v1→v2… 로 올려 이전 덱을 보존한다.

---

## Phase 3 — 렌더 QA (건너뛰지 않는다)

**첫 렌더는 거의 항상 틀린다.** 확인이 아니라 버그 사냥으로 접근한다.

```bash
# 내용 확인 — 누락·오타·순서·잔여 placeholder
python3 -m markitdown v1-<file>.pptx

# 시각 확인 — 슬라이드를 이미지로
/opt/homebrew/bin/soffice --headless --convert-to pdf --outdir /tmp/qa v1-<file>.pptx
pdftoppm -jpeg -r 100 /tmp/qa/v1-<file>.pdf /tmp/qa/s   # /tmp/qa/s-01.jpg ...
```

이미지를 열어 **겹침·넘침·잘림·정렬·저대비·빈 카드**를 찾는다.
**⚠️ 서브에이전트로 점검한다** — 코드를 본 눈은 있는 대로가 아니라 있어야 할 대로 본다.

> LibreOffice 렌더는 `Apple SD Gothic Neo` 를 대체 폰트로 그리므로 다크 카드의 본문이
> 실제보다 흐릿해 보일 수 있다. 실 PowerPoint 에서는 정상이다. 이 아티팩트는 무시한다.

**넘치면 폰트를 줄이지 말고** 문장을 줄이거나 항목을 `note` 로 내리거나 슬라이드를 나눈다.
문제를 고치면 **영향받은 슬라이드를 다시 렌더**해 확인한다. **최소 한 번의 수정-재확인 사이클**을 돈다.

---

## 글쓰기 기준 (발표 덱)

- **제품명은 풀네임** — `Foundry` ✗ / `Microsoft Foundry` ✓.
- **첫 미팅/기술 인트로 톤** — 하드 CTA·경쟁사 비방 금지, 과장 순화. 다음 단계는 워크숍 제안 수준.
- **번호는 한 슬라이드 안에서 완결** — 앞 장의 ①②③을 다음 장에서 ④부터 잇지 않는다.
- **`note` 는 발표자에게** — 청중이 아니라 발표자가 읽는 대본. 전체가 하나의 스토리로 이어지게.
- **성숙도는 배지로** — `cards` 의 `badge:{text,kind}`, `table` 셀 색으로 GA/Preview 구분.

### 개명된 Microsoft 제품 (자주 틀리는 부분)

| 옛 이름 | 현재 이름 |
|---|---|
| Azure Active Directory / Azure AD | **Microsoft Entra ID** |
| Azure AI Studio | **Microsoft Foundry** |
| Azure Cognitive Search | **Azure AI Search** |
| Azure Cognitive Services | **Azure AI Services** |
| GitHub Advanced Security | **GitHub Secret Protection** + **GitHub Code Security** |
| Office 365 | **Microsoft 365** |

### GA / Preview 다루기

엔터프라이즈 고객은 성숙도에 민감하다. 섞어 쓰면 신뢰를 잃는다.

- Preview 기능엔 **반드시 배지**(`badge:{text:"Preview",kind:"prev"}`).
- **"오늘 GA로 시작하는 법"을 함께** 제시한다. Preview 의존 제안은 승인되지 않는다.
- 성숙도 표기는 **가장 빨리 낡는다.** 빌드 전에 공식 문서로 확인한다.

```js
// ✗ 셋을 묶어 한 배지 — 하나라도 상태가 바뀌면 전부 틀린 말
{ title:"Fabric IQ · Work IQ · Foundry IQ", badge:{text:"Preview",kind:"prev"} }

// ✓ 상태가 다르면 나눠서
{ title:"Fabric IQ · Work IQ", badge:{text:"Preview",kind:"prev"} }
{ title:"Foundry IQ", badge:{text:"일부 GA",kind:"ga"} }
```

---

## 자주 밟는 지뢰

| 증상 | 원인 / 해결 |
|---|---|
| `Cannot find module 'pptxgenjs'` | `npm install` 안 함. 스킬 폴더에서 설치하거나 루트 `node_modules` 아래에서 실행 |
| 아이콘이 안 나옴 | react-icons/sharp 미설치 → 아이콘 없이 진행됨(경고 출력). `npm install` 로 활성화 |
| 카드 글자가 넘침 | 원고 문단을 그대로 넣었다. 핵심만 남기고 부연은 `note` 로 |
| 2단·카드가 허전함 | 내용 대비 항목이 적다. 항목을 늘리거나 다른 kind 로 |
| 성숙도·제품명이 틀림 | 원고를 그대로 믿었다. Phase 0 에서 공식 문서로 확인 |
| 슬라이드/노트 수 불일치 | `note` 는 슬라이드별 스펙에 넣는다(자동 매칭). `divider` 는 노트 없어도 됨 |
| 색을 바꾸고 싶다 | `build-pptx.js` 상단 `C` 팔레트만 수정(PATTERNS.md 색상 표) |

---

## 결과물

- `<version>-<file>.pptx` — PowerPoint 로 바로 열림, 발표자 노트 포함
- 원고 대비 **무엇을 어떤 kind 로 배치했는지, 어떤 성숙도·제품명을 최신으로 고쳤는지** 결과 보고에 밝힌다

## 파일

| 파일 | 언제 |
|---|---|
| `scripts/build-pptx.js` | 제너레이터(디자인 시스템). 색 교체 외엔 건드리지 않는다 |
| [PATTERNS.md](PATTERNS.md) | 슬라이드 kind 별 필드·아이콘 키·색상 토큰 |
| [examples/deck.data.js](examples/deck.data.js) | 실동작 스펙 예시 — **여기서 복사해 시작** |
| `package.json` | 의존성 5종 (`npm install`) |
