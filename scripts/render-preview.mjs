#!/usr/bin/env node
/**
 * Renders a preview of the journey without needing a GPU or real-time playback:
 *   1. the soundtrack, offline (Tone.Offline), as a WAV;
 *   2. the picture, frame by frame, by seeking the master timeline and screenshotting;
 *   3. both muxed into an MP4 with ffmpeg.
 *
 * Usage (with `npm run build && npm run preview` serving on :4173):
 *   node scripts/render-preview.mjs [--url http://localhost:4173] [--out previews] [--fps 12]
 *     [--width 1280] [--height 720] [--quality medium] [--from 0] [--seconds <all>] [--no-video] [--no-audio]
 *     [--resume]   keep frames already rendered (useful for long renders)
 */
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const url = opt('url', 'http://localhost:4173');
const out = resolve(opt('out', 'previews'));
const fps = Number(opt('fps', '12'));
const width = Number(opt('width', '1280'));
const height = Number(opt('height', '720'));
const quality = opt('quality', 'medium');
const from = Number(opt('from', '0'));

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  args: [
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--autoplay-policy=no-user-gesture-required',
  ],
});
const page = await browser.newPage({ viewport: { width, height } });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
await page.goto(`${url}/play?quality=${quality}`);
await page.waitForFunction(() => !!window.__journey, null, { timeout: 60_000 });
const { duration, pauses } = await page.evaluate(() => ({
  duration: window.__journey.duration,
  pauses: window.__journey.beats.filter((b) => b.pauseAt !== undefined).map((b) => b.pauseAt),
}));
const seconds = Math.min(Number(opt('seconds', String(duration))), duration - from);
console.log(`journey ${duration.toFixed(1)} s · rendering ${from}–${(from + seconds).toFixed(1)} s`);

const wav = join(out, 'soundtrack.wav');
if (!flag('no-audio') && !(flag('resume') && existsSync(wav))) {
  const t0 = Date.now();
  const b64 = await page.evaluate((s) => window.__journey.renderAudio(s), from + seconds);
  writeFileSync(wav, Buffer.from(b64, 'base64'));
  console.log(`audio → ${wav} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}

if (!flag('no-video')) {
  const framesDir = join(out, 'frames');
  if (!flag('resume')) rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });
  // A film, not the app: hide the player chrome.
  await page.addStyleTag({ content: '.player, .topbar { display: none !important; }' });
  const total = Math.round(seconds * fps);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const file = join(framesDir, `f${String(i).padStart(5, '0')}.jpg`);
    if (flag('resume') && existsSync(file)) continue;
    let t = from + i / fps;
    // Landing exactly on a Your-turn pause would hand the camera to the viewer; step past it.
    if (pauses.some((p) => Math.abs(t - p) < 0.06)) t += 0.12;
    await page.evaluate((x) => window.__journey.seek(x), t);
    // Playwright's screenshot waits for a fresh frame, which renders the seeked state.
    await page.screenshot({ path: file, type: 'jpeg', quality: 88 });
    if (i % 60 === 0) console.log(`frame ${i}/${total} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  const mp4 = join(out, 'journey.mp4');
  const audioIn = flag('no-audio') ? [] : ['-ss', String(from), '-i', wav];
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-loglevel',
      'error',
      '-framerate',
      String(fps),
      '-i',
      join(framesDir, 'f%05d.jpg'),
      ...audioIn,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-crf',
      '20',
      '-vf',
      'minterpolate=fps=24:mi_mode=blend',
      ...(flag('no-audio') ? [] : ['-c:a', 'aac', '-b:a', '192k', '-shortest']),
      mp4,
    ],
    { stdio: 'inherit' },
  );
  console.log(`video → ${mp4}`);
}

await browser.close();
