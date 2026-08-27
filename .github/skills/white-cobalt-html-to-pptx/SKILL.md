---
name: white-cobalt-html-to-pptx
description: Port a White Cobalt HTML slide deck to PPTX 1:1, with its entrance animations intact. Use when the user wants an HTML presentation converted to PowerPoint, wants a deck that exists in both formats, mentions "HTML 슬라이드 pptx 변환" or "pptx로 만들어줘", or wants a PPTX whose animations survive the conversion. Covers the 1920x1080 stage coordinate contract, the pptxgenjs generator, the p:timing dialect PowerPoint actually accepts, and a PowerPoint-verified QA loop. Pairs with white-cobalt-md-to-html, which authors the HTML. For building a PPTX straight from markdown in the deep navy theme instead, use deep-navy-md-to-pptx.
---

# White Cobalt HTML deck → PPTX

Port a deck that already exists in HTML to PPTX so both stay visually identical
and **the animations survive the conversion** rather than being flattened away.

This is the second half of a pipeline. The first half,
**`white-cobalt-md-to-html`**, builds the HTML deck from a markdown slide
script. If there is no HTML deck yet, start there.

## The style

White Cobalt: white paper ground, a single cobalt accent (`#0F62FE`), square
corners, hairline rules, a ruled top chrome bar carrying the section label /
journey markers / page number, and a large type scale.

`templates/deck.html` and `templates/make_deck.js` are a matched pair covering
six layouts — title, statement, two-column contrast, timeline, pipeline, and a
3-up reflection. They are the same design system as `white-cobalt-md-to-html`,
so a deck authored there ports through here without restyling.

**The palette constants in the generator and the `:root` tokens in the HTML are
deliberately parallel and must be edited together.** `ACCENT = "0F62FE"` in
`make_deck.js` is the same colour as `--accent:#0F62FE` in the CSS. Changing one
without the other is how the two formats silently drift apart — and nobody
notices until the PPTX is on a projector next to the HTML.

These are worked examples, not fixed slots. Content differs per slide, so
layouts will differ too — [layouts.md](layouts.md) covers adapting them without
letting the HTML and the PPTX drift apart.

## The one rule that matters

**PowerPoint is the only authority on whether a PPTX is valid.**

Schema validity is not the bar and can actively mislead you. A change made *to
satisfy the XSD* is what caused the "presentation needs repair" dialog in the
build this skill came from. Verify by opening the file in PowerPoint
(`scripts/ppt_open_test.sh`), not by reasoning about XML.

## Workflow

| Phase | What you do | Guide |
| --- | --- | --- |
| 1. Have an HTML deck | Fixed 1920×1080 stage, design tokens, `.reveal` classes, presenter notes | [authoring.md](authoring.md) — or build it with `white-cobalt-md-to-html` |
| 2. Port to PPTX | pptxgenjs generator in stage-pixel coordinates + animation manifest | [porting.md](porting.md) |
| 3. Animate | `scripts/add_animations.py` injects `<p:timing>` so the reveals survive | [animation.md](animation.md) |
| 4. Verify | Schema check, visual QA, PowerPoint open test | [qa.md](qa.md) |

If the deck came from `white-cobalt-md-to-html`, phase 1 is already done — its
output is exactly the structure this skill expects. Skip to phase 2.

[layouts.md](layouts.md) is cross-cutting: read it whenever the content does not
fit the template layout, which is most real slides.

Read the guide for the phase you are in. Do not read all four upfront.

## Quick start

```bash
npm install -g pptxgenjs
pip install lxml            # for the schema checker

SKILL=.github/skills/white-cobalt-html-to-pptx
mkdir -p build
cp $SKILL/templates/deck.html        deck.html            # phase 1: edit this
cp $SKILL/templates/make_deck.js     build/               # phase 2: mirror it here
cp $SKILL/scripts/add_animations.py  build/
cp $SKILL/scripts/fix_notes.py       build/
cp $SKILL/scripts/check_pptx.py      build/

NODE_PATH=$(npm root -g) node build/make_deck.js
python3 build/fix_notes.py deck.pptx                  # restore note line breaks
python3 build/add_animations.py deck.pptx build/anim-manifest.json
python3 build/check_pptx.py deck.pptx
$SKILL/scripts/render_slides.sh deck.pptx /tmp/qa     # visual QA
$SKILL/scripts/ppt_open_test.sh deck.pptx             # macOS + PowerPoint only
```

Out of the box that produces a 6-slide deck with 300 entrance effects and its
speaker notes intact.

## The coordinate contract

The HTML deck is authored on a fixed 1920×1080 stage. The generator keeps that
exact coordinate system so every number can be diffed against the CSS:

```
1920 px  →  13.333 in   (144 px per inch)   →  pptxgenjs LAYOUT_WIDE
1 px     →  0.5 pt                          →  font sizes
```

Never convert by eye. Write positions in stage pixels and let one helper do the
division. Getting this wrong in both the helper and the call site is a real
failure mode — it silently produces zero-height text boxes.

## Non-negotiables

These each cost a debugging cycle to learn. Do not rediscover them.

1. **Never reorder `ppt/presentation.xml`.** The XSD wants `notesMasterIdLst`
   before `sldIdLst`; pptxgenjs writes it after. Moving it to match the schema
   makes PowerPoint reject the entire package. Leave pptxgenjs's order alone.
2. **Emit no `grpId`** on animation nodes unless you also emit a matching
   `<p:bldLst>` entry. A dangling `grpId` is a reference to a build group that
   does not exist.
3. **Flatten translucent colors yourself.** Compose `rgba()` over the slide
   background and emit opaque hex rather than trusting renderer alpha.
4. **Web fonts do not exist in PPTX.** Map them to a font the audience's Office
   actually ships (Korean: `맑은 고딕`). Keep an env override so visual QA can
   re-render with a locally installed font.
5. **Animations must not be lost.** pptxgenjs writes no timing at all, so
   without the injector the deck ports as static slides. Confirm they survived
   by opening the Animation Pane, not by trusting the build log.
6. **A newline in `addNotes()` silently drops the whole note.** pptxgenjs 4.x
   emits an empty notes page and logs nothing. Write a `\u2424` sentinel and
   convert it with `scripts/fix_notes.py`. See [porting.md](porting.md).
7. **Keep the palette locked to the HTML.** The generator's `ACCENT`, `INK`,
   `PAPER` and `RULE` constants mirror the deck's `:root` tokens. Edit them as a
   pair. A PPTX that has drifted a shade off the HTML looks fine alone and
   obviously wrong side by side.
8. **Verify in PowerPoint before claiming success.** See [qa.md](qa.md).

## Files

```
authoring.md      Phase 1 — HTML deck structure and design tokens
porting.md        Phase 2 — generator patterns, layout primitives, measurement
animation.md      Phase 3 — the p:timing dialect PowerPoint accepts
qa.md             Phase 4 — validation, visual inspection, PowerPoint test
layouts.md        Adapting layouts when content does not fit the template
templates/
  deck.html       Fixed-stage White Cobalt HTML deck
  make_deck.js    Annotated pptxgenjs generator, palette matched to the CSS
scripts/
  add_animations.py   Injects <p:timing> + fixes pptxgenjs OOXML defects
  fix_notes.py        Restores speaker-note line breaks pptxgenjs drops
  check_pptx.py       Validates every XML part against ISO-29500
  ppt_open_test.sh    Opens a file in real PowerPoint for a human verdict
  render_slides.sh    PPTX → per-slide JPGs for visual QA
```

## The other half

`white-cobalt-md-to-html` authors the HTML deck from a markdown slide script in
this same design system. Together:

```
슬라이드 원고.md
  → white-cobalt-md-to-html  → deck.html
  → white-cobalt-html-to-pptx → deck.pptx
```
