#!/usr/bin/env node
/**
 * Records the landing page's teaser: a silent loop of a few seconds from each chapter, cut from the journey itself.
 * The world's clocks are taken off real time (window.__film) and stepped exactly one frame at a time, so the motion
 * is smooth however slowly the frames render (no GPU needed). Each clip crossfades into the next; the loop fades
 * out and back in at its seam.
 *
 * Usage (with `npm run build && npm run preview` serving on :4173; needs ffmpeg):
 *   node scripts/record-teaser.mjs [--url http://localhost:4173] [--only landscape|portrait] [--keep]
 *
 * Writes public/teaser/{landscape,portrait}.{webm,mp4,jpg} (the video and its poster) and src/landing/film.ts (when
 * each chapter's clip comes in, for the chip that names it). Re-record whenever a chapter in CLIPS changes.
 */
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const url = opt('url', 'http://localhost:4173');
const only = opt('only', null);
/** --clips 0,3: record only these (to try a change quickly); the videos then hold just them, and film.ts is kept. */
const pick = opt('clips', null)?.split(',').map(Number);

/** The moments: a beat, how far into it the clip starts, and how long it runs (seconds). */
const ALL = [
  { beat: 'pythagoras:draw', at: 6.5, dur: 3.5 },
  { beat: 'pythagoras:pour', at: 2, dur: 3.5 },
  { beat: 'circle-area:deal', at: 0.6, dur: 3.4 },
  { beat: 'archimedes:lower', at: 1.5, dur: 3.5 },
  { beat: 'kepler:areas', at: 3, dur: 3.5 },
  { beat: 'newton:orbit', at: 2.5, dur: 3.5 },
  { beat: 'calculus:stack', at: 4, dur: 3.5 },
  { beat: 'euler:shadows', at: 2, dur: 3.5 },
  { beat: 'fourier:spectrum', at: 1.5, dur: 3.5 },
  { beat: 'doppler:mach', at: 10.5, dur: 3.5 },
  { beat: 'energy:ride', at: 15, dur: 3 },
  { beat: 'finale:end', at: 0.3, dur: 4.2 },
];
const CLIPS = pick ? ALL.filter((_, i) => pick.includes(i)) : ALL;
const FPS = 30;
/** How long each clip crossfades into the next, and how long the loop fades at its seam. */
const FADE = 0.6;
const SEAM = 0.5;
/** Played (unrecorded) before each clip, so its camera and Dust are already moving when it starts. */
const PREROLL = 1.5;
const SIZES = { landscape: [1280, 720], portrait: [720, 1280] };
/** Which clip's middle frame becomes the poster. */
const POSTER = 1;

const root = resolve(import.meta.dirname, '..');
const publicDir = join(root, 'public', 'teaser');
mkdirSync(publicDir, { recursive: true });

/** When each clip starts in the finished video: the crossfades overlap neighbours by FADE. */
const starts = [];
let length = 0;
for (const [i, c] of CLIPS.entries()) {
  starts.push(i === 0 ? 0 : length - FADE);
  length = i === 0 ? c.dur : length + c.dur - FADE;
}

for (const [name, [width, height]] of Object.entries(SIZES)) {
  if (only && only !== name) continue;
  const frames = join(tmpdir(), `teaser-${name}`);
  rmSync(frames, { recursive: true, force: true });
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  await page.addInitScript(() =>
    window.localStorage.setItem(
      'sand-to-stars:prefs',
      JSON.stringify({ autoContinue: false, captionsOn: false }),
    ),
  );
  await page.goto(`${url}/play?quality=high`);
  await page.waitForFunction(() => !!window.__journey, null, { timeout: 60_000 });
  // A film of the world, not the app: no captions, player or grain.
  await page.addStyleTag({ content: '.overlay, .grain { display: none !important; }' });
  const beats = await page.evaluate(() => window.__journey.beats);
  const at = (c) => beats.find((b) => b.key === c.beat).start + c.at;

  // Visit every clip once in real time first, so each chapter's code is loaded before the clocks stop.
  for (const c of CLIPS) {
    await page.evaluate((t) => window.__journey.seek(t), at(c));
    await page.waitForTimeout(2500);
  }
  await page.evaluate(() => window.__film.start());
  await page.waitForTimeout(500);
  const step = (n) =>
    page.evaluate(
      ([n, dt]) => {
        for (let i = 0; i < n; i++) window.__film.step(dt);
      },
      [n, 1 / FPS],
    );

  const t0 = Date.now();
  for (const [i, c] of CLIPS.entries()) {
    const dir = join(frames, String(i).padStart(2, '0'));
    mkdirSync(dir, { recursive: true });
    await page.evaluate(
      (t) => {
        window.__journey.seek(t);
        window.__journey.play();
      },
      at(c) - PREROLL,
    );
    // Let the page catch up with the jump (a new station mounting), then run in to the clip unrecorded.
    await page.waitForTimeout(800);
    await step(Math.round(PREROLL * FPS));
    const n = Math.round(c.dur * FPS);
    for (let f = 0; f < n; f++) {
      await step(1);
      await page.screenshot({
        path: join(dir, `${String(f).padStart(4, '0')}.jpg`),
        type: 'jpeg',
        quality: 92,
        timeout: 120_000,
      });
    }
    await page.evaluate(() => window.__journey.pause());
    console.log(`${name}: ${c.beat} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  await browser.close();

  // Chain the clips with crossfades, then fade the loop's seam.
  const inputs = CLIPS.flatMap((_, i) => [
    '-framerate',
    String(FPS),
    '-i',
    join(frames, String(i).padStart(2, '0'), '%04d.jpg'),
  ]);
  const chain = [];
  let last = '[0:v]';
  for (let i = 1; i < CLIPS.length; i++) {
    chain.push(`${last}[${i}:v]xfade=transition=fade:duration=${FADE}:offset=${starts[i].toFixed(3)}[x${i}]`);
    last = `[x${i}]`;
  }
  chain.push(
    `${last}fade=t=in:st=0:d=${SEAM},fade=t=out:st=${(length - SEAM).toFixed(3)}:d=${SEAM},format=yuv420p[v]`,
  );
  // One near-lossless master, then the two files a browser chooses between: VP9 (smaller; also what Playwright's
  // Chromium plays) and H.264 (everywhere else).
  const master = join(frames, 'master.mkv');
  const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a], { stdio: 'inherit' });
  ff(...inputs, '-filter_complex', chain.join(';'), '-map', '[v]', '-c:v', 'libx264', '-crf', '8', master);
  const webm = join(publicDir, `${name}.webm`);
  ff(
    '-i',
    master,
    ...['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', opt('vp9-crf', '50'), '-row-mt', '1', '-cpu-used', '2'],
    ...['-pix_fmt', 'yuv420p', '-an', webm],
  );
  const mp4 = join(publicDir, `${name}.mp4`);
  ff(
    '-i',
    master,
    ...['-c:v', 'libx264', '-preset', 'slow', '-crf', opt('crf', '34'), '-pix_fmt', 'yuv420p'],
    ...['-movflags', '+faststart', '-an', mp4],
  );
  const poster = join(publicDir, `${name}.jpg`);
  const posterClip = Math.min(POSTER, CLIPS.length - 1);
  const mid = String(Math.floor((CLIPS[posterClip].dur * FPS) / 2)).padStart(4, '0');
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-i',
    join(frames, String(posterClip).padStart(2, '0'), `${mid}.jpg`),
    '-q:v',
    '5',
    poster,
  ]);
  const mb = (f) => `${(statSync(f).size / 1e6).toFixed(2)} MB`;
  console.log(`${name}: ${webm} (${mb(webm)}), ${mp4} (${mb(mp4)}), poster ${poster}`);
  if (!args.includes('--keep')) rmSync(frames, { recursive: true, force: true });
}

// For the landing page's chip: which chapter is on screen from when (the middle of its crossfade in).
if (!pick) {
  const clips = CLIPS.map((c, i) => ({
    slug: c.beat.split(':')[0],
    from: Number((i === 0 ? 0 : starts[i] + FADE / 2).toFixed(2)),
  }));
  const film = join(root, 'src', 'landing', 'film.ts');
  writeFileSync(
    film,
    `// Written by scripts/record-teaser.mjs with the videos in public/teaser: re-record rather than edit.

/** The landing page's film: how long it runs, and which chapter is on screen from when (seconds). */
export const FILM = ${JSON.stringify({ duration: Number(length.toFixed(2)), clips })};
`,
  );
  execFileSync('npx', ['prettier', '--write', film], { cwd: root, stdio: 'ignore' });
}
