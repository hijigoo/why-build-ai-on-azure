# Adapting layouts to real content

The templates are six worked examples, not a fixed set of slots. Content
changes per slide, so layouts change with it. This page is about doing that
without breaking the port.

## The principle

**HTML and PPTX must change together.** They are two renderings of one deck. If
a heading wraps to two lines in the browser, the generator has to reserve two
lines too, or the PPTX quietly diverges from the deck you designed.

Work in this order:

1. Change the HTML until the slide reads correctly in a browser.
2. Mirror the change in the generator.
3. Re-render and compare the two side by side.

## Position relative to content, not to constants

The commonest way a deck drifts is stacking hardcoded `y` values. When a block
above grows by one line, everything below it is wrong.

```js
// Fragile — the band's position silently rots when the column above grows.
band(s, { y: 690, text: "…" }, rev(5));

// Better — derive it, and let the helpers report what they consumed.
const colY = top + 87 + 52;
const colH = 306;
band(s, { y: colY + colH + 56, text: "…" }, rev(5));
```

`band()`, `flow()`, `chips()` and `pills()` all return the height they used.
Chain from those returns rather than re-deriving numbers by hand.

## Reserve space for the worst case in a repeated row

Timeline steps, cards, and columns share one baseline. Size the slot for the
longest item, not the first one.

```js
// Titles get a full two-line slot so the one column whose title wraps does not
// crowd its own body text while its neighbours sit loose.
T(s, head, { x, y: stY + 82,  w: stW, h: 32 * 1.3 * 2, size: 32, ... });
T(s, body, { x, y: stY + 136, w: stW, h: 24 * 1.55 * 3, size: 24, ... });
```

Both the "wrapping title collides with body" and "one column looks cramped next
to three loose ones" defects come from sizing a shared row off one item.

## Let content-sized things measure themselves

Anything that is `width:auto` or a flex row of content-width cells in CSS must
be measured in the generator. Handing it a fixed column width is what makes a
long value wrap and shove the row out of alignment.

```js
meta.forEach(([k, v]) => {
  const w = Math.max(wpx(k, 23), wpx(v, 26)) * 1.12;   // measured, not assumed
  T(s, k, { x: mx, y: 866, w, h: 28, size: 23, wrap: false }, rev(5));
  T(s, v, { x: mx, y: 900, w, h: 32, size: 26, wrap: false }, rev(5));
  mx += w + 56;                                        // CSS gutter
});
```

`wrap: false` is the safety net: it forces a layout bug to show as overflow you
can see, instead of a silent extra line that shifts everything below.

## When text does not fit

In priority order:

1. **Rewrite the copy.** Usually correct — a slide line that overflows is
   normally too long to read aloud anyway.
2. **Rebalance the break.** Move the explicit `\n` so the wrap lands somewhere
   sensible.
3. **Give the block another line** and push what follows down.
4. **Step the size down**, and say why:

   ```js
   // --h1-size is 168px, but the authored second line measures ~1800px against
   // a 1680px column, so at full size it wraps to a third line and collides
   // with the accent rule. 150px keeps the intended two-line composition.
   const H1 = 150;
   ```

Do not silently diverge from the CSS. If the generator has to deviate, the
comment explaining why is what stops the next person from "fixing" it back.

## Adding a slide

1. Add the `<section class="slide">` with `.reveal .rN` classes and
   `.slide-notes`.
2. Add a matching block in the generator, and bump `TOTAL` — it drives the page
   numbers and the progress bar.
3. Reuse the primitives. Only reach for a bespoke shape when no helper fits, and
   if you use it twice, promote it to a helper.
4. Give every added shape a manifest entry, or the injector will refuse to run.
   That mismatch check is what keeps animations from going missing.

## Removing or reordering

`TOTAL`, the page numbers, and the progress bar all follow slide order, so keep
them in step. The journey markers in `topbar()` come from each slide's
`data-stage`; update those too or the chrome will point at the wrong phase.

## After any layout change

Re-render and inspect — see [qa.md](qa.md). Specifically re-check:

- the slide you changed
- anything sharing a row or baseline with it
- the slide after it, if you touched `TOTAL` or the progress bar

## Let the content pick the layout

The failure mode is not ugliness, it is sameness: a deck where three unrelated
slides use the same construct because that construct already existed. The
reader stops seeing structure and starts skimming. Before reusing a layout, ask
what shape the content actually is.

| The content is | Use | Not |
| --- | --- | --- |
| A path with several hops | horizontal `flow()` | a list with arrows in it |
| A path of two or three hops, next to other content | vertical `vflow()` | a second horizontal flow |
| A set of many short items, grouped | two-column `catalog()` | a chip cloud that mimics a pipeline |
| One state becoming another | `changes()` | a table |
| Values you look up and scan | `limits()` table with a header row | before/after rows |
| Items where the count matters | numbered `caps()` | undifferentiated chips |
| Two or three peers compared | `blocks()` / `reflect()` | stacked rows |

Two symptoms that you picked by habit rather than by content:

- **A label and a row of chips standing in for a flow.** If nothing actually
  flows, the arrows are decoration and the slide reads like the real flow slide
  elsewhere in the deck.
- **`changes()` where nothing changes.** `from → to` is a claim about
  transformation. For a list of ceilings, a table is both honest and easier to
  scan.

Audit for repeats before shipping: list the top-level construct of every slide
and look for the same one appearing three times. Varying the layout is not
decoration — a different shape is how the reader knows they are being told a
different kind of thing.

Changing a layout changes how much vertical room the body needs. Re-check the
headline gap and the bottom margin, then re-render; a taller construct is the
usual cause of content sliding under the progress bar.
