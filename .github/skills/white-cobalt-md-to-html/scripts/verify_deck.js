/**
 * Renders a White Cobalt deck at its authored 1920x1080 stage size and reports
 * anything that would look broken in the room.
 *
 * Checks, per slide:
 *   - the slide overflows its own 1920x1080 canvas
 *   - any element escapes the slide bounds
 *   - text is clipped by its own container
 *   - sibling panels visually overlap
 * Plus one global check that the stage still letterboxes 16:9 on a phone.
 *
 * Screenshots land in the output directory so you can eyeball the result —
 * programmatic checks catch geometry, not ugliness. Look at them.
 *
 *   npm install playwright && npx playwright install chromium
 *   node verify_deck.js deck.html [outdir]
 */
const path = require('path');
const fs = require('fs');

// This script lives in the skill directory but playwright is installed in the
// user's project, so a bare require() would resolve against the wrong tree.
// Look in the current working directory first, then the global root.
function loadPlaywright() {
  const roots = [
    path.join(process.cwd(), 'node_modules'),
    process.env.NODE_PATH,
  ].filter(Boolean);
  for (const root of roots) {
    try {
      return require(path.join(root, 'playwright'));
    } catch (_) { /* try the next root */ }
  }
  try {
    return require('playwright');
  } catch (_) {
    console.error(
      'playwright not found. From your project directory run:\n' +
      '  npm install playwright && npx playwright install chromium'
    );
    process.exit(2);
  }
}
const { chromium } = loadPlaywright();

const FILE = process.argv[2];
const OUT = process.argv[3] || 'qa-shots';

if (!FILE) {
  console.error('usage: node verify_deck.js <deck.html> [outdir]');
  process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });

// Panels that sit side by side in a layout. If two of these overlap, the grid
// broke — which a scrollHeight check alone will not tell you.
const PANELS = '.step,.block,.ref,.word,.acc-item,.change,.cols > .col,.outcome > div,.accel > div';
const TEXT = 'h1,h2,h3,h4,p,li,cite,.chip,.pill,.tag,.lx,.band,.acc-box,.quote,.change,.block,.ref,.step';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.resolve(FILE));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500); // webfonts change metrics; measuring early lies

  const count = await page.evaluate(() => document.querySelectorAll('.slide').length);
  console.log(`slides: ${count}`);

  const failed = [];

  for (let i = 0; i < count; i++) {
    // Drive slides directly rather than through the controller so this works
    // even on a half-built deck whose JS has not been wired up yet.
    await page.evaluate((idx) => {
      document.querySelectorAll('.slide').forEach((s, j) => {
        s.classList.toggle('active', j === idx);
        s.classList.toggle('visible', j === idx);
      });
    }, i);
    await page.waitForTimeout(1300); // let the .reveal stagger finish

    const issues = await page.evaluate(({ idx, PANELS, TEXT }) => {
      const slide = document.querySelectorAll('.slide')[idx];
      const sb = slide.getBoundingClientRect();
      const out = [];

      if (slide.scrollHeight > slide.clientHeight + 2) {
        out.push(`OVERFLOW height ${slide.scrollHeight} > ${slide.clientHeight}`);
      }
      if (slide.scrollWidth > slide.clientWidth + 2) {
        out.push(`OVERFLOW width ${slide.scrollWidth} > ${slide.clientWidth}`);
      }

      for (const el of slide.querySelectorAll('*')) {
        if (el.classList.contains('slide-notes')) continue;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        if (r.right > sb.right + 3 || r.left < sb.left - 3 ||
            r.bottom > sb.bottom + 3 || r.top < sb.top - 3) {
          out.push(`ESCAPES <${el.tagName.toLowerCase()}.${el.className}>`);
        }
      }

      for (const el of slide.querySelectorAll(TEXT)) {
        if (el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflow !== 'visible') {
          out.push(`CLIPPED <${el.tagName.toLowerCase()}.${el.className}>`);
        }
      }

      const panels = [...slide.querySelectorAll(PANELS)];
      for (let a = 0; a < panels.length; a++) {
        for (let b = a + 1; b < panels.length; b++) {
          if (panels[a].contains(panels[b]) || panels[b].contains(panels[a])) continue;
          const A = panels[a].getBoundingClientRect();
          const B = panels[b].getBoundingClientRect();
          const ox = Math.min(A.right, B.right) - Math.max(A.left, B.left);
          const oy = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
          if (ox > 4 && oy > 4) out.push(`OVERLAP ${panels[a].className} x ${panels[b].className}`);
        }
      }

      // Orphan last line: Korean has no hyphenation, so a wrapped sentence
      // easily leaves one or two syllables alone on the final line. Group the
      // range's client rects into visual lines before measuring, or inline
      // <span> runs will be miscounted as extra lines.
      for (const el of slide.querySelectorAll('p,li,h2,h4,span,div,b')) {
        if (el.closest('.slide-notes')) continue;
        if (![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
        const rg = document.createRange();
        rg.selectNodeContents(el);
        const rects = [...rg.getClientRects()].filter((x) => x.width > 1 && x.height > 1);
        if (!rects.length) continue;
        const lines = [];
        for (const x of rects) {
          const hit = lines.find((L) => Math.abs(L.top - x.top) < x.height * 0.6);
          if (hit) { hit.left = Math.min(hit.left, x.left); hit.right = Math.max(hit.right, x.right); }
          else lines.push({ top: x.top, left: x.left, right: x.right });
        }
        if (lines.length < 2) continue;
        const w = lines.map((L) => L.right - L.left);
        const ratio = w[w.length - 1] / Math.max(...w);
        if (ratio < 0.34) {
          out.push(`ORPHAN_LINE ${ratio.toFixed(2)} "${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 46)}"`);
        }
      }

      // Session logistics belong in the notes, not on a projected slide.
      if (/All Hands|방향키로 이동|arrow keys to navigate/i.test(slide.innerText || '')) {
        out.push('LOGISTICS_CHROME on slide');
      }
      return out;
    }, { idx: i, PANELS, TEXT });

    await page.screenshot({ path: `${OUT}/slide-${String(i + 1).padStart(2, '0')}.png` });

    if (issues.length) {
      failed.push(i + 1);
      console.log(`[S${i + 1}] ${issues.length} issue(s)`);
      [...new Set(issues)].slice(0, 6).forEach((x) => console.log('   -', x));
    } else {
      console.log(`[S${i + 1}] ok`);
    }
  }

  // The stage must letterbox, never reflow. A drifting ratio means someone
  // added a responsive breakpoint inside the stage.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  const ratio = await page.evaluate(() => {
    const r = document.getElementById('deckStage').getBoundingClientRect();
    return +(r.width / r.height).toFixed(3);
  });
  console.log(`\nphone stage ratio: ${ratio} ${ratio === 1.778 ? 'OK 16:9' : 'RATIO DRIFT'}`);
  if (ratio !== 1.778) failed.push('ratio');

  console.log(`\nshots: ${path.resolve(OUT)}`);
  console.log(`slides with issues: ${failed.length}`);
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})();
