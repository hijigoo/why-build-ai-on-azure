#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SVG 파일 하나를 <symbol>로 변환한다.

    python3 make-symbol.py <symbol-id> <path/to/icon.svg>

내부 gradient/clip id를 심볼별로 격리한다. 이걸 하지 않으면 여러 아이콘을
한 문서에 넣었을 때 같은 id끼리 충돌해 색이 뒤섞인다.
"""
import re
import sys
from pathlib import Path

if len(sys.argv) != 3:
    sys.exit("usage: make-symbol.py <symbol-id> <icon.svg>")

name, src = sys.argv[1], Path(sys.argv[2])
if not src.exists():
    sys.exit("파일이 없습니다: %s" % src)

svg = src.read_text(encoding="utf-8")

# viewBox가 없으면 width/height로 만든다
m = re.search(r'viewBox="([^"]+)"', svg)
if m:
    vb = m.group(1)
else:
    w = re.search(r'\bwidth="(\d+)"', svg)
    h = re.search(r'\bheight="(\d+)"', svg)
    vb = "0 0 %s %s" % (w.group(1) if w else "24", h.group(1) if h else "24")

inner = re.sub(r"^[\s\S]*?<svg[^>]*>", "", svg, count=1)
inner = re.sub(r"</svg>\s*$", "", inner).strip()

# id 네임스페이싱 — 긴 id부터 바꿔야 부분 치환 사고가 안 난다
ids = sorted(set(re.findall(r'\bid="([^"]+)"', inner)), key=len, reverse=True)
for i, old in enumerate(ids):
    new = "%s-g%d" % (name, i)
    inner = inner.replace('id="%s"' % old, 'id="%s"' % new)
    inner = inner.replace("url(#%s)" % old, "url(#%s)" % new)
    inner = inner.replace('href="#%s"' % old, 'href="#%s"' % new)
    inner = inner.replace('xlink:href="#%s"' % old, 'xlink:href="#%s"' % new)

print('<symbol id="%s" viewBox="%s">%s</symbol>' % (name, vb, inner))
print("<!-- %s: id %d개 격리됨 -->" % (src.name, len(ids)), file=sys.stderr)
