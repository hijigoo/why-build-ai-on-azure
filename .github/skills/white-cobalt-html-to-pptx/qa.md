# Phase 4 — QA

Three checks, in order. The first two are deterministic and fast; the third is
the one that actually decides whether you can ship.

## 1. Schema

```bash
python3 build/check_pptx.py deck.pptx
```

Validates **every** XML part against ISO-29500. Expect:

```
deck.pptx: OK (1 known deviation(s) waived)
```

The waived deviation is the `notesMasterIdLst` ordering. It is registered as a
known exception precisely because "fixing" it breaks PowerPoint — see the
non-negotiables in [SKILL.md](SKILL.md).

> Do not use the pptx skill's `office/validate.py` for this. It does not check
> slide XML at all — a slide with a deliberately injected bogus element passes
> it. That gap is how malformed `<p:timing>` reached PowerPoint in the first
> place.

Schema-clean is necessary, not sufficient. Continue.

## 2. Visual

```bash
scripts/render_slides.sh deck.pptx /tmp/qa
```

Renders per-slide JPGs via LibreOffice. Inspect them and look for:

- overlapping or colliding elements
- text overflowing a card, chip, or the slide edge
- a wrapped title crowding the body beneath it
- inconsistent spacing between repeated elements (columns, cards, rows)
- large unexplained empty regions

**Use a subagent with fresh eyes.** You have been staring at the coordinates and
will see what you intended rather than what rendered. Ask for issues, not
confirmation, and treat "no issues found" from the first pass as suspicious.

Re-render after each fix; one fix routinely creates the next problem.

### LibreOffice font caveat

LibreOffice substitutes missing fonts unpredictably and will show Korean text
with mismatched weights or comically wide tracking. That is a **renderer**
artifact, not a defect in the file — check `<a:latin>`/`<a:ea>` in the XML
before chasing it. Re-render QA with a locally installed font instead:

```bash
DECK_SANS="AppleGothic" DECK_LATIN="Helvetica Neue" node build/make_deck.js
```

Ship with the Office-standard font; only the QA render uses the override.

## 3. PowerPoint

**This is the gate.** Nothing above predicts it.

```bash
scripts/ppt_open_test.sh deck.pptx
```

The script resets PowerPoint, opens the file, and then asks you to read the
screen. It is deliberately not fully automated: a modal dialog blocks the very
AppleScript queries you would use to detect that modal, and a leftover dialog
from a previous run poisons the next answer. Scripted runs produced both false
passes and false failures on identical bytes.

Two things to confirm:

1. **No repair dialog.** If "프레젠테이션 복구가 시도될 수 있습니다" appears, the
   package is rejected — do not ship it.
2. **Animations are present.** Open `Animations > Animation Pane` on a content
   slide. Entries should be listed and set to start *With Previous*. An empty
   pane means PowerPoint parsed the file but discarded the timing, which is a
   silent failure the other checks cannot see.

### If it is rejected

Bisect. Do not reason about the XML.

```bash
node build/make_deck.js                                   # A: raw pptxgenjs
python3 build/add_animations.py --no-anim deck.pptx m.json # B: OOXML fixes only
python3 build/add_animations.py deck.pptx m.json           # C: fixes + timing
```

Open each in PowerPoint. The first one that fails names the culprit. Keep a
known-good PowerPoint-authored file on hand as a positive control, and a
deliberately malformed package as a negative control, so you can tell a real
failure from a flaky run before you start changing code.

## Content

```bash
python3 -m markitdown deck.pptx | grep -c "Slide number:"   # slide count
python3 -m markitdown deck.pptx | grep -c "### Notes:"      # notes survived
python3 -m markitdown deck.pptx | grep -iE "xxxx|lorem|TODO"
```

`grep -c "### Notes:"` counts notes *pages*, and pptxgenjs writes one per slide
whether or not it holds any text. Count characters to prove the notes actually
carry content:

```bash
python3 - <<'PY'
import zipfile, re
z = zipfile.ZipFile("deck.pptx")
n = sum(len("".join(re.findall(r"<a:t>(.*?)</a:t>", z.read(p).decode())))
        for p in z.namelist() if p.startswith("ppt/notesSlides/notesSlide"))
print("notes characters:", n)
PY
```

A total roughly equal to the slide count means every note was dropped and you
are counting page-number placeholders — see the notes trap in
[porting.md](porting.md).

To prove nothing was dropped in the port, diff the HTML's visible text against
the PPTX text and expect an empty set:

```python
words = {w for w in re.findall(r'[가-힣A-Za-z0-9%]+', html_text) if len(w) > 1}
missing = sorted(w for w in words if w not in pptx_text)
```

## Before declaring done

- [ ] `check_pptx.py` passes
- [ ] Every slide visually inspected, issues fixed and re-verified
- [ ] Opens in PowerPoint with no repair dialog
- [ ] Animation Pane shows effects on a content slide
- [ ] Slide count matches the HTML, and notes carry real characters
- [ ] No placeholder text remains

## Rendering to JPG is not enough

`render_slides.sh` goes through LibreOffice, which uses whatever fonts the build
machine has. The Korean face PowerPoint actually sets — 맑은 고딕 — is usually
*not* installed there, so LibreOffice quietly substitutes a narrower one. Every
overflow caused by that font being wider than the web font disappears from the
render, and you ship a deck whose titles wrap onto the subtitle.

Audit the geometry numerically instead:

```bash
DECK_AUDIT=1 NODE_PATH=$(npm root -g) node build/make_deck.js
node scripts/audit_fit.js
```

The generator records every text run with its box; the checker reports

| | |
| --- | --- |
| `OVERSET` | wrapped text needs more height than the box has |
| `NOWRAP` | a `wrap:false` run is wider than its box and will bleed out |
| `OFFSTAGE` | the box leaves the 1920x1080 stage |
| `OVERLAP` | two runs share space vertically and horizontally |

`OVERLAP` catches the case a render hides best: a box far taller than the text
in it, sitting invisibly over the line below. Reserve height from a measured
line count, never from a guess like "titles are two lines".

## False REJECTED from ppt_open_test.sh

The script decides by looking for a modal dialog, so anything modal reads as a
repair prompt. Two harmless causes, both worth ruling out before you go
bisecting the OOXML:

- **a window left over from the previous run** — quit PowerPoint and retry.
- **the AutoRecovery prompt after PowerPoint was force-quit** (`kill -9`). Quit
  it cleanly, or move
  `~/Library/Containers/com.microsoft.Powerpoint/Data/Library/Preferences/AutoRecovery`
  aside, then retry.

A wedged PowerPoint also reports `INCONCLUSIVE: opened no window at all`. That
is the app, not the file.
