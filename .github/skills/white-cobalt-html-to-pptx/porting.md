# Phase 2 — Porting to PPTX

Start from `templates/make_deck.js`. It already contains the geometry contract,
the palette, the layout primitives, and six worked slides matching
`templates/deck.html`.

## The coordinate contract

Write every position in **stage pixels** and let one helper convert. Do not
convert by eye and do not convert twice.

```js
const PXI = 144;                       // stage px per inch
const px  = (v) => v / PXI;            // px -> inches  (shape geometry)
const pt  = (v) => v / 2;              // px -> points  (font sizes)
const lh  = (size, ratio) => (size * ratio) / 2;   // css line-height -> pt
```

> **The failure that costs an hour.** If `T()` divides `h` by 144 *and* the call
> site also passes `h: 90 / 144`, every text box collapses to near-zero height.
> Rendering looks like text bleeding out of invisible boxes. Pass `h` in stage
> pixels at the call site, always.

## Text

`T()` takes stage pixels and CSS-ish properties:

```js
T(s, "제목", { x: PAD_X, y: 240, w: CW, h: 70 * 1.24, size: 70, bold: true, ratio: 1.24 }, rev(2));
```

Rich runs mirror inline spans, and this is how `<span class="rd">` is ported:

```js
T(s, [
  { text: "핵심 주장을 " },
  { text: "두 줄", options: { color: ACCENT } },
  { text: " 이내로", options: { breakLine: true } },
  { text: "간결하게 적습니다" },
], { ... }, rev(4));
```

Two behaviours worth knowing:

- **Exact line spacing on a single centred line** pushes text to the top of its
  box. `T()` only applies `lineSpacing` when `ratio !== 1`, so pill and chip
  labels stay vertically centred.
- **`letter-spacing` is em-based in CSS and points in PPTX.**
  `charSpacing = em × fontSizePx / 2`. Converting at `1px = 1pt` doubles the
  tracking, which is subtle enough to survive a careless review.

## Measuring text

Pills, chips and flow steps are sized from their content, so the port needs an
advance-width estimate. `em()` treats Hangul/CJK as full width and Latin
per-case. It is approximate by design — used for sizing boxes and packing rows,
never for typesetting.

```js
const w = wpx(label, 24) + padX * 2;
```

Use it anywhere the CSS relies on `width:auto` or a flex row of content-sized
cells. Giving those a fixed column width instead is what makes a long value wrap
and shove the whole row out of alignment.

## Layout primitives

Each mirrors one CSS class. Extend rather than inline one-offs.

| Helper | CSS counterpart |
| --- | --- |
| `topbar(s, label, {stages, page})` | `.topbar` — section label, journey markers, page number, 2px rule |
| `h2(s, y, runs, r)` | `h2` |
| `label(s, x, y, w, text, r)` | `.label` |
| `band(s, {y, text, muted}, r)` | `.band` — accent-tinted takeaway with left rule |
| `flow(s, steps, {x, y}, r)` | `.flow` + `.chip` / `.chip.soft` + `.arrow` |
| `chips(s, items, {x, y, w}, r)` | `.tag` / `.pill` / `.lx`, wraps automatically |
| `progress(s, idx)` | `.progress` |

Helpers return the height they consumed where it is useful, so the next block
can be positioned relative to it instead of by a guessed constant.

## Colors

Flatten translucency against the slide background and emit opaque hex. Keep the
CSS value in the comment so the two can be diffed:

```js
const ACCENT_TINT = "EDF5FF";   // rgba over --paper
const FADE_SOFT   = "C1C1C1";   // --ink-soft at .42 (the .col-faded column)
```

## Fonts

```js
const SANS  = process.env.DECK_SANS  || "맑은 고딕";   // Office Korean standard
const LATIN = process.env.DECK_LATIN || "Segoe UI";    // numerals, page numbers, arrows
```

Web fonts do not exist in PowerPoint. The env overrides exist so visual QA can
re-render with a font that is actually installed locally — LibreOffice
substitutes unpredictably otherwise, and you end up chasing a font bug that
does not exist in the real file. See [qa.md](qa.md).

## Recording animations

Every `add*` call must be followed by exactly one manifest entry, which the
helpers do for you via the trailing argument:

```js
rect(s, {...}, rev(3));       // animates as .reveal.r3
T(s, "…", {...}, rev(3));
rect(s, {...});               // no animation (decoration)
```

The injector aborts if the shape count and manifest length disagree. That is the
guard against an animation silently going missing — see [animation.md](animation.md).

## Speaker notes

**A newline in `addNotes()` silently destroys the entire note.** pptxgenjs 4.x
writes a notes page with nothing on it and logs nothing. Passing an array of
runs does not help either — `addNotes` stringifies it to `[object Object]`.

So write a sentinel and convert it after the file is written:

```js
const NOTE_BR = "\u2424";                       // SYMBOL FOR NEWLINE
s.addNotes(note.replace(/\n/g, NOTE_BR));
```

```bash
python3 scripts/fix_notes.py deck.pptx          # sentinel -> <a:br/>
```

Do not reach for a vertical tab (`0x0B`) instead. PowerPoint uses it internally
for soft breaks, but it is not a legal XML 1.0 character: `check_pptx.py`
reports `PCDATA invalid Char value 11` and PowerPoint refuses the package.

Verify by counting, not by trusting the build:

```bash
python3 - <<'PY'
import zipfile, re
z = zipfile.ZipFile("deck.pptx")
n = sum(len("".join(re.findall(r"<a:t>(.*?)</a:t>", z.read(p).decode())))
        for p in z.namelist() if p.startswith("ppt/notesSlides/notesSlide"))
print("notes characters:", n)
PY
```

A number close to the slide count means every note was dropped and you are only
counting the page-number placeholders.

### Keep notes in one place

Read them out of the HTML at build time rather than retyping them into the
generator:

```js
const re = /<div class="slide-notes">([\s\S]*?)<\/div>/g;
```

Notes are long, get edited often, and are the part of the deck nobody
proofreads twice. Copying them by hand is how the two formats drift.

If the content does not fit the template layout, see [layouts.md](layouts.md).

Then go to [qa.md](qa.md).
