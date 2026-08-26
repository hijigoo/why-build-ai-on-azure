# 슬라이드 종류 (kind) 레퍼런스

`scripts/build-pptx.js` 가 읽는 **덱 데이터 스펙**의 슬라이드 종류별 필드.
스펙은 JS 모듈(`module.exports = { ... }`)이다. 예시는 [examples/deck.data.js](examples/deck.data.js).

모든 필드는 특별한 표시가 없으면 선택이다. **텍스트는 짧게** — 카드/셀에 넘치면 축소된다.

## 덱 최상위

```js
module.exports = {
  title:   "Why Build AI on Azure?",   // 필수 — footer 왼쪽 + 파일명
  file:    "why-build-ai-on-azure",     // 출력: <version>-<file>.pptx
  version: "v1",                          // DECK_VERSION 환경변수가 우선
  author:  "Kim", company: "Microsoft",
  cover:   { ...cover 필드 },             // 표지 (아래)
  slides:  [ { kind, ... }, ... ],        // 본문 슬라이드 배열
};
```

- `part` (1~4): 슬라이드 상단 4구간 진행 표시줄에서 몇 번째를 강조할지. `divider`에 주면
  이후 슬라이드가 물려받는다. 개별 슬라이드에 줘도 된다.
- `note`: 각 슬라이드의 발표자 노트(스피커 노트). 하나의 흐름으로 이어지게 쓴다.
- `icon`: 아이콘 키 문자열. 아래 **아이콘 키** 목록 참고. 없으면 빈 원.

---

## kind 목록

### `cover` — 표지 (딥네이비)
`DECK.cover` 로 준다(slides 배열이 아님). 페이지 번호 없음.
```js
cover: { icon:"cloud", kicker:"...", title:"...", subtitle:"...", subtitle2:"...", meta:"...", note:"..." }
```

### `agenda` — 아젠다 (번호 카드 세로 나열)
```js
{ kind:"agenda", kicker:"Agenda", title:"...",
  items:[ { n:1, title:"...", desc:"...", time:"~14분", icon:"compass" }, ... ] }
```

### `divider` — 파트 간지 (딥네이비, 좌측 아이콘). 페이지 번호 없음.
```js
{ kind:"divider", part:1, label:"Part 1", title:"...", sub:"...", icon:"compass" }
```

### `cards` — 카드 그리드 (가장 많이 씀). 2~6개, `cols` 로 열 수 지정 가능.
```js
{ kind:"cards", part:1, kicker:"...", title:"...", intro:"(선택) 한 줄 도입",
  cols:2,   // 생략 시 개수로 자동 (≤3=한 줄, 4=2×2, 그 외 3열)
  cards:[ { icon:"brain", title:"...", desc:"...",
            badge:{ text:"GA", kind:"ga" } }, ... ] }
```
`badge.kind`: `"ga"`(초록) · `"prev"`(골드=Preview) · `"mid"`(네이비).

### `numbered` — 번호 매긴 세로 리스트 (설명이 긴 항목들)
```js
{ kind:"numbered", kicker:"...", title:"...",
  items:[ { title:"...", desc:"...", icon:"..." }, ... ] }
```

### `table` — 표 (비교·매핑). 헤더 네이비, 얼룩 행.
```js
{ kind:"table", kicker:"...", title:"...", intro:"(선택)",
  head:["열1","열2","열3"], colW:[3.0,4.65,4.5],   // colW 생략 시 균등
  rows:[
    [ {text:"굵게",bold:true}, "보통", {text:"강조",color:"2E9E6B"} ],
    ...
  ],
  caption:"(선택) 표 아래 한 줄", fs:11.5, rowH:0.6 }
```
셀은 문자열이거나 `{ text, bold, color, align }` 객체.

### `flow` — 가로 단계 흐름 (화살표로 연결)
```js
{ kind:"flow", kicker:"...", title:"...",
  steps:[ { icon:"plug", title:"수집", desc:"..." }, ... ],  // 3~6개 권장
  caption:"(선택) 하단 강조 밴드" }
```

### `stack` — 세로 계층 스택 (아래 화살표로 연결)
```js
{ kind:"stack", kicker:"...", title:"...",
  layers:[ { icon:"windows", title:"Experience", desc:"..." }, ... ] }
```

### `twocol` — 좌우 2단 대비 (좌=흰 카드, 우=연파랑 카드). 내용 높이에 맞춰 크기 자동.
```js
{ kind:"twocol", kicker:"...", title:"...",
  left:  { icon:"users", title:"...", items:["...","..."] },
  right: { icon:"code",  title:"...", items:["...","..."] } }
```

### `image` — 다이어그램 한 장 (contain 으로 맞춤)
```js
{ kind:"image", kicker:"...", title:"...", image:"images/arch.png", caption:"(선택)" }
```

### `quote` — 마무리 선언 (딥네이비). 큰 문장 + 선택 서브 + 하단 카드.
```js
{ kind:"quote", part:4, kicker:"한 문장으로",
  big:"두 줄까지 \\n 로 개행", sub:"(선택) 다음 단계 제목",
  cards:[ { title:"...", desc:"..." }, ... ],   // 하단 네이비 카드
  footnote:"(선택) 맨 아래 한 줄" }
```

### `bullets` — 단순 불릿 (폴백). 알 수 없는 kind 도 여기로 대체됨.
```js
{ kind:"bullets", kicker:"...", title:"...", bullets:["...","..."] }
```

---

## 아이콘 키

아이콘은 `assets/icons/*.svg` 로 동봉돼 있다(43종). 의미가 맞을 때만 넣는다.
전체 목록·분류·추가 방법은 [assets/icons.md](assets/icons.md).

```
brain robot db shield layers code users chart lock cloud cogs diagram
check bulb sitemap clipboard route cubes magic comments server key
usershield search tools bolt flask eye github microsoft building
handshake clock warn compass rocket balance plug star question
windows stream network
```

색조는 자동으로 문맥에 맞게 고른다(카드=네이비, 딥네이비 배경=흰색). 스펙에는 키만 준다.

---

## 색상 토큰 (교체하려면)

`assets/theme.js` 의 `palette` 가 팔레트다. 여기만 바꾸면 덱 전체 톤이 바뀐다.
아이콘도 `currentColor` 라 새 팔레트 색으로 자동 재색상된다.

| 키 | 값 | 용도 |
|---|---|---|
| `DARK` | `0F2547` | 표지·간지·마무리 배경 |
| `NAVY` | `1A3D6D` | 배지·헤더 행·강조 카드 |
| `MID` | `2F5B93` | 키커·화살표·보조 |
| `ACCENT` | `4F8FB6` | 진행표시·포인트 라인 |
| `GREEN` | `2E9E6B` | GA 배지 |
| `GOLD` | `F5B841` | Preview 배지 |
| `BG` | `F5F8FC` | 본문 슬라이드 배경 |

같은 파일에서 폰트(`font.body`/`font.heading`)와 진행 표시줄 구간 수(`progress.parts`)도
바꿀 수 있다. 구간 수를 바꾸면 슬라이드 스펙의 `part` 값 범위도 함께 맞춘다.
