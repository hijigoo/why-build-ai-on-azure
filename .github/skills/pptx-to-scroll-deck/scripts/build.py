#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build.py — 슬라이드 조각들을 완성된 HTML 문서로 조립한다.

    python3 build.py slides.html -o 결과.html \
        --title "문서 제목" --subtitle "부제" --kicker "브랜드 라벨" \
        --intro "이 문서가 무엇인지 2~3문장"

입력(slides.html)에는 <article class="chapter"> 조각만 순서대로 넣으면 된다.
CSS·JS·아이콘 스프라이트·사이드바 목차는 이 스크립트가 자동으로 붙인다.

목차는 chapter의 data-part 속성으로 그룹을 만들고, ch-t 제목을 항목으로 쓴다.
페이지 번호(.pg)와 chapter id/data-n도 순서대로 자동 부여한다.
"""
import argparse
import html
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent / "assets"

HEAD = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>__TITLE__</title>
<meta name="description" content="__SUBTITLE__">

<!-- Manrope(라틴 디스플레이) · Pretendard(한글) · IBM Plex Mono(크롬) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">

<style>
__CSS__
</style>
</head>
<body>

__SPRITE__

<div class="top-prog"><span id="topProg"></span></div>
<button class="sb-toggle" id="sbToggle" title="목차 열기 (M)" aria-label="목차 열기">☰</button>
<div class="sb-scrim" id="sbScrim"></div>

<nav class="sidebar" id="sidebar" aria-label="목차">
  <div class="sb-head">
    <button class="sb-close" id="sbClose" title="목차 접기 (M)" aria-label="목차 접기">&#10094;</button>
    <div class="sb-brand"><span class="sb-sq"></span><span class="sb-kick">__KICKER__</span></div>
    <div class="sb-title">__SBTITLE__</div>
    <div class="sb-sub">__SUBTITLE__</div>
  </div>
  <div class="sb-nav" id="sbNav">
__NAV__
  </div>
</nav>

<main class="main">
  <header class="intro">
    <div class="ik">__KICKER__</div>
    <h1>__H1__<span class="q">.</span></h1>
    <p>__INTRO__</p>
    <div class="meta">__META__</div>
  </header>

__CHAPTERS__
</main>

<button class="to-top" id="toTop" aria-label="맨 위로">↑</button>

<script>
__JS__
</script>
</body>
</html>
"""


def read_asset(name):
    p = ASSETS / name
    if not p.exists():
        sys.exit("자산이 없습니다: %s" % p)
    return p.read_text(encoding="utf-8").strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slides", help="chapter 조각들이 든 HTML 파일")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--title", required=True, help="브라우저 탭 제목 / 사이드바 제목")
    ap.add_argument("--h1", default=None, help="본문 상단 큰 제목 (기본: --title)")
    ap.add_argument("--subtitle", default="")
    ap.add_argument("--kicker", default="")
    ap.add_argument("--intro", default="")
    ap.add_argument("--meta", default="", help="'항목1|항목2|항목3' 형식")
    args = ap.parse_args()

    body = Path(args.slides).read_text(encoding="utf-8")
    # HTML 주석 안의 예시 태그가 조각으로 잡히지 않게 먼저 제거한다
    body = re.sub(r"<!--[\s\S]*?-->", "", body)
    chapters = re.findall(r'<article class="chapter"[\s\S]*?</article>', body)
    if not chapters:
        sys.exit("chapter를 찾지 못했습니다. <article class=\"chapter\"> 형식인지 확인하세요.")

    total = len(chapters)
    rebuilt, nav_groups = [], []
    cur_part, cur_items = None, []

    for i, ch in enumerate(chapters, start=1):
        nn = "%02d" % i
        sid = "s%s" % nn

        part = (re.search(r'data-part="([^"]*)"', ch) or [None, ""])[1]
        title_m = re.search(r'<h2 class="ch-t">([\s\S]*?)</h2>', ch)
        title = re.sub(r"<[^>]+>", "", title_m.group(1)).strip() if title_m else ""

        # id / data-n / 번호 / 페이지 표시를 순서대로 다시 매긴다
        ch = re.sub(r'(<article class="chapter"[^>]*?)\sid="[^"]*"', r"\1", ch)
        ch = re.sub(r'(<article class="chapter"[^>]*?)\sdata-n="[^"]*"', r"\1", ch)
        ch = ch.replace('<article class="chapter"', '<article class="chapter" id="%s" data-n="%s"' % (sid, nn), 1)
        ch = re.sub(r'<span class="ch-n">[^<]*</span>', '<span class="ch-n">%s</span>' % nn, ch, count=1)
        ch = re.sub(r'<a class="ch-link" href="[^"]*"', '<a class="ch-link" href="#%s"' % sid, ch, count=1)
        ch = re.sub(r'<span class="pg">[^<]*</span>', '<span class="pg">%s / %d</span>' % (nn, total), ch, count=1)
        rebuilt.append(ch)

        if part != cur_part:
            if cur_items:
                nav_groups.append((cur_part, cur_items))
            cur_part, cur_items = part, []
        cur_items.append((nn, sid, title))

    if cur_items:
        nav_groups.append((cur_part, cur_items))

    nav = []
    for gi, (part, items) in enumerate(nav_groups, start=1):
        label = part or "섹션"
        nav.append('    <div class="nav-group">')
        nav.append('      <div class="nav-kicker">PART %d</div>' % gi)
        nav.append('      <div class="nav-label">%s</div>' % html.escape(label))
        nav.append('      <ul class="nav-list">')
        for nn, sid, title in items:
            nav.append(
                '        <li><a class="nav-link" href="#%s" data-target="%s" title="%s">'
                '<span class="nav-n">%s</span><span class="nav-t">%s</span></a></li>'
                % (sid, sid, html.escape(title), nn, html.escape(title))
            )
        nav.append("      </ul>")
        nav.append("    </div>")

    meta = "".join("<span>%s</span>" % html.escape(m.strip())
                   for m in args.meta.split("|") if m.strip())
    if not meta:
        meta = "<span>%d Sections</span>" % total

    out = (HEAD
           .replace("__CSS__", read_asset("deck.css"))
           .replace("__JS__", read_asset("deck.js"))
           .replace("__SPRITE__", read_asset("icon-sprite.html"))
           .replace("__NAV__", "\n".join(nav))
           .replace("__CHAPTERS__", "\n".join(rebuilt))
           .replace("__SBTITLE__", html.escape(args.title).replace(" — ", "<br>"))
           .replace("__H1__", html.escape(args.h1 or args.title))
           .replace("__TITLE__", html.escape(args.title))
           .replace("__SUBTITLE__", html.escape(args.subtitle))
           .replace("__KICKER__", html.escape(args.kicker))
           .replace("__INTRO__", args.intro)
           .replace("__META__", meta))

    Path(args.out).write_text(out, encoding="utf-8")
    print("%s — %d 슬라이드, %d개 파트, %d KB"
          % (args.out, total, len(nav_groups), len(out) // 1024))


if __name__ == "__main__":
    main()
