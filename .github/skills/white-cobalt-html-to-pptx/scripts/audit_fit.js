/**
 * Check every text run in the deck against its box using the calibrated
 * Malgun Gothic metrics. Reports:
 *   OVERSET  — the wrapped text needs more height than the box has
 *   NOWRAP   — a wrap:false run is wider than its box (it will bleed out)
 *   OFFSTAGE — the box escapes the 1920x1080 stage
 * A LibreOffice render cannot see any of this when the Korean font is missing.
 */
const fs = require("fs");
const path = require("path");
const rows = JSON.parse(fs.readFileSync(path.join(__dirname, "audit.json"), "utf8"));

function em(str) {
  let e = 0;
  for (const ch of str) {
    const c = ch.codePointAt(0);
    if (
      (c >= 0xac00 && c <= 0xd7a3) || (c >= 0x3130 && c <= 0x318f) ||
      (c >= 0x4e00 && c <= 0x9fff) || (c >= 0x3000 && c <= 0x303f) ||
      (c >= 0xff00 && c <= 0xffef)
    ) e += 1;
    else if (ch === " ") e += 0.356;
    else if (c === 0x2014 || c === 0x2015) e += 1;
    else if (/[A-Z]/.test(ch)) e += 0.611;
    else if (/[a-z]/.test(ch)) e += 0.422;
    else if (/[0-9]/.test(ch)) e += 0.5;
    else e += 0.42;
  }
  return e;
}

const STAGE_W = 1920, STAGE_H = 1080;
let bad = 0;
const perSlide = {};

for (const r of rows) {
  const w = em(r.text) * r.size;
  const issues = [];
  if (!r.wrap) {
    if (w > r.w + 2) issues.push(`NOWRAP  필요 ${Math.round(w)}px > 상자 ${Math.round(r.w)}px`);
  } else {
    const lines = Math.max(1, Math.ceil(w / r.w));
    const need = lines * r.size * (r.ratio || 1);
    if (need > r.h + 2) issues.push(`OVERSET ${lines}줄 필요 ${Math.round(need)}px > 높이 ${Math.round(r.h)}px`);
  }
  if (r.x < 0 || r.y < 0 || r.x + r.w > STAGE_W + 2 || r.y + r.h > STAGE_H + 2)
    issues.push(`OFFSTAGE x${r.x} y${r.y} w${r.w} h${r.h}`);
  if (issues.length) {
    bad++;
    (perSlide[r.slide] ||= []).push({ t: r.text.slice(0, 44), issues });
  }
}

const slides = Object.keys(perSlide).map(Number).sort((a, b) => a - b);
if (!slides.length) console.log("✓ 429개 텍스트 전부 상자 안에 들어갑니다");
for (const n of slides) {
  console.log(`\n[S${n}]`);
  for (const it of perSlide[n]) console.log(`  ${it.issues.join(" / ")}\n     "${it.t}"`);
}
console.log(`\n총 ${rows.length}개 중 ${bad}개 문제`);

// ---- Collision + stage-fit pass -------------------------------------------
// Text that fits its own box can still sit on top of the box below it, which is
// how the earlier title/subtitle overlap slipped through. Compare the vertical
// extents of runs that share horizontal space.
const bySlide = {};
for (const r of rows) (bySlide[r.slide] ||= []).push(r);
let clashes = 0;
for (const n of Object.keys(bySlide).map(Number).sort((a, b) => a - b)) {
  const list = bySlide[n];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > 30 && oy > 6) {
        clashes++;
        console.log(`[S${n}] OVERLAP ${Math.round(oy)}px\n     "${a.text.slice(0, 34)}"\n     "${b.text.slice(0, 34)}"`);
      }
    }
  }
}
console.log(clashes ? `\n겹침 ${clashes}건` : "\n✓ 텍스트 상자 간 겹침 없음");
