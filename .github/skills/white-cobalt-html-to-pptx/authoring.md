# Phase 1 — Authoring the HTML deck

Start here. The HTML deck is the source of truth; the PPTX is a port of it.

**If the deck was built with `white-cobalt-md-to-html`, skip this file.** Its
output already satisfies everything below — same stage contract, same tokens,
same `.reveal` classes, same `.slide-notes`. Go straight to
[porting.md](porting.md).

Otherwise start from `templates/deck.html`, which already contains the stage,
the controller, presenter notes, and inline editing.

## The fixed stage

Every slide is 1920×1080 and the whole stage is scaled to the viewport by JS.
**Never reflow slide content per device** — if the layout can move, the PPTX
port has no single geometry to copy.

```css
.deck-stage { position:absolute; width:1920px; height:1080px; transform-origin:0 0; }
.slide      { position:absolute; inset:0; width:1920px; height:1080px; }
```

```js
const factor = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
stage.style.transform = `translate(${x}px, ${y}px) scale(${factor})`;
```

## Design tokens

Put every color, size, and spacing value in `:root`. The generator will
transcribe these, so a token that only exists inline is a token that gets
mistranslated.

The White Cobalt palette:

```css
:root{
    --paper:#FFFFFF;  --accent:#0F62FE;  --ink:#0E0E0E;  --ink-soft:#6B6B6B;
    --accent-tint:#EDF5FF;  --panel:#F5F4F1;  --rule:#E7E7E7;
    --h1-size:168px; --h2-size:70px; --body-size:30px;  /* authored at stage scale */
    --pad-x:120px; --pad-y:92px;
}
```

Each of these has a twin in `templates/make_deck.js` — `ACCENT = "0F62FE"`,
`INK = "0E0E0E"`, and so on. Change them together or the two formats drift.

`white-cobalt-md-to-html/design.md` is the full reference for this system: the
type scale, the accent discipline, and the Korean typography rules.

Two things to decide now, because they are expensive to change later:

**Sizes at stage scale.** Author `--h2-size:70px`, not `clamp()`. A responsive
scale has no single value to port.

**Translucency.** `rgba()` over the background reads fine in a browser but is a
liability in PPTX. Note the flattened hex next to each token as you go:

```css
--accent-tint:#EDF5FF;   /* already flat — prefer this over rgba() */
--faded-ink:rgba(14,14,14,0.42);   /* → #999999 over #FFFFFF */
```

White Cobalt avoids translucency almost entirely for this reason. The one place
it appears is `.col-faded { opacity:0.42 }`, which the generator emits as
pre-flattened grey rather than as alpha.

## Fonts

Pick web fonts freely, but record the Office-safe fallback in the same
declaration. Korean decks should fall back to `맑은 고딕`, which is what the
generator will emit.

```css
--font-display:'Space Grotesk','IBM Plex Sans KR',sans-serif;
```

CJK-specific reminders: drop `text-transform:uppercase` and wide `letter-spacing`
on Korean runs (both damage CJK), keep `word-break:keep-all`, and loosen
`line-height` relative to the Latin spec.

## Reveal classes

Tag anything that should animate. The tier is what the generator records.

```html
<div class="head-line reveal r1">…</div>
<div class="cell reveal r2">…</div>
```

```css
.reveal{opacity:0;transform:translateY(30px);
        transition:opacity 0.7s var(--ease), transform 0.7s var(--ease);}
.slide.visible .reveal{opacity:1;transform:translateY(0);}
.slide.visible .r1{transition-delay:0.08s;}
.slide.visible .r2{transition-delay:0.20s;}
/* … r3–r6 */
```

Keep the tiers to a shallow ladder. Six is plenty; past that the audience is
waiting on the slide rather than listening.

## Presenter notes

One `.slide-notes` div per slide, hidden by CSS, surfaced by the `N` key. The
generator copies these straight into PPTX speaker notes, so they survive the
port for free.

```html
<div class="slide-notes">[0:50–2:00]
처음 들어온 요청은 …</div>
```

## Checklist before porting

- [ ] Every slide is exactly 1920×1080, nothing reflows
- [ ] All colors, sizes, spacing live in `:root`
- [ ] Translucent tokens have a flattened hex noted
- [ ] Web fonts have an Office-safe fallback
- [ ] Animated blocks carry `.reveal .rN`
- [ ] Every slide has `.slide-notes`
- [ ] Deck opens and navigates correctly in a browser

Then go to [porting.md](porting.md).
