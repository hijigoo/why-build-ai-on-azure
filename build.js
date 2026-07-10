// Why Build AI on Azure? — 40분 발표 덱
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");

// ---------- Palette ----------
const C = {
  DARK: "0F2547", NAVY: "1A3D6D", MID: "2F5B93", SKY: "7AA5D6",
  ICE: "DBE7F6", ICE2: "EEF4FB", BG: "F5F8FC",
  ACCENT: "4F8FB6", ACCENT2: "6FA9CC", GOLD: "F5B841", GREEN: "2E9E6B",
  TEXT: "1B2A41", MUTED: "5F708A", LINE: "D4E0F0", WHITE: "FFFFFF", SUBLT: "C7D8EC",
};
const FONT = "Apple SD Gothic Neo";
const FONTL = "Apple SD Gothic Neo";
const VERSION = process.env.DECK_VERSION || "v8";
let CUR_PART = 1; // 1..4, drives the top progress indicator

const pptx = new pptxgen();
pptx.defineLayout({ name: "W", width: 13.333, height: 7.5 });
pptx.layout = "W";
pptx.author = "Kichul Kim";
pptx.company = "Microsoft";
pptx.title = "Why Build AI on Azure?";
const PW = 13.333, PH = 7.5;

function shadow(opts) {
  return Object.assign({ type: "outer", color: "1A2A44", opacity: 0.22, blur: 8, offset: 3, angle: 90 }, opts || {});
}

// rasterize a react-icon to png dataURI
async function iconPng(Icon, hex, size) {
  size = size || 256;
  let svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Icon, { size }));
  svg = svg.replace(/currentColor/g, "#" + hex);
  if (!/width=/.test(svg)) svg = svg.replace("<svg", `<svg width="${size}" height="${size}"`);
  const buf = await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

const ICONSET = {
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
};
const IC = {}; // filled in main()
async function buildIcons() {
  const jobs = [];
  for (const k of Object.keys(ICONSET)) {
    jobs.push(iconPng(ICONSET[k], "FFFFFF").then(d => IC[k + "_w"] = d));
    jobs.push(iconPng(ICONSET[k], C.NAVY).then(d => IC[k + "_n"] = d));
    jobs.push(iconPng(ICONSET[k], C.MID).then(d => IC[k + "_m"] = d));
    jobs.push(iconPng(ICONSET[k], C.ACCENT).then(d => IC[k + "_a"] = d));
  }
  await Promise.all(jobs);
}

// ---------- Slide helpers ----------
function footer(slide, n, dark) {
  const col = dark ? C.SKY : C.MUTED;
  slide.addText("Why Build AI on Azure?", { x: 0.5, y: 7.06, w: 6, h: 0.3, fontFace: FONT, fontSize: 8.5, color: col, align: "left" });
  slide.addText(String(n), { x: 12.4, y: 7.06, w: 0.5, h: 0.3, fontFace: FONT, fontSize: 8.5, color: col, align: "right" });
}

function contentBG(slide) {
  slide.background = { color: C.BG };
  // segmented "you are here" progress indicator (4 parts)
  const gap = 0.05, segW = (PW - 3 * gap) / 4;
  for (let i = 0; i < 4; i++) {
    const on = (i + 1) === CUR_PART;
    slide.addShape(pptx.ShapeType.rect, { x: i * (segW + gap), y: 0, w: segW, h: 0.075, fill: { color: on ? C.ACCENT : C.ICE } });
  }
}

// horizontal arrow (line + triangle head) — replaces plain "→" glyph
function arrowR(slide, x, y, len, opts) {
  opts = opts || {};
  slide.addShape(pptx.ShapeType.line, { x, y, w: len, h: 0, line: { color: opts.color || C.MID, width: opts.w || 2.5, endArrowType: "triangle" } });
}

function header(slide, kicker, title, opts) {
  opts = opts || {};
  slide.addText(kicker.toUpperCase(), { x: 0.55, y: 0.42, w: 11.5, h: 0.34, fontFace: FONT, fontSize: 12.5, bold: true, color: C.MID, charSpacing: 2, align: "left" });
  slide.addText(title, { x: 0.52, y: 0.74, w: 12.3, h: opts.h || 0.9, fontFace: FONTL, fontSize: opts.size || 30, bold: true, color: C.DARK, align: "left", valign: "top" });
}

// number badge card
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

function iconCircle(slide, x, y, d, icon, opts) {
  opts = opts || {};
  slide.addShape(pptx.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: opts.fill || C.ICE }, line: opts.line ? { color: opts.line, width: 1 } : { type: "none" } });
  const pad = d * 0.26;
  slide.addImage({ data: icon, x: x + pad, y: y + pad, w: d - pad * 2, h: d - pad * 2 });
}

function pill(slide, x, y, txt, kind) {
  const col = kind === "ga" ? C.GREEN : kind === "prev" ? C.GOLD : C.MID;
  const txtCol = kind === "prev" ? C.DARK : C.WHITE;
  const w = Math.max(0.72, 0.2 + txt.length * 0.092);
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.3, rectRadius: 0.15, fill: { color: col } });
  slide.addText(txt, { x, y, w, h: 0.3, fontFace: FONT, fontSize: 10, bold: true, color: txtCol, align: "center", valign: "middle" });
  return w;
}

// styled table
function styledTable(slide, rows, x, y, w, colW, opts) {
  opts = opts || {};
  const tblRows = rows.map((r, ri) => r.map(cell => {
    const isHead = ri === 0;
    const base = {
      fontFace: FONT, fontSize: opts.fs || 11.5,
      color: isHead ? C.WHITE : C.TEXT,
      fill: { color: isHead ? C.NAVY : (ri % 2 ? C.ICE2 : C.WHITE) },
      align: cell.align || (isHead ? "center" : "left"),
      valign: "middle", bold: isHead || cell.bold,
      margin: [3, 5, 3, 5],
    };
    if (cell.color) base.color = cell.color;
    return { text: cell.text != null ? cell.text : cell, options: base };
  }));
  slide.addTable(tblRows, {
    x, y, w, colW,
    border: [
      { type: "solid", color: C.LINE, pt: 0.5 },
      { type: "none" },
      { type: "solid", color: C.LINE, pt: 0.5 },
      { type: "none" },
    ],
    rowH: opts.rowH || 0.36, valign: "middle", autoPage: false,
  });
}

// dark divider
function divider(part, title, sub, icon) {
  const s = pptx.addSlide();
  s.background = { color: C.DARK };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 4.6, h: PH, fill: { color: C.NAVY } });
  s.addShape(pptx.ShapeType.rect, { x: 4.6, y: 0, w: 0.05, h: PH, fill: { color: C.MID } });
  iconCircle(s, 1.5, 2.7, 1.6, icon, { fill: C.MID });
  s.addText(part.toUpperCase(), { x: 5.2, y: 2.55, w: 7.4, h: 0.5, fontFace: FONT, fontSize: 15, bold: true, color: C.ACCENT2, charSpacing: 3 });
  s.addText(title, { x: 5.15, y: 3.0, w: 7.7, h: 1.1, fontFace: FONTL, fontSize: 34, bold: true, color: C.WHITE });
  if (sub) s.addText(sub, { x: 5.2, y: 4.15, w: 7.5, h: 1.0, fontFace: FONT, fontSize: 14, color: C.SUBLT, lineSpacingMultiple: 1.25 });
  return s;
}

function main() {
  CUR_PART = 0;
  // ===== Slide 1: Title =====
  let s = pptx.addSlide();
  s.background = { color: C.DARK };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: PW, h: PH, fill: { color: C.DARK } });
  // subtle band
  s.addShape(pptx.ShapeType.rect, { x: 0.85, y: 5.55, w: 4.2, h: 0.045, fill: { color: C.ACCENT } });
  iconCircle(s, 0.85, 0.75, 1.0, IC.cloud_w, { fill: C.MID });
  s.addText("MICROSOFT AZURE · ENTERPRISE AI", { x: 1.95, y: 0.98, w: 9, h: 0.5, fontFace: FONT, fontSize: 13, bold: true, color: C.SUBLT, charSpacing: 2, valign: "middle" });
  s.addText("Why Build AI on Azure?", { x: 0.8, y: 2.5, w: 11.8, h: 1.5, fontFace: FONTL, fontSize: 54, bold: true, color: C.WHITE });
  s.addText("Azure 위에서 만드는 신뢰할 수 있는 Enterprise AI Platform", { x: 0.85, y: 3.95, w: 11.6, h: 0.6, fontFace: FONT, fontSize: 20, color: C.ICE });
  s.addText("데이터 · 온톨로지 · 에이전트 · 거버넌스를 하나의 스택으로", { x: 0.85, y: 4.55, w: 11.6, h: 0.5, fontFace: FONT, fontSize: 15, color: C.SUBLT });
  s.addText("약 40분 발표 · 6개 완결 서비스 · 6계층 아키텍처", { x: 0.85, y: 5.85, w: 11.6, h: 0.5, fontFace: FONT, fontSize: 13, color: C.ICE });

  // ===== Slide 2: Agenda =====
  s = pptx.addSlide(); contentBG(s);
  header(s, "Agenda · 오늘의 흐름", "네 개의 파트로 나눠 이야기합니다");
  const parts = [
    ["1", "왜 지금, 왜 Azure인가", "에이전트 시대의 전환 · 고객 과제 · 4대 신뢰 근거 · 6가지 판단 기준", "~14분", IC.compass_w],
    ["2", "AX 전략과 비즈니스 가치", "AX 3대 전략 · 에이전트 = 디지털 직원", "~4분", IC.chart_w],
    ["3", "Enterprise AI Platform (근거)", "6개 완결 서비스 · 6계층 아키텍처 · Agentic DevOps · Governance", "~15분", IC.layers_w],
    ["4", "실현 — 다음 단계", "역할별 시나리오 · 도입 로드맵 · 핵심 요약", "~7분", IC.rocket_w],
  ];
  let ay = 1.95;
  parts.forEach(p => {
    card(s, 0.6, ay, 12.15, 1.12);
    numBadge(s, 0.85, ay + 0.31, p[0], { d: 0.5 });
    slideIconRight(s, 11.95, ay + 0.32, 0.48, p[4]);
    s.addText(p[1], { x: 1.55, y: ay + 0.16, w: 8.5, h: 0.42, fontFace: FONTL, fontSize: 17, bold: true, color: C.DARK });
    s.addText(p[2], { x: 1.57, y: ay + 0.58, w: 9.2, h: 0.44, fontFace: FONT, fontSize: 11.5, color: C.MUTED });
    s.addText(p[3], { x: 10.4, y: ay + 0.16, w: 1.35, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: C.MID, align: "right" });
    ay += 1.26;
  });
  footer(s, 2);
}

function slideIconRight(slide, x, y, d, icon) {
  slide.addShape(pptx.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: C.NAVY } });
  const pad = d * 0.26;
  slide.addImage({ data: icon, x: x + pad, y: y + pad, w: d - pad * 2, h: d - pad * 2 });
}

// ===== PART 1 =====
function part1() {
  CUR_PART = 1;
  divider("Part 1", "왜 지금, 왜 Azure인가", "에이전트 시대의 전환과 신뢰의 근거", IC.compass_w);

  // Slide 4: AI 3세대 진화
  let s = pptx.addSlide(); contentBG(s);
  header(s, "1. 왜 지금 AI인가", "AI는 3세대를 거쳐 '실행'의 단계로 왔습니다");
  const gens = [
    ["1세대", "예측 AI", "데이터로 미래를 예측\n(수요·이탈·리스크)", IC.chart_n, C.SKY],
    ["2세대", "생성 AI", "콘텐츠를 생성\n(문서·코드·이미지)", IC.magic_n, C.MID],
    ["3세대", "에이전트 AI", "스스로 계획하고 실행\n(업무를 대신 수행)", IC.robot_w, C.NAVY],
  ];
  let gx = 0.75;
  gens.forEach((g, i) => {
    const isLast = i === 2;
    card(s, gx, 2.1, 3.6, 3.1, { fill: isLast ? C.NAVY : C.WHITE });
    iconCircle(s, gx + 1.3, 2.45, 1.0, g[3], { fill: isLast ? C.MID : C.ICE });
    s.addText(g[0], { x: gx, y: 3.55, w: 3.6, h: 0.35, align: "center", fontFace: FONT, fontSize: 12, bold: true, color: isLast ? C.SKY : C.MID });
    s.addText(g[1], { x: gx, y: 3.9, w: 3.6, h: 0.5, align: "center", fontFace: FONTL, fontSize: 21, bold: true, color: isLast ? C.WHITE : C.DARK });
    s.addText(g[2], { x: gx, y: 4.45, w: 3.6, h: 0.7, align: "center", fontFace: FONT, fontSize: 12, color: isLast ? C.ICE : C.MUTED, lineSpacingMultiple: 1.1 });
    if (i < 2) arrowR(s, gx + 3.62, 3.55, 0.32, { color: C.MID });
    gx += 4.0;
  });
  s.addText("AI가 '대신 실행'하는 시대 — 데이터·모델·거버넌스가 한 스택에서 이어져야 안전하게 운영됩니다. 그래서 '어디서 구축·운영하느냐'가 핵심입니다.", { x: 0.75, y: 5.45, w: 11.8, h: 0.75, fontFace: FONT, fontSize: 13.5, bold: true, color: C.NAVY, align: "center", lineSpacingMultiple: 1.15 });
  footer(s, 4);

  // Slide 5: 에이전트가 바꾸는 것 + 왜 지금
  s = pptx.addSlide(); contentBG(s);
  header(s, "1. 왜 지금 AI인가", "에이전트가 바꾸는 것 — 그리고 왜 '지금'인가");
  slabel(s, 0.6, 1.85, "에이전트가 바꾸는 것", IC.robot_n);
  styledTable(s, [
    [{text:"구분"},{text:"기존 방식"},{text:"에이전트 시대"}],
    [{text:"업무 수행",bold:true},"사람이 직접 처리","에이전트가 대신 실행"],
    [{text:"시스템",bold:true},"사람이 도구를 조작","에이전트가 도구를 호출"],
    [{text:"확장",bold:true},"인력 증원","에이전트 확장"],
    [{text:"속도",bold:true},"업무시간에 종속","24/7 상시 실행"],
  ], 0.6, 2.25, 6.05, [1.35, 2.35, 2.35], { fs: 11, rowH: 0.52 });

  slabel(s, 7.0, 1.85, "왜 지금인가 — 4가지 압력", IC.warn_n);
  const risks = [
    ["프론티어 모델의 성숙", "복잡한 업무를 맡길 수준으로 도약"],
    ["경쟁사의 선점", "AI 도입 격차가 시장 격차로"],
    ["데이터 준비 비용", "미루면 부채가 계속 쌓임"],
    ["Shadow AI 확산", "통제 밖 AI 사용이 이미 시작"],
  ];
  let ry = 2.25;
  risks.forEach((r, i) => {
    card(s, 7.0, ry, 5.75, 0.78);
    numBadge(s, 7.2, ry + 0.17, String(i + 1), { d: 0.44, fs: 15 });
    s.addText(r[0], { x: 7.8, y: ry + 0.09, w: 4.85, h: 0.34, fontFace: FONTL, fontSize: 13, bold: true, color: C.DARK });
    s.addText(r[1], { x: 7.8, y: ry + 0.42, w: 4.85, h: 0.3, fontFace: FONT, fontSize: 10.5, color: C.MUTED });
    ry += 0.9;
  });
  s.addText("이미 M365·GitHub·Fabric을 쓰고 있다면, '지금' 시작하기 가장 가까운 곳은 그 위에 얹히는 Azure입니다.", { x: 0.6, y: 6.55, w: 12.15, h: 0.4, fontFace: FONT, fontSize: 12.5, bold: true, color: C.NAVY, align: "center" });
  footer(s, 5);
}

function slabel(slide, x, y, txt, icon) {
  slide.addShape(pptx.ShapeType.ellipse, { x, y, w: 0.34, h: 0.34, fill: { color: C.ICE } });
  slide.addImage({ data: icon, x: x + 0.08, y: y + 0.08, w: 0.18, h: 0.18 });
  slide.addText(txt, { x: x + 0.44, y: y - 0.02, w: 5.6, h: 0.4, fontFace: FONTL, fontSize: 15, bold: true, color: C.NAVY, valign: "middle" });
}

function part1b() {
  CUR_PART = 1;
  // Slide 6: 5가지 과제
  let s = pptx.addSlide(); contentBG(s);
  header(s, "2. 고객이 겪는 과제", "AI 도입을 막는 5개의 벽");
  const walls = [
    ["데이터의 벽", "흩어진 데이터·사일로 — AI가 쓸 준비가 안 됨", IC.db_w],
    ["신뢰의 벽", "환각·보안·규제 — '믿고 맡길 수 있나'", IC.shield_w],
    ["통합의 벽", "기존 시스템·업무와 어떻게 연결하나", IC.plug_w],
    ["인재·역량의 벽", "만들 사람도, 운영할 체계도 부족", IC.users_w],
    ["확장의 벽", "PoC는 됐지만 전사 확장이 안 됨", IC.stream_w],
  ];
  const wx0 = 0.9, ww = 11.55, chh = 0.8, cg = 0.09, wy0 = 1.9;
  walls.forEach((w, i) => {
    const cy = wy0 + i * (chh + cg);
    const shade = i % 2 ? C.NAVY : C.MID;
    s.addShape(pptx.ShapeType.rect, { x: wx0, y: cy, w: ww, h: chh, fill: { color: shade }, shadow: shadow({ opacity: 0.1, blur: 4, offset: 1 }) });
    s.addImage({ data: w[2], x: wx0 + 0.32, y: cy + (chh - 0.42) / 2, w: 0.42, h: 0.42 });
    s.addText(w[0], { x: wx0 + 1.05, y: cy, w: 3.3, h: chh, fontFace: FONTL, fontSize: 15, bold: true, color: C.WHITE, valign: "middle" });
    s.addShape(pptx.ShapeType.rect, { x: wx0 + 4.35, y: cy + 0.18, w: 0.02, h: chh - 0.36, fill: { color: C.SKY } });
    s.addText(w[1], { x: wx0 + 4.6, y: cy, w: ww - 4.9, h: chh, fontFace: FONT, fontSize: 12, color: C.ICE, valign: "middle" });
  });
  s.addText("이 다섯 개의 벽을 하나의 스택에서 넘을 수 있는가 — 다음 장부터 Azure가 각 벽에 어떻게 답하는지 봅니다.", { x: 0.9, y: 6.45, w: 11.55, h: 0.5, align: "center", fontFace: FONT, fontSize: 13.5, bold: true, color: C.NAVY });
  footer(s, 6);

  // Slide 7: 4대 신뢰 근거
  s = pptx.addSlide(); contentBG(s);
  header(s, "3. 왜 Azure인가", "신뢰의 4대 근거");
  const trust = [
    ["AI 리더십", "프론티어 모델(OpenAI)부터 오픈 모델까지 — Microsoft Foundry 모델 카탈로그에서 안전하게 선택·운영", IC.brain_w],
    ["Responsible AI", "설계부터 내장된 책임·안전 — Content Safety · Entra · Purview · Defender", IC.balance_w],
    ["End-to-End 완결 스택", "데이터(Fabric·OneLake) → 에이전트(Foundry) → 운영(Monitor)까지 하나의 스택에서", IC.layers_w],
    ["개발자 생태계", "이미 쓰는 GitHub 위에서 — 세계 최대 개발 생태계로 앱·에이전트를 바로 구축·운영", IC.code_w],
  ];
  let tx = 0.6, ty = 2.0;
  trust.forEach((t, i) => {
    const cw = 6.0, ch = 2.28;
    const px = tx + (i % 2) * 6.15;
    const py = ty + Math.floor(i / 2) * 2.42;
    const dk = false;
    card(s, px, py, cw, ch, { fill: dk ? C.NAVY : C.WHITE });
    const key = ["brain","balance","layers","code"][i];
    iconCircle(s, px + 0.35, py + 0.4, 1.0, dk ? IC[key+"_w"] : IC[key+"_n"], { fill: dk ? C.MID : C.ICE });
    s.addText(String(i+1), { x: px + cw - 0.9, y: py + 0.25, w: 0.6, h: 0.6, align: "center", fontFace: FONTL, fontSize: 30, bold: true, color: C.SKY });
    s.addText(t[0], { x: px + 1.55, y: py + 0.42, w: cw - 2.2, h: 0.5, fontFace: FONTL, fontSize: 18, bold: true, color: dk ? C.WHITE : C.DARK });
    s.addText(t[1], { x: px + 1.55, y: py + 0.95, w: cw - 1.85, h: 1.3, fontFace: FONT, fontSize: 12, color: dk ? C.ICE : C.MUTED, lineSpacingMultiple: 1.18, valign: "top" });
  });
  s.addText("이 네 가지가 특히 강한 이유 — 이미 M365·Entra·GitHub·Fabric을 쓰는 조직에겐, 새로 만드는 게 아니라 '쓰던 것' 위에 안전하게 얹힙니다.", { x: 0.6, y: 6.9, w: 12.15, h: 0.45, align: "center", fontFace: FONT, fontSize: 12.5, bold: true, color: C.NAVY });
  footer(s, 7);
}

function part1c() {
  CUR_PART = 1;
  // Slide 8: 왜 Azure인가 — 구체적으로 (신규)
  let s = pptx.addSlide(); contentBG(s);
  header(s, "3. 왜 Azure인가", "일반론이 아니라 — 구체적으로 무엇이 다른가");
  const diff = [
    ["데이터는 당신의 것", "고객 입력·출력을 파운데이션 모델 학습에 사용하지 않음 · 한국 리전 우선 · 테넌트 격리 (약관은 서비스·모델별 확인)", IC.lock_n],
    ["모델 선택의 자유", "Microsoft Foundry 모델 카탈로그 — 프론티어 OpenAI · 오픈소스 · 산업별 모델을 운영 가능한 방식으로 선택·교체", IC.brain_n],
    ["이미 가진 스택 위에서", "M365 · GitHub · Fabric은 연동 가치, 이 기준을 책임지는 엔진은 Azure — 옮기지 않고 연결부터", IC.plug_n],
    ["AI를 감싸는 보안·거버넌스", "Entra(신원) · Purview(데이터) · Defender(위협) · Agent 365(에이전트 통제, GA·2026.5)", IC.usershield_n],
  ];
  const dx = 0.6, dw = 12.15, dh = 0.95, dgap = 0.12, dy0 = 1.9;
  diff.forEach((d, i) => {
    const cyy = dy0 + i * (dh + dgap);
    card(s, dx, cyy, dw, dh);
    iconCircle(s, dx + 0.28, cyy + (dh - 0.62) / 2, 0.62, d[2], { fill: C.ICE });
    s.addText(String(i + 1), { x: dx + 1.05, y: cyy, w: 0.5, h: dh, fontFace: FONTL, fontSize: 22, bold: true, color: C.SKY, valign: "middle" });
    s.addText(d[0], { x: dx + 1.5, y: cyy, w: 3.35, h: dh, fontFace: FONTL, fontSize: 14.5, bold: true, color: C.DARK, valign: "middle" });
    s.addShape(pptx.ShapeType.rect, { x: dx + 5.0, y: cyy + 0.2, w: 0.02, h: dh - 0.4, fill: { color: C.LINE } });
    s.addText(d[1], { x: dx + 5.25, y: cyy, w: dw - 5.55, h: dh, fontFace: FONT, fontSize: 11.5, color: C.MUTED, valign: "middle", lineSpacingMultiple: 1.08 });
  });
  s.addText("핵심은 '어디서 구축·운영하느냐' — Azure는 이 기준들을 하나의 플랫폼에서 일관되게 제공합니다.", { x: 0.6, y: 6.45, w: 12.15, h: 0.45, fontFace: FONT, fontSize: 12.5, bold: true, color: C.NAVY, align: "center" });
  footer(s, 8);

  // Slide 9: Responsible AI 표
  s = pptx.addSlide(); contentBG(s);
  header(s, "3. 왜 Azure인가 · Responsible AI", "신뢰는 기능이 아니라 설계 원칙입니다");
  styledTable(s, [
    [{text:"원칙"},{text:"의미"},{text:"Azure에서의 실현"}],
    [{text:"공정성",bold:true},"편향 없는 결과","모델 평가·편향 탐지 도구"],
    [{text:"신뢰성·안전",bold:true},"예측 가능하고 안전한 동작","Content Safety · 평가 파이프라인"],
    [{text:"개인정보·보안",bold:true},"데이터 주권과 보호","고객 데이터 학습 미사용 · 리전 격리"],
    [{text:"투명성",bold:true},"설명 가능성","추적·관측(Observability)"],
    [{text:"책임성",bold:true},"거버넌스와 통제","Entra · Purview · Defender 연동"],
  ], 0.6, 2.05, 12.15, [2.3, 4.2, 5.65], { fs: 12, rowH: 0.62 });
  s.addText("고객 데이터로 파운데이션 모델을 학습하지 않으며, 서비스·모델·리전별 조건을 확인한 전제에서 테넌트·리전 격리 원칙을 적용합니다.", { x: 0.6, y: 6.15, w: 12.15, h: 0.5, fontFace: FONT, fontSize: 13, bold: true, color: C.NAVY, align: "center" });
  footer(s, 9);

  // Slide 10: 6가지 판단 기준 + Azure의 답
  s = pptx.addSlide(); contentBG(s);
  header(s, "3. 왜 Azure인가", "6가지 판단 기준 — 그리고 Azure의 답");
  const crit = [
    ["데이터 주권", "데이터가 어디에 머무는가", "리전·테넌트 격리 · 학습 미사용", IC.lock_n],
    ["보안 경계", "조직 보안·ID 안에서 도는가", "Entra · Purview · Defender", IC.shield_n],
    ["모델 선택·운영", "최신 모델을 바꿔 쓸 수 있나", "Foundry 모델 카탈로그", IC.brain_n],
    ["거버넌스", "누가·무엇을 쓰는지 통제되나", "Agent 365 · Purview 감사", IC.usershield_n],
    ["통합 가치", "이미 쓰는 시스템과 연결되나", "M365 · GitHub · Fabric 연동", IC.plug_n],
    ["비용 예측성", "확장 시 비용이 통제되나", "관리형 · 작게 시작해 확장", IC.chart_n],
  ];
  let cy = 1.95;
  crit.forEach((c, i) => {
    const cw = 3.95, ch = 2.42, col = i % 3, row = Math.floor(i / 3);
    const px = 0.6 + col * 4.08, py = cy + row * 2.55;
    card(s, px, py, cw, ch);
    iconCircle(s, px + 0.3, py + 0.3, 0.8, c[3], { fill: C.ICE });
    numBadge(s, px + cw - 0.72, py + 0.3, String(i+1), { d: 0.44, fs: 14, fill: C.SKY });
    s.addText(c[0], { x: px + 0.3, y: py + 1.12, w: cw - 0.55, h: 0.36, fontFace: FONTL, fontSize: 15, bold: true, color: C.DARK });
    s.addText(c[1], { x: px + 0.3, y: py + 1.47, w: cw - 0.55, h: 0.38, fontFace: FONT, fontSize: 10, color: C.MUTED, lineSpacingMultiple: 1.05 });
    s.addText([{ text: "→ ", options: { color: C.ACCENT, bold: true } }, { text: c[2], options: { color: C.NAVY, bold: true } }], { x: px + 0.3, y: py + 1.88, w: cw - 0.5, h: 0.44, fontFace: FONT, fontSize: 10, lineSpacingMultiple: 1.05, valign: "top" });
  });
  footer(s, 10);

  // Slide 11: 우리의 관점 (3원칙 + 자주 묻는 4가지)
  s = pptx.addSlide(); contentBG(s);
  header(s, "4. Azure의 관점", "제품이 아니라 비즈니스 성과입니다");
  slabel(s, 0.6, 1.85, "3가지 원칙", IC.star_n);
  const princ = [
    ["성과 우선", "벤더 교체가 아니라 성과가 목표"],
    ["기존 투자 보호", "원본은 그대로, AI가 쓰도록 연결"],
    ["작게 시작해 확장", "한 업무에서 검증 후 패턴 확장"],
  ];
  let py = 2.3;
  princ.forEach((p, i) => {
    card(s, 0.6, py, 5.85, 0.95);
    numBadge(s, 0.82, py + 0.24, String(i+1), { d: 0.46, fs: 15, fill: C.NAVY });
    s.addText(p[0], { x: 1.45, y: py + 0.14, w: 4.9, h: 0.36, fontFace: FONTL, fontSize: 14.5, bold: true, color: C.DARK });
    s.addText(p[1], { x: 1.45, y: py + 0.5, w: 4.9, h: 0.34, fontFace: FONT, fontSize: 11, color: C.MUTED });
    py += 1.07;
  });
  slabel(s, 7.0, 1.85, "자주 묻는 4가지", IC.question_n);
  styledTable(s, [
    [{text:"질문"},{text:"짧은 답"}],
    [{text:"기존 투자?",bold:true},"옮기지 않고 연결부터"],
    [{text:"보안·규제?",bold:true},"리전·테넌트 격리, 학습 미사용"],
    [{text:"비용?",bold:true},"작게 시작, 성과로 확장"],
    [{text:"어디부터?",bold:true},"ROI 높은 한 업무부터"],
  ], 7.0, 2.3, 5.75, [2.0, 3.75], { fs: 11.5, rowH: 0.62 });
  footer(s, 11);
}

// ===== PART 2 =====
function part2() {
  CUR_PART = 2;
  divider("Part 2", "AX 전략과 비즈니스 가치", "AI Transformation을 성과로 연결하는 법", IC.chart_w);

  // Slide 12: AX 3대 전략
  let s = pptx.addSlide(); contentBG(s);
  header(s, "5. AX 3대 전략", "AI를 성과로 바꾸는 세 개의 축");
  const ax = [
    ["업무를 재설계", "Reimagine Work", "기존 프로세스에 AI를 얹는 게 아니라, 에이전트 중심으로 업무를 다시 설계", IC.cogs_w],
    ["직원을 강화", "Empower People", "모든 직원이 Copilot으로 더 높은 가치의 일에 집중", IC.users_w],
    ["에이전트를 확장", "Scale Agents", "검증된 에이전트를 전사로 확장하고 안전하게 운영", IC.stream_w],
  ];
  let x = 0.7;
  ax.forEach((a, i) => {
    const cw = 3.85, ch = 3.5;
    card(s, x, 2.1, cw, ch, { fill: C.NAVY });
    iconCircle(s, x + (cw-1.1)/2, 2.5, 1.1, a[3], { fill: C.MID });
    s.addText(a[1].toUpperCase(), { x, y: 3.75, w: cw, h: 0.3, align: "center", fontFace: FONT, fontSize: 10.5, bold: true, color: C.SKY, charSpacing: 1 });
    s.addText(a[0], { x, y: 4.05, w: cw, h: 0.5, align: "center", fontFace: FONTL, fontSize: 20, bold: true, color: C.WHITE });
    s.addText(a[2], { x: x + 0.25, y: 4.6, w: cw - 0.5, h: 0.95, align: "center", fontFace: FONT, fontSize: 11.5, color: C.ICE, lineSpacingMultiple: 1.18 });
    x += 4.05;
  });
  s.addText("세 축은 순서가 아니라 동시에 맞물려 돌아갑니다 — 업무·사람·에이전트가 함께 진화합니다.", { x: 0.7, y: 5.85, w: 12.0, h: 0.5, align: "center", fontFace: FONT, fontSize: 13.5, bold: true, color: C.NAVY });
  footer(s, 13);

  // Slide 13: 에이전트 = 디지털 직원
  s = pptx.addSlide(); contentBG(s);
  header(s, "5. AX 3대 전략", "에이전트 = '디지털 직원'으로 생각하기");
  styledTable(s, [
    [{text:"직원에게 필요한 것"},{text:"에이전트에게 필요한 것"},{text:"Azure에서"}],
    [{text:"업무 지식",bold:true},"데이터·온톨로지 이해","Fabric · OneLake · 3개 IQ"],
    [{text:"일하는 도구",bold:true},"시스템·API 연결","Foundry Tools · 커넥터"],
    [{text:"판단·실행",bold:true},"모델·추론","Foundry 모델 카탈로그"],
    [{text:"소속·권한",bold:true},"ID·접근 통제","Entra Agent ID"],
    [{text:"관리·평가",bold:true},"성과·안전 관측","Purview · Defender · 평가"],
  ], 0.6, 2.0, 12.15, [3.5, 4.0, 4.65], { fs: 12, rowH: 0.6 });
  s.addText("에이전트를 '새로 합류한 직원'처럼 생각하면 필요한 것이 분명해집니다 — 단, 사람의 책임·권한·감사 체계 안에서 운영되며, 그 모두를 Azure가 제공합니다.", { x: 0.6, y: 6.1, w: 12.15, h: 0.55, align: "center", fontFace: FONT, fontSize: 13, bold: true, color: C.NAVY });
  footer(s, 14);
}

// ===== PART 3 =====
function part3a() {
  CUR_PART = 3;
  divider("Part 3", "Enterprise AI Platform", "6개 완결 서비스 · 6계층 아키텍처 (근거)", IC.layers_w);

  // Slide 15: 6개 서비스 미리보기
  let s = pptx.addSlide(); contentBG(s);
  header(s, "6. 완결 스택의 핵심 서비스", "6개 서비스가 하나의 스택을 완성합니다");
  const svc = [
    ["Microsoft Fabric · OneLake", "데이터 기반", "흩어진 데이터를 하나의 논리적 레이크로", IC.db_n, "ga"],
    ["3개의 IQ + Azure AI Search", "지능 레이어", "데이터·업무·지식의 의미를 이해", IC.brain_n, "prev"],
    ["Microsoft Foundry", "에이전트 개발·운영", "모델·에이전트·평가·안전을 하나로", IC.robot_n, "ga"],
    ["Copilot Studio", "현업·IT 에이전트", "코드 없이 업무 에이전트 제작", IC.comments_n, "ga"],
    ["Microsoft 365 · Agent 365", "업무 현장 통합", "일하는 곳에서 바로 에이전트 활용", IC.windows_n, "ga"],
    ["GitHub Copilot", "개발 생태계", "에이전트를 만드는 개발자 생산성", IC.github_n, "ga"],
  ];
  let x = 0.6, y = 1.95;
  svc.forEach((v, i) => {
    const cw = 3.95, ch = 2.3, col = i % 3, row = Math.floor(i / 3);
    const px = x + col * 4.08, py = y + row * 2.42;
    card(s, px, py, cw, ch);
    iconCircle(s, px + 0.3, py + 0.3, 0.8, v[3], { fill: C.ICE });
    pill(s, px + cw - (v[4]==="ga"?1.05:1.35), py + 0.42, v[4] === "ga" ? "GA" : "Preview", v[4]);
    s.addText(v[1].toUpperCase(), { x: px + 0.3, y: py + 1.18, w: cw - 0.5, h: 0.28, fontFace: FONT, fontSize: 9.5, bold: true, color: C.MID, charSpacing: 1 });
    s.addText(v[0], { x: px + 0.3, y: py + 1.42, w: cw - 0.5, h: 0.5, fontFace: FONTL, fontSize: 14, bold: true, color: C.DARK, lineSpacingMultiple: 0.95 });
    s.addText(v[2], { x: px + 0.3, y: py + 1.92, w: cw - 0.5, h: 0.4, fontFace: FONT, fontSize: 10, color: C.MUTED, lineSpacingMultiple: 1.05 });
  });
  s.addText("Fabric IQ · Work IQ · Foundry IQ는 Preview 단계 — 발표 시점 GA·한국 리전 재확인 권장", { x: 0.6, y: 6.78, w: 12.15, h: 0.3, fontFace: FONT, fontSize: 8.5, color: C.MUTED });
  footer(s, 16);
}

function part3b() {
  CUR_PART = 3;
  // Slide 16: ① Fabric · OneLake
  let s = pptx.addSlide(); contentBG(s);
  header(s, "6-① 데이터 기반", "Microsoft Fabric · OneLake");
  iconCircle(s, 10.9, 0.5, 1.4, IC.db_n, { fill: C.ICE });
  deepBody(s, "흩어진 데이터를 하나의 논리적 레이크(OneLake)로 통합합니다. 복사·이동 없이 있는 자리에서 연결(Shortcut)하고, AI가 바로 쓸 수 있는 형태로 정돈합니다.", [
    ["OneLake", "조직 전체의 단일 논리 데이터 레이크 — 원본은 그대로, 논리적으로 하나로"],
    ["Shortcut", "복사 없이 외부 스토리지·소스를 연결 (기존 투자 보호)"],
    ["100+ 커넥터", "Azure Data Factory로 다양한 소스를 자동 수집·정제"],
    ["개방형 포맷", "Delta·Parquet 기반 — 특정 벤더에 잠기지 않음"],
  ]);
  pill(s, 0.6, 5.95, "GA", "ga");
  s.addText("데이터를 옮기지 않고도 AI가 쓸 수 있게 — 이것이 시작점입니다.", { x: 1.4, y: 5.9, w: 11, h: 0.4, fontFace: FONT, fontSize: 12.5, bold: true, color: C.NAVY, valign: "middle" });
  footer(s, 17);

  // Slide 17: ② 3개 IQ + AI Search  (convergence "equation")
  s = pptx.addSlide(); contentBG(s);
  header(s, "6-② 지능 레이어", "3개의 IQ가 합쳐져 '비즈니스를 아는 지능'이 됩니다");
  const iqs = [
    ["Fabric IQ", "데이터의 의미", "테이블·컬럼이 '무엇을 뜻하는지' 이해"],
    ["Work IQ", "일의 맥락", "M365 속 업무·협업의 흐름을 이해"],
    ["Foundry IQ", "에이전트 지식", "에이전트가 참조할 지식을 관리"],
  ];
  const iqW = 3.7, iqXs = [0.7, 4.75, 8.8], iqY = 1.85, iqH = 2.05;
  iqs.forEach((q, i) => {
    const ix = iqXs[i];
    card(s, ix, iqY, iqW, iqH, { fill: C.NAVY });
    s.addText(q[0], { x: ix, y: iqY + 0.28, w: iqW, h: 0.45, align: "center", fontFace: FONTL, fontSize: 19, bold: true, color: C.WHITE });
    s.addText(q[1], { x: ix, y: iqY + 0.74, w: iqW, h: 0.32, align: "center", fontFace: FONT, fontSize: 12, bold: true, color: C.SKY });
    s.addText(q[2], { x: ix + 0.25, y: iqY + 1.08, w: iqW - 0.5, h: 0.6, align: "center", fontFace: FONT, fontSize: 11, color: C.ICE, lineSpacingMultiple: 1.12 });
    pill(s, ix + (iqW - 1.35) / 2, iqY + 1.62, "Preview", "prev");
    if (i < 2) s.addText("+", { x: ix + iqW - 0.03, y: iqY + 0.55, w: 0.38, h: 0.9, align: "center", valign: "middle", fontFace: FONTL, fontSize: 30, bold: true, color: C.MID });
  });
  // convergence banner
  card(s, 0.7, 4.32, 11.8, 0.98, { fill: C.ICE2, line: C.SKY });
  iconCircle(s, 0.95, 4.55, 0.55, IC.brain_n, { fill: C.WHITE });
  s.addText([{ text: "= 비즈니스를 이해하는 지능  ", options: { bold: true, color: C.NAVY, fontSize: 15 } }, { text: "— '데이터 + 업무 + 지식'을 모두 아는 하나의 지능", options: { color: C.TEXT, fontSize: 12.5 } }], { x: 1.7, y: 4.32, w: 10.6, h: 0.98, fontFace: FONTL, valign: "middle" });
  // AI Search engine bar
  card(s, 0.7, 5.5, 11.8, 0.98, { fill: C.NAVY });
  iconCircle(s, 0.95, 5.73, 0.55, IC.search_w, { fill: C.MID });
  s.addText([{ text: "Azure AI Search ", options: { bold: true, color: C.WHITE, fontSize: 14 } }, { text: "GA", options: { color: C.WHITE, fontSize: 10.5, bold: true } }], { x: 1.7, y: 5.62, w: 10.6, h: 0.35, fontFace: FONTL });
  s.addText("세 IQ를 뒷받침하는 검색·검색증강(RAG) 엔진 — 에이전트가 정확한 근거를 찾도록 합니다.", { x: 1.7, y: 5.98, w: 10.6, h: 0.4, fontFace: FONT, fontSize: 11.5, color: C.ICE });
  footer(s, 18);
}

function deepBody(s, lead, rows) {
  s.addText(lead, { x: 0.6, y: 1.95, w: 10.0, h: 0.9, fontFace: FONT, fontSize: 13.5, color: C.TEXT, lineSpacingMultiple: 1.25 });
  let y = 3.0;
  rows.forEach((r, i) => {
    card(s, 0.6, y, 12.15, 0.66);
    s.addText(r[0], { x: 0.85, y: y + 0.08, w: 3.0, h: 0.5, fontFace: FONTL, fontSize: 14, bold: true, color: C.NAVY, valign: "middle" });
    s.addShape(pptx.ShapeType.rect, { x: 3.95, y: y + 0.14, w: 0.02, h: 0.38, fill: { color: C.LINE } });
    s.addText(r[1], { x: 4.2, y: y + 0.08, w: 8.35, h: 0.5, fontFace: FONT, fontSize: 12, color: C.TEXT, valign: "middle", lineSpacingMultiple: 1.05 });
    y += 0.72;
  });
}

function part3c() {
  CUR_PART = 3;
  // Slide 18: ③ Microsoft Foundry
  let s = pptx.addSlide(); contentBG(s);
  header(s, "6-③ 에이전트 개발·운영", "Microsoft Foundry");
  s.addText("AI 앱과 에이전트를 만들고 운영하는 통합 플랫폼. '실험'이 아니라 '운영'을 전제로 설계되었습니다.", { x: 0.6, y: 1.95, w: 12.15, h: 0.6, fontFace: FONT, fontSize: 13.5, color: C.TEXT, lineSpacingMultiple: 1.2 });
  const four = [
    ["모델 카탈로그", "OpenAI 프론티어 모델부터 오픈 모델까지 — 선택의 자유", IC.brain_n],
    ["에이전트 개발", "Foundry Agent Service로 에이전트를 만들고 배포", IC.robot_n],
    ["평가 · 관측", "품질·안전을 지속 측정하는 평가·Observability", IC.eye_n],
    ["안전 · 거버넌스", "Content Safety로 안전 가드레일 내장", IC.shield_n],
  ];
  let x = 0.6, y = 2.7;
  four.forEach((f, i) => {
    const cw = 6.0, ch = 1.75, col = i % 2, row = Math.floor(i / 2);
    const px = x + col * 6.15, py = y + row * 1.9;
    card(s, px, py, cw, ch);
    iconCircle(s, px + 0.28, py + 0.4, 0.95, f[2], { fill: C.ICE });
    numBadge(s, px + cw - 0.7, py + 0.28, String(i+1), { d: 0.42, fs: 13, fill: C.SKY });
    s.addText(f[0], { x: px + 1.4, y: py + 0.28, w: cw - 2.0, h: 0.4, fontFace: FONTL, fontSize: 16, bold: true, color: C.DARK });
    s.addText(f[1], { x: px + 1.4, y: py + 0.72, w: cw - 1.7, h: 0.85, fontFace: FONT, fontSize: 11.5, color: C.MUTED, lineSpacingMultiple: 1.15, valign: "top" });
    x = 0.6;
  });
  pill(s, 0.6, 6.5, "GA", "ga");
  s.addText("모델 선택 → 개발 → 평가 → 안전을 한 곳에서 — 에이전트를 '운영'하는 공장.", { x: 1.4, y: 6.45, w: 11, h: 0.4, fontFace: FONT, fontSize: 12.5, bold: true, color: C.NAVY, valign: "middle" });
  footer(s, 19);

  // Slide 19: ④⑤⑥ Copilot Studio / M365·Agent 365 / GitHub Copilot
  s = pptx.addSlide(); contentBG(s);
  header(s, "6-④⑤⑥ 만들고 · 일하고 · 개발한다", "Copilot Studio · Microsoft 365 · GitHub Copilot");
  const three = [
    ["④ Copilot Studio", "현업·IT를 위한 에이전트 빌더", ["코드 없이 업무 에이전트 제작", "M365·Teams로 바로 게시 (GA)", "Foundry와 상호운용"], IC.comments_w, "ga"],
    ["⑤ M365 · Agent 365", "일하는 현장의 에이전트", ["Teams·Outlook 등 업무 흐름 안에서", "Agent 365로 에이전트를 관리·운영", "Entra·Purview로 통제"], IC.windows_w, "ga"],
    ["⑥ GitHub Copilot", "에이전트를 만드는 생산성", ["세계 최대 개발 생태계", "코딩 에이전트로 개발 가속", "Foundry와 함께 앱·에이전트 구축"], IC.github_w, "ga"],
  ];
  let tx = 0.6;
  three.forEach(t => {
    const cw = 3.95, ch = 4.4;
    card(s, tx, 2.0, cw, ch, { fill: C.NAVY });
    iconCircle(s, tx + (cw-1.0)/2, 2.35, 1.0, t[3], { fill: C.MID });
    s.addText(t[0], { x: tx, y: 3.45, w: cw, h: 0.42, align: "center", fontFace: FONTL, fontSize: 16, bold: true, color: C.WHITE });
    s.addText(t[1], { x: tx + 0.15, y: 3.88, w: cw - 0.3, h: 0.5, align: "center", fontFace: FONT, fontSize: 11, color: C.SKY, lineSpacingMultiple: 1.1 });
    const bullets = t[2].map(b => ({ text: b, options: { bullet: { indent: 12 }, fontSize: 11, color: C.ICE, breakLine: true, paraSpaceAfter: 6 } }));
    s.addText(bullets, { x: tx + 0.32, y: 4.5, w: cw - 0.55, h: 1.4, fontFace: FONT, valign: "top", lineSpacingMultiple: 1.1 });
    pill(s, tx + (cw-0.7)/2, 6.02, "GA", "ga");
    tx += 4.08;
  });
  footer(s, 20);
}

function part3d() {
  CUR_PART = 3;
  // Slide 20: 전체 아키텍처 (네이티브 계층도)
  let s = pptx.addSlide(); contentBG(s);
  header(s, "7. Enterprise AI Platform", "한눈에 보는 6계층 아키텍처");
  // Experience layer top
  const layers = [
    ["Experience", "사용자·업무 경험", "M365 · Teams · Copilot Studio 앱", IC.comments_w, C.MID],
    ["Agents", "에이전트", "Foundry Agent Service · Copilot 에이전트", IC.robot_w, C.NAVY],
    ["Agent Factory", "에이전트 제작 계층", "Copilot Studio(현업·IT) · Foundry(개발자)", IC.cogs_w, C.MID],
    ["Ontology / Intelligence", "지능 레이어", "3개의 IQ · Azure AI Search", IC.brain_w, C.NAVY],
    ["OneLake", "단일 데이터 레이크", "Microsoft Fabric · OneLake", IC.db_w, C.MID],
    ["Data", "데이터 원천", "100+ 커넥터 · Shortcut · 개방형 포맷", IC.server_w, C.NAVY],
  ];
  let ly = 1.85;
  const lh = 0.72, lgap = 0.05;
  layers.forEach((l, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 1.3, y: ly, w: 9.0, h: lh, rectRadius: 0.06, fill: { color: l[4] }, shadow: shadow({ opacity: 0.12, blur: 5, offset: 2 }) });
    s.addImage({ data: l[3], x: 1.55, y: ly + (lh-0.4)/2, w: 0.4, h: 0.4 });
    s.addText(l[0], { x: 2.15, y: ly + 0.06, w: 3.2, h: lh - 0.12, fontFace: FONTL, fontSize: 14, bold: true, color: C.WHITE, valign: "middle" });
    s.addText(l[2], { x: 5.4, y: ly + 0.06, w: 4.75, h: lh - 0.12, fontFace: FONT, fontSize: 10.5, color: C.ICE, valign: "middle", align: "right" });
    ly += lh + lgap;
  });
  // governance bar on right (vertical, spanning)
  const gy0 = 1.85, gy1 = ly - lgap;
  s.addShape(pptx.ShapeType.roundRect, { x: 10.55, y: gy0, w: 1.8, h: gy1 - gy0, rectRadius: 0.06, fill: { color: C.DARK }, line: { color: C.ACCENT, width: 1.25 } });
  s.addImage({ data: IC.usershield_w, x: 11.25, y: gy0 + 0.3, w: 0.5, h: 0.5 });
  s.addText("Governance\n& Security", { x: 10.6, y: gy0 + 0.95, w: 1.7, h: 0.9, align: "center", fontFace: FONTL, fontSize: 12.5, bold: true, color: C.WHITE, lineSpacingMultiple: 1.05 });
  s.addText("Entra · Purview\nDefender · Monitor", { x: 10.6, y: (gy0+gy1)/2 + 0.5, w: 1.7, h: 1.2, align: "center", fontFace: FONT, fontSize: 9.5, color: C.SKY, lineSpacingMultiple: 1.15 });
  // up arrow annotation
  s.addText("데이터가 위로 올라가며 '지능 → 에이전트 → 경험'으로 실현됩니다.", { x: 1.3, y: gy1 + 0.08, w: 9.0, h: 0.3, align: "center", fontFace: FONT, fontSize: 10, color: C.MUTED });
  footer(s, 21);

  // Slide 21: 데이터의 여정 6단계
  s = pptx.addSlide(); contentBG(s);
  header(s, "7. Enterprise AI Platform", "데이터의 여정 — 6단계로 읽기");
  const steps = [
    ["수집", "흩어진 원천을 연결", IC.plug_n],
    ["통합", "OneLake로 하나의 레이크", IC.db_n],
    ["의미 부여", "온톨로지·3개 IQ로 의미화", IC.brain_n],
    ["에이전트화", "Foundry·Copilot Studio로 제작", IC.robot_n],
    ["실행", "업무 현장에서 실행·자동화", IC.bolt_n],
    ["통제", "Governance로 상시 관측", IC.usershield_n],
  ];
  let x = 0.6, y = 2.3;
  steps.forEach((st, i) => {
    const cw = 3.85, ch = 1.9, col = i % 3, row = Math.floor(i / 3);
    const px = x + col * 4.08, py = y + row * 2.35;
    card(s, px, py, cw, ch);
    iconCircle(s, px + 0.28, py + 0.35, 0.85, st[2], { fill: C.ICE });
    numBadge(s, px + cw - 0.72, py + 0.28, String(i+1), { d: 0.44, fs: 14, fill: C.NAVY });
    s.addText(st[0], { x: px + 1.3, y: py + 0.35, w: cw - 1.9, h: 0.45, fontFace: FONTL, fontSize: 16, bold: true, color: C.DARK });
    s.addText(st[1], { x: px + 0.3, y: py + 1.2, w: cw - 0.55, h: 0.55, fontFace: FONT, fontSize: 11, color: C.MUTED, lineSpacingMultiple: 1.1 });
    if (col < 2) arrowR(s, px + cw + 0.02, py + 0.72, 0.18, { color: C.MID });
  });
  footer(s, 22);
}

function part3e() {
  CUR_PART = 3;
  // Slide 22: 계층별 요약
  let s = pptx.addSlide(); contentBG(s);
  header(s, "8. 계층별 요약", "비즈니스 가치 → 이를 실현하는 Azure 서비스");
  styledTable(s, [
    [{text:"계층"},{text:"비즈니스 가치"},{text:"Azure / Microsoft 서비스"}],
    [{text:"Experience",bold:true},"일하는 곳에서 바로 쓰는 경험","M365 · Teams · Copilot Studio 앱"],
    [{text:"Agents",bold:true},"업무를 대신 실행하는 디지털 직원","Foundry Agent Service · Copilot 에이전트"],
    [{text:"Agent Factory",bold:true},"현업·개발자 모두 에이전트 제작","Copilot Studio · Microsoft Foundry"],
    [{text:"Ontology / IQ",bold:true},"비즈니스를 이해하는 지능","Fabric IQ · Work IQ · Foundry IQ · AI Search"],
    [{text:"OneLake",bold:true},"흩어진 데이터를 하나로","Microsoft Fabric · OneLake"],
    [{text:"Data",bold:true},"기존 투자 보호하며 연결","100+ 커넥터 · Shortcut"],
  ], 0.6, 2.0, 12.15, [2.5, 4.35, 5.3], { fs: 11.5, rowH: 0.6 });
  s.addText("각 계층은 '무엇을 위한 것(가치)'을 먼저, '무엇으로 실현하나(서비스)'를 다음에 봅니다.", { x: 0.6, y: 6.5, w: 12.15, h: 0.4, align: "center", fontFace: FONT, fontSize: 12.5, bold: true, color: C.NAVY });
  footer(s, 23);

  // Slide 23: Agentic DevOps
  s = pptx.addSlide(); contentBG(s);
  header(s, "9. Agentic DevOps", "에이전트를 만드는 개발도 에이전트가 돕습니다");
  const flow = [
    ["계획", "이슈·요구사항 정리", IC.clipboard_n],
    ["개발", "Copilot이 코드 초안 생성", IC.code_n],
    ["리뷰", "자동 리뷰·보안 점검", IC.eye_n],
    ["배포", "CI/CD로 안전하게 릴리스", IC.rocket_n],
  ];
  let x = 0.85;
  flow.forEach((f, i) => {
    const cw = 2.7, ch = 2.4;
    card(s, x, 2.15, cw, ch);
    iconCircle(s, x + (cw-1.0)/2, 2.5, 1.0, f[2], { fill: C.ICE });
    s.addText(f[0], { x, y: 3.6, w: cw, h: 0.4, align: "center", fontFace: FONTL, fontSize: 17, bold: true, color: C.DARK });
    s.addText(f[1], { x: x + 0.15, y: 4.0, w: cw - 0.3, h: 0.5, align: "center", fontFace: FONT, fontSize: 11, color: C.MUTED, lineSpacingMultiple: 1.1 });
    if (i < 3) arrowR(s, x + cw + 0.03, 3.35, 0.24, { color: C.MID });
    x += 3.0;
  });
  card(s, 0.85, 5.0, 11.6, 1.35, { fill: C.ICE2 });
  s.addImage({ data: IC.github_n, x: 1.15, y: 5.3, w: 0.7, h: 0.7 });
  s.addText([{text:"GitHub Copilot + Secret Protection · Code Security  ", options:{bold:true, color:C.NAVY, fontSize:13.5}},{text:"GA", options:{bold:true, color:C.GREEN, fontSize:11}}], { x: 2.05, y: 5.25, w: 10.2, h: 0.4, fontFace: FONTL });
  s.addText("개발 속도를 높이면서도, 코드 보안·시크릿 보호를 파이프라인에 내장합니다.", { x: 2.05, y: 5.62, w: 10.2, h: 0.6, fontFace: FONT, fontSize: 11.5, color: C.MUTED, lineSpacingMultiple: 1.15 });
  footer(s, 24);

  // Slide 24: Governance
  s = pptx.addSlide(); contentBG(s);
  header(s, "10. Governance & Security", "거버넌스는 전 계층을 가로지릅니다");
  s.addText("Responsible AI를 '원칙'이 아니라 '동작'으로 만드는 4개의 축 — 모든 계층에 관통 적용됩니다.", { x: 0.6, y: 1.9, w: 12.15, h: 0.55, fontFace: FONT, fontSize: 13, color: C.TEXT, lineSpacingMultiple: 1.2 });
  const gov = [
    ["Entra Agent ID", "ID · 접근", "에이전트에게도 신원과 권한을 부여·통제", IC.key_n],
    ["Microsoft Purview", "데이터 거버넌스", "민감정보 분류·데이터 정책·감사", IC.usershield_n],
    ["Defender for Cloud/AI", "위협 보호", "AI 워크로드의 위협 탐지·대응", IC.shield_n],
    ["Azure Monitor", "관측", "성능·품질·안전을 지속 관측", IC.eye_n],
  ];
  let gx = 0.6, gy = 2.6;
  gov.forEach((g, i) => {
    const cw = 6.0, ch = 1.75, col = i % 2, row = Math.floor(i / 2);
    const px = gx + col * 6.15, py = gy + row * 1.9;
    card(s, px, py, cw, ch);
    iconCircle(s, px + 0.28, py + 0.4, 0.95, g[3], { fill: C.ICE });
    s.addText(g[1].toUpperCase(), { x: px + 1.4, y: py + 0.25, w: cw - 1.7, h: 0.28, fontFace: FONT, fontSize: 9.5, bold: true, color: C.MID, charSpacing: 1 });
    s.addText(g[0], { x: px + 1.4, y: py + 0.52, w: cw - 1.7, h: 0.4, fontFace: FONTL, fontSize: 15, bold: true, color: C.DARK });
    s.addText(g[2], { x: px + 1.4, y: py + 0.95, w: cw - 1.7, h: 0.7, fontFace: FONT, fontSize: 11, color: C.MUTED, lineSpacingMultiple: 1.12, valign: "top" });
    gx = 0.6;
  });
  s.addText("이 네 가지는 모두 GA — 지금 바로 표준 거버넌스로 시작할 수 있습니다.", { x: 0.6, y: 6.5, w: 12.15, h: 0.4, align: "center", fontFace: FONT, fontSize: 12.5, bold: true, color: C.NAVY });
  footer(s, 25);
}

function part3f() {
  CUR_PART = 3;
  // Slide 25: 서비스 맵
  let s = pptx.addSlide(); contentBG(s);
  header(s, "11. Azure 서비스 맵", "계층 ↔ 서비스 총정리");
  styledTable(s, [
    [{text:"계층"},{text:"핵심 서비스"},{text:"성숙도"}],
    [{text:"경험",bold:true},"Microsoft 365 · Teams · Copilot Studio",{text:"GA",color:C.GREEN,bold:true,align:"center"}],
    [{text:"에이전트 관리",bold:true},"Agent 365",{text:"GA · 2026.5",color:C.GREEN,bold:true,align:"center"}],
    [{text:"에이전트 제작",bold:true},"Copilot Studio · Microsoft Foundry",{text:"GA",color:C.GREEN,bold:true,align:"center"}],
    [{text:"지능(IQ)",bold:true},"Fabric IQ · Work IQ · Foundry IQ",{text:"Preview",color:"9A6A00",bold:true,align:"center"}],
    [{text:"검색·RAG",bold:true},"Azure AI Search",{text:"GA",color:C.GREEN,bold:true,align:"center"}],
    [{text:"데이터",bold:true},"Microsoft Fabric · OneLake",{text:"GA",color:C.GREEN,bold:true,align:"center"}],
    [{text:"개발",bold:true},"GitHub Copilot · Secret Protection",{text:"GA",color:C.GREEN,bold:true,align:"center"}],
    [{text:"거버넌스",bold:true},"Entra · Purview · Defender · Monitor",{text:"GA",color:C.GREEN,bold:true,align:"center"}],
  ], 0.6, 1.95, 12.15, [2.7, 6.9, 2.55], { fs: 11, rowH: 0.44 });
  s.addText("Fabric IQ · Work IQ · Foundry IQ는 Preview — 발표 시점 GA·한국 리전 재확인 권장. 나머지는 지금 GA로 시작 가능.", { x: 0.6, y: 6.6, w: 12.15, h: 0.4, align: "center", fontFace: FONT, fontSize: 10.5, color: C.MUTED });
  footer(s, 26);
}

// ===== PART 4 =====
function part4() {
  CUR_PART = 4;
  divider("Part 4", "실현 — 다음 단계", "역할별 시나리오 · 도입 로드맵 · 핵심 요약", IC.rocket_w);

  // Slide 27: Personas
  let s = pptx.addSlide(); contentBG(s);
  header(s, "12. 역할별 시나리오", "누가, 무엇을 얻는가");
  const per = [
    ["경영진", "성과 가시성", "KPI·리스크를 한눈에 보는 대시보드 에이전트", IC.chart_n],
    ["현업 담당자", "반복업무 자동화", "Copilot Studio로 직접 만든 업무 에이전트", IC.users_n],
    ["개발자", "개발 생산성", "GitHub Copilot·Foundry로 앱·에이전트 구축", IC.code_n],
    ["IT·보안", "통제 가능한 확산", "Entra·Purview로 안전하게 관리·감사", IC.usershield_n],
  ];
  let x = 0.6, y = 2.0;
  per.forEach((p, i) => {
    const cw = 6.0, ch = 2.35, col = i % 2, row = Math.floor(i / 2);
    const px = x + col * 6.15, py = y + row * 2.52;
    card(s, px, py, cw, ch);
    iconCircle(s, px + 0.32, py + 0.4, 1.05, p[3], { fill: C.ICE });
    s.addText(p[0], { x: px + 1.6, y: py + 0.4, w: cw - 1.9, h: 0.42, fontFace: FONTL, fontSize: 18, bold: true, color: C.DARK });
    s.addText(p[1], { x: px + 1.6, y: py + 0.85, w: cw - 1.9, h: 0.35, fontFace: FONT, fontSize: 12, bold: true, color: C.MID });
    s.addText(p[2], { x: px + 1.6, y: py + 1.25, w: cw - 1.85, h: 0.9, fontFace: FONT, fontSize: 11.5, color: C.MUTED, lineSpacingMultiple: 1.15, valign: "top" });
    x = 0.6;
  });
  footer(s, 28);

  // Slide 28: 시나리오 6개
  s = pptx.addSlide(); contentBG(s);
  header(s, "13. 활용 시나리오", "6개 업무에서 바로 시작할 수 있습니다");
  styledTable(s, [
    [{text:"#"},{text:"업무 시나리오"},{text:"핵심 Azure 서비스"}],
    [{text:"1",align:"center"},"보고서·리서치 자동 작성","Foundry · AI Search · OneLake"],
    [{text:"2",align:"center"},"내부 지식 Q&A 어시스턴트","Copilot Studio · AI Search"],
    [{text:"3",align:"center"},"업무 프로세스 자동화","Copilot Studio · Work IQ [Preview]"],
    [{text:"4",align:"center"},"전사 에이전트 관리·운영","Agent 365 · Entra · Purview"],
    [{text:"5",align:"center"},"데이터 분석·인사이트","Fabric · Fabric IQ [Preview]"],
    [{text:"6",align:"center"},"개발 가속·현대화","GitHub Copilot · Foundry"],
  ], 0.6, 2.0, 12.15, [1.0, 6.15, 5.0], { fs: 11.5, rowH: 0.58 });
  s.addText("대표 시나리오 #1은 이미 GA 서비스만으로 구현 가능 — 여기서 시작해 패턴을 확장합니다.", { x: 0.6, y: 6.5, w: 12.15, h: 0.4, align: "center", fontFace: FONT, fontSize: 12.5, bold: true, color: C.NAVY });
  footer(s, 29);
}

function part4b() {
  CUR_PART = 4;
  // Slide 29: 로드맵 4단계
  let s = pptx.addSlide(); contentBG(s);
  header(s, "14. 도입 로드맵", "작게 시작해 안전하게 확장합니다");
  const road = [
    ["1", "Envision", "0~2주", "ROI 높은 한 업무 선정 · 데이터·보안 요건 정리"],
    ["2", "Pilot", "2~6주", "GA 서비스로 대표 시나리오 1개 구현·검증"],
    ["3", "Scale", "6주~", "검증된 패턴을 인접 업무로 확장"],
    ["4", "Govern", "상시", "Entra·Purview·Defender로 통제·관측 정착"],
  ];
  const nodeX = [2.55, 5.4, 8.25, 11.1], spineY = 3.9, nd = 0.66;
  // spine
  s.addShape(pptx.ShapeType.roundRect, { x: nodeX[0], y: spineY - 0.035, w: nodeX[3] - nodeX[0], h: 0.07, rectRadius: 0.035, fill: { color: C.SKY } });
  road.forEach((r, i) => {
    const nx = nodeX[i], above = i % 2 === 0;
    const cw = 2.75, chh = 1.5;
    const cy = above ? 2.0 : 4.3;
    const cx = nx - cw / 2;
    // connector
    if (above) s.addShape(pptx.ShapeType.line, { x: nx, y: cy + chh, w: 0, h: spineY - nd / 2 - (cy + chh), line: { color: C.SKY, width: 1.5 } });
    else s.addShape(pptx.ShapeType.line, { x: nx, y: spineY + nd / 2, w: 0, h: cy - (spineY + nd / 2), line: { color: C.SKY, width: 1.5 } });
    // card
    const dk = i === 0;
    card(s, cx, cy, cw, chh, { fill: dk ? C.NAVY : C.WHITE });
    s.addText(r[1], { x: cx, y: cy + 0.16, w: cw, h: 0.42, align: "center", fontFace: FONTL, fontSize: 17, bold: true, color: dk ? C.WHITE : C.DARK });
    pill(s, cx + (cw - 1.05) / 2, cy + 0.58, r[2], "info");
    s.addText(r[3], { x: cx + 0.18, y: cy + 0.96, w: cw - 0.36, h: 0.48, align: "center", fontFace: FONT, fontSize: 10, color: dk ? C.ICE : C.MUTED, lineSpacingMultiple: 1.1 });
    // node
    s.addShape(pptx.ShapeType.ellipse, { x: nx - nd / 2, y: spineY - nd / 2, w: nd, h: nd, fill: { color: i === 0 ? C.ACCENT : C.NAVY }, line: { color: C.WHITE, width: 2 } });
    s.addText(r[0], { x: nx - nd / 2, y: spineY - nd / 2, w: nd, h: nd, align: "center", valign: "middle", fontFace: FONTL, fontSize: 16, bold: true, color: i === 0 ? C.DARK : C.WHITE });
  });
  card(s, 0.6, 6.0, 12.15, 0.85, { fill: C.ICE2 });
  s.addImage({ data: IC.bulb_n, x: 0.9, y: 6.2, w: 0.46, h: 0.46 });
  s.addText([{text:"Quick Win  ", options:{bold:true, color:C.NAVY, fontSize:13}},{text:"— 워크숍 준비물: 데이터 소스 2개 · 보안 요구사항 · ROI 후보 업무 1개", options:{color:C.TEXT, fontSize:12}}], { x: 1.5, y: 6.0, w: 11.1, h: 0.85, fontFace: FONT, valign: "middle" });
  footer(s, 30);

  // Slide 30: Key Takeaways
  s = pptx.addSlide(); contentBG(s);
  header(s, "핵심 요약", "기억할 7가지");
  const take = [
    "AI는 '실행하는' 에이전트 시대로 전환했다",
    "다섯 개의 벽은 하나의 완결 스택으로 넘는다",
    "왜 Azure — 데이터주권·보안경계·모델운영·거버넌스·비용",
    "6개 서비스가 데이터→에이전트→경험을 완성한다",
    "거버넌스는 전 계층을 관통하는 GA 기반이다",
    "GA 서비스만으로 대표 시나리오를 지금 시작할 수 있다",
    "작게 시작해 검증된 패턴을 안전하게 확장한다",
  ];
  let ty = 1.95;
  take.forEach((t, i) => {
    const col = i < 4 ? 0 : 1;
    const idx = i < 4 ? i : i - 4;
    const px = 0.6 + col * 6.15;
    const py = 1.95 + idx * 1.15;
    card(s, px, py, 6.0, 1.0);
    numBadge(s, px + 0.22, py + 0.27, String(i+1), { d: 0.46, fs: 15, fill: C.NAVY });
    s.addText(t, { x: px + 0.9, y: py + 0.08, w: 5.0, h: 0.85, fontFace: FONT, fontSize: 12, bold: true, color: C.TEXT, valign: "middle", lineSpacingMultiple: 1.12 });
    ty = py;
  });
  // 8th slot: summary highlight card to balance the grid
  const bx = 0.6 + 1 * 6.15, by = 1.95 + 3 * 1.15;
  s.addShape(pptx.ShapeType.roundRect, { x: bx, y: by, w: 6.0, h: 1.0, rectRadius: 0.09, fill: { color: C.NAVY }, shadow: shadow({ opacity: 0.14, blur: 6, offset: 2 }) });
  s.addImage({ data: IC.bulb_w, x: bx + 0.28, y: by + 0.28, w: 0.44, h: 0.44 });
  s.addText("한 문장 — Azure는 신뢰할 수 있는 Enterprise AI Platform입니다", { x: bx + 0.95, y: by + 0.08, w: 4.9, h: 0.85, fontFace: FONTL, fontSize: 12.5, bold: true, color: C.WHITE, valign: "middle", lineSpacingMultiple: 1.12 });
  footer(s, 31);

  // Slide 31: Closing + 질문 3개
  s = pptx.addSlide();
  s.background = { color: C.DARK };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: PW, h: 0.09, fill: { color: C.ACCENT } });
  s.addText("한 문장으로", { x: 0.85, y: 0.8, w: 11, h: 0.5, fontFace: FONT, fontSize: 14, bold: true, color: C.SUBLT, charSpacing: 2 });
  s.addText("Azure는 데이터·에이전트·거버넌스를 하나의 스택으로 잇는,\n신뢰할 수 있는 Enterprise AI Platform입니다.", { x: 0.85, y: 1.35, w: 11.6, h: 1.5, fontFace: FONTL, fontSize: 27, bold: true, color: C.WHITE, lineSpacingMultiple: 1.15 });
  s.addShape(pptx.ShapeType.rect, { x: 0.85, y: 3.35, w: 3.0, h: 0.05, fill: { color: C.ACCENT } });
  s.addText("제안하는 다음 단계 — 함께 여는 90분 워크숍", { x: 0.85, y: 3.7, w: 11.6, h: 0.45, fontFace: FONTL, fontSize: 17, bold: true, color: C.ICE });
  const qs = [
    ["후보 업무 1개", "ROI가 크고 데이터가 준비된 워크플로 선정"],
    ["데이터·보안 요건", "리전·규제·민감정보·ID 기준 정리"],
    ["파일럿 스코프·KPI", "GA 서비스로 2~6주 구현 범위·성공 기준"],
  ];
  let qx = 0.85;
  qs.forEach((q, i) => {
    const cw = 3.75;
    s.addShape(pptx.ShapeType.roundRect, { x: qx, y: 4.35, w: cw, h: 1.95, rectRadius: 0.08, fill: { color: C.NAVY }, line: { color: C.MID, width: 1 } });
    numBadge(s, qx + 0.3, 4.6, String(i+1), { d: 0.5, fs: 17, fill: C.MID });
    s.addText(q[0], { x: qx + 0.3, y: 5.22, w: cw - 0.6, h: 0.5, fontFace: FONTL, fontSize: 16, bold: true, color: C.WHITE });
    s.addText(q[1], { x: qx + 0.3, y: 5.72, w: cw - 0.6, h: 0.5, fontFace: FONT, fontSize: 11.5, color: C.ICE, lineSpacingMultiple: 1.15 });
    qx += 3.95;
  });
  s.addText([{ text: "함께할 분  ", options: { bold: true, color: C.SUBLT } }, { text: "업무 오너 · 데이터 · 보안/컴플라이언스 · IT      ", options: { color: C.ICE } }, { text: "산출물  ", options: { bold: true, color: C.SUBLT } }, { text: "파일럿 설계서 1장", options: { color: C.ICE } }], { x: 0.85, y: 6.5, w: 11.6, h: 0.4, fontFace: FONT, fontSize: 11.5, valign: "middle" });
  footer(s, 31, true);
}

// ---------- 발표 스크립트 (스피커 노트) ----------
// 인덱스 = 물리 슬라이드 순서(0=1번 … 31=32번). 전체가 하나의 흐름으로 이어지도록 작성.
// 총 분량 목표 40~50분. 각 노트 앞 [약 N분]은 페이싱 가이드.
const SCRIPT = [
  // 1) 타이틀
  `[약 1분]\n안녕하세요. 오늘은 'Why Build AI on Azure' — 왜 엔터프라이즈 AI를 Azure 위에서 만들어야 하는가를 말씀드리겠습니다. 저는 여러분의 기술 파트너로서, 마케팅 메시지가 아니라 '무엇이 실제로 다른가'를 근거 중심으로 보여드리는 데 초점을 두겠습니다. 오늘 40분 남짓, 데이터·온톨로지·에이전트·거버넌스가 어떻게 하나의 스택으로 이어지는지, 그리고 그것이 왜 신뢰할 수 있는 선택인지 함께 보시죠.\n다음 장에서 오늘의 전체 흐름을 먼저 안내드리겠습니다.`,
  // 2) 아젠다
  `[약 1분]\n오늘은 네 개의 파트로 이야기합니다. 파트 1은 '왜 지금, 왜 Azure인가' — 에이전트 시대로의 전환과 신뢰의 근거입니다. 파트 2는 그 전환을 실제 성과로 잇는 AX 전략, 파트 3은 그 근거가 되는 Enterprise AI Platform을 서비스와 아키텍처로 구체적으로 보여드립니다. 마지막 파트 4는 '그래서 무엇부터 하면 되는가' — 역할별 시나리오와 도입 로드맵입니다. 중간에 편하게 질문 주셔도 됩니다.\n그럼 파트 1부터 시작하겠습니다.`,
  // 3) Divider Part 1
  `[약 20초]\n먼저 파트 1, '왜 지금, 왜 Azure인가'입니다. AI가 어떤 단계까지 왔는지, 그리고 그 변화를 안전하게 담아낼 기반이 왜 중요한지부터 짚겠습니다.`,
  // 4) AI 3세대
  `[약 1.5분]\nAI는 크게 세 세대를 거쳐 왔습니다. 1세대는 예측 AI — 수요·이탈·리스크를 데이터로 예측했습니다. 2세대는 생성 AI — 문서·코드·이미지 같은 콘텐츠를 만들어냈죠. 그리고 지금 우리가 서 있는 3세대가 에이전트 AI입니다. 답을 주는 걸 넘어, 스스로 계획하고 실제 업무를 대신 실행합니다.\n여기서 중요한 변화가 있습니다. AI가 '대신 실행'하는 순간, 데이터에 접근하고 시스템을 호출하고 결정을 내립니다. 그래서 데이터·모델·거버넌스가 한 스택에서 이어져 있느냐가 안전한 운영의 전제가 됩니다. 즉 '무엇을 쓰느냐'만큼 '어디서 구축·운영하느냐'가 핵심 질문이 되는 겁니다. 이 관점을 오늘 계속 가지고 가겠습니다.\n그럼 에이전트가 구체적으로 무엇을 바꾸는지 보겠습니다.`,
  // 5) 에이전트가 바꾸는 것 + 왜 지금
  `[약 2분]\n왼쪽 표를 보시면 변화가 분명합니다. 사람이 직접 처리하던 업무를 에이전트가 대신 실행하고, 사람이 도구를 조작하던 걸 에이전트가 API로 직접 호출합니다. 확장은 인력 증원이 아니라 에이전트 확장으로, 업무시간에 묶여 있던 처리 속도가 24시간 상시 실행으로 바뀝니다.\n그런데 'AI가 좋은 건 알겠는데 왜 하필 지금이냐'고 물으실 수 있습니다. 오른쪽 네 가지 압력 때문입니다. 첫째 프론티어 모델이 복잡한 업무를 맡길 수준으로 성숙했고, 둘째 경쟁사의 도입 격차가 곧 시장 격차로 벌어지고 있습니다. 셋째 데이터 준비를 미룰수록 부채처럼 비용이 쌓이고, 넷째 이미 현장에는 통제 밖의 Shadow AI 사용이 시작됐습니다.\n그리고 핵심은 — 이미 M365·GitHub·Fabric을 쓰고 계시다면, '지금' 시작하기 가장 가까운 곳이 바로 그 위에 얹히는 Azure라는 점입니다.\n그럼 실제 도입을 막는 벽들을 보겠습니다.`,
  // 6) 5개의 벽
  `[약 1.5분]\n현장에서 AI 도입을 막는 벽은 대개 다섯 가지입니다. 첫째 데이터의 벽 — 데이터가 흩어져 사일로에 갇혀 AI가 쓸 준비가 안 돼 있습니다. 둘째 신뢰의 벽 — 환각·보안·규제 때문에 '믿고 맡길 수 있나'가 걸립니다. 셋째 통합의 벽 — 기존 시스템·업무와 어떻게 연결하느냐죠. 넷째 인재·역량의 벽 — 만들 사람도, 운영할 체계도 부족합니다. 다섯째 확장의 벽 — PoC까지는 성공해도 전사 확장이 안 됩니다.\n오늘 제가 드리고 싶은 질문은 이겁니다. 이 다섯 개의 벽을 '따로따로'가 아니라 '하나의 스택에서' 넘을 수 있는가. 다음 장부터 Azure가 각 벽에 어떻게 답하는지 하나씩 보겠습니다.`,
  // 7) 4대 신뢰 근거
  `[약 2분]\nAzure를 신뢰할 수 있는 근거를 네 가지로 정리했습니다. 첫째 AI 리더십 — 프론티어 모델인 OpenAI부터 오픈 모델까지, Microsoft Foundry 모델 카탈로그에서 안전하게 골라 운영합니다. 둘째 Responsible AI — 안전·책임이 나중에 붙는 게 아니라 설계부터 내장돼 있고, Content Safety·Entra·Purview·Defender로 뒷받침됩니다. 셋째 End-to-End 완결 스택 — 데이터부터 에이전트, 운영까지 하나의 스택에서 이어집니다. 넷째 개발자 생태계 — 이미 많은 조직이 쓰는 GitHub 위에서 앱과 에이전트를 바로 구축·운영합니다.\n그리고 이 네 가지가 특히 강해지는 지점이 있습니다. 이미 M365·Entra·GitHub·Fabric을 쓰고 계신 조직에겐, 이것들이 '새로 만드는 것'이 아니라 '쓰던 것' 위에 안전하게 얹힌다는 점입니다.\n다만 이런 얘기는 다소 추상적으로 들릴 수 있죠. 그래서 다음 장에서 '구체적으로 무엇이 다른가'를 보여드리겠습니다.`,
  // 8) 구체적으로 무엇이 다른가
  `[약 2분]\n'신뢰할 수 있다'를 구체적인 네 가지로 풀면 이렇습니다. 첫째, 데이터는 여러분의 것입니다. 고객의 입력·출력을 파운데이션 모델 학습에 사용하지 않는 것을 원칙으로 하고, 한국 리전을 우선 설계하며 테넌트 격리를 적용합니다. 다만 데이터 상주·약관은 서비스·모델별로 확인이 필요하다는 점은 정확히 말씀드립니다. 둘째, 모델 선택의 자유 — Foundry 모델 카탈로그에서 프론티어·오픈소스·산업별 모델을 운영 가능한 방식으로 바꿔 씁니다. 셋째, 이미 가진 스택 위에서 — M365·GitHub·Fabric은 연동 가치로 얹히고, 이 기준을 실제로 책임지는 엔진은 Azure입니다. 원본을 옮기지 않고 '연결'부터 시작합니다. 넷째, AI를 감싸는 보안·거버넌스 — Entra·Purview·Defender, 그리고 에이전트 통제를 위한 Agent 365가 전 계층을 관통합니다. Agent 365는 2026년 5월 GA 예정입니다.\n결국 핵심은 '어디서 구축·운영하느냐'입니다. 이제 신뢰의 토대인 Responsible AI를 조금 더 보겠습니다.`,
  // 9) Responsible AI
  `[약 1.5분]\nMicrosoft의 Responsible AI는 슬로건이 아니라 다섯 개의 설계 원칙으로 제품에 구현돼 있습니다. 공정성은 모델 평가·편향 탐지 도구로, 신뢰성·안전은 Content Safety와 평가 파이프라인으로 확인합니다. 개인정보·보안은 앞서 말씀드린 데이터 학습 미사용과 리전 격리로 지키고, 투명성은 추적·관측으로, 책임성은 Entra·Purview·Defender 연동으로 거버넌스와 통제를 겁니다.\n다시 한 번 정확히 말씀드리면, 고객 데이터로 파운데이션 모델을 학습하지 않으며, 서비스·모델·리전별 조건을 확인한 전제에서 테넌트·리전 격리 원칙을 적용합니다.\n이 원칙들이 실제 의사결정 기준으로 어떻게 이어지는지, 다음 장의 여섯 가지 판단 기준에서 정리하겠습니다.`,
  // 10) 6가지 판단 기준
  `[약 2분]\nAI 플랫폼을 고르실 때 이 여섯 가지를 체크리스트로 쓰시길 권합니다. 첫째 데이터 주권 — 데이터가 어디에 머무는가. Azure는 리전·테넌트 격리와 학습 미사용으로 답합니다. 둘째 보안 경계 — 조직 보안·ID 안에서 도는가. Entra·Purview·Defender죠. 셋째 모델 선택·운영 — 최신 모델을 바꿔 쓸 수 있나. Foundry 모델 카탈로그입니다. 넷째 거버넌스 — 누가 무엇을 쓰는지 통제되나. Agent 365와 Purview 감사입니다. 다섯째 통합 가치 — 이미 쓰는 시스템과 연결되나. M365·GitHub·Fabric 연동이고요. 여섯째 비용 예측성 — 확장할 때 비용이 통제되나. 관리형 서비스로 작게 시작해 확장합니다.\n어느 플랫폼을 검토하시든 이 여섯 기준으로 비교해 보시면 판단이 훨씬 명확해집니다. 다음은 이 모든 것을 관통하는 Azure의 관점을 짧게 정리하겠습니다.`,
  // 11) Azure의 관점 3원칙 + FAQ
  `[약 1.5분]\n저희가 고객과 일하는 관점은 세 가지 원칙으로 요약됩니다. 첫째 성과 우선 — 목표는 벤더 교체가 아니라 비즈니스 성과입니다. 둘째 기존 투자 보호 — 원본은 그대로 두고 AI가 쓰도록 '연결'합니다. 셋째 작게 시작해 확장 — 한 업무에서 검증한 뒤 패턴을 넓힙니다.\n오른쪽은 초기 미팅에서 자주 받는 네 가지 질문에 대한 짧은 답입니다. 기존 투자는 옮기지 않고 연결부터, 보안·규제는 리전·테넌트 격리와 학습 미사용, 비용은 작게 시작해 성과로 확장, 어디부터는 ROI 높은 한 업무부터입니다.\n여기까지가 '왜 Azure인가'였습니다. 이제 파트 2에서, 이 신뢰를 어떻게 실제 성과로 잇는지 — AX 전략을 보겠습니다.`,
  // 12) Divider Part 2
  `[약 20초]\n파트 2, AX 전략과 비즈니스 가치입니다. 기술 자체가 아니라 '일하는 방식'을 어떻게 바꾸느냐의 이야기입니다.`,
  // 13) AX 3대 전략
  `[약 2분]\nAI Transformation, AX는 세 개의 축으로 움직입니다. 첫째 업무를 재설계하는 것 — 기존 프로세스에 AI를 얹는 데서 그치지 않고, 에이전트를 중심으로 업무 자체를 다시 설계합니다. 둘째 직원을 강화하는 것 — 모든 직원이 Copilot으로 단순 작업에서 벗어나 더 높은 가치의 일에 집중합니다. 셋째 에이전트를 확장하는 것 — 검증된 에이전트를 전사로 넓히고 안전하게 운영합니다.\n중요한 건 이 세 축이 순서가 아니라는 점입니다. 동시에 맞물려 돌아가면서 업무·사람·에이전트가 함께 진화합니다.\n그런데 '에이전트를 운영한다'는 게 막연하게 느껴질 수 있는데요, 저는 이걸 아주 직관적인 비유로 설명드리길 좋아합니다. 다음 장입니다.`,
  // 14) 디지털 직원
  `[약 1.8분]\n에이전트를 '새로 합류한 디지털 직원'이라고 생각해 보십시오. 그러면 필요한 것이 분명해집니다. 직원에게 업무 지식이 필요하듯 에이전트에겐 데이터·온톨로지 이해가 필요하고, 이건 Fabric·OneLake와 세 개의 IQ가 제공합니다. 일할 도구는 Foundry Tools와 커넥터로, 판단·실행을 위한 모델은 Foundry 모델 카탈로그로 얻습니다. 소속과 권한은 Entra Agent ID로 부여하고, 성과·안전 관리는 Purview·Defender와 평가로 합니다. 채용·교육·근무·인사관리가 그대로 대응되는 거죠.\n다만 반드시 강조드릴 점은 — 최종 책임과 권한은 사람에게 있고, 에이전트는 그 통제·감사 체계 안에서 움직인다는 것입니다. 그리고 그 모든 걸 Azure가 한 기반에서 제공합니다.\n그럼 이 이야기의 '근거'가 되는 실제 플랫폼을, 파트 3에서 구체적으로 보겠습니다.`,
  // 15) Divider Part 3
  `[약 20초]\n파트 3입니다. 지금까지 말씀드린 신뢰와 전략이 '실제로 이런 서비스와 아키텍처로 구현된다'는 근거를 보여드리는 파트입니다. 조금 기술적이지만 핵심만 짚겠습니다.`,
  // 16) 6개 서비스 미리보기
  `[약 1.5분]\nEnterprise AI Platform을 완성하는 핵심 서비스는 여섯 개입니다. 데이터 기반의 Microsoft Fabric·OneLake, 의미를 이해하는 지능 레이어인 세 개의 IQ와 Azure AI Search, 에이전트를 만들고 운영하는 Microsoft Foundry, 현업이 코드 없이 에이전트를 만드는 Copilot Studio, 일하는 현장에 통합되는 Microsoft 365·Agent 365, 그리고 개발 생태계인 GitHub Copilot입니다.\n여기서 정확히 말씀드릴 점 하나 — 세 개의 IQ, 즉 Fabric IQ·Work IQ·Foundry IQ는 아직 Preview 단계입니다. 발표 시점 기준 GA 여부와 한국 리전 지원은 꼭 재확인하시길 권합니다. 나머지는 대부분 GA입니다.\n이제 각 서비스를 데이터부터 순서대로 보겠습니다.`,
  // 17) Fabric · OneLake
  `[약 1.5분]\n모든 것의 시작은 데이터입니다. Microsoft Fabric의 OneLake는 흩어진 데이터를 하나의 '논리적' 레이크로 통합합니다. 핵심은 복사·이동이 아니라 있는 자리에서 연결하는 Shortcut 방식이라는 점입니다. 원본은 그대로 두고 논리적으로 하나로 묶으니 기존 투자가 보호됩니다. 100개가 넘는 커넥터로 다양한 소스를 자동 수집·정제하고, Delta·Parquet 같은 개방형 포맷을 써서 특정 벤더에 잠기지 않습니다.\n한마디로 '데이터를 옮기지 않고도 AI가 쓸 수 있게' 만드는 게 이 계층의 역할이고, 이게 시작점입니다. 이제 이 데이터에 '의미'를 입히는 지능 레이어를 보겠습니다.`,
  // 18) 3개 IQ + AI Search
  `[약 2분]\n데이터가 모였다고 AI가 바로 잘 쓰는 건 아닙니다. 데이터가 '무엇을 뜻하는지' 의미를 알아야 하죠. 그 역할을 세 개의 IQ가 나눠 맡습니다. Fabric IQ는 테이블·컬럼이 무엇을 뜻하는지 데이터의 의미를, Work IQ는 M365 속 업무·협업의 맥락을, Foundry IQ는 에이전트가 참조할 지식을 관리합니다. 이 셋이 합쳐지면 '데이터 + 업무 + 지식'을 모두 아는, 비즈니스를 이해하는 지능이 됩니다.\n다시 한 번, 이 세 IQ는 Preview 단계라는 점 기억해 주십시오. 그리고 이 지능을 아래에서 떠받치는 게 Azure AI Search입니다. 이건 GA이고, 검색·검색증강(RAG) 엔진으로 에이전트가 정확한 근거를 찾도록 해서 환각을 줄입니다.\n의미를 알게 됐으니, 이제 이걸 실제 에이전트로 만드는 '공장'을 보겠습니다.`,
  // 19) Foundry
  `[약 1.5분]\nMicrosoft Foundry는 AI 앱과 에이전트를 만들고 운영하는 통합 플랫폼입니다. 중요한 건 '실험'이 아니라 '운영'을 전제로 설계됐다는 점입니다. 네 가지가 한 곳에 있습니다. 모델 카탈로그로 OpenAI 프론티어부터 오픈 모델까지 골라 쓰고, Agent Service로 에이전트를 만들고 배포하며, 평가와 Observability로 품질·안전을 지속 측정하고, Content Safety로 안전 가드레일을 내장합니다.\n모델 선택부터 개발, 평가, 안전까지 한 곳에서 — 그래서 저는 이걸 에이전트를 '운영'하는 공장이라고 부릅니다. GA 서비스입니다.\n이제 만든 에이전트를 어디서 만들고, 어디서 일하게 하고, 어떻게 개발 생산성을 높이는지 세 서비스를 묶어 보겠습니다.`,
  // 20) ④⑤⑥
  `[약 1.8분]\n세 서비스가 각각 '만들고, 일하고, 개발하는' 역할을 맡습니다. 넷째 Copilot Studio는 현업·IT를 위한 에이전트 빌더입니다. 코드 없이 업무 에이전트를 만들고 M365·Teams로 바로 게시하며 Foundry와 상호운용됩니다. 다섯째 Microsoft 365·Agent 365는 일하는 현장의 에이전트입니다. Teams·Outlook 같은 업무 흐름 안에서 에이전트를 쓰고, Agent 365로 전사의 에이전트를 관리·운영하며 Entra·Purview로 통제합니다. Agent 365는 2026년 5월 GA 예정입니다. 여섯째 GitHub Copilot은 에이전트를 만드는 개발 생산성입니다. 세계 최대 개발 생태계 위에서 코딩 에이전트로 개발을 가속하고 Foundry와 함께 앱·에이전트를 구축합니다.\n여기까지가 개별 서비스였고, 이제 이 서비스들이 어떻게 하나의 아키텍처로 쌓이는지 전체 그림을 보겠습니다.`,
  // 21) 6계층 아키텍처
  `[약 2분]\n이 그림 한 장이 오늘 발표의 뼈대입니다. 아래에서 위로 읽으시면 됩니다. 맨 아래 Data 계층에서 100개 넘는 커넥터와 Shortcut으로 데이터 원천을 연결하고, OneLake에서 단일 데이터 레이크로 통합합니다. 그 위 Ontology·Intelligence 계층에서 세 개의 IQ와 AI Search가 의미를 부여하고, Agent Factory에서 Copilot Studio와 Foundry로 에이전트를 만듭니다. 그렇게 만든 에이전트가 Agents 계층에서 동작하고, 맨 위 Experience 계층에서 M365·Teams를 통해 사용자와 만납니다. 즉 데이터가 위로 올라가며 '지능 → 에이전트 → 경험'으로 실현되는 구조죠.\n그리고 오른쪽을 보시면 Governance & Security가 이 여섯 계층 전체를 세로로 관통합니다 — Entra·Purview·Defender·Monitor로요. 보안이 한 층이 아니라 전 계층에 걸쳐 있다는 게 핵심입니다.\n같은 흐름을 '데이터의 여정'으로 한 번 더 정리해 보겠습니다.`,
  // 22) 데이터의 여정 6단계
  `[약 1.2분]\n방금 아키텍처를 데이터 입장에서 여섯 단계로 풀면 이렇습니다. 수집 — 흩어진 원천을 연결하고, 통합 — OneLake로 하나의 레이크를 만들고, 의미 부여 — 온톨로지와 세 IQ로 의미화하고, 에이전트화 — Foundry·Copilot Studio로 제작하고, 실행 — 업무 현장에서 자동화하고, 마지막으로 통제 — Governance로 상시 관측합니다.\n데이터가 원천에서 성과까지 어떻게 흘러가는지를 한 줄로 보여드리는 장입니다. 다음은 각 계층을 '비즈니스 가치'와 '실현 서비스'로 나란히 정리한 표입니다.`,
  // 23) 계층별 요약
  `[약 1분]\n이 표는 각 계층을 두 가지 관점으로 봅니다 — 왼쪽은 '무엇을 위한 것인가'라는 비즈니스 가치, 오른쪽은 '무엇으로 실현하는가'라는 Azure 서비스입니다. 예를 들어 Experience는 일하는 곳에서 바로 쓰는 경험이고 M365·Teams로 실현되며, Agents는 업무를 대신 실행하는 디지털 직원이고 Foundry Agent Service로 구현됩니다. 가치부터 보고 서비스로 내려오는 순서로 읽으시면 됩니다.\n이제 이 플랫폼 위에서 '개발' 자체가 어떻게 빨라지는지 보겠습니다.`,
  // 24) Agentic DevOps
  `[약 1.3분]\n에이전트를 만드는 개발 과정도 에이전트가 돕습니다. 계획 단계에서 이슈·요구사항을 정리하고, 개발 단계에서 Copilot이 코드 초안을 만들고, 리뷰 단계에서 자동 리뷰·보안 점검을 하고, 배포 단계에서 CI/CD로 안전하게 릴리스합니다. 중요한 건 아래 카드입니다 — GitHub Copilot에 Secret Protection과 Code Security가 함께 들어갑니다. 즉 개발 속도를 높이면서도 코드 보안·시크릿 보호를 파이프라인에 내장하는 거죠. 속도와 안전을 맞바꾸지 않는다는 점이 핵심입니다.\n그리고 이 모든 걸 관통하는 거버넌스를 다음 장에서 정리하겠습니다.`,
  // 25) Governance
  `[약 1.5분]\n거버넌스는 특정 계층이 아니라 전 계층을 가로지릅니다. Responsible AI를 '원칙'이 아니라 실제 '동작'으로 만드는 네 개의 축입니다. Entra Agent ID는 에이전트에게도 신원과 권한을 부여하고 통제합니다. Purview는 민감정보 분류와 데이터 정책, 감사를 담당하고, Defender는 AI 워크로드의 위협을 탐지·대응하며, Azure Monitor는 성능·품질·안전을 지속 관측합니다.\n특히 강조드리고 싶은 건 — 이 네 가지는 모두 GA라는 점입니다. 미래의 약속이 아니라, 지금 바로 표준 거버넌스로 시작하실 수 있습니다.\n다음 장에서 지금까지의 서비스를 성숙도까지 포함해 한 표로 총정리하겠습니다.`,
  // 26) 서비스 맵
  `[약 50초]\n이 표는 계층별 핵심 서비스와 성숙도를 한눈에 정리한 참조용 슬라이드입니다. 보시다시피 경험·에이전트 제작·검색·데이터·개발·거버넌스 대부분이 GA이고, Agent 365는 2026년 5월 GA 예정입니다. 유일하게 Preview인 것이 세 개의 IQ입니다. 그래서 다시 한 번 — Fabric IQ·Work IQ·Foundry IQ는 발표 시점에 GA 여부와 한국 리전을 재확인하시길 권합니다. 나머지는 지금 GA로 시작 가능합니다.\n여기까지가 '근거'였고, 이제 마지막 파트 4 — 그래서 무엇부터 하느냐로 넘어가겠습니다.`,
  // 27) Divider Part 4
  `[약 20초]\n마지막 파트 4입니다. 지금까지의 이야기를 '누가 무엇을 얻고, 어디서부터 시작하는가'로 정리하겠습니다.`,
  // 28) Personas
  `[약 1.5분]\n이 플랫폼이 역할별로 무엇을 주는지 보겠습니다. 경영진께는 KPI·리스크를 한눈에 보는 성과 가시성을, 현업 담당자께는 Copilot Studio로 직접 만드는 반복업무 자동화를 드립니다. 개발자는 GitHub Copilot·Foundry로 개발 생산성을 얻고, IT·보안 조직은 Entra·Purview로 '통제 가능한 확산'을 얻습니다.\n여기서 중요한 균형이 있습니다 — 현업의 자율성과 IT의 통제가 충돌하지 않고, 한 플랫폼 안에서 양립한다는 점입니다.\n그럼 실제 어떤 업무부터 시작할 수 있는지 시나리오로 보겠습니다.`,
  // 29) 시나리오 6개
  `[약 1.3분]\n바로 시작할 수 있는 대표 업무 여섯 개입니다. 보고서·리서치 자동 작성, 내부 지식 Q&A 어시스턴트, 업무 프로세스 자동화, 전사 에이전트 관리·운영, 데이터 분석·인사이트, 그리고 개발 가속입니다. 표시된 것처럼 3번·5번은 Preview인 Work IQ·Fabric IQ가 관련되지만, 첫 번째 시나리오인 보고서·리서치 자동 작성은 이미 GA 서비스만으로 구현이 가능합니다. 그래서 저희는 보통 여기서 시작해 패턴을 확장하시길 권합니다.\n그럼 그 시작을 어떻게 단계적으로 밟는지, 로드맵을 보겠습니다.`,
  // 30) 로드맵 4단계
  `[약 1.8분]\n도입은 네 단계로, 작게 시작해 안전하게 확장합니다. 1단계 Envision, 0~2주 — ROI가 높은 한 업무를 정하고 데이터·보안 요건을 정리합니다. 2단계 Pilot, 2~6주 — GA 서비스만으로 대표 시나리오 하나를 실제로 구현·검증합니다. 3단계 Scale, 6주 이후 — 검증된 패턴을 인접 업무로 넓힙니다. 4단계 Govern은 상시로, Entra·Purview·Defender로 통제·관측을 정착시킵니다.\n아래 Quick Win 박스가 실무적으로 중요합니다 — 워크숍에 딱 세 가지만 준비해 오시면 됩니다. 데이터 소스 2개, 보안 요구사항, 그리고 ROI 후보 업무 1개. 이것만 있으면 바로 파일럿 설계를 시작할 수 있습니다.\n이제 오늘 내용을 일곱 가지로 압축하겠습니다.`,
  // 31) Key Takeaways
  `[약 1.3분]\n오늘 말씀드린 걸 일곱 가지로 요약하겠습니다. 하나, AI는 대화를 넘어 '실행하는' 에이전트 시대로 전환했습니다. 둘, 도입을 막는 다섯 개의 벽은 따로가 아니라 하나의 완결 스택으로 넘습니다. 셋, 왜 Azure인가는 데이터 주권·보안 경계·모델 운영·거버넌스·비용을 한 기반에서 통제하기 때문입니다. 넷, 여섯 개 서비스가 데이터에서 에이전트, 경험까지 완성합니다. 다섯, 거버넌스는 전 계층을 관통하는 GA 기반입니다. 여섯, GA 서비스만으로 대표 시나리오를 지금 시작할 수 있습니다. 일곱, 작게 시작해 검증된 패턴을 안전하게 확장합니다.\n한 문장으로 — Azure는 신뢰할 수 있는 Enterprise AI Platform입니다. 마지막으로, 그래서 다음 단계를 제안드리겠습니다.`,
  // 32) Closing 90분 워크숍
  `[약 1.5분]\n오늘의 결론을 한 문장으로 남기면 — Azure는 데이터·에이전트·거버넌스를 하나의 스택으로 잇는, 신뢰할 수 있는 Enterprise AI Platform입니다. 그리고 발표로 끝내지 않고, 구체적인 다음 단계를 제안드립니다. 90분짜리 워크숍입니다. 발표가 아니라 함께 답을 찾는 기술 워킹 세션이고요, 세 가지를 함께 정합니다 — 첫째 후보 업무 한 개, 둘째 데이터·보안 요건, 셋째 파일럿 스코프와 KPI입니다. 참석은 업무 오너·데이터 담당·보안/컴플라이언스·IT 네 분이면 충분하고, 산출물은 파일럿 설계서 한 장입니다.\n오늘 나눈 이야기를 여러분의 실제 업무 위에 올려 보는 자리로 이어가면 좋겠습니다. 감사합니다. 질문 받겠습니다.`,
];

async function run() {
  await buildIcons();
  main();
  part1(); part1b(); part1c();
  part2();
  part3a(); part3b(); part3c(); part3d(); part3e(); part3f();
  part4(); part4b();
  pptx.slides.forEach((sl, i) => { if (SCRIPT[i]) sl.addNotes(SCRIPT[i]); });
  if (pptx.slides.length !== SCRIPT.length) {
    console.warn("WARN slide/script mismatch: slides=" + pptx.slides.length + " script=" + SCRIPT.length);
  }
  const OUT = VERSION + "-why-build-ai-on-azure.pptx";
  await pptx.writeFile({ fileName: OUT });
  console.log("WROTE " + OUT);
}
run().catch(e => { console.error(e); process.exit(1); });
