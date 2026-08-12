#!/usr/bin/env python3
"""
why-build-ai-on-azure-slides.html (덱 모드) → 원페이지 스크롤 문서로 변환.

- 슬라이드 마크업과 디자인 시스템(CSS)을 그대로 재사용해 시각적 동일성 보장
- 각 슬라이드는 1920×1080 고정 무대를 유지한 채 16:9 시트 안에서 균일 축소
- 발표자 노트는 각 시트 바로 아래에 밝은 테마 카드로 렌더링
- 왼쪽 고정 사이드바 목차 + 스크롤 스파이 + 필터
"""
import html
import re
import sys
from pathlib import Path

SRC = Path("why-build-ai-on-azure-slides.html")
OUT = Path("why-build-ai-on-azure-onepage.html")

src = SRC.read_text(encoding="utf-8")

# ── 1. 원본에서 디자인 시스템 CSS 추출 ──────────────────────────────
style = re.search(r"<style>([\s\S]*?)</style>", src)
if not style:
    sys.exit("style block not found")
base_css = style.group(1)

# 덱 전용 셸(무대 스케일링·노트 도크·HUD)은 원페이지에서 불필요하므로 제거
for start_marker, end_marker in [
    ("/* ===========================================================\n   3. NOTES DOCK", "/* ===========================================================\n   5. SLIDE SHELL"),
]:
    i, j = base_css.find(start_marker), base_css.find(end_marker)
    if i == -1 or j == -1:
        sys.exit("could not locate deck-shell CSS block")
    base_css = base_css[:i] + base_css[j:]

# ── 1b. Azure 아이콘 스프라이트 추출 (<use href="#az-..."> 참조 대상) ──
m = re.search(r'<svg class="az-sprite"[\s\S]*?</svg>', src)
if not m:
    sys.exit("azure icon sprite not found")
sprite = m.group(0)

# ── 2. 슬라이드 추출 ────────────────────────────────────────────────
sections = re.findall(
    r'<section class="slide([^"]*)" data-title="([^"]*)">([\s\S]*?)\n</section>', src
)
if len(sections) != 49:
    sys.exit(f"expected 49 slides, got {len(sections)}")

slides = []
for cls, title, inner in sections:
    k = inner.find('<div class="notes">')
    body = inner[:k].rstrip()
    notes = inner[k + len('<div class="notes">'):].rstrip()
    if notes.endswith("</div>"):
        notes = notes[: -len("</div>")].rstrip()
    slides.append({
        "cls": cls.strip(),
        "title": html.unescape(title),
        "raw_title": title,
        "body": body,
        "notes": notes,
    })

# ── 3. 파트 단위로 묶기 ─────────────────────────────────────────────
groups, current = [], {"label": "시작하기", "kicker": "INTRO", "items": []}
for idx, s in enumerate(slides, start=1):
    if s["title"].startswith("PART "):
        if current["items"]:
            groups.append(current)
        head, _, tail = s["title"].partition(" — ")
        current = {"label": tail or head, "kicker": head, "items": []}
    current["items"].append({"n": idx, **s})
groups.append(current)

# ── 4. 사이드바 목차 ────────────────────────────────────────────────
nav = []
for g in groups:
    nav.append('<div class="nav-group">')
    nav.append(f'  <div class="nav-kicker">{html.escape(g["kicker"])}</div>')
    nav.append(f'  <div class="nav-label">{html.escape(g["label"])}</div>')
    nav.append('  <ul class="nav-list">')
    for it in g["items"]:
        label = it["title"]
        if label.startswith("PART "):
            label = "표지"
        nav.append(
            f'    <li><a class="nav-link" href="#s{it["n"]:02d}" data-target="s{it["n"]:02d}" '
            f'title="{it["raw_title"]}">'
            f'<span class="nav-n">{it["n"]:02d}</span>'
            f'<span class="nav-t">{html.escape(label)}</span></a></li>'
        )
    nav.append("  </ul>")
    nav.append("</div>")
nav_html = "\n".join(nav)

# ── 5. 본문 챕터 ────────────────────────────────────────────────────
chapters = []
for g in groups:
    for it in g["items"]:
        cls = (" " + it["cls"]) if it["cls"] else ""
        chapters.append(f'''
<article class="chapter" id="s{it["n"]:02d}" data-n="{it["n"]:02d}" data-part="{html.escape(g["label"])}">
  <div class="ch-head">
    <span class="ch-n">{it["n"]:02d}</span>
    <h2 class="ch-t">{html.escape(it["title"])}</h2>
    <span class="ch-part">{html.escape(g["label"])}</span>
    <a class="ch-link" href="#s{it["n"]:02d}" aria-label="이 섹션 링크 복사">#</a>
  </div>
  <div class="sheet">
    <div class="slide{cls}">
{it["body"]}
    </div>
  </div>
  <aside class="note" aria-label="슬라이드 설명">
    <div class="note-head">슬라이드 설명</div>
    <div class="note-body">
{it["notes"]}
    </div>
  </aside>
</article>''')
chapters_html = "\n".join(chapters)

# ── 6. 원페이지 전용 CSS ────────────────────────────────────────────
page_css = """
/* ===========================================================
   ONE-PAGE SHELL — 왼쪽 고정 목차 + 세로 스크롤 본문
   슬라이드 자체는 1920×1080 고정 무대를 그대로 유지하고,
   16:9 시트 안에서 전체를 균일 축소합니다. (내부 재배치 없음)
   =========================================================== */
:root{--sb-w:314px;--page-bg:#E9E5DC;--page-bg-2:#DFDACF}

html,body{width:auto;height:auto;overflow:visible;background:var(--page-bg)}
body{font-family:var(--f-body);color:var(--ink);
  -webkit-font-smoothing:antialiased;scroll-behavior:smooth}
@media (prefers-reduced-motion: reduce){body{scroll-behavior:auto}}

/* --- 상단 진행 바 --- */
.top-prog{position:fixed;left:0;right:0;top:0;height:3px;background:rgba(14,35,64,.12);z-index:80}
.top-prog span{display:block;height:100%;width:0;background:var(--cobalt)}

/* --- 사이드바 --- */
.sidebar{position:fixed;left:0;top:0;bottom:0;width:var(--sb-w);z-index:70;
  background:linear-gradient(170deg,var(--navy) 0%,var(--navy-2) 62%,var(--navy-3) 100%);
  display:flex;flex-direction:column;color:var(--on-dark);
  transition:transform .3s var(--ease)}
/* 목차를 접으면 본문이 화면 전체 폭을 쓰고 슬라이드가 커집니다 */
body.sb-collapsed .sidebar{transform:translateX(-100%)}
.sb-head{position:relative;padding:30px 26px 20px;flex:0 0 auto}
.sb-close{position:absolute;right:14px;top:16px;width:30px;height:30px;border-radius:2px;
  background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);color:#A9BBD1;
  font-size:12px;line-height:1;cursor:pointer;transition:color .2s,border-color .2s,background .2s}
.sb-close:hover{color:#fff;border-color:var(--cobalt);background:rgba(44,107,237,.32)}
.sb-brand{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.sb-sq{width:13px;height:13px;background:var(--cobalt);transform:rotate(45deg);flex:0 0 auto}
.sb-kick{font-family:var(--f-mono);font-size:10px;letter-spacing:.28em;text-transform:uppercase;
  color:var(--cobalt-soft)}
.sb-title{font-family:var(--f-display);font-size:26px;font-weight:800;letter-spacing:-.035em;
  color:#fff;line-height:1.14}
.sb-sub{margin-top:9px;font-size:12.5px;line-height:1.55;color:var(--on-dark-dim);letter-spacing:-.01em}

.sb-tools{padding:0 26px 18px;flex:0 0 auto}
.sb-btns{display:flex;gap:7px}
.sb-btn{flex:1;font-family:var(--f-mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:#A9BBD1;
  padding:8px 6px;border-radius:2px;cursor:pointer;transition:color .2s,border-color .2s,background .2s;
  text-align:center;text-decoration:none;line-height:1.3}
.sb-btn:hover{color:#fff;border-color:var(--cobalt)}
.sb-btn.on{color:#fff;border-color:var(--cobalt);background:rgba(44,107,237,.34)}

/* --- 목차 --- */
.sb-nav{flex:1;min-height:0;overflow-y:auto;padding:6px 14px 30px}
.sb-nav::-webkit-scrollbar{width:8px}
.sb-nav::-webkit-scrollbar-thumb{background:#2B3B54;border-radius:6px}
.nav-group{margin-bottom:16px}
.nav-kicker{font-family:var(--f-mono);font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;
  color:var(--cobalt-soft);padding:0 12px;margin-bottom:3px}
.nav-label{font-size:13.5px;font-weight:700;color:#fff;padding:0 12px 8px;letter-spacing:-.02em;
  border-bottom:1px solid rgba(255,255,255,.10);margin-bottom:5px}
.nav-list{list-style:none;margin:0;padding:0}
.nav-link{display:flex;gap:10px;align-items:baseline;padding:6px 12px;border-radius:2px;
  text-decoration:none;transition:background .18s,color .18s}
.nav-link:hover{background:rgba(255,255,255,.07)}
.nav-n{font-family:var(--f-mono);font-size:10.5px;color:#69809C;flex:0 0 auto;letter-spacing:.06em}
.nav-t{font-size:13px;line-height:1.42;color:#B4C4D8;letter-spacing:-.012em;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.nav-link.active{background:rgba(44,107,237,.24)}
.nav-link.active .nav-t{color:#fff;font-weight:700}
.nav-link.active .nav-n{color:var(--cobalt-soft)}

/* --- 본문 --- */
.main{margin-left:var(--sb-w);padding:56px 56px 120px;max-width:1580px;
  transition:margin-left .3s var(--ease),max-width .3s var(--ease)}
body.sb-collapsed .main{margin-left:auto;margin-right:auto;max-width:1760px;padding:56px 76px 120px}
.intro{margin-bottom:52px;padding-bottom:36px;border-bottom:2px solid rgba(14,35,64,.16)}
.intro .ik{font-family:var(--f-mono);font-size:13px;letter-spacing:.3em;text-transform:uppercase;
  color:var(--cobalt);margin-bottom:16px}
.intro h1{font-family:var(--f-display);font-size:62px;font-weight:800;letter-spacing:-.045em;
  color:var(--navy);line-height:1.04}
.intro h1 .q{color:var(--cobalt)}
.intro p{margin-top:18px;font-size:20px;line-height:1.6;color:var(--muted);max-width:940px;
  letter-spacing:-.02em;font-weight:500}
.intro .meta{margin-top:24px;display:flex;flex-wrap:wrap;gap:10px 26px;
  font-family:var(--f-mono);font-size:12px;letter-spacing:.14em;color:var(--muted-2);text-transform:uppercase}

.chapter{margin-bottom:64px;scroll-margin-top:24px}
.ch-head{display:flex;align-items:baseline;gap:14px;margin-bottom:14px;
  padding-bottom:11px;border-bottom:1px solid rgba(14,35,64,.16)}
.ch-n{font-family:var(--f-mono);font-size:13px;letter-spacing:.14em;color:var(--cobalt);flex:0 0 auto}
.ch-t{font-size:21px;font-weight:800;color:var(--navy);letter-spacing:-.028em;line-height:1.3;
  flex:1;min-width:0}
.ch-part{font-family:var(--f-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--muted-2);flex:0 0 auto;white-space:nowrap}
.ch-link{font-family:var(--f-mono);font-size:15px;color:var(--muted-2);text-decoration:none;
  opacity:0;transition:opacity .2s,color .2s;flex:0 0 auto}
.chapter:hover .ch-link{opacity:1}
.ch-link:hover{color:var(--cobalt)}

/* --- 16:9 시트 (슬라이드를 통째로 축소) --- */
.sheet{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:3px;
  background:var(--paper);box-shadow:0 14px 44px rgba(14,35,64,.18),0 2px 6px rgba(14,35,64,.10)}
.sheet .slide{position:absolute;left:0;top:0;width:1920px;height:1080px;
  visibility:visible;opacity:1;pointer-events:auto;transform-origin:0 0;overflow:hidden}

/* --- 노트 카드 (밝은 지면용 재스타일) --- */
.note{margin-top:16px;background:#FFFFFF;border:1px solid var(--line);border-top:4px solid var(--cobalt);
  border-radius:2px;padding:6px 30px 24px;box-shadow:0 2px 10px rgba(14,35,64,.06)}
body.notes-hidden .note{display:none}
.note-head{font-family:var(--f-body);font-size:12.5px;font-weight:800;letter-spacing:.02em;
  color:var(--cobalt);margin:16px 0 13px;padding-bottom:11px;border-bottom:1px solid #EFECE4}
.note-head::before{content:"";display:inline-block;width:8px;height:8px;background:var(--cobalt);
  transform:rotate(45deg);margin-right:9px;vertical-align:1px}
.note-body{font-size:16.5px;line-height:1.76;color:#37475A;letter-spacing:-.012em}
.note-body p{margin-bottom:11px}
.note-body p:last-child{margin-bottom:0}
.note-body b,.note-body strong{color:var(--navy);font-weight:700}
.note-body em{font-style:normal;color:var(--cobalt);font-weight:700}
.note-body ul{margin:6px 0 13px;padding-left:21px}
.note-body li{margin-bottom:7px}
.note-body li::marker{color:var(--cobalt)}
.note-body .q{display:block;margin-top:13px;padding-top:11px;
  border-top:1px solid var(--line);color:var(--muted);font-size:15.5px}
.note-body .badge{font-size:12px;padding:3px 8px}
/* 용어·제품 설명 블록 */
.note-body dl.gloss{margin:14px 0 4px;border-top:1px solid var(--line);padding-top:13px}
.note-body dl.gloss::before{content:"용어 · 제품 설명";display:block;font-family:var(--f-body);
  font-size:12.5px;font-weight:800;letter-spacing:.02em;color:var(--cobalt);margin-bottom:10px}
.note-body dl.gloss dt{font-weight:700;color:var(--navy);font-size:16.5px;margin-top:11px}
.note-body dl.gloss dt:first-of-type{margin-top:0}
.note-body dl.gloss dd{margin:3px 0 0;color:#4A5B70;font-size:16px;line-height:1.72}

/* --- 맨 위로 --- */
.to-top{position:fixed;right:26px;bottom:26px;z-index:75;width:44px;height:44px;border-radius:2px;
  background:var(--navy);color:#fff;border:1px solid rgba(255,255,255,.2);cursor:pointer;
  font-size:15px;opacity:0;pointer-events:none;transition:opacity .25s,background .2s}
.to-top.show{opacity:1;pointer-events:auto}
.to-top:hover{background:var(--cobalt)}

/* --- 모바일: 사이드바를 접이식 서랍으로 (슬라이드 시트는 계속 16:9 유지) --- */
.sb-toggle{display:none;position:fixed;left:14px;top:14px;z-index:90;width:44px;height:44px;
  border-radius:2px;background:var(--navy);color:#fff;border:1px solid rgba(255,255,255,.2);
  font-size:17px;cursor:pointer;transition:background .2s}
.sb-toggle:hover{background:var(--cobalt)}
body.sb-collapsed .sb-toggle{display:block}
.sb-scrim{display:none;position:fixed;inset:0;background:rgba(8,14,24,.55);z-index:65}
@media (max-width:1100px){
  .sb-toggle{display:block}
  .sidebar{transform:translateX(-100%);box-shadow:0 0 44px rgba(0,0,0,.4)}
  /* 모바일에서는 항상 오버레이 서랍이므로 데스크톱 접힘 상태를 무시합니다 */
  body.sb-open .sidebar,
  body.sb-collapsed.sb-open .sidebar{transform:translateX(0)}
  body.sb-open .sb-scrim{display:block}
  .main,
  body.sb-collapsed .main{margin-left:0;margin-right:0;max-width:none;padding:74px 22px 90px}
  .intro h1{font-size:40px}
  .intro p{font-size:17px}
  .ch-part{display:none}
  .note{padding:18px 20px 20px}
  .note-body{font-size:15px}
}

/* --- 인쇄: 시트 1장 = 1페이지 --- */
@media print{
  .sidebar,.sb-toggle,.sb-scrim,.top-prog,.to-top,.intro .meta{display:none!important}
  body{background:#fff}
  .main{margin-left:0;padding:0;max-width:none}
  .chapter{margin-bottom:0;break-after:page;page-break-after:always}
  .sheet{box-shadow:none;border:1px solid #ccc}
  .note{break-inside:avoid}
}
"""

# ── 7. 파일 조립 ────────────────────────────────────────────────────
page = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Why Build AI on Azure? — 원페이지</title>
<meta name="description" content="Azure 위에서 만드는 신뢰할 수 있는 Enterprise AI Platform — 전체 49개 섹션을 한 페이지에서">

<!-- ===========================================================
     FONTS — Manrope(Latin display) · Pretendard(Korean) · IBM Plex Mono(chrome)
     =========================================================== -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">

<style>
__BASE_CSS__
__PAGE_CSS__
</style>
</head>
<body>

__SPRITE__

<div class="top-prog"><span id="topProg"></span></div>
<button class="sb-toggle" id="sbToggle" title="목차 열기 (M)" aria-label="목차 열기">☰</button>
<div class="sb-scrim" id="sbScrim"></div>

<!-- ===========================================================
     SIDEBAR — 파트별 목차 · 필터 · 노트 토글
     =========================================================== -->
<nav class="sidebar" id="sidebar" aria-label="목차">
  <div class="sb-head">
    <button class="sb-close" id="sbClose" title="목차 접기 (M)" aria-label="목차 접기">&#10094;</button>
    <div class="sb-brand"><span class="sb-sq"></span><span class="sb-kick">Enterprise AI Platform</span></div>
    <div class="sb-title">Why Build AI<br>on Azure?</div>
    <div class="sb-sub">데이터에서 에이전트까지</div>
  </div>
  <div class="sb-tools">
    <div class="sb-btns">
      <button class="sb-btn on" id="notesBtn" title="슬라이드 설명 표시/숨김 (N)">슬라이드 설명</button>
    </div>
  </div>
  <div class="sb-nav" id="sbNav">
__NAV__
  </div>
</nav>

<!-- ===========================================================
     MAIN — 위에서 아래로 읽는 본문
     =========================================================== -->
<main class="main">
  <header class="intro">
    <div class="ik">Why Build AI on Azure?</div>
    <h1>데이터에서 에이전트까지<span class="q">.</span></h1>
    <p>엔터프라이즈 의사결정자를 위한 Azure AI 기술 자료입니다. 신뢰 → 가치 → 플랫폼 → 실현의 순서로,
       전체 __N__개 섹션을 위에서 아래로 이어서 읽을 수 있습니다. 각 장 아래에는 슬라이드 설명이 함께 있습니다.</p>
    <div class="meta">
      <span>__N__ Sections</span><span>약 40분 분량</span><span>v1.0</span><span>Microsoft Solution Engineer</span>
    </div>
  </header>
__CHAPTERS__
</main>

<button class="to-top" id="toTop" aria-label="맨 위로">↑</button>

<script>
/* ===========================================================
   1. 시트 스케일링
   슬라이드는 1920×1080으로 작성되어 있으므로, 시트 너비에 맞춰
   전체를 한 번의 transform으로 축소합니다. (내부 레이아웃 불변)
   =========================================================== */
const sheets = Array.from(document.querySelectorAll('.sheet'));
function fitSheets(){
  sheets.forEach(sh => {
    const slide = sh.firstElementChild;
    const f = sh.clientWidth / 1920;
    slide.style.transform = 'scale(' + f + ')';
  });
}
fitSheets();
window.addEventListener('resize', fitSheets);
if (window.ResizeObserver && sheets[0]) new ResizeObserver(fitSheets).observe(sheets[0].parentElement);
document.fonts && document.fonts.ready.then(fitSheets);

/* ===========================================================
   2. 등장 애니메이션 — 화면에 들어올 때 .visible 부여
   =========================================================== */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
document.querySelectorAll('.sheet .slide').forEach(s => io.observe(s));

/* ===========================================================
   3. 스크롤 스파이 — 현재 섹션을 목차에서 하이라이트
   =========================================================== */
const chapters = Array.from(document.querySelectorAll('.chapter'));
const links    = Array.from(document.querySelectorAll('.nav-link'));
const navBox   = document.getElementById('sbNav');
const linkOf   = id => links.find(a => a.dataset.target === id);
let activeId = null;

function syncSpy(){
  const line = window.innerHeight * 0.34;
  let cur = chapters[0];
  for (const c of chapters){
    if (c.getBoundingClientRect().top <= line) cur = c; else break;
  }
  if (!cur || cur.id === activeId) return;
  activeId = cur.id;
  links.forEach(a => a.classList.remove('active'));
  const a = linkOf(cur.id);
  if (a){
    a.classList.add('active');
    const ar = a.getBoundingClientRect(), nr = navBox.getBoundingClientRect();
    if (ar.top < nr.top + 8 || ar.bottom > nr.bottom - 8){
      navBox.scrollTop += (ar.top - nr.top) - navBox.clientHeight / 2 + ar.height;
    }
  }
}

function syncProgress(){
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const p = h > 0 ? (window.scrollY / h) * 100 : 0;
  document.getElementById('topProg').style.width = p + '%';
  document.getElementById('toTop').classList.toggle('show', window.scrollY > 700);
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { syncSpy(); syncProgress(); ticking = false; });
}, {passive:true});
syncSpy(); syncProgress();

/* ===========================================================
   4. 슬라이드 설명 토글 · 섹션 단위 이동 · 모바일 서랍
   =========================================================== */
const notesBtn = document.getElementById('notesBtn');
notesBtn.addEventListener('click', () => {
  const hidden = document.body.classList.toggle('notes-hidden');
  notesBtn.classList.toggle('on', !hidden);
  setTimeout(syncProgress, 60);
});

function goto(delta){
  const line = window.innerHeight * 0.34;
  let i = 0;
  chapters.forEach((c, k) => { if (c.getBoundingClientRect().top <= line + 2) i = k; });
  const t = chapters[Math.max(0, Math.min(i + delta, chapters.length - 1))];
  if (t) t.scrollIntoView({behavior:'smooth', block:'start'});
}

document.addEventListener('keydown', (e) => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  if (e.key === 'j' || e.key === 'J'){ e.preventDefault(); goto(1); }
  if (e.key === 'k' || e.key === 'K'){ e.preventDefault(); goto(-1); }
  if (e.key === 'n' || e.key === 'N'){ notesBtn.click(); }
  if (e.key === 'm' || e.key === 'M'){
    if (isDesktop()) setCollapsed(!document.body.classList.contains('sb-collapsed'));
    else document.body.classList.toggle('sb-open');
  }
});

document.getElementById('toTop').addEventListener('click',
  () => window.scrollTo({top:0, behavior:'smooth'}));

const sbToggle = document.getElementById('sbToggle');
const sbClose  = document.getElementById('sbClose');
const sbScrim  = document.getElementById('sbScrim');
const SB_KEY   = 'wbaoa-sidebar-collapsed';
const isDesktop = () => window.innerWidth > 1100;

/* 접힘 상태는 다음 방문에도 유지됩니다 */
function setCollapsed(v){
  document.body.classList.toggle('sb-collapsed', v);
  try { localStorage.setItem(SB_KEY, v ? '1' : '0'); } catch(e){}
  setTimeout(() => { fitSheets(); syncProgress(); }, 330);
}
try { if (localStorage.getItem(SB_KEY) === '1') document.body.classList.add('sb-collapsed'); } catch(e){}
fitSheets();

sbToggle.addEventListener('click', () => {
  if (isDesktop()) setCollapsed(false);
  else document.body.classList.toggle('sb-open');
});
sbClose.addEventListener('click', () => {
  if (isDesktop()) setCollapsed(true);
  else document.body.classList.remove('sb-open');
});
sbScrim.addEventListener('click', () => document.body.classList.remove('sb-open'));
links.forEach(a => a.addEventListener('click', () => document.body.classList.remove('sb-open')));
</script>
</body>
</html>
"""

page = (page
    .replace("__BASE_CSS__", base_css)
    .replace("__PAGE_CSS__", page_css)
    .replace("__NAV__", nav_html)
    .replace("__CHAPTERS__", chapters_html)
    .replace("__N__", str(len(slides)))
    .replace("__SPRITE__", sprite))

OUT.write_text(page, encoding="utf-8")
print(f"wrote {OUT} — {len(slides)} sections, {len(groups)} groups, {OUT.stat().st_size//1024} KB")
