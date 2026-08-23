// build-pptx.js — 덱 데이터 스펙 → .pptx (Why Build AI on Azure 덱과 동일 디자인)
//
//   node build-pptx.js <deck.data.js>
//
// 이 제너레이터는 프로젝트 루트 build.js 의 디자인 시스템(팔레트 C · 헬퍼 ·
// 슬라이드 레이아웃)을 그대로 보존하고, 콘텐츠만 데이터 스펙에서 주입한다.
// 슬라이드 종류(kind)는 PATTERNS.md 참고. 스펙 예시는 examples/deck.data.js.
//
// 의존성: pptxgenjs, react, react-dom, react-icons, sharp  (npm install)

const path = require("path");
const pptxgen = require("pptxgenjs");

// react-icons + sharp 는 아이콘 래스터화에만 쓴다. 없으면 아이콘 없이 진행.
let React, ReactDOMServer, sharp, fa, ICONS_OK = true;
try {
  React = require("react");
  ReactDOMServer = require("react-dom/server");
  sharp = require("sharp");
  fa = require("react-icons/fa");
} catch (e) {
  ICONS_OK = false;
  console.warn("[build-pptx] 아이콘 의존성 없음 — 아이콘 없이 생성합니다. (npm install 로 활성화)");
}

// ---------- Palette (build.js 와 동일) ----------
const C = {
  DARK: "0F2547", NAVY: "1A3D6D", MID: "2F5B93", SKY: "7AA5D6",
  ICE: "DBE7F6", ICE2: "EEF4FB", BG: "F5F8FC",
  ACCENT: "4F8FB6", ACCENT2: "6FA9CC", GOLD: "F5B841", GREEN: "2E9E6B",
  TEXT: "1B2A41", MUTED: "5F708A", LINE: "D4E0F0", WHITE: "FFFFFF", SUBLT: "C7D8EC",
};
const FONT = "Apple SD Gothic Neo";
const FONTL = "Apple SD Gothic Neo";
const PW = 13.333, PH = 7.5;

let pptx, CUR_PART = 0, PAGE = 0, DECK;

function shadow(opts) {
  return Object.assign({ type: "outer", color: "1A2A44", opacity: 0.22, blur: 8, offset: 3, angle: 90 }, opts || {});
}

// ---------- Icons ----------
const ICONSET = ICONS_OK ? {
  brain: fa.FaBrain, robot: fa.FaRobot, db: fa.FaDatabase, shield: fa.FaShieldAlt,
  layers: fa.FaLayerGroup, code: fa.FaCode, users: fa.FaUsers, chart: fa.FaChartLine,
  lock: fa.FaLock, cloud: fa.FaCloud, cogs: fa.FaCogs, diagram: fa.FaProjectDiagram,
  check: fa.FaCheckCircle, bulb: fa.FaLightbulb, sitemap: fa.FaSitemap, clipboard: fa.FaClipboardCheck,
  route: fa.FaRoute, cubes: fa.FaCubes, magic: fa.FaMagic, comments: fa.FaComments,
  server: fa.FaServer, key: fa.FaKey, usershield: fa.FaUserShield, search: fa.FaSearch,
  tools: fa.FaTools, bolt: fa.FaBolt, flask: fa.FaFlask, eye: fa.FaEye,
  github: fa.FaGithub, microsoft: fa.FaMicrosoft, building: fa.FaBuilding, handshake: fa.FaHandshake,
  clock: fa.FaClock, warn: fa.FaExclamationTriangle, compass: fa.FaCompass, rocket: fa.FaRocket,
  balance: fa.FaBalanceScale, plug: fa.FaPlug, star: fa.FaStar, question: fa.FaQuestion,
  windows: fa.FaWindows, stream: fa.FaStream, network: fa.FaNetworkWired,
} : {};
const IC = {}; // filled in buildIcons()

async function iconPng(Icon, hex, size) {
  size = size || 256;
  let svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Icon, { size }));
  svg = svg.replace(/currentColor/g, "#" + hex);
  if (!/width=/.test(svg)) svg = svg.replace("<svg", `<svg width="${size}" height="${size}"`);
  const buf = await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

async function buildIcons() {
  if (!ICONS_OK) return;
  const jobs = [];
  for (const k of Object.keys(ICONSET)) {
    jobs.push(iconPng(ICONSET[k], "FFFFFF").then(d => IC[k + "_w"] = d));
    jobs.push(iconPng(ICONSET[k], C.NAVY).then(d => IC[k + "_n"] = d));
    jobs.push(iconPng(ICONSET[k], C.MID).then(d => IC[k + "_m"] = d));
    jobs.push(iconPng(ICONSET[k], C.ACCENT).then(d => IC[k + "_a"] = d));
  }
  await Promise.all(jobs);
}
// icon("cloud","w") → dataURI or null (graceful if missing)
function icon(name, tone) {
  if (!name) return null;
  return IC[name + "_" + (tone || "n")] || null;
}

// ---------- Slide helpers (build.js 와 동일) ----------
function footer(slide, dark) {
  PAGE += 1;
  const col = dark ? C.SKY : C.MUTED;
  slide.addText(DECK.title || "", { x: 0.5, y: 7.06, w: 6, h: 0.3, fontFace: FONT, fontSize: 8.5, color: col, align: "left" });
  slide.addText(String(PAGE), { x: 12.4, y: 7.06, w: 0.5, h: 0.3, fontFace: FONT, fontSize: 8.5, color: col, align: "right" });
}

function contentBG(slide) {
  slide.background = { color: C.BG };
  const gap = 0.05, segW = (PW - 3 * gap) / 4;
  for (let i = 0; i < 4; i++) {
    const on = (i + 1) === CUR_PART;
    slide.addShape(pptx.ShapeType.rect, { x: i * (segW + gap), y: 0, w: segW, h: 0.075, fill: { color: on ? C.ACCENT : C.ICE } });
  }
}

function arrowR(slide, x, y, len, opts) {
  opts = opts || {};
  slide.addShape(pptx.ShapeType.line, { x, y, w: len, h: 0, line: { color: opts.color || C.MID, width: opts.w || 2.5, endArrowType: "triangle" } });
}
function arrowD(slide, x, y, len, opts) {
  opts = opts || {};
  slide.addShape(pptx.ShapeType.line, { x, y, w: 0, h: len, line: { color: opts.color || C.MID, width: opts.w || 2.5, endArrowType: "triangle" } });
}

function header(slide, kicker, title, opts) {
  opts = opts || {};
  if (kicker) slide.addText(kicker.toUpperCase(), { x: 0.55, y: 0.42, w: 11.5, h: 0.34, fontFace: FONT, fontSize: 12.5, bold: true, color: C.MID, charSpacing: 2, align: "left" });
  slide.addText(title, { x: 0.52, y: 0.74, w: 12.3, h: opts.h || 0.9, fontFace: FONTL, fontSize: opts.size || 30, bold: true, color: C.DARK, align: "left", valign: "top" });
}

function card(slide, x, y, w, h, opts) {
  opts = opts || {};
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.09, fill: { color: opts.fill || C.WHITE }, line: { color: opts.line || C.LINE, width: 1 }, shadow: shadow({ opacity: 0.14, blur: 6, offset: 2 }) });
}

function numBadge(slide, x, y, txt, opts) {
  opts = opts || {};
  const d = opts.d || 0.5;
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: d, h: d, rectRadius: 0.1, fill: { color: opts.fill || C.NAVY } });
  slide.addText(txt, { x, y, w: d, h: d, fontFace: FONTL, fontSize: opts.fs || 18, bold: true, color: C.WHITE, align: "center", valign: "middle" });
}

function iconCircle(slide, x, y, d, ic, opts) {
  opts = opts || {};
  slide.addShape(pptx.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: opts.fill || C.ICE }, line: opts.line ? { color: opts.line, width: 1 } : { type: "none" } });
  if (ic) {
    const pad = d * 0.26;
    slide.addImage({ data: ic, x: x + pad, y: y + pad, w: d - pad * 2, h: d - pad * 2 });
  }
}

function slideIconRight(slide, x, y, d, ic) {
  slide.addShape(pptx.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: C.NAVY } });
  if (ic) {
    const pad = d * 0.26;
    slide.addImage({ data: ic, x: x + pad, y: y + pad, w: d - pad * 2, h: d - pad * 2 });
  }
}

function pill(slide, x, y, txt, kind) {
  const col = kind === "ga" ? C.GREEN : kind === "prev" ? C.GOLD : C.MID;
  const txtCol = kind === "prev" ? C.DARK : C.WHITE;
  const w = Math.max(0.72, 0.2 + txt.length * 0.092);
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.3, rectRadius: 0.15, fill: { color: col } });
  slide.addText(txt, { x, y, w, h: 0.3, fontFace: FONT, fontSize: 10, bold: true, color: txtCol, align: "center", valign: "middle" });
  return w;
}

function styledTable(slide, rows, x, y, w, colW, opts) {
  opts = opts || {};
  const tblRows = rows.map((r, ri) => r.map(cell => {
    const isHead = ri === 0;
    const c = (typeof cell === "object" && cell !== null) ? cell : { text: cell };
    const base = {
      fontFace: FONT, fontSize: opts.fs || 11.5,
      color: isHead ? C.WHITE : C.TEXT,
      fill: { color: isHead ? C.NAVY : (ri % 2 ? C.ICE2 : C.WHITE) },
      align: c.align || (isHead ? "center" : "left"),
      valign: "middle", bold: isHead || c.bold,
      margin: [3, 5, 3, 5],
    };
    if (c.color) base.color = c.color;
    return { text: c.text != null ? c.text : "", options: base };
  }));
  slide.addTable(tblRows, {
    x, y, w, colW,
    border: [
      { type: "solid", color: C.LINE, pt: 0.5 }, { type: "none" },
      { type: "solid", color: C.LINE, pt: 0.5 }, { type: "none" },
    ],
    rowH: opts.rowH || 0.36, valign: "middle", autoPage: false,
  });
}

// =====================================================================
//  Slide kinds
// =====================================================================

function s_cover(sp) {
  const s = pptx.addSlide();
  s.background = { color: C.DARK };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: PW, h: PH, fill: { color: C.DARK } });
  s.addShape(pptx.ShapeType.rect, { x: 0.85, y: 5.55, w: 4.2, h: 0.045, fill: { color: C.ACCENT } });
  iconCircle(s, 0.85, 0.75, 1.0, icon(sp.icon || "cloud", "w"), { fill: C.MID });
  if (sp.kicker) s.addText(sp.kicker.toUpperCase(), { x: 1.95, y: 0.98, w: 9, h: 0.5, fontFace: FONT, fontSize: 13, bold: true, color: C.SUBLT, charSpacing: 2, valign: "middle" });
  s.addText(sp.title, { x: 0.8, y: 2.5, w: 11.8, h: 1.5, fontFace: FONTL, fontSize: sp.titleSize || 54, bold: true, color: C.WHITE });
  if (sp.subtitle) s.addText(sp.subtitle, { x: 0.85, y: 3.95, w: 11.6, h: 0.6, fontFace: FONT, fontSize: 20, color: C.ICE });
  if (sp.subtitle2) s.addText(sp.subtitle2, { x: 0.85, y: 4.55, w: 11.6, h: 0.5, fontFace: FONT, fontSize: 15, color: C.SUBLT });
  if (sp.meta) s.addText(sp.meta, { x: 0.85, y: 5.85, w: 11.6, h: 0.5, fontFace: FONT, fontSize: 13, color: C.ICE });
  return s;
}

function s_agenda(sp) {
  const s = pptx.addSlide(); contentBG(s);
  header(s, sp.kicker || "Agenda", sp.title || "오늘의 흐름");
  const items = sp.items || [];
  let ay = 1.95;
  const h = Math.min(1.12, (6.7 - 1.95 - (items.length - 1) * 0.14) / items.length);
  items.forEach((p, i) => {
    card(s, 0.6, ay, 12.15, h);
    numBadge(s, 0.85, ay + (h - 0.5) / 2, String(p.n != null ? p.n : i + 1), { d: 0.5 });
    if (p.icon) slideIconRight(s, 11.95, ay + (h - 0.48) / 2, 0.48, icon(p.icon, "w"));
    s.addText(p.title, { x: 1.55, y: ay + 0.16, w: 8.5, h: 0.42, fontFace: FONTL, fontSize: 17, bold: true, color: C.DARK });
    if (p.desc) s.addText(p.desc, { x: 1.57, y: ay + 0.58, w: 9.2, h: 0.44, fontFace: FONT, fontSize: 11.5, color: C.MUTED });
    if (p.time) s.addText(p.time, { x: 10.4, y: ay + 0.16, w: 1.35, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: C.MID, align: "right" });
    ay += h + 0.14;
  });
  footer(s);
  return s;
}

function s_divider(sp) {
  if (sp.part) CUR_PART = sp.part;
  const s = pptx.addSlide();
  s.background = { color: C.DARK };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 4.6, h: PH, fill: { color: C.NAVY } });
  s.addShape(pptx.ShapeType.rect, { x: 4.6, y: 0, w: 0.05, h: PH, fill: { color: C.MID } });
  iconCircle(s, 1.5, 2.7, 1.6, icon(sp.icon || "compass", "w"), { fill: C.MID });
  if (sp.label) s.addText(sp.label.toUpperCase(), { x: 5.2, y: 2.55, w: 7.4, h: 0.5, fontFace: FONT, fontSize: 15, bold: true, color: C.ACCENT2, charSpacing: 3 });
  s.addText(sp.title, { x: 5.15, y: 3.0, w: 7.7, h: 1.1, fontFace: FONTL, fontSize: 34, bold: true, color: C.WHITE });
  if (sp.sub) s.addText(sp.sub, { x: 5.2, y: 4.15, w: 7.5, h: 1.0, fontFace: FONT, fontSize: 14, color: C.SUBLT, lineSpacingMultiple: 1.25 });
  return s; // dividers 는 페이지번호 없음 (build.js 와 동일)
}

function s_cards(sp) {
  if (sp.part) CUR_PART = sp.part;
  const s = pptx.addSlide(); contentBG(s);
  header(s, sp.kicker, sp.title);
  let top = 1.95;
  if (sp.intro) { s.addText(sp.intro, { x: 0.6, y: 1.78, w: 12.15, h: 0.5, fontFace: FONT, fontSize: 12.5, color: C.TEXT, lineSpacingMultiple: 1.2 }); top = 2.5; }
  const cards = sp.cards || [];
  const cols = sp.cols || (cards.length <= 3 ? cards.length : (cards.length === 4 ? 2 : 3));
  const rows = Math.ceil(cards.length / cols);
  const gap = 0.25, x0 = 0.6, wTot = 12.15;
  const cw = (wTot - (cols - 1) * gap) / cols;
  const areaB = 6.85;
  const ch = Math.min(2.2, (areaB - top - (rows - 1) * gap) / rows);
  cards.forEach((cd, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const px = x0 + col * (cw + gap), py = top + row * (ch + gap);
    card(s, px, py, cw, ch);
    const ir = icon(cd.icon, "n");
    if (cd.icon) iconCircle(s, px + 0.3, py + 0.32, 0.8, ir, { fill: C.ICE });
    const tx = cd.icon ? px + 1.25 : px + 0.32;
    s.addText(cd.title, { x: tx, y: py + 0.34, w: px + cw - tx - 0.25, h: 0.7, fontFace: FONTL, fontSize: 16, bold: true, color: C.DARK, valign: "middle" });
    if (cd.desc) s.addText(cd.desc, { x: px + 0.32, y: py + (cd.icon ? 1.24 : 1.02), w: cw - 0.6, h: ch - (cd.icon ? 1.24 : 1.02) - (cd.badge ? 0.45 : 0.18), fontFace: FONT, fontSize: 11.5, color: C.MUTED, lineSpacingMultiple: 1.15, valign: "top" });
    if (cd.badge) pill(s, px + 0.32, py + ch - 0.46, cd.badge.text, cd.badge.kind);
  });
  footer(s);
  return s;
}

function s_numbered(sp) {
  if (sp.part) CUR_PART = sp.part;
  const s = pptx.addSlide(); contentBG(s);
  header(s, sp.kicker, sp.title);
  const items = sp.items || [];
  let ay = 1.95;
  const h = Math.min(1.05, (6.75 - 1.95 - (items.length - 1) * 0.14) / items.length);
  items.forEach((p, i) => {
    card(s, 0.6, ay, 12.15, h);
    numBadge(s, 0.85, ay + (h - 0.5) / 2, String(i + 1), { d: 0.5 });
    if (p.icon) slideIconRight(s, 11.95, ay + (h - 0.48) / 2, 0.48, icon(p.icon, "w"));
    s.addText(p.title, { x: 1.55, y: ay + 0.14, w: 9.9, h: 0.42, fontFace: FONTL, fontSize: 16.5, bold: true, color: C.DARK });
    if (p.desc) s.addText(p.desc, { x: 1.57, y: ay + 0.55, w: 10.0, h: h - 0.6, fontFace: FONT, fontSize: 11.5, color: C.MUTED, lineSpacingMultiple: 1.12 });
    ay += h + 0.14;
  });
  footer(s);
  return s;
}

function s_table(sp) {
  if (sp.part) CUR_PART = sp.part;
  const s = pptx.addSlide(); contentBG(s);
  header(s, sp.kicker, sp.title);
  let top = 2.0;
  if (sp.intro) { s.addText(sp.intro, { x: 0.6, y: 1.8, w: 12.15, h: 0.5, fontFace: FONT, fontSize: 12.5, color: C.TEXT, lineSpacingMultiple: 1.2 }); top = 2.55; }
  const rows = [sp.head].concat(sp.rows);
  const n = sp.head.length;
  const colW = sp.colW || Array(n).fill(12.15 / n);
  const rowH = sp.rowH || Math.min(0.6, (6.5 - top) / rows.length);
  styledTable(s, rows, 0.6, top, 12.15, colW, { fs: sp.fs || 11.5, rowH });
  if (sp.caption) s.addText(sp.caption, { x: 0.6, y: 6.55, w: 12.15, h: 0.4, align: "center", fontFace: FONT, fontSize: 12.5, bold: true, color: C.NAVY });
  footer(s);
  return s;
}

function s_flow(sp) {
  if (sp.part) CUR_PART = sp.part;
  const s = pptx.addSlide(); contentBG(s);
  header(s, sp.kicker, sp.title);
  const steps = sp.steps || [];
  const n = steps.length;
  const gap = 0.3, x0 = 0.85, wTot = 11.6;
  const cw = (wTot - (n - 1) * gap) / n;
  const ch = 2.4, ty = 2.3;
  let x = x0;
  steps.forEach((f, i) => {
    card(s, x, ty, cw, ch);
    iconCircle(s, x + (cw - 1.0) / 2, ty + 0.35, 1.0, icon(f.icon, "n"), { fill: C.ICE });
    s.addText(f.title, { x, y: ty + 1.45, w: cw, h: 0.4, align: "center", fontFace: FONTL, fontSize: 16, bold: true, color: C.DARK });
    if (f.desc) s.addText(f.desc, { x: x + 0.15, y: ty + 1.85, w: cw - 0.3, h: 0.5, align: "center", fontFace: FONT, fontSize: 11, color: C.MUTED, lineSpacingMultiple: 1.1 });
    if (i < n - 1) arrowR(s, x + cw + 0.04, ty + ch / 2, gap - 0.08, { color: C.MID });
    x += cw + gap;
  });
  if (sp.caption) {
    card(s, 0.85, 5.35, 11.6, 0.95, { fill: C.ICE2 });
    s.addText(sp.caption, { x: 1.15, y: 5.35, w: 11.0, h: 0.95, fontFace: FONT, fontSize: 12.5, color: C.TEXT, lineSpacingMultiple: 1.2, valign: "middle" });
  }
  footer(s);
  return s;
}

function s_stack(sp) {
  if (sp.part) CUR_PART = sp.part;
  const s = pptx.addSlide(); contentBG(s);
  header(s, sp.kicker, sp.title);
  const layers = sp.layers || [];
  const n = layers.length;
  let top = 1.95;
  const h = Math.min(0.92, (6.75 - top - (n - 1) * 0.12) / n);
  layers.forEach((l, i) => {
    const py = top + i * (h + 0.12);
    card(s, 1.4, py, 10.5, h);
    if (l.icon) iconCircle(s, 1.65, py + (h - 0.6) / 2, 0.6, icon(l.icon, "n"), { fill: C.ICE });
    s.addText(l.title, { x: 2.5, y: py + 0.08, w: 3.6, h: h - 0.16, fontFace: FONTL, fontSize: 15, bold: true, color: C.DARK, valign: "middle" });
    if (l.desc) s.addText(l.desc, { x: 6.2, y: py + 0.08, w: 5.5, h: h - 0.16, fontFace: FONT, fontSize: 11.5, color: C.MUTED, valign: "middle", lineSpacingMultiple: 1.1 });
    if (i < n - 1) arrowD(s, 6.65, py + h + 0.005, 0.11, { color: C.MID, w: 2 });
  });
  footer(s);
  return s;
}

function s_twocol(sp) {
  if (sp.part) CUR_PART = sp.part;
  const s = pptx.addSlide(); contentBG(s);
  header(s, sp.kicker, sp.title);
  const cols = [sp.left, sp.right];
  const maxItems = Math.max((sp.left && sp.left.items || []).length, (sp.right && sp.right.items || []).length);
  const cw = 5.95, gap = 0.25, x0 = 0.6, top = 2.0;
  const ch = Math.min(4.9, 1.35 + maxItems * 0.62 + 0.35);
  cols.forEach((c, i) => {
    if (!c) return;
    const px = x0 + i * (cw + gap);
    card(s, px, top, cw, ch, { fill: i === 0 ? C.WHITE : C.ICE2 });
    if (c.icon) iconCircle(s, px + 0.35, top + 0.35, 0.7, icon(c.icon, "n"), { fill: C.ICE });
    s.addText(c.title, { x: c.icon ? px + 1.2 : px + 0.35, y: top + 0.4, w: cw - 1.4, h: 0.6, fontFace: FONTL, fontSize: 18, bold: true, color: i === 0 ? C.NAVY : C.DARK, valign: "middle" });
    let iy = top + 1.3;
    (c.items || []).forEach(it => {
      const t = typeof it === "object" ? it.text : it;
      s.addShape(pptx.ShapeType.ellipse, { x: px + 0.45, y: iy + 0.06, w: 0.12, h: 0.12, fill: { color: C.ACCENT } });
      s.addText(t, { x: px + 0.75, y: iy - 0.06, w: cw - 1.1, h: 0.55, fontFace: FONT, fontSize: 12.5, color: C.TEXT, valign: "top", lineSpacingMultiple: 1.15 });
      iy += 0.62;
    });
  });
  footer(s);
  return s;
}

function s_image(sp) {
  if (sp.part) CUR_PART = sp.part;
  const s = pptx.addSlide(); contentBG(s);
  header(s, sp.kicker, sp.title);
  const top = 1.85, bot = sp.caption ? 6.5 : 6.9;
  const availW = 12.0, availH = bot - top;
  const opt = { path: sp.image, x: 0.66, y: top, w: availW, h: availH, sizing: { type: "contain", w: availW, h: availH } };
  s.addImage(opt);
  if (sp.caption) s.addText(sp.caption, { x: 0.6, y: 6.55, w: 12.15, h: 0.4, align: "center", fontFace: FONT, fontSize: 12, italic: true, color: C.MUTED });
  footer(s);
  return s;
}

function s_quote(sp) {
  if (sp.part) CUR_PART = sp.part;
  const s = pptx.addSlide();
  s.background = { color: C.DARK };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: PW, h: 0.09, fill: { color: C.ACCENT } });
  if (sp.kicker) s.addText(sp.kicker, { x: 0.85, y: 0.8, w: 11, h: 0.5, fontFace: FONT, fontSize: 14, bold: true, color: C.SUBLT, charSpacing: 2 });
  s.addText(sp.big, { x: 0.85, y: 1.35, w: 11.6, h: 1.6, fontFace: FONTL, fontSize: sp.bigSize || 27, bold: true, color: C.WHITE, lineSpacingMultiple: 1.15 });
  let cy = 3.4;
  if (sp.sub) {
    s.addShape(pptx.ShapeType.rect, { x: 0.85, y: 3.35, w: 3.0, h: 0.05, fill: { color: C.ACCENT } });
    s.addText(sp.sub, { x: 0.85, y: 3.65, w: 11.6, h: 0.5, fontFace: FONTL, fontSize: 17, bold: true, color: C.ICE });
    cy = 4.35;
  }
  const cards = sp.cards || [];
  if (cards.length) {
    const n = cards.length, gap = 0.2, x0 = 0.85, wTot = 11.6;
    const cw = (wTot - (n - 1) * gap) / n;
    let qx = x0;
    cards.forEach((q, i) => {
      s.addShape(pptx.ShapeType.roundRect, { x: qx, y: cy, w: cw, h: 1.95, rectRadius: 0.08, fill: { color: C.NAVY }, line: { color: C.MID, width: 1 } });
      numBadge(s, qx + 0.3, cy + 0.25, String(i + 1), { d: 0.5, fs: 17, fill: C.MID });
      s.addText(q.title, { x: qx + 0.3, y: cy + 0.87, w: cw - 0.6, h: 0.5, fontFace: FONTL, fontSize: 15.5, bold: true, color: C.WHITE });
      if (q.desc) s.addText(q.desc, { x: qx + 0.3, y: cy + 1.37, w: cw - 0.6, h: 0.5, fontFace: FONT, fontSize: 11.5, color: C.ICE, lineSpacingMultiple: 1.15 });
      qx += cw + gap;
    });
  }
  if (sp.footnote) s.addText(sp.footnote, { x: 0.85, y: 6.5, w: 11.6, h: 0.4, fontFace: FONT, fontSize: 11.5, color: C.ICE, valign: "middle" });
  footer(s, true);
  return s;
}

function s_bullets(sp) {
  if (sp.part) CUR_PART = sp.part;
  const s = pptx.addSlide(); contentBG(s);
  header(s, sp.kicker, sp.title);
  let iy = 2.1;
  (sp.bullets || []).forEach(b => {
    const t = typeof b === "object" ? b.text : b;
    s.addShape(pptx.ShapeType.ellipse, { x: 0.8, y: iy + 0.09, w: 0.15, h: 0.15, fill: { color: C.ACCENT } });
    s.addText(t, { x: 1.15, y: iy - 0.05, w: 11.3, h: 0.6, fontFace: FONT, fontSize: 14.5, color: C.TEXT, valign: "top", lineSpacingMultiple: 1.2 });
    iy += 0.72;
  });
  footer(s);
  return s;
}

const KINDS = {
  cover: s_cover, agenda: s_agenda, divider: s_divider, cards: s_cards,
  numbered: s_numbered, table: s_table, flow: s_flow, stack: s_stack,
  twocol: s_twocol, image: s_image, quote: s_quote, bullets: s_bullets,
};

// =====================================================================
async function run() {
  const specPath = process.argv[2];
  if (!specPath) { console.error("사용법: node build-pptx.js <deck.data.js>"); process.exit(1); }
  DECK = require(path.resolve(specPath));

  pptx = new pptxgen();
  pptx.defineLayout({ name: "W", width: 13.333, height: 7.5 });
  pptx.layout = "W";
  pptx.author = DECK.author || "";
  pptx.company = DECK.company || "";
  pptx.title = DECK.title || "";

  await buildIcons();

  const slides = DECK.slides || [];
  const built = [];
  // cover 는 slides[0] 이거나 DECK.cover 로 줄 수 있다
  if (DECK.cover) built.push(s_cover(DECK.cover));
  slides.forEach(sp => {
    const fn = KINDS[sp.kind];
    if (!fn) { console.warn("[build-pptx] 알 수 없는 kind: " + sp.kind + " — bullets 로 대체"); built.push(s_bullets(sp)); return; }
    built.push(fn(sp));
  });

  // 발표자 노트 주입 (각 슬라이드 spec 의 note)
  const allSpecs = (DECK.cover ? [DECK.cover] : []).concat(slides);
  built.forEach((sl, i) => { if (allSpecs[i] && allSpecs[i].note) sl.addNotes(allSpecs[i].note); });

  const version = process.env.DECK_VERSION || DECK.version || "v1";
  const base = DECK.file || "deck";
  const OUT = version + "-" + base + ".pptx";
  await pptx.writeFile({ fileName: OUT });
  console.log("WROTE " + OUT + "  (" + built.length + " slides)");
}

run().catch(e => { console.error(e); process.exit(1); });
