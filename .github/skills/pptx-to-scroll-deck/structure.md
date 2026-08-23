# HTML 뼈대 (참고용)

> **대부분의 경우 이 문서를 읽을 필요가 없다.**
> `scripts/build.py`가 아래 셸을 자동으로 생성한다.
> 슬라이드는 `templates/slide-patterns.html`에서 복사해 쓰고, 빌더에 넘기면 된다.
>
> 이 문서는 빌더를 쓰지 않고 직접 조립하거나, 사이드바·인트로 구조 자체를
> 바꿔야 할 때만 참고한다.

`assets/`의 3개 파일을 이 순서로 조립한다. CSS를 새로 쓰지 않는다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>문서 제목</title>
<meta name="description" content="한 줄 요약">

<!-- 폰트: Manrope(라틴 디스플레이) · Pretendard(한글) · IBM Plex Mono(크롬) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">

<style>
/* ===== assets/deck.css 전체 내용을 여기에 붙여넣는다 ===== */
</style>
</head>
<body>

<!-- ===== assets/icon-sprite.html 전체 내용을 여기에 붙여넣는다 ===== -->

<div class="top-prog"><span id="topProg"></span></div>
<button class="sb-toggle" id="sbToggle" title="목차 열기 (M)" aria-label="목차 열기">☰</button>
<div class="sb-scrim" id="sbScrim"></div>

<!-- 왼쪽 사이드바 -->
<nav class="sidebar" id="sidebar" aria-label="목차">
  <div class="sb-head">
    <button class="sb-close" id="sbClose" title="목차 접기 (M)" aria-label="목차 접기">&#10094;</button>
    <div class="sb-brand"><span class="sb-sq"></span><span class="sb-kick">브랜드 라벨</span></div>
    <div class="sb-title">문서 제목<br>두 줄까지</div>
    <div class="sb-sub">한 줄 부제</div>
  </div>
  <div class="sb-tools">
    <button class="sb-btn on" id="notesBtn" title="슬라이드 설명 표시/숨김 (N)">슬라이드 설명</button>
  </div>
  <div class="sb-nav" id="sbNav">
    <!-- 파트별 목차 (아래 참고) -->
  </div>
</nav>

<main class="main">
  <header class="intro">
    <div class="ik">라벨</div>
    <h1>큰 제목<span class="q">.</span></h1>
    <p>이 문서가 무엇이고 어떤 순서로 읽으면 되는지 2~3문장.</p>
    <div class="meta"><span>30 Sections</span><span>약 25분</span><span>v1.0</span></div>
  </header>

  <!-- chapter 반복 -->
</main>

<button class="to-top" id="toTop" aria-label="맨 위로">↑</button>

<script>
/* ===== assets/deck.js 전체 내용을 여기에 붙여넣는다 ===== */
</script>
</body>
</html>
```

---

## 사이드바 목차

파트별로 묶는다. `data-target`은 해당 chapter의 `id`와 같아야 스크롤 스파이가 동작한다.

```html
<div class="nav-group">
  <div class="nav-kicker">PART 1</div>
  <div class="nav-label">파트 이름</div>
  <ul class="nav-list">
    <li><a class="nav-link" href="#s04" data-target="s04" title="전체 제목">
      <span class="nav-n">04</span><span class="nav-t">목차에 보일 제목</span></a></li>
  </ul>
</div>
```

---

## 슬라이드(chapter) 한 장

```html
<article class="chapter" id="s07" data-n="07" data-part="파트명">
  <div class="ch-head">
    <span class="ch-n">07</span>
    <h2 class="ch-t">슬라이드 제목</h2>
    <span class="ch-part">파트명</span>
    <a class="ch-link" href="#s07" aria-label="이 섹션 링크">#</a>
  </div>

  <div class="sheet">
    <div class="slide">
      <div class="frame">
        <header class="s-head">
          <div class="kicker reveal r1">섹션 라벨</div>
          <h2 class="s-title reveal r2">핵심 메시지 <span class="hl">강조</span></h2>
          <p class="s-lead reveal r3">한 줄 보충. 없으면 생략.</p>
        </header>
        <div class="s-body">
          <!-- components.md의 컴포넌트 -->
        </div>
        <div class="s-foot"><span>Part 1 · 구분</span><span class="pg">07 / 30</span></div>
      </div>
    </div>
  </div>

  <aside class="note" aria-label="슬라이드 설명">
    <div class="note-head">슬라이드 설명</div>
    <div class="note-body">
      <p>배경과 근거를 독자에게 설명하는 문단.</p>
      <ul><li><em>강조 항목</em> — 설명</li></ul>
      <dl class="gloss">
        <dt>제품명</dt><dd>처음 보는 사람도 이해할 한 문장 정의.</dd>
      </dl>
      <p class="q">보조 메모는 이 스타일로.</p>
    </div>
  </aside>
</article>
```

### 어두운 슬라이드

파트 표지나 강조 장에 쓴다. `.slide dark` + 장식용 원.

```html
<div class="slide dark">
  <div class="orb o1"></div><div class="orb o2"></div>
  <div class="frame"> ... </div>
</div>
```

### 파트 표지

```html
<div class="slide dark">
  <div class="orb o1"></div><div class="orb o2"></div>
  <div class="frame">
    <div class="s-body">
      <div class="part-no reveal r1">02</div>
      <div class="part-t reveal r2">파트 제목</div>
      <div class="part-d reveal r3">이 파트에서 다루는 것 한두 문장.</div>
      <div class="part-idx reveal r4">
        <span>첫 번째 주제</span><span>두 번째 주제</span>
      </div>
    </div>
    <div class="s-foot"><span>Part 2 · 라벨</span><span class="pg"></span></div>
  </div>
</div>
```

### 이미지 슬라이드

```html
<div class="s-body">
  <div class="figwrap reveal r3">
    <img src="images/diagram.png" alt="다이어그램 설명">
  </div>
</div>
```

`.figwrap`은 이미지를 무대 밖으로 못 나가게 잡아준다. 큰 이미지도 안전하다.

---

## 등장 애니메이션

- `reveal r1` ~ `r8` — 순차 등장. 숫자가 클수록 늦게 나온다.
- `stagger` — 부모에 걸면 자식들이 자동으로 순차 등장한다. 카드/리스트 그룹에 쓴다.

```html
<div class="grid g3 stagger"> <div class="card">…</div> … </div>
```

---

## 조작 (deck.js가 제공)

| 키 | 동작 |
|---|---|
| `J` / `K` | 다음 / 이전 섹션 |
| `N` | 설명란 전체 표시·숨김 |
| `M` | 목차 접기·펼치기 (접힘 상태는 localStorage에 저장) |

이 외에 스크롤 스파이, 읽기 진행 바, 시트 자동 스케일링, 모바일 서랍 전환이 자동으로 붙는다.
