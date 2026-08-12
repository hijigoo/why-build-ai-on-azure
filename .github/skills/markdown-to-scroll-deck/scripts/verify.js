#!/usr/bin/env node
/**
 * scroll-deck 검증기
 *
 *   node verify.js <url> [--shots 1,5,12] [--density] [--out DIR]
 *
 * 확인 항목
 *   - 슬라이드 내용 넘침 (.s-body overflow) — 0이어야 한다
 *   - 16:9 유지 / 슬라이드가 시트를 벗어나는지
 *   - 아이콘 <use> 참조 누락
 *   - 콘솔·페이지 에러
 *   - (--density) 슬라이드별 본문 글자 수
 *
 * 넘침은 스크린샷으로 안 보인다. 반드시 이걸로 잡는다.
 */
const path = require('path');

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--'));
if (!url) {
  console.error('usage: node verify.js <url> [--shots 1,5,12] [--density] [--out DIR]');
  process.exit(1);
}
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const shots = (flag('--shots') || '').split(',').map((n) => parseInt(n, 10)).filter(Boolean);
const outDir = flag('--out') || '.';
const wantDensity = args.includes('--density');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  // 스크립트를 다른 디렉터리에서 실행하면 상대 경로로는 못 찾는다.
  // npm root -g / 현재 작업 디렉터리 순으로 다시 찾아본다.
  const { execSync } = require('child_process');
  const candidates = [];
  try { candidates.push(execSync('npm root -g', { encoding: 'utf8' }).trim()); } catch (_) {}
  candidates.push(path.join(process.cwd(), 'node_modules'));
  for (const base of candidates) {
    try {
      ({ chromium } = require(path.join(base, 'playwright')));
      break;
    } catch (_) {}
  }
  if (!chromium) {
    console.error('playwright를 찾을 수 없습니다. 설치:');
    console.error('  npm i playwright && npx playwright install chromium');
    console.error('설치한 디렉터리에서 실행하거나 NODE_PATH를 지정하세요.');
    process.exit(2);
  }
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  // 웹폰트가 로드되면 줄바꿈이 달라져 넘침 여부가 바뀐다
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(600);

  const summary = await page.evaluate(() => {
    const chapters = document.querySelectorAll('.chapter').length;
    const sheets = document.querySelectorAll('.sheet').length;
    const notes = document.querySelectorAll('.note-body').length;
    const uses = Array.from(document.querySelectorAll('use'));
    const missing = uses
      .filter((u) => !document.getElementById((u.getAttribute('href') || '').replace('#', '')))
      .map((u) => u.getAttribute('href'));
    return { chapters, sheets, notes, icons: uses.length, missingIcons: missing };
  });

  // 각 시트를 순서대로 화면에 올려 애니메이션을 끝낸 뒤 측정한다
  const problems = [];
  const density = [];
  const total = summary.sheets;

  for (let i = 0; i < total; i++) {
    await page.evaluate((n) => {
      const c = document.querySelectorAll('.chapter')[n];
      if (c) c.scrollIntoView({ block: 'start' });
    }, i);
    await page.waitForTimeout(i === 0 ? 900 : 320);

    const r = await page.evaluate((n) => {
      const ch = document.querySelectorAll('.chapter')[n];
      if (!ch) return null;
      const sheet = ch.querySelector('.sheet');
      const slide = ch.querySelector('.sheet .slide');
      const body = ch.querySelector('.s-body');
      const frame = ch.querySelector('.frame');
      const title = (ch.querySelector('.ch-t') || {}).textContent || '';
      const issues = [];

      if (sheet) {
        const sr = sheet.getBoundingClientRect();
        const ratio = sr.width / sr.height;
        if (Math.abs(ratio - 16 / 9) > 0.02) issues.push('ratio ' + ratio.toFixed(3));
        if (slide) {
          const lr = slide.getBoundingClientRect();
          if (lr.width > sr.width + 1.5 || lr.height > sr.height + 1.5) issues.push('slide overflows sheet');
        }
      }
      if (body && body.scrollHeight > body.clientHeight + 2) {
        issues.push('body +' + (body.scrollHeight - body.clientHeight) + 'px');
      }
      if (frame && frame.scrollHeight > 1080 + 2) {
        issues.push('frame +' + (frame.scrollHeight - 1080) + 'px');
      }
      const chars = frame ? frame.textContent.replace(/\s+/g, ' ').trim().length : 0;
      return { n: n + 1, title: title.trim(), issues, chars };
    }, i);

    if (!r) continue;
    density.push(r);
    if (r.issues.length) problems.push(r);
  }

  // ── 리포트 ───────────────────────────────────────────────
  console.log('구성      chapters=%d  sheets=%d  notes=%d  icons=%d',
    summary.chapters, summary.sheets, summary.notes, summary.icons);
  console.log('아이콘참조 %s', summary.missingIcons.length ? '누락 ' + summary.missingIcons.join(', ') : 'OK');
  console.log('에러      %s', errors.length ? errors.join(' | ') : '없음');

  if (!problems.length) {
    console.log('레이아웃  전 슬라이드 정상 (넘침 0 / %d)', total);
  } else {
    console.log('레이아웃  넘침 %d / %d', problems.length, total);
    problems.forEach((p) => console.log('   #%s %s  →  %s', String(p.n).padStart(2), p.title.slice(0, 40), p.issues.join(', ')));
  }

  if (wantDensity) {
    console.log('\n밀도 상위 (본문 글자 수, 500 넘으면 압축 검토)');
    density.sort((a, b) => b.chars - a.chars).slice(0, 12)
      .forEach((d) => console.log('   %s  #%s %s', String(d.chars).padStart(4), String(d.n).padStart(2), d.title.slice(0, 46)));
  }

  if (shots.length) {
    for (const n of shots) {
      await page.evaluate((i) => {
        const c = document.querySelectorAll('.chapter')[i - 1];
        if (c) c.scrollIntoView({ block: 'start' });
      }, n);
      await page.waitForTimeout(1300);
      const file = path.join(outDir, `shot-${String(n).padStart(2, '0')}.png`);
      await page.screenshot({ path: file });
      console.log('스크린샷  %s', file);
    }
  }

  await browser.close();

  const failed = problems.length || summary.missingIcons.length || errors.length;
  process.exit(failed ? 1 : 0);
})();
