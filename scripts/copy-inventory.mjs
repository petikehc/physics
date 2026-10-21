#!/usr/bin/env node
/**
 * Lists every caption the journey shows, with how long it is on screen and how fast it has to be read, for the
 * story editor (.claude/agents/story-editor.md) to check.
 *
 * Usage (with `npm run build && npm run preview` serving on :4173):
 *   node scripts/copy-inventory.mjs [--url http://localhost:4173] [--out copy-inventory.md]
 *
 * How long a caption can be read for:
 *   - a title card's body fades in about 3 s into its beat (after the title has built), so it has the beat less 3 s;
 *   - any other caption's lines rise in over the first half second or so, so it has the beat less 0.6 s;
 *   - flights and Your-turn pauses show no timed caption (Your turn waits for the viewer).
 * The player also runs at 1.25×, which leaves four fifths of that time.
 */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const url = opt('url', 'http://localhost:4173');
const out = resolve(opt('out', 'copy-inventory.md'));

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
await page.goto(`${url}/play?quality=low`);
await page.waitForFunction(() => !!window.__journey, null, { timeout: 60_000 });
const beats = await page.evaluate(() =>
  window.__journey.beats.map((b) => ({
    key: b.key,
    chapter: b.chapter,
    kind: b.kind,
    heading: b.heading ?? '',
    body: b.body ?? '',
    start: b.start,
    end: b.end,
  })),
);
await browser.close();

/** Caption markup like [a:text] colours text; only the text is read. */
const plain = (s) => s.replace(/\[[a-z]+:([^\]]+)\]/g, '$1');
const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);
const fmt = (x, d = 1) => x.toFixed(d);
const clock = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

const rows = [];
for (const b of beats) {
  if (b.kind === 'flight' || b.kind === 'yourTurn') continue;
  const text = `${plain(b.heading)} ${plain(b.body)}`.trim();
  if (!text) continue;
  const length = b.end - b.start;
  const shown = Math.max(length - (b.kind === 'title' ? 3 : 0.6), 0.1);
  const w = words(text);
  rows.push({
    ...b,
    text,
    length,
    shown,
    words: w,
    wps: w / shown,
    wpsFast: w / (shown / 1.25),
    cps: text.length / shown,
  });
}

const lines = [
  '# Copy inventory',
  '',
  `${rows.length} timed captions. "Shown" is how long the caption can be read at 1× (see the script's header); "w/s"`,
  'is the reading speed that needs, at 1× and at 1.25×; "c/s" is characters per second at 1×.',
  '',
  '| Beat | At | Kind | Words | Shown (s) | w/s 1× | w/s 1.25× | c/s 1× |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map(
    (r) =>
      `| ${r.key} | ${clock(r.start)} | ${r.kind} | ${r.words} | ${fmt(r.shown)} | ${fmt(r.wps, 2)} | ${fmt(r.wpsFast, 2)} | ${fmt(r.cps)} |`,
  ),
  '',
  '## The captions in full',
  '',
  ...rows.flatMap((r) => [
    `### ${r.key} (${r.kind}, ${clock(r.start)}–${clock(r.end)}, shown ${fmt(r.shown)} s)`,
    '',
    ...(r.heading ? [`**${plain(r.heading)}**`, ''] : []),
    plain(r.body),
    '',
  ]),
];
writeFileSync(out, `${lines.join('\n')}\n`);
console.log(`${rows.length} captions written to ${out}`);
