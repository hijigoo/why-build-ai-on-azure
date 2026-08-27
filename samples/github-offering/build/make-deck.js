/**
 * GitHub Copilot Offering — 1:1 port of github/copilot-offering-v29.html to PPTX.
 *
 * Blue Accent design system: white paper ground, one cobalt accent, square
 * corners, hairline rules, ruled top chrome bar, large type scale.
 *
 * Stage coordinates are kept identical to the HTML so every number here can be
 * diffed straight against the CSS:
 *
 *     1920 px  ->  13.333 in   (144 px per inch)
 *     1 px     ->  0.5 pt      (font sizes)
 *
 * Speaker notes are read out of the HTML's .slide-notes blocks at build time
 * rather than retyped here. The notes are long and get edited often; copying
 * them by hand is how the two formats silently drift apart.
 *
 * Usage:
 *   NODE_PATH=$(npm root -g) node build/make_offering_v29.js
 *   python3 build/fix_notes.py github/copilot-offering.pptx
 *   python3 build/add_animations.py github/copilot-offering.pptx build/anim-manifest.json
 */

const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

// ------------------------------------------------------------- geometry ----
const PXI = 144;
const px = (v) => v / PXI;
const pt = (v) => v / 2;
const lh = (size, ratio) => (size * ratio) / 2;

const STAGE_W = 1920;
const STAGE_H = 1080;
const PAD_X = 120; // --pad-x
const PAD_Y = 92; // --pad-y
const CW = STAGE_W - PAD_X * 2; // 1680
const RIGHT = STAGE_W - PAD_X; // 1800

const BAR_ROW = 34;
const BAR_RULE_Y = PAD_Y + BAR_ROW + 26;

// Top chrome geometry, measured off the rendered HTML so the marker row and
// page number land in the same place in both formats.
const PAGE_W = 110; // "NN / 21" at 30px — sized for Segoe UI, which PowerPoint uses
const CHROME_GAP = 34; // .chrome { gap: 34px }
const DOT = 32; // .stages i
const DOT_GAP = 8; // .stages { gap: 8px }
// Renderer metrics run wider than our estimate; pad measurements by this.
const SAFETY = 1.04;

// --------------------------------------------------------------- palette ----
const PAPER = "FFFFFF";
const PANEL = "F5F4F1";
const INK = "0E0E0E";
const INK_SOFT = "6B6B6B";
const INK_FAINT = "AFAFAF";
const ACCENT = "0F62FE";
const ACCENT_TINT = "EDF5FF";
const RULE = "E7E7E7";

const SANS = process.env.DECK_SANS || "맑은 고딕";
const LATIN = process.env.DECK_LATIN || "Segoe UI";

const ROOT = path.resolve(__dirname, "..");
const HTML = process.env.DECK_HTML || path.join(ROOT, "copilot-offering.html");
const OUT = process.env.DECK_OUT || path.join(ROOT, "copilot-offering.pptx");
const TOTAL = 21;

// ------------------------------------------------- notes from the source ----
/** Pull every .slide-notes block out of the HTML, in slide order. */
function readNotes() {
  const html = fs.readFileSync(HTML, "utf8");
  const out = [];
  const re = /<div class="slide-notes">([\s\S]*?)<\/div>/g;
  let m;
  while ((m = re.exec(html))) {
    out.push(
      m[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .trim()
    );
  }
  return out;
}
const NOTES = readNotes();
if (NOTES.length !== TOTAL) {
  throw new Error(`expected ${TOTAL} .slide-notes blocks in the HTML, found ${NOTES.length}`);
}

// pptxgenjs 4.x silently discards the whole note if the string contains a
// newline — the notes page comes out blank with nothing in the build log. Swap
// newlines for a sentinel here and let build/fix_notes.py turn them into real
// <a:br/> after the file is written.
const NOTE_BR = "\u2424";
const notes = (i) => NOTES[i].replace(/\n/g, NOTE_BR);

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "GitHub";
pres.title = "GitHub Copilot Offering";
pres.subject = "모델도 도구도 고정하지 않는 개발 플랫폼";

// ------------------------------------------------- animation bookkeeping ----
const DUR = 700;
const OFF_Y = 30 / STAGE_H;
const R = [0, 80, 200, 320, 440, 560, 680];
const rev = (n) => ({ d: R[n], dur: DUR, fx: "fade", axis: "y", off: OFF_Y });
const wipe = (delay, dur) => ({ d: delay, dur, fx: "wipe" });

const manifest = [];
let anim = null;
let pageNo = 0;

function slide() {
  const s = pres.addSlide();
  s.background = { color: PAPER };
  anim = [];
  manifest.push(anim);
  pageNo += 1;
  return s;
}

function tier(r) {
  anim.push(r || 0);
}

const NONE = { type: "none" };

let dry = false;
/** Run a draw helper for its height only, emitting nothing. */
function measure(fn) {
  dry = true;
  try {
    return fn();
  } finally {
    dry = false;
  }
}

/**
 * .body is `flex:1; justify-content:center` in the CSS, so slide content is
 * centred between the topbar rule and the bottom padding rather than starting
 * at a fixed offset. Mirroring that here removes the small vertical drift
 * between the HTML and the PPTX.
 */
const BODY_TOP2 = BAR_RULE_Y + 2 + 56;
const BODY_BOTTOM = STAGE_H - PAD_Y;
/**
 * Shift everything drawn since `from` so the block sits centred in the body
 * area, matching the CSS. Measuring the drawn objects rather than re-deriving
 * heights keeps one source of truth: whatever the helpers actually emitted is
 * what gets centred, so the two never disagree.
 */
function centreBody(s, from) {
  const objs = s._slideObjects.slice(from);
  if (!objs.length) return;
  let top = Infinity,
    bot = -Infinity;
  for (const o of objs) {
    const y = o.options.y * PXI;
    const h = (o.options.h || 0) * PXI;
    if (y < top) top = y;
    if (y + h > bot) bot = y + h;
  }
  const off = BODY_TOP2 + (BODY_BOTTOM - BODY_TOP2 - (bot - top)) / 2 - top;
  for (const o of objs) o.options.y += off / PXI;
}

function centerY(contentH) {
  return Math.round(BODY_TOP2 + Math.max(0, (BODY_BOTTOM - BODY_TOP2 - contentH) / 2));
}

function box(s, type, opts, r) {
  if (dry) return;
  s.addShape(type, { line: NONE, ...opts });
  tier(r);
}

function rect(s, o, r) {
  box(s, pres.ShapeType.rect, o, r);
}

/**
 * DECK_AUDIT=1 records every text run with its box so a separate pass can check
 * that it fits. Rendering through LibreOffice cannot answer this: the Korean
 * face PowerPoint uses is usually absent on the build machine, so the render
 * silently substitutes a narrower font and hides exactly the overflow we are
 * looking for.
 */
const AUDIT = process.env.DECK_AUDIT === "1";
const audited = [];

function txt(s, body, o, r) {
  if (dry) return;
  if (AUDIT) {
    const text = typeof body === "string" ? body : body.map((t) => t.text).join("");
    audited.push({
      slide: pageNo,
      text,
      x: +(o.x * PXI).toFixed(1),
      y: +(o.y * PXI).toFixed(1),
      w: +(o.w * PXI).toFixed(1),
      h: +(o.h * PXI).toFixed(1),
      size: o.fontSize * 2,
      wrap: o.wrap !== false,
      ratio: o.lineSpacing ? o.lineSpacing / (o.fontSize * 2) / 0.5 : 1,
    });
  }
  s.addText(body, { fontFace: SANS, margin: 0, valign: "top", isTextBox: true, ...o });
  tier(r);
}

function T(s, body, { x, y, w, h, size, color = INK, ratio = 1.4, ...rest }, r) {
  const o = { x: px(x), y: px(y), w: px(w), h: px(h), fontSize: pt(size), color, ...rest };
  if (ratio !== 1) o.lineSpacing = lh(size, ratio);
  txt(s, body, o, r);
}

// ------------------------------------------------------ text measurement ----
/**
 * Advance width in em, calibrated against the fonts these decks actually use
 * rather than guessed. The old numbers ran ~15% wide on Latin, which made the
 * title autofit shrink headings that would have fitted, so the PPTX drifted
 * visibly smaller than the HTML.
 *
 * Measured at 100px in the browser:
 *   맑은 고딕 / Malgun Gothic — Hangul 1.00, upper .611, lower .422, digit .50, space .356
 *   IBM Plex Sans KR (the web deck) — Hangul .892
 * The Hangul gap is why a title that fills one line in HTML can still need a
 * step down here: PowerPoint's Korean face is ~12% wider and we cannot ship
 * the web font to the audience's Office.
 */
function em(str) {
  let e = 0;
  for (const ch of str) {
    const c = ch.codePointAt(0);
    if (
      (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0x3130 && c <= 0x318f) ||
      (c >= 0x4e00 && c <= 0x9fff) ||
      (c >= 0x3000 && c <= 0x303f) ||
      (c >= 0xff00 && c <= 0xffef)
    )
      e += 1;
    else if (ch === " ") e += 0.356;
    else if (c === 0x2014 || c === 0x2015) e += 1; // em dash is full width
    else if (/[A-Z]/.test(ch)) e += 0.611;
    else if (/[a-z]/.test(ch)) e += 0.422;
    else if (/[0-9]/.test(ch)) e += 0.5;
    else e += 0.42;
  }
  return e;
}
const wpx = (str, size) => em(str) * size;

// ------------------------------------------------------ shared fragments ----
function topbar(s, sec, { stages = [], page }) {
  const mid = PAD_Y + BAR_ROW / 2;
  rect(s, { x: px(PAD_X), y: px(mid - 10), w: px(20), h: px(20), fill: { color: ACCENT } }, rev(1));
  T(
    s,
    sec,
    { x: PAD_X + 36, y: PAD_Y, w: 1000, h: BAR_ROW, size: 26, bold: true, ratio: 1.2, valign: "middle", charSpacing: -0.2 },
    rev(1)
  );

  T(
    s,
    [
      { text: String(page).padStart(2, "0"), options: { bold: true } },
      { text: ` / ${TOTAL}`, options: { color: INK_FAINT } },
    ],
    {
      // PAGE_W is the width Archivo takes in the browser, but PowerPoint sets
      // this in Segoe UI, which runs wider and wrapped "02 / 21" onto a second
      // line. Give the box slack and forbid wrapping: right-aligned text still
      // ends exactly at RIGHT, so the layout matches while the run stays whole.
      x: RIGHT - PAGE_W,
      y: PAD_Y,
      w: PAGE_W,
      h: BAR_ROW,
      size: 30,
      fontFace: LATIN,
      ratio: 1.2,
      align: "right",
      valign: "middle",
      wrap: false,
      charSpacing: 0.3,
    },
    rev(1)
  );

  if (stages.length) {
    const x0 = RIGHT - PAGE_W - CHROME_GAP - (5 * DOT + 4 * DOT_GAP);
    [1, 2, 3, 4, 5].forEach((n, i) => {
      const on = stages.includes(n);
      const x = x0 + i * (DOT + DOT_GAP);
      box(
        s,
        pres.ShapeType.ellipse,
        {
          x: px(x),
          y: px(PAD_Y + 1),
          w: px(32),
          h: px(32),
          fill: on ? { color: ACCENT } : { type: "none" },
          line: { color: on ? ACCENT : RULE, width: 1.5 },
        },
        rev(1)
      );
      T(
        s,
        String(n),
        {
          x,
          y: PAD_Y + 1,
          w: 32,
          h: 32,
          size: 17,
          fontFace: LATIN,
          bold: true,
          color: on ? PAPER : INK_FAINT,
          ratio: 1,
          align: "center",
          valign: "middle",
        },
        rev(1)
      );
    });
  }

  rect(s, { x: px(PAD_X), y: px(BAR_RULE_Y), w: px(CW), h: px(2), fill: { color: INK } }, rev(1));
}

/**
 * Slide title. Every title in this deck is written to sit on one line, and the
 * subtitle underneath is positioned from the height returned here.
 *
 * PowerPoint's Korean metrics are wider than the browser's, so a title that
 * fits the HTML can wrap in the PPTX and drop its second line straight onto the
 * subtitle. Step the size down until it fits instead of letting it wrap: a
 * slightly smaller title reads as a design choice, two overlapping lines read
 * as a broken file. Returns the height actually used.
 */
/**
 * Largest size at or below `max` that keeps `text` on one line in `w`.
 *
 * Lines authored to sit on one line must stay on one line. PowerPoint's Korean
 * face is ~12% wider than the deck's web font, so a phrase that just fits in
 * the browser can spill a word onto a second row here — which then collides
 * with whatever sits below it. Stepping the size down keeps the shape of the
 * slide; letting it wrap does not.
 */
function fitOneLine(text, max, min, w) {
  let size = max;
  while (size > min && wpx(text, size) * SAFETY > w) size -= 1;
  return size;
}

const H2_MAX = 70;
const H2_MIN = 52;
function h2(s, y, runs, r, { w = CW } = {}) {
  const text = typeof runs === "string" ? runs : runs.map((t) => t.text).join("");
  const size = fitOneLine(text, H2_MAX, H2_MIN, w);
  const h = size * 1.24;
  T(s, runs, { x: PAD_X, y, w, h, size, bold: true, ratio: 1.24, charSpacing: -1 }, r);
  return h;
}

function subtitle(s, y, text, r) {
  T(s, text, { x: PAD_X, y, w: CW, h: 40, size: 32, color: INK_SOFT, ratio: 1.2, charSpacing: -0.2 }, r);
  return 40;
}

function label(s, x, y, w, text, r, color = INK_SOFT) {
  T(s, text, { x, y, w, h: 26.4, size: 22, bold: true, color, ratio: 1.2, charSpacing: 1.1 }, r);
}

function band(s, { x = PAD_X, y, w = CW, text, lines, muted }, r) {
  const flat = typeof text === "string" ? text : text.map((t) => t.text).join("");
  const textLines = lines || Math.max(1, Math.ceil((wpx(flat, 34) * SAFETY) / (w - 80)));
  const textH = 34 * 1.45 * textLines;
  const mutedLines = muted ? Math.max(1, Math.ceil((wpx(muted, 27) * SAFETY) / (w - 80))) : 0;
  const mutedH = muted ? 10 + 27 * 1.2 * mutedLines : 0;
  const h = 60 + textH + mutedH;
  rect(s, { x: px(x), y: px(y), w: px(w), h: px(h), fill: { color: ACCENT_TINT } }, r);
  rect(s, { x: px(x), y: px(y), w: px(10), h: px(h), fill: { color: ACCENT } }, r);
  T(s, text, { x: x + 40, y: y + 30, w: w - 80, h: textH, size: 34, bold: true, ratio: 1.45, charSpacing: -0.2 }, r);
  if (muted)
    T(s, muted, { x: x + 40, y: y + 30 + textH + 10, w: w - 80, h: 27 * 1.2 * mutedLines, size: 27, color: INK_SOFT, ratio: 1.2 }, r);
  return h;
}

function flow(s, steps, { x, y, size = 25, padX = 24, padY = 18, gap = 18 }, r) {
  const h = size * 1.2 + padY * 2;
  let cx = x;
  steps.forEach((step, i) => {
    const t = typeof step === "string" ? step : step.t;
    const soft = typeof step === "object" && step.soft;
    const w = wpx(t, size) + padX * 2;
    rect(
      s,
      {
        x: px(cx),
        y: px(y),
        w: px(w),
        h: px(h),
        fill: soft ? { color: ACCENT_TINT } : { color: PAPER },
        line: { color: soft ? ACCENT : INK, width: 1.5 },
      },
      r
    );
    T(s, t, { x: cx, y, w, h, size, bold: true, color: soft ? ACCENT : INK, ratio: 1, align: "center", valign: "middle" }, r);
    cx += w;
    if (i < steps.length - 1) {
      T(
        s,
        "→",
        { x: cx + gap, y, w: 30, h, size: 26, fontFace: LATIN, bold: true, color: ACCENT, ratio: 1, align: "center", valign: "middle" },
        r
      );
      cx += gap + 30 + gap;
    }
  });
  return h;
}

function pills(s, items, { x, y, size = 24, padX = 22, padY = 13, gap = 12 }, r) {
  const h = size * 1.2 + padY * 2;
  let cx = x;
  items.forEach((t) => {
    const w = wpx(t, size) + padX * 2;
    rect(s, { x: px(cx), y: px(y), w: px(w), h: px(h), fill: { color: ACCENT_TINT } }, r);
    T(s, t, { x: cx, y, w, h, size, color: ACCENT, ratio: 1, align: "center", valign: "middle" }, r);
    cx += w + gap;
  });
  return h;
}

function chips(s, items, { x, y, w, size = 24, padX = 20, padY = 12, gap = 12 }, r) {
  const h = size * 1.2 + padY * 2;
  let cx = x,
    cy = y,
    rows = 1;
  items.forEach((t) => {
    const cw = wpx(t, size) + padX * 2;
    if (cx > x && cx + cw > x + w) {
      cx = x;
      cy += h + gap;
      rows += 1;
    }
    rect(s, { x: px(cx), y: px(cy), w: px(cw), h: px(h), fill: { color: PANEL } }, r);
    T(s, t, { x: cx, y: cy, w: cw, h, size, color: INK_SOFT, ratio: 1, align: "center", valign: "middle" }, r);
    cx += cw + gap;
  });
  return rows * h + (rows - 1) * gap;
}

/**
 * .steps — 4-up cards under a 6px top rule. `hot` lights the rule and numeral
 * in accent; everything else stays grey, which is what makes the highlight
 * mean something.
 *
 * Title and description heights are measured across the whole row and applied
 * uniformly. Sizing each card independently lets a two-line title in one
 * column push its description below its neighbours', and the ragged baselines
 * read as a layout bug from the back of the room.
 */
function steps4(s, y, items, r) {
  const gap = 26;
  const w = (CW - gap * 3) / 4;
  const titleH = 32 * 1.24 * Math.max(...items.map((it) => Math.ceil(wpx(it.title, 32) / w)));
  const descH = 24 * 1.55 * Math.max(...items.map((it) => Math.ceil(wpx(it.desc, 24) / w)));
  const durY = 6 + 24 + 40 + 10 + titleH + 12 + descH + 14;

  items.forEach((it, i) => {
    const x = PAD_X + i * (w + gap);
    rect(s, { x: px(x), y: px(y), w: px(w), h: px(6), fill: { color: it.hot ? ACCENT : RULE } }, r);
    T(
      s,
      it.n,
      { x, y: y + 30, w, h: 40, size: 34, fontFace: LATIN, bold: true, color: it.hot ? ACCENT : INK_FAINT, ratio: 1 },
      r
    );
    T(s, it.title, { x, y: y + 80, w, h: titleH, size: 32, bold: true, ratio: 1.24, charSpacing: -0.6 }, r);
    T(s, it.desc, { x, y: y + 80 + titleH + 12, w, h: descH, size: 24, color: INK_SOFT, ratio: 1.55 }, r);
    if (it.dur) T(s, it.dur, { x, y: y + durY, w, h: 26, size: 21, color: INK_FAINT, ratio: 1.2 }, r);
  });
  return durY + (items.some((it) => it.dur) ? 26 : 0);
}

/** .acc-list — numbered rows separated by hairlines. */
function accList(s, x, y, w, items, r) {
  let cy = y;
  items.forEach((it, i) => {
    T(s, it.n, { x, y: cy + 4, w: 46, h: 30, size: 24, fontFace: LATIN, bold: true, color: ACCENT, ratio: 1.2 }, r);
    const tx = x + 46;
    const tw = w - 46;
    T(s, it.title, { x: tx, y: cy, w: tw, h: 38, size: 30, bold: true, ratio: 1.2, charSpacing: -0.3 }, r);
    const lines = Math.ceil(wpx(it.desc, 23) / tw);
    const dh = 23 * 1.5 * lines;
    T(s, it.desc, { x: tx, y: cy + 38 + 6, w: tw, h: dh, size: 23, color: INK_SOFT, ratio: 1.5 }, r);
    cy += 38 + 6 + dh + 16;
    if (i < items.length - 1) {
      rect(s, { x: px(x), y: px(cy), w: px(w), h: px(1), fill: { color: RULE } }, r);
      cy += 18;
    }
  });
  return cy - y;
}

/**
 * .acc-box — the one claim worth boxing, in a 3px accent border.
 *
 * Both lines are measured rather than assumed. A fixed two-line reservation
 * either leaves a hole under a one-line claim or, worse, lets a long sub run
 * past the border — and a box whose text escapes it reads as broken, not busy.
 * SAFETY pads the estimate because the renderer's metrics are wider than ours.
 */
function accBox(s, x, y, w, runs, sub, r) {
  const inner = w - 72;
  const leadText = typeof runs === "string" ? runs : runs.map((t) => t.text).join("");
  const lead = 31 * 1.5 * Math.max(1, Math.ceil((wpx(leadText, 31) * SAFETY) / inner));
  const subH = sub ? 14 + 25 * 1.5 * Math.ceil((wpx(sub, 25) * SAFETY) / inner) : 0;
  const h = 68 + lead + subH;
  box(s, pres.ShapeType.rect, { x: px(x), y: px(y), w: px(w), h: px(h), fill: { type: "none" }, line: { color: ACCENT, width: 2.25 } }, r);
  T(s, runs, { x: x + 36, y: y + 34, w: w - 72, h: lead, size: 31, bold: false, ratio: 1.5, charSpacing: -0.3 }, r);
  if (sub) T(s, sub, { x: x + 36, y: y + 34 + lead + 14, w: w - 72, h: subH, size: 25, color: INK_SOFT, ratio: 1.5 }, r);
  return h;
}

/**
 * .changes — a hairline-separated row grid. `cols` are stage-pixel widths and
 * each cell carries its own style, so one helper covers the three different
 * column layouts the deck uses.
 */
function rowGrid(s, { y, cols, rows, gap = 20, padY = 20 }, r) {
  let cy = y;
  rows.forEach((row, ri) => {
    let rowH = 0;
    let cx = PAD_X;
    row.forEach((cell, ci) => {
      const w = cols[ci];
      if (cell) {
        const size = cell.size || 25;
        const lines = Math.ceil(wpx(typeof cell.t === "string" ? cell.t : cell.t.map((x) => x.text).join(""), size) / w);
        rowH = Math.max(rowH, size * 1.42 * lines);
      }
      cx += w + gap;
    });
    cx = PAD_X;
    row.forEach((cell, ci) => {
      const w = cols[ci];
      if (cell) {
        const size = cell.size || 25;
        T(
          s,
          cell.t,
          {
            x: cx,
            y: cy + padY,
            w,
            h: rowH,
            size,
            bold: !!cell.bold,
            color: cell.color || INK,
            ratio: 1.42,
            align: cell.align || "left",
            charSpacing: cell.bold ? -0.3 : 0,
          },
          r
        );
      }
      cx += w + gap;
    });
    cy += padY * 2 + rowH;
    if (ri < rows.length - 1) {
      rect(s, { x: px(PAD_X), y: px(cy), w: px(CW), h: px(1), fill: { color: RULE } }, r);
      cy += 1;
    }
  });
  return cy - y;
}

/**
 * Tool profile — who uses it, what for, and the one thing only this tool does.
 * `also` items are feature parity with competing tools, so they render small
 * and grey under a rule: reference material, not an argument.
 */
function toolProfile(s, { y, icon, who, whoList, edges, alsoLabel, also }) {
  const LW = (CW - 70) / 2.32;
  const RX = PAD_X + LW + 70;
  const RW = CW - LW - 70;

  // Icon: drawn from primitives so the deck carries no third-party brand mark.
  icon(PAD_X, y);

  let ly = y + 84 + 26;
  label(s, PAD_X, ly, LW, "주 사용자", rev(3));
  ly += 40;
  const whoSize = fitOneLine(who, 38, 30, LW);
  const whoH = whoSize * 1.34;
  T(s, who, { x: PAD_X, y: ly, w: LW, h: whoH, size: whoSize, bold: true, ratio: 1.34, charSpacing: -0.6 }, rev(3));
  ly += whoH + 22;
  whoList.forEach((t) => {
    rect(s, { x: px(PAD_X), y: px(ly + 13), w: px(8), h: px(8), fill: { color: INK_FAINT } }, rev(3));
    const h = 24 * 1.5 * Math.ceil(wpx(t, 24) / (LW - 24));
    T(s, t, { x: PAD_X + 24, y: ly, w: LW - 24, h, size: 24, color: INK_SOFT, ratio: 1.5 }, rev(3));
    ly += h + 10;
  });

  label(s, RX, y, RW, alsoLabel ? "이 도구만의 것" : "이 도구만의 것", rev(4), ACCENT);
  let ry = y + 40;
  edges.forEach((e) => {
    const bH = 31 * 1.36 * Math.ceil(wpx(e.b, 31) / (RW - 72));
    const pH = 24 * 1.5 * Math.ceil(wpx(e.p, 24) / (RW - 72));
    const h = 52 + bH + 10 + pH;
    rect(s, { x: px(RX), y: px(ry), w: px(RW), h: px(h), fill: { color: ACCENT_TINT } }, rev(4));
    rect(s, { x: px(RX), y: px(ry), w: px(8), h: px(h), fill: { color: ACCENT } }, rev(4));
    T(s, e.b, { x: RX + 32, y: ry + 26, w: RW - 72, h: bH, size: 31, bold: true, ratio: 1.36, charSpacing: -0.6 }, rev(4));
    T(s, e.p, { x: RX + 32, y: ry + 26 + bH + 10, w: RW - 72, h: pH, size: 24, color: INK_SOFT, ratio: 1.5 }, rev(4));
    ry += h + 22;
  });

  const ay = Math.max(ly, ry) + 14;
  rect(s, { x: px(PAD_X), y: px(ay), w: px(CW), h: px(1), fill: { color: RULE } }, rev(5));
  // Box sized to the label, not a round number: an oversized transparent box
  // reaches under the chips that follow it.
  const alsoW = wpx(alsoLabel, 21) * SAFETY;
  T(s, alsoLabel, { x: PAD_X, y: ay + 26, w: alsoW, h: 26, size: 21, color: INK_FAINT, ratio: 1.2, wrap: false }, rev(5));
  let cx = PAD_X + alsoW + 30;
  also.forEach((t) => {
    const w = wpx(t, 21) + 36;
    rect(s, { x: px(cx), y: px(ay + 20), w: px(w), h: px(39), fill: { color: PANEL } }, rev(5));
    T(s, t, { x: cx, y: ay + 20, w, h: 39, size: 21, color: INK_FAINT, ratio: 1, align: "center", valign: "middle" }, rev(5));
    cx += w + 12;
  });
}

/** Hub and spoke: one core, six call sites. A list would read as six products. */
function hub(s, { y, h, core, sub, where, left, right }) {
  const colW = 520;
  const coreW = 474;
  const coreX = (STAGE_W - coreW) / 2;
  const mid = y + h / 2;

  rect(s, { x: px(PAD_X), y: px(mid - 1), w: px(CW), h: px(2), fill: { color: RULE } }, rev(3));

  const nodeH = (h - 44) / 3;
  const draw = (items, x) =>
    items.forEach((n, i) => {
      const ny = y + i * (nodeH + 22);
      rect(s, { x: px(x), y: px(ny), w: px(colW), h: px(nodeH), fill: { color: PANEL } }, rev(3));
      T(s, n.b, { x: x + 26, y: ny + 20, w: colW - 52, h: 34, size: 27, bold: true, ratio: 1.2, charSpacing: -0.5 }, rev(3));
      T(s, n.s, { x: x + 26, y: ny + 58, w: colW - 52, h: 28, size: 21, color: INK_SOFT, ratio: 1.2 }, rev(3));
    });
  draw(left, PAD_X);
  draw(right, RIGHT - colW);

  // The core box answers "where is this managed" as well as "what is managed",
  // because that is the first thing a platform team asks back.
  const coreH = where ? 200 : 130;
  const coreY = mid - coreH / 2;
  box(
    s,
    pres.ShapeType.rect,
    { x: px(coreX), y: px(coreY), w: px(coreW), h: px(coreH), fill: { color: PAPER }, line: { color: ACCENT, width: 2.25 } },
    rev(3)
  );
  T(s, core, { x: coreX, y: coreY + 30, w: coreW, h: 40, size: 32, bold: true, ratio: 1.2, align: "center", charSpacing: -0.6 }, rev(3));
  T(s, sub, { x: coreX, y: coreY + 76, w: coreW, h: 28, size: 22, color: INK_SOFT, ratio: 1.2, align: "center" }, rev(3));
  if (where) {
    rect(s, { x: px(coreX + 28), y: px(coreY + 126), w: px(coreW - 56), h: px(1), fill: { color: RULE } }, rev(3));
    T(s, where, { x: coreX, y: coreY + 146, w: coreW, h: 26, size: 18, bold: true, color: ACCENT, ratio: 1.2, align: "center", charSpacing: 0.2 }, rev(3));
  }
}

function progress(s, idx) {
  rect(s, { x: 0, y: px(STAGE_H - 6), w: (STAGE_W * (idx / TOTAL)) / PXI, h: px(6), fill: { color: ACCENT } });
}

/** Statement surfaces: a big centred-ish claim with a quiet attribution. */
function statement(s, { sec, stages, runs, attrib, size = 80, y = 360 }) {
  topbar(s, sec, { stages: stages || [], page: pageNo });
  const mark = s._slideObjects.length;
  const text = typeof runs === "string" ? runs : runs.map((t) => t.text).join("");
  // Statement slides are authored as two lines; reserve exactly that so the
  // centring below is not thrown off by an empty third line.
  const lines = Math.max(2, Math.ceil((wpx(text, size) * SAFETY) / CW));
  const bodyH = size * 1.42 * lines;
  T(s, runs, { x: PAD_X, y, w: CW, h: bodyH, size, bold: true, ratio: 1.42, charSpacing: -1.6 }, rev(2));
  if (attrib)
    T(s, attrib, { x: PAD_X, y: y + bodyH + 46, w: CW, h: 32, size: 26, color: INK_SOFT, ratio: 1.2, charSpacing: -0.2 }, rev(3));
  centreBody(s, mark);
}


/**
 * .split-head + .change.split — a header row over hairline-separated rows,
 * with a vertical rule before the last column. The rule is what keeps the
 * agent side from reading as a continuation of the feature name next to it.
 */
function splitTable(s, { y, cols, head, rows, gap = 20, padY = 15, ruleBefore }, r) {
  const HEAD_H = 22 * 1.2;
  let cx = PAD_X;
  head.forEach((c, i) => {
    T(
      s,
      c.t,
      { x: cx + (i === ruleBefore ? 34 : 0), y, w: cols[i], h: HEAD_H, size: 22, bold: true, color: c.color, ratio: 1.2, charSpacing: 1.1 },
      r
    );
    cx += cols[i] + gap;
  });
  let cy = y + HEAD_H + 14;
  rect(s, { x: px(PAD_X), y: px(cy), w: px(CW), h: px(2), fill: { color: INK } }, r);
  cy += 2;

  rows.forEach((row, ri) => {
    let rowH = 0;
    row.forEach((cell, ci) => {
      const size = cell.size || 25;
      const w = cols[ci] - (ci === ruleBefore ? 34 : 0);
      rowH = Math.max(rowH, size * 1.4 * Math.ceil(wpx(cell.t, size) / w));
    });
    const top = cy;
    cx = PAD_X;
    row.forEach((cell, ci) => {
      const size = cell.size || 25;
      const off = ci === ruleBefore ? 34 : 0;
      if (ci === ruleBefore) {
        rect(s, { x: px(cx), y: px(top + 6), w: px(1), h: px(rowH + padY * 2 - 12), fill: { color: RULE } }, r);
      }
      T(
        s,
        cell.t,
        {
          x: cx + off,
          y: top + padY,
          w: cols[ci] - off,
          h: rowH,
          size,
          bold: !!cell.bold,
          color: cell.color || INK,
          ratio: 1.4,
          charSpacing: cell.bold ? -0.4 : 0,
        },
        r
      );
      cx += cols[ci] + gap;
    });
    cy = top + padY * 2 + rowH;
    if (ri < rows.length - 1) {
      rect(s, { x: px(PAD_X), y: px(cy), w: px(CW), h: px(1), fill: { color: RULE } }, r);
      cy += 1;
    }
  });
  return cy - y;
}

/**
 * .consoles — two admin panels side by side, each with an accent header.
 * Filling both headers with accent is what says "same level, different
 * scope"; ranking them visually would imply the org panel is a lesser thing.
 */
function consoles(s, { y, panels }, r) {
  const gap = 40;
  const w = (CW - gap) / 2;
  const HEAD_H = 84;
  const rowH = 26 + 23 * 1.38;
  const h = HEAD_H + 4 + panels[0].rows.length * rowH + 12;

  panels.forEach((p, pi) => {
    const x = PAD_X + pi * (w + gap);
    box(s, pres.ShapeType.rect, { x: px(x), y: px(y), w: px(w), h: px(h), fill: { type: "none" }, line: { color: RULE, width: 1.5 } }, r);
    rect(s, { x: px(x), y: px(y), w: px(w), h: px(HEAD_H), fill: { color: ACCENT } }, r);
    T(s, p.title, { x: x + 24, y: y + 15, w: w - 48, h: 33, size: 27, bold: true, color: PAPER, ratio: 1.2, charSpacing: -0.5 }, r);
    T(s, p.sub, { x: x + 24, y: y + 52, w: w - 48, h: 26, size: 21, color: PAPER, ratio: 1.2, charSpacing: -0.2 }, r);

    let cy = y + HEAD_H + 4;
    p.rows.forEach((rw, ri) => {
      T(s, rw.b, { x: x + 24, y: cy + 13, w: 238, h: 29, size: 23, bold: true, ratio: 1.2, charSpacing: -0.5 }, r);
      T(s, rw.s, { x: x + 24 + 238 + 16, y: cy + 13, w: w - 48 - 238 - 16, h: 23 * 1.38, size: 21, color: INK_SOFT, ratio: 1.38 }, r);
      cy += rowH;
      if (ri < p.rows.length - 1) rect(s, { x: px(x + 24), y: px(cy), w: px(w - 48), h: px(1), fill: { color: RULE } }, r);
    });
  });
  return h;
}

// ============================================================ S1 — 표지 ====
{
  const s = slide();
  rect(s, { x: px(PAD_X), y: px(96), w: px(20), h: px(20), fill: { color: ACCENT } }, rev(1));
  T(
    s,
    "GITHUB COPILOT OFFERING",
    { x: PAD_X + 38, y: 92, w: 900, h: 28, size: 22, fontFace: LATIN, bold: true, ratio: 1.2, charSpacing: 2.6, valign: "middle" },
    rev(1)
  );

  const H1 = 142; // matches --h1-size in the HTML
  const heroY = 239;
  const line2Y = heroY + H1 * 1.08;
  const hlW = wpx("모든 것", H1) - 3 * H1 * 0.045;
  rect(s, { x: px(PAD_X - 4), y: px(line2Y + H1 * 0.9), w: px(hlW + 8), h: px(16), fill: { color: ACCENT } }, wipe(850, 700));
  T(
    s,
    [
      { text: "GitHub Copilot", options: { breakLine: true } },
      { text: "모든 것이 들어 있습니다" },
    ],
    { x: PAD_X, y: heroY, w: CW, h: H1 * 1.08 * 2, size: H1, bold: true, ratio: 1.08, charSpacing: -3.4 },
    rev(2)
  );

  rect(s, { x: px(PAD_X), y: px(613), w: px(CW), h: px(10), fill: { color: ACCENT } }, wipe(500, 900));
  T(
    s,
    "MODEL · AGENT · TOOL · LIFECYCLE · GOVERNANCE",
    { x: PAD_X, y: 653, w: CW, h: 48, size: 40, fontFace: LATIN, bold: true, ratio: 1.2, charSpacing: 0.4 },
    rev(3)
  );

  // Cover meta carries only what dates the material and who it is for. The
  // axis count is already spelled out by the Latin rule above, and a runtime
  // makes the audience read the clock before the claim.
  T(s, "기준일", { x: PAD_X, y: 866, w: 200, h: 28, size: 23, color: INK_SOFT, ratio: 1.2, wrap: false }, rev(5));
  T(s, "2026.08", { x: PAD_X, y: 900, w: 200, h: 32, size: 26, bold: true, ratio: 1.2, charSpacing: -0.2, wrap: false }, rev(5));
  T(s, "대상 · 개발 리더 / 플랫폼팀", { x: PAD_X, y: 958, w: 900, h: 28, size: 23, color: INK_FAINT, ratio: 1.2, wrap: false }, rev(5));
  T(
    s,
    "01",
    { x: RIGHT - 300, y: 884, w: 300, h: 118, size: 112, fontFace: LATIN, bold: true, color: ACCENT, ratio: 1, align: "right" },
    rev(6)
  );

  progress(s, 1);
  s.addNotes(notes(0));
}

// ========================================================== S2 — 아젠다 ====
{
  const s = slide();
  topbar(s, "아젠다", { stages: [1, 2, 3, 4, 5], page: pageNo });
  const mark = s._slideObjects.length;
  const title = [{ text: "선택의 폭과 통제력을 " }, { text: "동시에", options: { color: ACCENT } }, { text: " 제공합니다" }];
  const grid = {
    cols: [70, 360, CW - 70 - 360 - 40],
    rows: [
      ["01", "모델과 에이전트", "여러 벤더의 모델 · Copilot · Claude · Codex 하네스"],
      ["02", "개발자가 쓰는 도구", "Copilot CLI · VS Code · 데스크톱 앱 · 웹 · 모바일"],
      ["03", "Agentic SDLC", "Cloud Agent · 전 구간 실행 · 탐지 연계 · 승인 지점"],
      ["04", "거버넌스", "모델 · 에이전트 · MCP 중앙 관리 · 감사 · 비용"],
      ["05", "도입 프로그램", "1시간 브리핑 ~ 2개월 정착 프로그램 · 시작 지점 선택"],
    ].map(([n, t, d]) => [
      { t: n, size: 26, bold: true, color: ACCENT },
      { t, size: 28, bold: true },
      { t: d, size: 25, color: INK_FAINT },
    ]),
  };
  const bandText = "기능을 나열하지 않습니다 — 축마다 무엇을 선택할 수 있고 어디가 경계인지 정리합니다";

  const tH = measure(() => h2(s, 0, title, null));
  const gH = measure(() => rowGrid(s, { y: 0, ...grid }, null));
  const bH = measure(() => band(s, { y: 0, text: bandText }, null));
  let y = centerY(tH + 44 + gH + 56 + bH);

  h2(s, y, title, rev(2));
  y += tH + 44;
  rowGrid(s, { y, ...grid }, rev(3));
  y += gH + 56;
  band(s, { y, text: bandText }, rev(4));
  centreBody(s, mark);
  progress(s, pageNo);
  s.addNotes(notes(1));
}

// ========================================================== S3 — Part 1 ====
{
  const s = slide();
  statement(s, {
    sec: "Part 1",
    stages: [1],
    runs: [
      { text: "모델도 에이전트도", options: { breakLine: true } },
      { text: "벤더에 묶이지", options: { color: ACCENT } },
      { text: " 않습니다" },
    ],
    attrib: "모델과 에이전트",
  });
  progress(s, pageNo);
  s.addNotes(notes(2));
}

// ======================================================= S4 — 멀티 모델 ====
{
  const s = slide();
  topbar(s, "모델과 에이전트", { stages: [1], page: pageNo });
  const mark = s._slideObjects.length;
  const th = h2(s, 268, [{ text: "한 구독으로 " }, { text: "여러 벤더", options: { color: ACCENT } }, { text: "의 모델을 사용합니다" }], rev(2));
  subtitle(s, 268 + th + 16, "모델이 추가되거나 바뀌어도 도구와 워크플로는 그대로입니다", rev(2));

  const cy = 268 + th + 16 + 40 + 44;
  const LW = 869,
    RX = PAD_X + 869 + 56,
    RW = 755;

  label(s, PAD_X, cy, LW, "무엇을 고를 수 있나", rev(3));
  accList(
    s,
    PAD_X,
    cy + 48,
    LW,
    [
      { n: "01", title: "복수 벤더", desc: "OpenAI · Anthropic · Google · xAI · Microsoft 모델이 한 구독에" },
      { n: "02", title: "자동 선택", desc: "과업에 맞는 모델을 자동 지정 · 사용 시 모델 비용 할인" },
      { n: "03", title: "과업별 배분", desc: "루틴은 경량 모델로, 어려운 문제에만 프런티어 모델" },
      { n: "04", title: "허용 범위", desc: "사용 가능한 모델은 개발자가 아니라 관리자 정책이 정합니다" },
    ],
    rev(3)
  );

  label(s, RX, cy, RW, "비용 관점", rev(4), ACCENT);
  const bh = accBox(
    s,
    RX,
    cy + 48,
    RW,
    [
      { text: "모델 선택권은 성능 문제이면서", options: { breakLine: true } },
      { text: "동시에 " },
      { text: "비용 문제", options: { color: ACCENT, bold: true } },
      { text: "입니다" },
    ],
    "단일 벤더 도구에서는 이 최적화 자체가 성립하지 않습니다.",
    rev(4)
  );
  T(
    s,
    [
      { text: "code completion · next edit suggestions 는 " },
      { text: "AI Credits 를 차감하지 않습니다", options: { color: INK, bold: true } },
    ],
    { x: RX, y: cy + 48 + bh + 30, w: RW, h: 24 * 1.5 * 2, size: 24, color: INK_SOFT, ratio: 1.5 },
    rev(4)
  );

  centreBody(s, mark);
  progress(s, pageNo);
  s.addNotes(notes(3));
}

// ===================================================== S5 — 멀티 하네스 ====
{
  const s = slide();
  topbar(s, "모델과 에이전트", { stages: [1], page: pageNo });
  const mark = s._slideObjects.length;
  const th = h2(s, 268, [{ text: "사용하시던 Claude · Codex 를 " }, { text: "그대로", options: { color: ACCENT } }, { text: " 사용합니다" }], rev(2));
  subtitle(s, 268 + th + 16, "모델뿐 아니라 에이전트도 고릅니다. 같은 화면에서 전환합니다", rev(2));

  const cy = 268 + th + 16 + 40 + 44;
  const LW = 869,
    RX = PAD_X + 869 + 56,
    RW = 755;

  label(s, PAD_X, cy, LW, "무엇을 할 수 있나", rev(3));
  accList(
    s,
    PAD_X,
    cy + 48,
    LW,
    [
      { n: "01", title: "하네스 선택", desc: "Copilot · Claude · Codex 를 같은 화면에서 (Preview)" },
      { n: "02", title: "병렬 실행", desc: "한 과업을 여러 에이전트에 동시에 할당" },
      { n: "03", title: "결과 비교", desc: "접근 방식을 비교한 뒤 채택할 것만 선택" },
      { n: "04", title: "자산 이관", desc: "CLAUDE.md · AGENTS.md · MCP 서버 설정이 그대로" },
    ],
    rev(3)
  );

  // The value is not that all three can be picked, but that picking them adds
  // no second contract, no second console and no second audit trail.
  label(s, RX, cy, RW, "셋을 함께 쓰면", rev(4), ACCENT);
  const bh = accBox(
    s,
    RX,
    cy + 48,
    RW,
    [
      { text: "세 에이전트가 " },
      { text: "한 구독 · 한 정책", options: { color: ACCENT, bold: true } },
      { text: " 안에 있습니다" },
    ],
    "벤더마다 따로 계약하고 따로 통제하지 않습니다. 어느 에이전트로 실행하든 이슈 · 리뷰 · 감사는 같은 자리에 남습니다.",
    rev(4)
  );
  T(
    s,
    [
      { text: "한 벤더의 성능 변화나 장애가 " },
      { text: "개발 속도를 좌우하지 않습니다", options: { color: INK, bold: true } },
    ],
    { x: RX, y: cy + 48 + bh + 30, w: RW, h: 24 * 1.5 * 2, size: 24, color: INK_SOFT, ratio: 1.5 },
    rev(4)
  );

  centreBody(s, mark);
  progress(s, pageNo);
  s.addNotes(notes(4));
}

// ========================================================== S6 — Part 2 ====
{
  const s = slide();
  statement(s, {
    sec: "Part 2",
    stages: [2],
    runs: [
      { text: "개발자는 " },
      { text: "쓰던 도구", options: { color: ACCENT } },
      { text: "를", options: { breakLine: true } },
      { text: "바꾸지 않습니다" },
    ],
    attrib: "터미널 · 편집기 · 데스크톱 앱 · 웹 · 모바일",
  });
  progress(s, pageNo);
  s.addNotes(notes(5));
}

// ===================================================== S7 — Copilot CLI ====
{
  const s = slide();
  topbar(s, "개발자가 쓰는 도구", { stages: [2], page: pageNo });
  const mark = s._slideObjects.length;
  const th = h2(s, 268, [{ text: "Copilot CLI — 터미널에서 " }, { text: "PR 생성", options: { color: ACCENT } }, { text: "까지" }], rev(2));
  subtitle(s, 268 + th + 16, "전 플랜 포함 · core CLI GA", rev(2));
  toolProfile(s, {
    y: 268 + th + 16 + 40 + 40,
    icon: (x, y) => {
      box(s, pres.ShapeType.rect, { x: px(x), y: px(y), w: px(84), h: px(64), fill: { type: "none" }, line: { color: ACCENT, width: 3 } }, rev(3));
      T(s, ">_", { x: x + 16, y: y + 14, w: 60, h: 36, size: 32, fontFace: LATIN, bold: true, color: ACCENT, ratio: 1 }, rev(3));
    },
    who: "터미널에서 대부분의 작업을 처리하는 개발자",
    whoList: ["CI/CD 를 많이 다루는 플랫폼 엔지니어", "SSH 로 서버에 접속해 작업하는 인프라 팀", "IDE 를 사용하지 않는 시니어 개발자"],
    // Both edges must hold with no admin policy and no higher plan, because the
    // subtitle promises every plan. The benefit is stated without naming LSP:
    // a customer stopping to ask what that is has left the argument.
    edges: [
      { b: "사용하시던 셸 안에서 그대로 실행됩니다", p: "에이전트 사용을 위해 환경을 변경하지 않습니다. SSH 세션과 CI 파이프라인 안에서 그대로 호출합니다." },
      { b: "파일이 많아도 고칠 자리를 정확히 찾습니다", p: "코드를 훑어 짐작하지 않고 구조를 그대로 확인합니다. 오래되고 복잡한 프로젝트일수록 차이가 큽니다." },
    ],
    alsoLabel: "참고 · 다른 에이전트 CLI 에도 있는 것",
    also: ["MCP 연결", "custom agents · skills", "hooks", "plan 모드", "클라우드 샌드박스 (Preview)"],
  });
  centreBody(s, mark);
  progress(s, pageNo);
  s.addNotes(notes(6));
}

// ========================================================= S8 — VS Code ====
{
  const s = slide();
  topbar(s, "개발자가 쓰는 도구", { stages: [2], page: pageNo });
  const mark = s._slideObjects.length;
  const th = h2(s, 268, [{ text: "VS Code — 자동완성은 그대로, " }, { text: "필요할 때만", options: { color: ACCENT } }, { text: " 에이전트로" }], rev(2));
  subtitle(s, 268 + th + 16, "가장 많은 개발자가 이미 사용하는 환경", rev(2));
  toolProfile(s, {
    y: 268 + th + 16 + 40 + 40,
    icon: (x, y) => {
      box(s, pres.ShapeType.rect, { x: px(x), y: px(y), w: px(84), h: px(64), fill: { type: "none" }, line: { color: ACCENT, width: 3 } }, rev(3));
      rect(s, { x: px(x + 26), y: px(y), w: px(3), h: px(64), fill: { color: ACCENT } }, rev(3));
      rect(s, { x: px(x + 42), y: px(y + 22), w: px(28), h: px(3), fill: { color: ACCENT } }, rev(3));
      rect(s, { x: px(x + 42), y: px(y + 38), w: px(18), h: px(3), fill: { color: ACCENT } }, rev(3));
    },
    who: "편집기 안에서 대부분의 시간을 보내는 개발자",
    whoList: ["가장 넓은 사용자층 — 도입 효과가 가장 먼저 나타납니다", "에이전트를 아직 사용하지 않는 개발자까지 포함"],
    edges: [
      { b: "인라인 제안은 AI Credits 를 차감하지 않습니다", p: "에이전트를 사용하지 않는 개발자에게도 도입 효과가 있습니다." },
      { b: "Session Target 에서 하네스를 바꿉니다", p: "Local · Copilot · Claude · Codex · Cloud. 하네스 전환이 실제로 이루어지는 지점입니다." },
    ],
    alsoLabel: "참고 · 에이전트형 편집기라면 대체로 제공",
    also: ["Ask 역할", "Agent 역할", "Plan 역할"],
  });
  centreBody(s, mark);
  progress(s, pageNo);
  s.addNotes(notes(7));
}

// ===================================================== S9 — Copilot app ====
{
  const s = slide();
  topbar(s, "개발자가 쓰는 도구", { stages: [2], page: pageNo });
  const mark = s._slideObjects.length;
  const th = h2(s, 268, [{ text: "Copilot app — 여러 작업을 " }, { text: "동시에", options: { color: ACCENT } }, { text: " 진행합니다" }], rev(2));
  subtitle(s, 268 + th + 16, "에이전트 기반 개발 전용 데스크톱 앱 · 전 플랜 포함", rev(2));
  toolProfile(s, {
    y: 268 + th + 16 + 40 + 40,
    icon: (x, y) => {
      box(s, pres.ShapeType.rect, { x: px(x + 16), y: px(y), w: px(68), h: px(48), fill: { type: "none" }, line: { color: ACCENT, width: 3 } }, rev(3));
      box(s, pres.ShapeType.rect, { x: px(x), y: px(y + 16), w: px(68), h: px(48), fill: { color: PAPER }, line: { color: ACCENT, width: 3 } }, rev(3));
      rect(s, { x: px(x), y: px(y + 30), w: px(68), h: px(3), fill: { color: ACCENT } }, rev(3));
    },
    who: "여러 작업을 동시에 진행하는 사람",
    whoList: ["팀 리드 · 시니어 — 대기 시간이 곧 비용이 되는 역할", "리팩터링 · 업그레이드처럼 오래 걸리는 작업"],
    edges: [
      { b: "작업마다 별도 브랜치 · 워크트리", p: "세션끼리 서로 간섭하지 않습니다. 하나가 실행되는 동안 다른 작업을 시작하고, 진행 중인 작업을 검토할 수 있습니다." },
      { b: "이슈에서 PR 리뷰까지 앱을 벗어나지 않습니다", p: "CI 상태 확인과 PR 생성 · 리뷰가 같은 화면 안에 있습니다." },
    ],
    alsoLabel: "참고 · 세부 기능",
    also: ["Interactive · Plan · Autopilot 모드", "automations 예약 실행", "macOS · Windows · Linux"],
  });
  centreBody(s, mark);
  progress(s, pageNo);
  s.addNotes(notes(8));
}

// ======================================================= S10 — 도달 범위 ====
{
  const s = slide();
  topbar(s, "개발자가 쓰는 도구", { stages: [2], page: pageNo });
  const mark = s._slideObjects.length;
  const th = h2(s, 268, [{ text: "팀마다 도구가 달라도 " }, { text: "관리는 한 곳", options: { color: ACCENT } }, { text: "입니다" }], rev(2));
  subtitle(s, 268 + th + 16, "도구를 몇 개 쓰든 시트 · 정책 · 감사 · 비용은 GitHub 한 곳에서 봅니다", rev(2));
  hub(s, {
    y: 268 + th + 16 + 40 + 44,
    h: 430,
    core: "GitHub 한 곳에서 관리",
    sub: "시트 · 정책 · 감사 · 비용",
    where: "GitHub.com 엔터프라이즈 · 조직 설정",
    left: [
      { b: "GitHub Copilot CLI", s: "터미널 · SSH · CI 안에서" },
      { b: "VS Code · Visual Studio", s: "편집기에서 인라인 + 에이전트" },
      { b: "JetBrains · Eclipse · Xcode · Neovim", s: "팀마다 다른 IDE 그대로" },
    ],
    right: [
      { b: "GitHub Copilot app", s: "브랜치별 병렬 세션" },
      { b: "GitHub Repository", s: "이슈 할당 · PR 코멘트로 호출" },
      { b: "GitHub Mobile", s: "이동 중 확인과 지시" },
    ],
  });
  band(
    s,
    {
      y: 892,
      text: [{ text: "도구가 늘어도 " }, { text: "관리 대상은 늘지 않습니다", options: { color: ACCENT } }],
      muted: "이미 쓰고 계신 GitHub 안에 있어 통제 체계를 새로 만들지 않아도 됩니다",
    },
    rev(4)
  );
  centreBody(s, mark);
  progress(s, pageNo);
  s.addNotes(notes(9));
}

// ========================================================= S11 — Part 3 ====
{
  const s = slide();
  statement(s, {
    sec: "Part 3",
    stages: [3],
    runs: [
      { text: "코딩만 빨라지는 게 아니라", options: { breakLine: true } },
      { text: "개발 전 과정", options: { color: ACCENT } },
      { text: "이 바뀝니다" },
    ],
    attrib: "이슈 할당 · 코드 수정 · 리뷰 · 보안 검증 · 배포까지 에이전트가 수행합니다",
  });
  progress(s, pageNo);
  s.addNotes(notes(10));
}

// ================================================= S12 — 비동기 실행 ====
{
  const s = slide();
  topbar(s, "Agentic SDLC", { stages: [3], page: pageNo });
  const mark = s._slideObjects.length;
  const th = h2(s, 268, [{ text: "노트북을 닫아도 " }, { text: "에이전트는 계속 실행", options: { color: ACCENT } }, { text: "합니다" }], rev(2));
  subtitle(s, 268 + th + 16, "Cloud Agent 가 이슈를 받아 GitHub Actions 기반 임시 환경에서 비동기로 실행합니다", rev(2));

  const sy = 268 + th + 16 + 40 + 56;
  label(s, PAD_X, sy, CW, "실행 흐름", rev(3));
  const fh = flow(
    s,
    ["이슈 할당", { t: "조사 · 계획", soft: true }, { t: "브랜치 수정", soft: true }, { t: "보안 검증", soft: true }, "PR · 담당자 검토"],
    { x: PAD_X, y: sy + 44 },
    rev(3)
  );

  const py = sy + 44 + fh + 44;
  label(s, PAD_X, py, CW, "PR 확정 전 자동 검증", rev(4));
  pills(s, ["CodeQL", "secret scanning", "의존성 검사"], { x: PAD_X, y: py + 44 }, rev(4));

  band(
    s,
    {
      y: 830,
      text: "이 사전 검증에는 별도 보안 라이선스가 필요하지 않습니다",
      muted: "단, 리포지토리 상시 스캔은 Code Security · Secret Protection 이 필요합니다",
    },
    rev(5)
  );
  centreBody(s, mark);
  progress(s, pageNo);
  s.addNotes(notes(11));
}

// ================================================== S13 — 전 구간 실행 ====
{
  const s = slide();
  topbar(s, "Agentic SDLC", { stages: [3], page: pageNo });
  const mark = s._slideObjects.length;
  const th = h2(s, 240, [{ text: "계획부터 배포까지 " }, { text: "에이전트가 실행", options: { color: ACCENT } }, { text: "합니다" }], rev(2));
  subtitle(s, 240 + th + 16, "GitHub Copilot 과 GitHub Enterprise 를 함께 쓰면 한 플랫폼에서 이어집니다", rev(2));

  // Feature names stay faint: they answer "what makes this work", which is a
  // technical aside. The agent column is the claim, so it carries the weight.
  const cols = [180, 560, CW - 180 - 560 - 40];
  splitTable(
    s,
    {
      y: 240 + th + 16 + 40 + 26,
      cols,
      ruleBefore: 2,
      head: [
        { t: "구간", color: INK_SOFT },
        { t: "GitHub 기능", color: INK_FAINT },
        { t: "에이전트가 실행", color: ACCENT },
      ],
      rows: [
        ["계획", "Issues + Planning Agent", "요구사항을 작업 단위로 분해"],
        ["코딩", "Agent Mode + Cloud Agent", "브랜치 수정 · 테스트 · PR 생성"],
        ["리뷰", "Copilot Code Review", "PR 1차 검토 · 수정 제안"],
        ["테스트 · 보안", "Code Security + Copilot Autofix", "취약점 탐지 · 수정 PR 생성"],
        ["배포 · 운영", "Actions + Agentic Workflows", "반복 작업 · 재검증 실행"],
      ].map(([a, b, c]) => [
        { t: a, size: 24, bold: true },
        { t: b, size: 25, color: INK_FAINT },
        { t: c, size: 30, bold: true },
      ]),
    },
    rev(3)
  );

  band(
    s,
    {
      y: 838,
      text: [{ text: "실행이 사람의 " }, { text: "대기 시간에 묶이지 않습니다", options: { color: ACCENT } }],
      muted: "다만 에이전트는 스스로 승인하거나 병합하지 않습니다 — 종착점은 언제나 Issue 또는 Draft PR 입니다",
    },
    rev(4)
  );
  centreBody(s, mark);
  progress(s, pageNo);
  s.addNotes(notes(12));
}

// =================================================== S14 — 탐지 연계 ====
{
  const s = slide();
  topbar(s, "Agentic SDLC", { stages: [3], page: pageNo });
  const mark = s._slideObjects.length;
  const h2h = h2(s, 240, [{ text: "GitHub 이 찾은 문제를 " }, { text: "에이전트가 처리", options: { color: ACCENT } }, { text: "합니다" }], rev(2));
  subtitle(s, 240 + h2h + 16, "Dependabot · CodeQL · 정기 테스트가 찾고, 할당하면 수정 PR 까지 에이전트가 만듭니다", rev(2));

  // Product names, not activity names. "의존성 점검" in this column would read
  // as something the agent performs, which is the opposite of the point.
  const cols = [300, 620, CW - 300 - 620 - 40];
  const th = splitTable(
    s,
    {
      y: 240 + h2h + 16 + 40 + 26,
      cols,
      ruleBefore: 2,
      head: [
        { t: "탐지 — GitHub 기능", color: INK_SOFT },
        { t: "무엇을 찾는가", color: INK_FAINT },
        { t: "에이전트에 할당하면", color: ACCENT },
      ],
      rows: [
        ["Dependabot", "오래된 · 취약한 패키지 버전", "업그레이드 수정 PR"],
        ["CodeQL code scanning", "코드 취약점 · 보안 결함", "취약점 수정 PR"],
        ["Actions 정기 테스트", "회귀 · 실패한 E2E 시나리오", "원인 수정 PR"],
      ].map(([a, b, c]) => [
        { t: a, size: 24, bold: true },
        { t: b, size: 25, color: INK_FAINT },
        { t: c, size: 30, bold: true },
      ]),
    },
    rev(3)
  );

  const fy = 240 + h2h + 16 + 40 + 26 + th + 30;
  label(s, PAD_X, fy, CW, "알림 이후", rev(4));
  flow(
    s,
    [{ t: "탐지 알림 · Issue", soft: true }, "사람이 에이전트에 할당", { t: "에이전트가 수정 PR", soft: true }, { t: "리뷰 · CI 검증", soft: true }],
    { x: PAD_X, y: fy + 40 },
    rev(4)
  );

  band(
    s,
    {
      y: 838,
      text: "탐지 도구는 지금 쓰시는 것 그대로입니다",
      muted: "달라지는 것은 알림 다음입니다 — 사람이 손으로 고치던 자리에 에이전트가 들어갑니다",
    },
    rev(5)
  );
  centreBody(s, mark);
  progress(s, pageNo);
  s.addNotes(notes(13));
}

// ========================================================= S15 — Part 4 ====
{
  const s = slide();
  statement(s, {
    sec: "Part 4",
    stages: [4],
    runs: [
      { text: "자동화를 늘릴수록", options: { breakLine: true } },
      { text: "통제권", options: { color: ACCENT } },
      { text: "이 더 중요해집니다" },
    ],
    attrib: "모델 · 에이전트 · MCP · 감사 · 비용을 조직이 관리합니다",
  });
  progress(s, pageNo);
  s.addNotes(notes(14));
}

// ==================================================== S16 — 중앙 관리 ====
{
  const s = slide();
  topbar(s, "거버넌스", { stages: [4], page: pageNo });
  const mark = s._slideObjects.length;
  const th = h2(s, 240, [{ text: "모델 · 에이전트 · MCP 까지 " }, { text: "중앙에서 관리", options: { color: ACCENT } }, { text: "합니다" }], rev(2));
  subtitle(s, 240 + th + 16, "엔터프라이즈가 상한을 정하고, 그 안에서 조직이 세부를 결정합니다", rev(2));

  // Menu paths are deliberately absent. The answer this slide owes is "what can
  // we lock", not "where do we click", and a path goes stale the moment GitHub
  // reorganises the settings screen.
  consoles(
    s,
    {
      y: 240 + th + 16 + 40 + 30,
      panels: [
        {
          title: "엔터프라이즈",
          sub: "전사 상한을 정합니다",
          rows: [
            { b: "기능 · 클라이언트", s: "Chat · CLI · app · Mobile 별 사용 허용" },
            { b: "모델", s: "모델별 허용 여부와 신규 모델 기본값" },
            { b: "공개 코드 제안", s: "공개 코드와 일치하는 제안 차단" },
            { b: "에이전트", s: "Cloud Agent · 서드파티 코딩 에이전트" },
            { b: "MCP", s: "MCP 서버 사용 허용" },
          ],
        },
        {
          title: "조직",
          sub: "위임받은 범위 안에서 정합니다",
          rows: [
            { b: "정책", s: "엔터프라이즈가 위임한 항목을 조직이 결정" },
            { b: "모델", s: "선택 항목으로 열린 모델의 사용 여부" },
            { b: "Cloud Agent", s: "리포지토리 단위로 사용 허용 · 제외" },
            { b: "콘텐츠 제외", s: "파일 · 경로 · 리포지토리를 컨텍스트에서 제외" },
            { b: "인터넷 접근", s: "Cloud Agent 방화벽과 허용 도메인" },
          ],
        },
      ],
    },
    rev(3)
  );

  band(
    s,
    {
      y: 838,
      text: [{ text: "기본값이 이미 " }, { text: "보수적으로", options: { color: ACCENT } }, { text: " 잡혀 있습니다" }],
      muted: "Cloud Agent 와 MCP 정책은 기본 비활성이고, 공개 코드 일치 제안은 Copilot Business 에서 기본 차단입니다",
    },
    rev(4)
  );
  centreBody(s, mark);
  progress(s, pageNo);
  s.addNotes(notes(15));
}

// =================================================== S17 — 감사 · 비용 ====
{
  const s = slide();
  topbar(s, "거버넌스", { stages: [4], page: pageNo });
  const mark = s._slideObjects.length;
  const th = h2(s, 268, [{ text: "누가 무엇을 했는지 남고, " }, { text: "비용은 상한 안에서", options: { color: ACCENT } }, { text: " 돕니다" }], rev(2));
  subtitle(s, 268 + th + 16, "정책으로 범위를 정했다면, 남는 것은 기록과 사용량 관리입니다", rev(2));

  steps4(
    s,
    268 + th + 16 + 40 + 56,
    [
      { n: "01", title: "결정 권한", desc: "전사에서 잠근 항목은 개별 조직이 풀 수 없고, 맡긴 항목만 조직이 정합니다", hot: true },
      { n: "02", title: "활동 기록", desc: "PR 생성처럼 에이전트가 한 작업이 지시한 사람과 함께 180일간 남습니다", hot: true },
      { n: "03", title: "크레딧 공유", desc: "사용자마다 나눠 갖지 않고 회사 전체가 하나의 크레딧을 함께 씁니다", hot: true },
      { n: "04", title: "예산 한도", desc: "회사 · 조직 · 부서 · 사용자 단위로 한도를 걸어 초과 지출을 막습니다", hot: true },
    ],
    rev(3)
  );

  // The band answers the question this part always gets: does rolling this out
  // company-wide blow up the bill. Seats are fixed cost; credits are not.
  band(
    s,
    {
      y: 830,
      text: [
        { text: "전 직원에게 배포해도 비용은 " },
        { text: "에이전트를 쓴 만큼만", options: { color: ACCENT } },
        { text: " 늘어납니다" },
      ],
      muted: "코드 자동완성과 다음 편집 제안은 유료 플랜에서 무제한이고 크레딧을 쓰지 않습니다 — 크레딧은 Chat · CLI · Cloud Agent 실행에만 소비됩니다",
    },
    rev(4)
  );
  centreBody(s, mark);
  progress(s, pageNo);
  s.addNotes(notes(16));
}

// ========================================================= S18 — Part 5 ====
{
  const s = slide();
  statement(s, {
    sec: "Part 5",
    stages: [5],
    runs: [
      { text: "도구 도입이 아니라", options: { breakLine: true } },
      { text: "Agentic 개발 문화", options: { color: ACCENT } },
      { text: "를 함께 만듭니다" },
    ],
    attrib: "1시간 브리핑부터 2개월 정착 프로그램까지",
  });
  progress(s, pageNo);
  s.addNotes(notes(17));
}

// ========================================================== S19 — 기간 ====
{
  const s = slide();
  topbar(s, "도입 프로그램", { stages: [5], page: pageNo });
  const mark = s._slideObjects.length;
  const th = h2(s, 268, [{ text: "목적에 따라 " }, { text: "네 가지 프로그램", options: { color: ACCENT } }, { text: "을 제안드립니다" }], rev(2));
  subtitle(s, 268 + th + 16, "한 시간짜리 브리핑부터 두 달짜리 정착 프로그램까지", rev(2));

  steps4(
    s,
    268 + th + 16 + 40 + 52,
    [
      { n: "1시간", title: "경영진 브리핑", desc: "AI 개발 도입이 어느 프로세스를 바꾸는지 정리하고 투자 우선순위를 맞춥니다", dur: "C-Level · 개발 임원", hot: true },
      { n: "1일", title: "실무자 핸즈온", desc: "실제 업무에 바로 적용해 봅니다. 개발자 과정과 비개발 직군 과정으로 나뉩니다", dur: "개발자 · 기획 · 운영", hot: true },
      { n: "3일", title: "Agentic SDLC 집중", desc: "이슈에서 배포까지 전 과정을 팀의 실제 리포지토리로 수행하고 거버넌스를 적용합니다", dur: "시니어 · 플랫폼팀", hot: true },
      { n: "2개월", title: "정착 프로그램", desc: "파일럿 팀과 함께 조직 표준을 만들고 측정 기준선 대비 개선폭을 확인합니다", dur: "챔피언 · 플랫폼팀", hot: true },
    ],
    rev(3)
  );

  band(
    s,
    {
      y: 848,
      text: "전체를 순차로 진행하지 않아도 됩니다 — 지금 필요한 하나부터 시작합니다",
      muted: "3일 · 2개월 과정은 GitHub Enterprise Cloud 가 전제입니다",
    },
    rev(4)
  );
  centreBody(s, mark);
  progress(s, pageNo);
  s.addNotes(notes(18));
}

// ===================================================== S20 — 시작 지점 ====
{
  const s = slide();
  topbar(s, "도입 프로그램", { stages: [5], page: pageNo });
  const mark = s._slideObjects.length;
  const th = h2(s, 268, [{ text: "어느 단계에 계시든 " }, { text: "맞는 과정이 준비", options: { color: ACCENT } }, { text: "되어 있습니다" }], rev(2));
  subtitle(s, 268 + th + 16, "조직마다 출발점이 다릅니다. 상황별로 시작 지점과 다음 단계를 미리 정리해 두었습니다", rev(2));

  // Read the left column aloud and stop where the customer nods. The title is a
  // statement of readiness, not a request, so the slide must not need an answer
  // before it can be used.
  //
  // The last column is a different kind of information from the first — one is
  // where the customer is now, the other is what comes after the engagement.
  // Without a header the arrow appears to join only columns 2-3 and the fourth
  // floats. The header names all three so the row reads as one sentence.
  const cols = [460, 52, 380, CW - 460 - 52 - 380 - 60];
  const HEAD_Y = 268 + th + 16 + 40 + 22;
  const HEAD_H = 22 * 1.2;
  {
    const head = [
      { t: "현재 상태", color: INK_SOFT },
      null,
      { t: "시작 지점", color: ACCENT },
      { t: "다음 단계", color: INK_FAINT },
    ];
    let hx = PAD_X;
    head.forEach((c, i) => {
      if (c) {
        T(s, c.t, { x: hx, y: HEAD_Y, w: cols[i], h: HEAD_H, size: 22, bold: true, color: c.color, ratio: 1.2, charSpacing: 1.1 }, rev(3));
      }
      hx += cols[i] + 20;
    });
    rect(s, { x: px(PAD_X), y: px(HEAD_Y + HEAD_H + 14), w: px(CW), h: px(2), fill: { color: INK } }, rev(3));
  }

  rowGrid(
    s,
    {
      y: HEAD_Y + HEAD_H + 16,
      cols,
      padY: 15,
      rows: [
        ["도입 여부를 검토 중", "1시간", "경영진 브리핑", "대상 직군에 따라 1일 과정으로"],
        ["시트는 도입했으나 개발팀만 활용 중", "1일", "비개발 직군 핸즈온", "전사 확산 계획 수립"],
        ["개발자가 자동완성 수준에 머물러 있음", "1일", "개발자 핸즈온", "성과 확인 후 3일 집중 과정"],
        ["일부 팀은 정착했고 조직 표준이 필요", "3일", "Agentic SDLC 집중", "이후 2개월 정착 프로그램"],
        ["전사 표준으로 확산할 계획", "2개월", "정착 프로그램", "측정 기준선 · 챔피언 · 조직 표준"],
      ].map(([from, dur, to, next]) => [
        { t: from, size: 25 },
        { t: "→", size: 26, color: ACCENT, bold: true, align: "center" },
        { t: [{ text: dur, options: { color: ACCENT, bold: true } }, { text: " " + to }], size: 28, bold: true },
        { t: next, size: 25, color: INK_FAINT },
      ]),
    },
    rev(3)
  );

  band(s, { y: 872, text: "공통 산출물 — 팀 표준 초안 · 측정 기준선 · 다음 단계 합의" }, rev(4));
  centreBody(s, mark);
  progress(s, pageNo);
  s.addNotes(notes(19));
}

// ========================================================= S21 — 마무리 ====
{
  const s = slide();
  topbar(s, "마무리", { stages: [], page: pageNo });
  const mark = s._slideObjects.length;

  // Three tiers, sized by priority: the ask is the largest, the upsell is
  // deliberately small so it does not read as "you must buy both", and the
  // courtesy line stays under the ask so the last thing on screen is the point.
  const CLOSE_TEXT = "GitHub Copilot 으로 Agentic SDLC 전환을 제안드립니다";
  const CLOSE_LINES = Math.max(1, Math.ceil((wpx(CLOSE_TEXT, 60) * SAFETY) / CW));
  const CLOSE_SUB = "쓰시던 모델과 에이전트는 그대로 두고, GitHub Enterprise 와 함께 계획부터 배포까지 한 플랫폼에서 이어갑니다";
  const CLOSE_SUB_LINES = Math.max(1, Math.ceil((wpx(CLOSE_SUB, 29) * SAFETY) / CW));
  T(
    s,
    [
      { text: "GitHub Copilot 으로 " },
      { text: "Agentic SDLC", options: { color: ACCENT } },
      { text: " 전환을 제안드립니다" },
    ],
    { x: PAD_X, y: 420, w: CW, h: 60 * 1.42 * CLOSE_LINES, size: 60, bold: true, ratio: 1.42, charSpacing: -1.6 },
    rev(2)
  );
  T(
    s,
    [
      { text: "쓰시던 모델과 에이전트는 그대로 두고, " },
      { text: "GitHub Enterprise", options: { color: INK, bold: true } },
      { text: " 와 함께 계획부터 배포까지 한 플랫폼에서 이어갑니다" },
    ],
    { x: PAD_X, y: 420 + 60 * 1.42 * CLOSE_LINES + 30, w: CW, h: 29 * 1.5 * CLOSE_SUB_LINES, size: 29, color: INK_SOFT, ratio: 1.5, charSpacing: -0.2 },
    rev(3)
  );
  T(
    s,
    "감사합니다",
    { x: PAD_X, y: 420 + 60 * 1.42 * CLOSE_LINES + 30 + 29 * 1.5 * CLOSE_SUB_LINES + 46, w: CW, h: 60 * 1.2, size: 60, bold: true, ratio: 1.2, charSpacing: -1.8 },
    rev(4)
  );

  centreBody(s, mark);
  progress(s, pageNo);
  s.addNotes(notes(20));
}

// ------------------------------------------------------------------ write ---
fs.writeFileSync(path.join(ROOT, "build", "anim-manifest.json"), JSON.stringify(manifest));
if (AUDIT) fs.writeFileSync(path.join(ROOT, "build", "audit.json"), JSON.stringify(audited, null, 1));
pres.writeFile({ fileName: OUT }).then(() => console.log(`wrote ${OUT}  (${pageNo} slides)`));
