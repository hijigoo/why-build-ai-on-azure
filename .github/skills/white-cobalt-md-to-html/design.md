# The White Cobalt design system

White paper, near-black type, one cobalt accent. Square corners, hairline
rules, large type. Nothing else.

## Tokens

These live in `:root` in the template. Restyling the deck means changing these
and nothing else — if a colour or size is hard-coded in a slide, it is a bug.

```css
--paper:#FFFFFF;      /* slide ground — always white */
--panel:#F5F4F1;      /* soft fill: chips, tags, blocks */
--ink:#0E0E0E;        /* headlines, body emphasis */
--ink-soft:#6B6B6B;   /* body copy, labels */
--ink-faint:#AFAFAF;  /* the "before" side, inactive markers */
--accent:#0F62FE;     /* the only accent colour */
--accent-tint:#EDF5FF;/* accent at reading weight — takeaway bands */
--rule:#E7E7E7;       /* hairlines and inactive borders */

--font-display:'IBM Plex Sans KR';  /* statement slides, weight 700 */
--font-body:'IBM Plex Sans KR';     /* headlines and body */
--font-latin:'Archivo';             /* latin chrome, numerals, page numbers */
--font-mono:'IBM Plex Mono';        /* LATIN-ONLY labels — never Korean */

--h1-size:168px;  --statement-size:80px;  --h2-size:70px;  --body-size:30px;
--pad-x:120px;    --pad-y:92px;
```

## Type scale

Authored at the 1920×1080 stage, so these are literal pixels, not responsive
units. Two type sizes on a slide is usually right; four is a sign the slide is
doing too much.

| Role | Size | Weight | Colour |
| --- | --- | --- | --- |
| Cover headline | 168px | 700 | ink |
| Statement | 80px | 700 | ink, accent on the key phrase |
| Slide headline `h2` | 70px | 600 | ink |
| Section title `h4` | 32–36px | 600 | ink |
| Body | 30px | 400 | ink-soft |
| Supporting | 23–25px | 400 | ink-soft / ink-faint |
| Label | 22px | 600 | ink-soft, `.rd` for accent |

Headlines carry `letter-spacing:-0.02em` to `-0.045em`. Korean at display sizes
looks loose without it. Never apply positive tracking to Korean — it reads as
gappy because the glyphs are already square.

## Accent discipline

Cobalt appears in a fixed set of places:

- the section square `.sq` and the cover mark
- active journey markers, the progress bar
- numerals — step numbers, page numbers, metrics
- exactly **one** highlighted phrase per headline (`.rd`)
- the takeaway band's left rule, the `.acc-box` border, arrows in a `.flow`

It does not appear as: a headline colour, a second body colour, a background
fill for a whole panel, or decoration. A slide with cobalt in five places has
no emphasis at all.

There is no second accent colour. If something needs to stand out and cobalt is
taken, use weight or scale instead.

## Shape language

- **Square corners.** No `border-radius` anywhere except the round journey
  markers, which are circles by design.
- **Hairlines, not boxes.** Separation comes from a 1px `--rule` line or a 2px
  ink rule under the top bar. Reach for a bordered card only when the content
  really is a discrete unit (`.block`, `.acc-box`, `.word`).
- **No shadows, no gradients, no background texture.** The deck this style came
  from originally had a faint vertical grid behind every slide; it cut across
  the strokes of large Korean glyphs and was removed. White space does the work.

## Motion

One staggered entrance per slide. `.reveal` plus `.r1`–`.r6` sets the order;
each step is ~120ms. Two bespoke wipes exist on the cover — the accent rule and
the highlight bar behind the key word.

Reveal in *reading* order, and give one number to each idea rather than each
element. Five things appearing one at a time reads as a list being dictated.

`prefers-reduced-motion` is honoured in the base CSS. Leave it alone.

## Korean typography

This style is built for Korean, and most of its failure modes are Korean-specific.

- `word-break:keep-all` on every slide, so lines break between words rather
  than mid-word.
- Body line-height 1.6–1.78. Korean crowds vertically more than Latin.
- Never `text-transform:uppercase` on Korean — there is no case, and it only
  affects any Latin caught in the run.
- Mixed Korean/Latin: one face per sentence. Letting the browser fall back to a
  Latin face for the ASCII inside a Korean sentence produces two different
  weights in one line.
- Latin numerals stay in `--font-latin` (Archivo). Its numerals are tighter and
  read as data, which is the intent.

### Orphan lines are the most common Korean defect

Korean does not hyphenate, so a wrapped sentence in a narrow column routinely
leaves one or two trailing syllables alone on the final line (`않습니다`,
`지점입니다.`). It reads as a rushed deck even when everything else is right.

Fix it in CSS, never with hand-placed `<br>` — a single copy edit re-breaks it:

```css
.slide p,.slide li,.slide h2,.slide h4,
.stat,.claim,.tag,.node span,.crow span,
.change .from,.change .aside,.change .to,
.band,.band .muted,.attrib{ text-wrap:balance; }

.nb{white-space:nowrap;}
```

`text-wrap:balance` evens out line lengths and leaves single-line text alone.

A Latin+Korean compound (`SSH 세션`, `CI 파이프라인`) reads as one unit, but the
space inside it is a break opportunity, so the Latin half gets stranded at the
end of a line. Wrap those in `.nb`.

`verify_deck.js` enforces this: it groups a range's client rects into visual
lines (inline `<span>` runs would otherwise be miscounted as extra lines) and
fails with `ORPHAN_LINE` when the last line is under 34% of the widest line.
