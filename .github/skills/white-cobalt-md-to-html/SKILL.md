---
name: white-cobalt-md-to-html
description: Turn a markdown slide script into a White Cobalt HTML deck — pure white ground (#FFFFFF), near-black ink, one cobalt accent (#0F62FE), square corners, hairline rules, a fixed 1920x1080 stage, staggered entrance reveals, and presenter notes. One slide fills the screen like a projected presentation. Use when the user wants slides, a deck, or a presentation built from markdown or notes, mentions "마크다운으로 발표자료", "슬라이드 만들어줘", "HTML 덱", or wants the White Cobalt deck style. Pairs with white-cobalt-html-to-pptx, which ports the result to PowerPoint. For a vertically scrolled reading document with a sidebar table of contents instead, use deep-navy-md-to-html.
---

# Markdown → White Cobalt HTML deck

Take a written slide script and build it into a single self-contained HTML deck
in the White Cobalt style. No build step, no dependencies — one file that opens
in any browser.

This is the first half of a pipeline. The second half,
**`white-cobalt-html-to-pptx`**, ports the finished HTML to PowerPoint with the
animations intact. Author here; port there.

## The style

White paper ground, near-black type, and exactly one accent — cobalt `#0F62FE`.
Square corners, hairline rules, a ruled top bar carrying the section label /
journey markers / page number, and a large type scale meant to be read from the
back of a room.

The accent is scarce on purpose. It marks the eye's landing spots — the section
square, the active journey marker, numerals, one highlighted phrase per
headline — and nothing else. When everything is accented, nothing is.

Full token list and the rules that keep a deck recognisably White Cobalt:
[design.md](design.md).

## Workflow

| Phase | What you do | Guide |
| --- | --- | --- |
| 1. Read the script | Get the markdown into slide-shaped units with a script per slide | [authoring.md](authoring.md) |
| 2. Choose layouts | Match each slide's *content shape* to a layout component | [layouts.md](layouts.md) |
| 3. Build | Copy `templates/deck.html`, replace content slide by slide | below |
| 4. Verify | Render every slide and look at it | below |

Read the guide for the phase you are in. Do not read all three upfront.

## Quick start

```bash
SKILL=.github/skills/white-cobalt-md-to-html
cp $SKILL/templates/deck.html ./deck.html      # 11 worked layouts, ready to edit

npm install playwright && npx playwright install chromium
node $SKILL/scripts/verify_deck.js deck.html qa-shots
```

`templates/deck.html` is a working deck, not a skeleton — 11 slides covering
every layout in the catalogue. Delete what you don't need, duplicate what you
do, replace the text.

## The one rule that matters

**Slides are 1920×1080 and never reflow. Content fits, or it moves to another
slide.**

There is no scrolling and no shrink-to-fit. When a slide overflows, the fix is
to split it or cut it — never to reduce the type scale until it fits. A slide
whose body text has been quietly shrunk to 20px is unreadable in the room,
which is the only place it matters.

`scripts/verify_deck.js` fails the build on overflow so this cannot slip
through unnoticed.

## Non-negotiables

Each of these cost a debugging cycle. Do not rediscover them.

1. **Never use a mono font for Korean.** `IBM Plex Mono` has no Hangul, so the
   browser falls back mid-run and the wide mono word-space blows the spacing
   apart — Korean renders with gaps between every word. Mono is Latin-only:
   labels, numerals, chrome. Body and headlines are `IBM Plex Sans KR`.
2. **Never put a display face without Hangul on Korean text.** `Black Han Sans`
   looked right in the preview and rendered as broken boxes on the cover.
   Verify by rendering, not by reading the font's marketing page.
3. **Do not lay out a sentence with flexbox.** A `display:flex` row splits the
   text nodes around `<b>` into separate flex items and injects the row `gap`
   mid-sentence. Use an absolutely positioned `::before` for the marker and let
   the sentence stay one text flow. See `.after li` in the template.
4. **Never negate a CSS function.** `-clamp(...)` and `-min(...)` are silently
   dropped by the browser — no error, the element just lands in the wrong
   place. Write `calc(-1 * clamp(...))`.
5. **Slide visibility is `visibility`/`opacity`, never `display`.** A later
   `display:flex` on a child overrides `display:none` and every slide becomes
   visible at once.
6. **No session logistics on a slide.** "All Hands · 10 min", keyboard hints,
   run-of-show — that is operator information the audience should not be shown.
   It belongs in `.slide-notes`. The verifier fails on it.
7. **Bump `STORAGE_KEY` whenever you change the markup.** The deck restores
   inline edits from `localStorage` into the stage on load, so a stale cached
   copy silently resurrects the old slides. This one is genuinely confusing to
   debug: the file on disk is correct and the browser shows the old deck.

## Verify before claiming it works

Programmatic checks catch geometry, not ugliness:

```bash
node $SKILL/scripts/verify_deck.js deck.html qa-shots
```

It renders each slide at full 1920×1080 and fails on overflow, escaping
elements, clipped text, overlapping panels, logistics chrome, and aspect-ratio
drift. **Then open the screenshots in `qa-shots/` and look at them.** Every
visual defect in the deck this skill came from — broken glyphs, a highlight bar
sitting across a word, gaps mid-sentence — passed the geometry checks clean.

## Files

```
authoring.md    Phase 1 — the markdown slide-script convention
layouts.md      Phase 2 — layout catalogue and how to pick one
design.md       The design system: tokens, type scale, accent discipline
templates/
  deck.html     Working 11-slide deck — the starting point
scripts/
  verify_deck.js  Renders every slide and fails on layout defects
```

## The other half

Once the HTML deck is right, `white-cobalt-html-to-pptx` ports it to PowerPoint
with the entrance animations and presenter notes intact. Together:

```
슬라이드 원고.md
  → white-cobalt-md-to-html  → deck.html
  → white-cobalt-html-to-pptx → deck.pptx
```

Author in HTML and port. Do not maintain the two formats by hand — they drift.
