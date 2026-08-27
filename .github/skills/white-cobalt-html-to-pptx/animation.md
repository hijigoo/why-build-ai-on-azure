# Phase 3 — Animation

**pptxgenjs writes no animation at all.** Without this phase the deck ports as
static slides and every reveal is silently lost. This is where the CSS reveals
become real PowerPoint entrance effects, with the same motion, durations, and
stagger so the PPTX presents like the HTML deck.

## The mapping

CSS `.reveal` is one declaration; PowerPoint needs two effects. Keep the values
identical — this is what makes both formats feel like the same deck.

| CSS | PowerPoint |
| --- | --- |
| `opacity: 0 → 1` | entrance effect, `filter="fade"` |
| `transform: translateY(30px) → 0` | separate motion-path effect (`presetClass="path"`) |
| `transition: 0.7s` | `dur="700"` on both |
| `.r1 { transition-delay: 0.08s }` | `<p:cond delay="80"/>` on that shape's effects |
| runs on `.slide.visible` | auto-starts on slide entry, no click |
| `scaleX(0) → 1` wipe | `presetID="22" presetSubtype="8"` + `filter="wipe(left)"` |

The shipped template profile:

| motion | duration | stagger (r1..r6) |
| --- | --- | --- |
| `translateY(30px)` | 700 ms | 80 / 200 / 320 / 440 / 560 / 680 ms |

Offsets are expressed as a **fraction of the stage**, not pixels —
`30 / 1080 = 0.02778`. A horizontal profile works the same way with
`axis: "x"` and `40 / 1920 = 0.02083`.

## How the generator talks to the injector

pptxgenjs has no animation API. The generator records, per shape in the order
shapes are added, what that shape should do. Shape ids in a pptxgenjs slide are
assigned sequentially from 2 in the same order, so a manifest index maps
straight onto `<p:cNvPr id>`.

```js
const DUR = 700;
const OFF_Y = 30 / 1080;
const R = [0, 80, 200, 320, 440, 560, 680];        // r1..r6

const rev  = (n)          => ({ d: R[n], dur: DUR, fx: "fade", axis: "y", off: OFF_Y });
const wipe = (delay, dur) => ({ d: delay, dur, fx: "wipe" });

tier(rev(2));            // this shape animates as .reveal.r2
tier(wipe(850, 700));    // this shape wipes in at 850ms
tier(0);                 // no animation (decoration, chrome)
```

Manifest entries, one per shape, in document order:

- `0` — no animation
- `{ d, dur, fx: "fade"|"wipe", axis: "x"|"y", off }` — explicit

The injector fails loudly if the shape count and manifest length disagree, which
catches a shape added without a matching `tier()` call.

## The dialect PowerPoint accepts

Derived by diffing against `<p:timing>` blocks from real PowerPoint-authored
files, then confirmed by opening the result in PowerPoint. Do not "improve" it.

**A fade entrance is one `<p:par>`:**

```xml
<p:par><p:cTn id="5" presetID="10" presetClass="entr" presetSubtype="0"
              fill="hold" nodeType="withEffect">
  <p:stCondLst><p:cond delay="80"/></p:stCondLst>
  <p:childTnLst>
    <!-- without this the shape is already painted and there is nothing to reveal -->
    <p:set>...<p:attrName>style.visibility</p:attrName>...<p:strVal val="visible"/></p:set>
    <p:animEffect transition="in" filter="fade">
      <p:cBhvr><p:cTn id="7" dur="700"/><p:tgtEl><p:spTgt spid="2"/></p:tgtEl></p:cBhvr>
    </p:animEffect>
  </p:childTnLst>
</p:cTn></p:par>
```

**The translate is a second, separate `<p:par>`** sharing the same delay:

```xml
<p:par><p:cTn id="8" presetID="42" presetClass="path" presetSubtype="0"
              decel="100000" fill="hold" nodeType="withEffect">
  <p:stCondLst><p:cond delay="80"/></p:stCondLst>
  <p:childTnLst>
    <p:animMotion origin="layout" path="M 0.00000 0.02778 L 0 0 "
                  pathEditMode="relative" rAng="0" ptsTypes="AA">
      <p:cBhvr><p:cTn id="9" dur="700" fill="hold"/>
        <p:tgtEl><p:spTgt spid="2"/></p:tgtEl>
        <p:attrNameLst><p:attrName>ppt_x</p:attrName>
                       <p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr>
      <p:rCtr x="0" y="-1389"/>
    </p:animMotion>
  </p:childTnLst>
</p:cTn></p:par>
```

`rCtr` is the path midpoint in 1/100000 units: `round(-offset / 2 * 100000)`.

### Things that look reasonable and are wrong

| Wrong | Right | Why |
| --- | --- | --- |
| `grpId="0"` | omit it | Only valid paired with a `<p:bldP>` build entry. 238 of 451 effects in reference files omit it entirely. |
| `<p:anim>` with `val="#ppt_y+0.02778"` | `<p:animMotion>` relative path | PowerPoint writes motion paths, not attribute formulas. |
| `filter="wipe(right)"` for a left-anchored wipe | `presetSubtype="8"` + `filter="wipe(left)"` | The pairing is fixed. |
| one wrapper `<p:par>` per distinct delay | one click group, delay on each effect | Matches how PowerPoint groups "with previous". |
| `<p:nextCondLst>` inside the click `<p:par>` | only on the enclosing `<p:seq>` | `CT_TLTimeNodeParallel` allows a `cTn` and nothing else. |

### Auto-start

Everything sits in a single click group whose `<p:cond>` fires on slide entry,
mirroring CSS transitions that run on `.slide.visible`:

```xml
<p:cTn id="3" fill="hold"><p:stCondLst>
  <p:cond delay="indefinite"/>
  <p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>
</p:stCondLst>
```

## Running it

```bash
python3 build/add_animations.py deck.pptx build/anim-manifest.json
python3 build/add_animations.py --no-anim deck.pptx build/anim-manifest.json
```

`--no-anim` applies only the OOXML corrections and skips the timing block. Keep
it working — if animations ever have to be dropped under time pressure, it is
the escape hatch that still produces a usable deck.

The injector also repairs a pptxgenjs defect while it is in there: `<a:pPr>`
repeated before every run of a multi-run paragraph, where `CT_TextParagraph`
allows a single leading one. The copies are byte-identical, so removing them
changes nothing visually.

It deliberately does **not** touch `ppt/presentation.xml`. See the
non-negotiables in [SKILL.md](SKILL.md).

## Confirming the animations survived

Counting effects in PowerPoint is the proof, not the absence of an error dialog:

```bash
scripts/ppt_open_test.sh deck.pptx
# OK slides=11 effects=616
```

A fade+motion pair is 2 effects per shape, a wipe is 1. So 307 revealed shapes
plus 2 wipes reads as `616`. If the number is far lower, PowerPoint silently
dropped effects and the XML needs another look.
