---
name: markdown-to-scroll-deck
description: Markdown 원고를 세로 스크롤형 HTML 슬라이드 문서로 변환합니다. 각 슬라이드는 고정 16:9 무대로 발표 자료처럼 보이고, 상세 설명은 슬라이드 바로 아래 설명란으로 분리됩니다. 왼쪽에 접이식 목차가 붙습니다. 사용자가 마크다운 문서를 슬라이드/발표자료/원페이지 문서로 만들어 달라고 하거나, 주제만 주고 발표 자료를 만들어 달라고 할 때 사용합니다.
---

# Markdown to Scroll Deck

Markdown 원고 → **세로 스크롤형 HTML 슬라이드 문서**를 만든다.
읽는 사람은 위에서 아래로 스크롤하며 보고, 각 장은 발표 슬라이드처럼 독립적으로 보인다.

## 핵심 원칙

1. **슬라이드는 한눈에** — 제목 + 핵심 메시지 + 시각 요소. 문장을 채워 넣지 않는다.
2. **상세는 아래로** — 제품 설명, 근거, 예시, 배경은 전부 슬라이드 아래 **설명란**에 둔다.
3. **고정 16:9 무대** — 1920×1080으로 작성하고 통째로 축소한다. 내용을 재배치(reflow)하지 않는다.
4. **글씨는 크게** — 본문 24px 이상(1920 기준). 작게 줄여서 우겨넣지 않는다.
5. **넘치면 나눈다** — 한 장이 넘치면 압축하거나 두 장으로 쪼갠다. 폰트를 줄이는 것은 최후의 수단.
6. **읽는 사람 기준** — 설명란은 발표자 코칭이 아니라 **독자가 읽는 해설**로 쓴다.

---

## Phase 0. 입력 확인

- `.md` 파일이 있으면 그대로 원고로 사용한다.
- 없으면 주제·대상·목적을 확인하고 **Markdown 원고를 먼저 생성**해 저장한다.
  (원고 없이 바로 HTML을 만들지 않는다. 구조를 잡고 시작해야 분량 조절이 된다.)
- 원고가 크면(수백 KB) 먼저 구조만 파악한다:
  ```bash
  grep -n '^#\{1,3\} ' 원고.md          # 목차
  grep -c '```mermaid' 원고.md          # 다이어그램 수
  grep -n '!\[' 원고.md | cut -c1-120   # 이미지 참조
  awk '{print length($0), NR}' 원고.md | sort -rn | head -3   # 초장문 라인(base64 이미지 등)
  ```
- base64로 인라인된 이미지는 별도 파일로 빼서 `<img src>`로 참조한다. HTML에 그대로 넣으면 파일이 비대해진다.

**분량 확인** — 섹션 수를 세고 사용자에게 슬라이드 규모를 묻는다.
원문 1개 섹션이 보통 슬라이드 2~4장이 된다.

---

## Phase 1. 슬라이드 설계

원고를 읽고 **장별로 무엇을 남기고 무엇을 내릴지** 먼저 정한다.

| 슬라이드 본문에 남길 것 | 설명란으로 내릴 것 |
|---|---|
| 제목, 핵심 메시지 한 줄 | 왜 그런지의 근거·배경 |
| 3~6개 항목의 카드/리스트/표 | 각 항목의 부연 설명 |
| 단계 흐름, 계층 구조 | 실무 조언, 흔한 오해 |
| 숫자·라벨·서비스명 | 용어·제품 정의 |

**구성 패턴** — 표지 → 요약 → 목차 → (파트 표지 → 내용 슬라이드 N장) × 파트 수 → 마무리.
파트 표지를 넣으면 긴 문서도 리듬이 생긴다.

---

## Phase 2. HTML 생성

`assets/`의 3개 파일을 조립한다. 처음부터 CSS를 쓰지 않는다.

| 파일 | 역할 |
|---|---|
| `assets/deck.css` | 디자인 시스템 + 고정 무대 + 사이드바 셸 (그대로 `<style>`에 삽입) |
| `assets/deck.js` | 시트 스케일링·스크롤 스파이·목차 접기·설명란 토글 (그대로 `<script>`에 삽입) |
| `assets/icon-sprite.html` | 공식 아이콘 스프라이트 (`<body>` 시작 직후 삽입) |

문서 뼈대와 컴포넌트 사용법은 **[structure.md](structure.md)** 를 읽는다.
사용 가능한 컴포넌트(카드·리스트·표·흐름·계층·콜아웃 등)는 **[components.md](components.md)** 에 있다.

### 슬라이드 한 장의 형태

```html
<article class="chapter" id="s07" data-n="07" data-part="파트명">
  <div class="ch-head">
    <span class="ch-n">07</span>
    <h2 class="ch-t">슬라이드 제목</h2>
    <span class="ch-part">파트명</span>
    <a class="ch-link" href="#s07">#</a>
  </div>
  <div class="sheet">
    <div class="slide">          <!-- .slide.dark 로 어두운 변형 -->
      <div class="frame">
        <header class="s-head">
          <div class="kicker reveal r1">섹션 라벨</div>
          <h2 class="s-title reveal r2">핵심 메시지 <span class="hl">강조</span></h2>
        </header>
        <div class="s-body"> ... 컴포넌트 ... </div>
        <div class="s-foot"><span>파트 · 구분</span><span class="pg">07 / 30</span></div>
      </div>
    </div>
  </div>
  <aside class="note">
    <div class="note-head">슬라이드 설명</div>
    <div class="note-body">
      <p>이 장의 배경과 근거를 독자에게 설명하는 문단.</p>
      <dl class="gloss">
        <dt>제품명</dt><dd>처음 보는 사람도 이해할 한 문장 정의.</dd>
      </dl>
    </div>
  </aside>
</article>
```

---

## Phase 3. 검증 (건너뛰지 않는다)

눈으로 보면 멀쩡해 보여도 **넘침은 스크린샷으로 안 보인다**. 반드시 스크립트로 잡는다.

```bash
bash .github/skills/markdown-to-scroll-deck/scripts/serve.sh 결과물.html    # 로컬 서버 (포트 출력)
node .github/skills/markdown-to-scroll-deck/scripts/verify.js http://localhost:8749/결과물.html
```

`verify.js`가 확인하는 것:
- 각 슬라이드의 **내용 넘침**(`.s-body` overflow) — 0이어야 한다
- 16:9 유지 여부, 슬라이드가 시트를 벗어나는지
- 아이콘 `<use>` 참조 누락
- 콘솔 에러 / 페이지 에러

**넘치면 폰트를 줄이지 말고** 문장을 압축하거나 항목을 설명란으로 내린다.

마지막으로 스크린샷 몇 장을 실제로 눈으로 확인한다:
```bash
node .github/skills/markdown-to-scroll-deck/scripts/verify.js <url> --shots 1,5,12,20
```

---

## 아이콘

`assets/icon-sprite.html`에 공식 아이콘이 들어 있다. `<use>`로 참조한다.

```html
<svg class="ic" aria-hidden="true"><use href="#az-openai"></use></svg>
```

포함된 심볼과 새 아이콘을 추가하는 방법은 **[icons.md](icons.md)** 참고.

**배치 규칙**
- 장식이 아니라 **"어떤 서비스인지 알리는"** 용도로만 쓴다.
- 한 표/카드 그룹에는 **전부 넣거나 전부 빼거나** 둘 중 하나. 일부만 넣으면 실수처럼 보인다.
- 개념 설명·표지 슬라이드에는 넣지 않는다.

---

## 자주 밟는 지뢰

| 증상 | 원인 / 해결 |
|---|---|
| 슬라이드가 안 보이고 빈 화면 | `.deck-viewport`에서 `inset:auto`를 `bottom`보다 **뒤에** 선언하면 덮어쓴다. 순서 주의 |
| 어두운 슬라이드에서 강조 글씨가 안 보임 | `<b>`가 네이비색. `.dark` 하위에서 흰색으로 올리는 규칙이 `deck.css`에 있으니 새 컴포넌트를 만들면 추가 |
| 아이콘 색이 서로 뒤섞임 | 원본 SVG들이 같은 gradient id를 씀. 심볼마다 id를 네임스페이싱해야 한다 (`icons.md` 참조) |
| 설명란이 원페이지에서 깨짐 | `.note-body` 안에 `<div>`를 쓰지 않는다. 문단은 `<p>`, 목록은 `<ul>`, 용어는 `<dl class="gloss">` |
| 넘침 검사에서 오탐 | 원페이지는 화면 밖 슬라이드에 `.visible`이 없어 자식이 `translateY(26px)` 내려간 상태다. 그대로 재면 8~30px씩 부풀려 나온다. `verify.js`는 측정 직전에 `.visible`을 강제하고 transition을 끈다 |
| 폰트 로드 전 측정 | 웹폰트가 적용되면 줄바꿈이 달라져 넘침 여부가 바뀐다. `document.fonts.ready`를 기다린 뒤 측정해야 한다 |
| 제목 끝 글자만 다음 줄로 | 의미 단위에서 `<br>`로 직접 끊는다 |

---

## 글쓰기 기준

- **제품명은 풀네임** — `Foundry` ✗ / `Microsoft Foundry` ✓. 첫 등장 시 설명란에 정의를 넣는다.
- **섹션 기호(§1, §3-②) 금지** — 내부 문서 번호처럼 보인다. 상호참조는 장 이름으로 쓴다.
- **번호는 한 장 안에서 완결** — 앞 장에서 시작한 ①②③을 다음 장에서 ④부터 이어 쓰지 않는다.
- **설명란은 독자에게 말하듯** — "강조하세요", "청중에게 물어보세요" 같은 발표자 지시문을 쓰지 않는다.
- **성숙도 표기는 정직하게** — GA/Preview를 섞어 쓰지 말고 배지로 구분한다.

---

## 결과물

- `<이름>-slides.html` — 단일 HTML. 의존성 없음. 브라우저에서 바로 열림
- `<이름>.md` — 원고를 새로 생성했다면 함께 저장
- 완료 후 `open <파일>` 로 열어주고, 조작법(스크롤 / `J`·`K` / `N` / `M`)을 안내한다

## 참고 파일

| 파일 | 언제 읽나 |
|---|---|
| [structure.md](structure.md) | HTML 뼈대를 조립할 때 |
| [components.md](components.md) | 슬라이드 본문을 채울 때 |
| [icons.md](icons.md) | 아이콘을 넣거나 새로 추가할 때 |
