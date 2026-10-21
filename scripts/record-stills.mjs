#!/usr/bin/env node
/**
 * Records the site's stills from the journey itself:
 *   public/og.jpg    the link preview (1200×630): the constellation, titled;
 *   public/still.jpg what a browser without 3D shows behind its message: the dusk beach, the tanks pouring.
 *
 * Usage (with `npm run build && npm run preview` serving on :4173):
 *   node scripts/record-stills.mjs [--url http://localhost:4173]
 */
import { chromium } from '@playwright/test';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const i = args.indexOf('--url');
const url = i >= 0 ? args[i + 1] : 'http://localhost:4173';
const root = resolve(import.meta.dirname, '..');

const STILLS = [
  {
    file: 'og.jpg',
    size: [1200, 630],
    beat: 'finale:end',
    at: 4.5,
    // The title, set as the landing page sets it, low in the frame under the stars.
    title: true,
  },
  { file: 'still.jpg', size: [1600, 900], beat: 'pythagoras:pour', at: 4.5 },
];

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
for (const s of STILLS) {
  const [width, height] = s.size;
  const page = await browser.newPage({ viewport: { width, height } });
  await page.addInitScript(() =>
    window.localStorage.setItem(
      'sand-to-stars:prefs',
      JSON.stringify({ autoContinue: false, captionsOn: false }),
    ),
  );
  const slug = s.beat.split(':')[0];
  await page.goto(`${url}/play/${slug}?quality=high`);
  await page.waitForFunction(() => !!window.__journey, null, { timeout: 60_000 });
  await page.addStyleTag({ content: '.overlay, .grain { display: none !important; }' });
  await page.evaluate((key) => {
    const j = window.__journey;
    j.pause();
    j.seek(j.beats.find((b) => b.key === key).start);
  }, s.beat);
  await page.evaluate((t) => window.__journey.seek(window.__journey.time() + t), s.at);
  // Let the particles settle into their shape.
  await page.waitForTimeout(10_000);
  if (s.title) {
    await page.evaluate(() => {
      const card = document.createElement('div');
      card.style.cssText =
        'position:fixed;inset:0;display:grid;place-items:end center;padding-bottom:56px;text-align:center;z-index:5;' +
        'background:linear-gradient(to top, rgba(10,11,14,0.85), rgba(10,11,14,0) 55%)';
      card.innerHTML =
        '<div><h1 class="landing__title" style="font-size:96px">From Sand to <em>Stars</em></h1>' +
        '<p class="landing__sub" style="margin:14px auto 0;font-size:22px;max-width:960px">Ten theorems of ' +
        'mathematics and physics, told as one cinematic journey.</p></div>';
      document.body.appendChild(card);
    });
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: join(root, 'public', s.file), type: 'jpeg', quality: 84, timeout: 120_000 });
  console.log(`${s.file} (${width}×${height}) from ${s.beat}`);
  await page.close();
}
await browser.close();
