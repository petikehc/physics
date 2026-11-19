#!/usr/bin/env node
/**
 * Renders a ~40 s demo of the journey for social feeds: 4:5 (1080×1350), 30 fps, with the score.
 * Each shot is the desktop journey (rendered at 1440×810) in the middle of the frame, the chapter above it and the
 * beat's heading below it in the site's own type; the last shot is the constellation, full frame, with the title and
 * the address. The world is stepped exactly 1/30 s per frame (window.__film), so nothing jitters however slowly the
 * software renderer draws.
 *
 * Usage (with `npm run build && npm run preview` serving on :4173):
 *   node scripts/render-demo.mjs [--stills] [--only <beat key>] [--resume] [--plain] [--url http://localhost:4173]
 *     --stills  one composed still per shot and alternate, at its in-point, into previews/demo-stills/
 *     --only    render just that shot (e.g. to check it), not the whole cut
 *     --resume  keep shots already rendered completely (an unfinished shot is rendered again from its start)
 *     --plain   plain ink behind the picture instead of a blurred, darkened copy of it
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { launchBrowser, openJourney } from './lib/journey.mjs';

/** The cut: beat key, seconds into the beat to start at, and length in seconds. Change the cut here. */
const SHOTS = [
  // Screen-recorded from the site in real time: the frame-stepped render of the scratching looked shaky.
  {
    beat: 'pythagoras:draw',
    at: 0,
    length: 6,
    footage: { file: 'previews/footage/pythagoras-draw.mov', from: 10.74, crop: '1962:1104:0:152' },
  },
  { beat: 'doppler:mach', at: 5, length: 5 },
  { beat: 'newton:cannon', at: 2, length: 5 },
  { beat: 'fourier:build', at: 1, length: 6 },
  { beat: 'kepler:areas', at: 1, length: 5 },
  { beat: 'energy:ride', at: 9.5, length: 4 },
];
/** The last shot: the constellation, full frame, under the title and the address. */
const END = { beat: 'finale:end', at: 0, length: 6 };
/** Other candidates, rendered as stills only (--stills). */
const ALTERNATES = [
  { beat: 'circle-area:deal', at: 1 },
  { beat: 'euler:helix', at: 4 },
  { beat: 'archimedes:eureka', at: 2 },
  { beat: 'fourier:shapes', at: 2 },
  { beat: 'finale:sweep', at: 4 },
];

const ADDRESS = 'sand-to-stars.idoescode.com';
const FPS = 30;
/** Seconds rendered (and dropped) before each shot, so the dust has settled when it starts. */
const PRE_ROLL = 2;
/** Seconds of crossfade between shots, picture and sound. */
const FADE = 0.4;
const CARD = { w: 1080, h: 1350 };
/** The desktop picture, and where it sits in the card. */
const VIEW = { w: 1440, h: 810 };
const PICTURE = { w: 1080, h: 608, y: 300 };

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);
const url = opt('url', 'http://localhost:4173');
const out = resolve('previews');
const prefs = { autoContinue: false };

const browser = await launchBrowser();

/** The app's own page, for laying out text in the site's type (no 3D: the transcript draws none). */
const typePage = await browser.newPage({
  viewport: { width: CARD.w / 2, height: CARD.h / 2 },
  deviceScaleFactor: 2,
});
await typePage.goto(`${url}/transcript`);

/** A transparent 1080×1350 PNG of the shot's words: the chapter above the picture, the heading below it. */
async function band(file, { label, heading, end }) {
  await typePage.evaluate(
    ({ label, heading, end, address, top, bottom }) => {
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
      const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
      document.body.innerHTML = end
        ? `<div style="position:fixed;inset:0;display:grid;place-items:end center;padding-bottom:64px;text-align:center;
             background:linear-gradient(to top, rgba(10,11,14,0.9), rgba(10,11,14,0) 60%)">
             <div><h1 class="landing__title" style="font-size:58px">From Sand to <em>Stars</em></h1>
             <p class="landing__sub" style="margin:10px auto 0;font-size:15px;max-width:400px">Ten great ideas of
             mathematics and physics, told as one cinematic journey.</p>
             <p style="margin-top:22px;font-family:var(--font-mono);font-size:14px;letter-spacing:0.06em;
             color:var(--chalk)">${address}</p></div></div>`
        : `<div style="position:fixed;left:0;right:0;top:0;height:${top}px;display:grid;place-content:center;
             text-align:center;gap:8px">
             <div style="font-family:var(--font-display);font-size:22px;color:var(--chalk)">From Sand to Stars</div>
             <div style="font-family:var(--font-mono);font-size:12px;letter-spacing:0.12em;text-transform:uppercase;
             color:var(--chalk-dim)">${esc(label)}</div></div>
           <div style="position:fixed;left:0;right:0;top:${bottom}px;padding:28px 36px 0;text-align:center;
             font-family:var(--font-display);font-size:34px;line-height:1.12;color:var(--chalk)">${esc(heading)}</div>`;
    },
    { label, heading, end, address: ADDRESS, top: PICTURE.y / 2, bottom: (PICTURE.y + PICTURE.h) / 2 },
  );
  await typePage.evaluate(() => document.fonts.ready);
  await typePage.screenshot({ path: file, omitBackground: true });
}

/** ffmpeg filter that puts the desktop picture (input 0) in the card and the words (input 1) over it. */
function cardFilter(end) {
  if (end) return '[0:v]scale=1080:1350:flags=lanczos,format=rgba[c];[c][1:v]overlay=0:0,format=yuv420p';
  const bg = flag('plain')
    ? `color=c=0x0e0f13:s=${CARD.w}x${CARD.h}[bg]`
    : `[0:v]scale=${CARD.w}:${CARD.h}:force_original_aspect_ratio=increase,crop=${CARD.w}:${CARD.h},` +
      'gblur=sigma=48,eq=brightness=-0.22:saturation=0.85[bg]';
  return (
    `${bg};[0:v]scale=${PICTURE.w}:${PICTURE.h}:flags=lanczos[fg];[bg][fg]overlay=0:${PICTURE.y}[c];` +
    '[c][1:v]overlay=0:0,format=yuv420p'
  );
}

/**
 * Renders a shot's frames into `dir`: opens the journey at the shot's chapter (the end shot in portrait, so the
 * constellation fills the card), steps through the pre-roll, then one frame per 1/30 s. Returns the shot's words.
 */
async function renderShot(shot, dir, { frames, end }) {
  const slug = shot.beat.split(':')[0];
  const size = end ? { width: CARD.w / 2, height: CARD.h / 2, scale: 2 } : { width: VIEW.w, height: VIEW.h };
  const page = await openJourney(browser, { url, path: `/play/${slug}`, quality: 'high', prefs, ...size });
  // A film, not the app: the journey's own captions, player and grain are left out (the card sets the words).
  await page.addStyleTag({ content: '.overlay, .grain { display: none !important; }' });
  await page.waitForTimeout(1500);
  const start = await page.evaluate(
    ({ key, at, pre }) => {
      const b = window.__journey.beats.find((x) => x.key === key);
      if (!b) throw new Error(`no beat ${key}`);
      window.__film.start();
      window.__journey.seek(Math.max(b.start + at - pre, 0));
      window.__journey.play();
      return b.start + at;
    },
    { key: shot.beat, at: shot.at, pre: PRE_ROLL },
  );
  // Let a chapter that was not mounted load before the clock runs.
  await page.waitForTimeout(1500);
  for (let i = 0; i < PRE_ROLL * FPS; i++) await page.evaluate((s) => window.__film.step(s), 1 / FPS);
  const words = await page.evaluate(() => ({
    label: document.querySelector('.brand__chapter')?.textContent ?? '',
    heading: document.querySelector('.captions__heading')?.textContent ?? '',
  }));
  for (let i = 0; i < frames; i++) {
    if (i > 0) await page.evaluate((s) => window.__film.step(s), 1 / FPS);
    await page.screenshot({ path: join(dir, `f${String(i).padStart(5, '0')}.png`) });
  }
  await page.close();
  return { ...words, start };
}

const ffmpeg = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a], { stdio: 'inherit' });

if (flag('stills')) {
  const dir = join(out, 'demo-stills');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const all = [...SHOTS, END, ...ALTERNATES];
  for (const [n, shot] of all.entries()) {
    const end = shot === END;
    const name = `${String(n + 1).padStart(2, '0')}-${shot.beat.replace(':', '-')}`;
    const tmp = join(dir, `${name}-raw`);
    mkdirSync(tmp, { recursive: true });
    const words = await renderShot(shot, tmp, { frames: 1, end });
    await band(join(tmp, 'band.png'), { ...words, end });
    ffmpeg([
      '-i',
      join(tmp, 'f00000.png'),
      '-i',
      join(tmp, 'band.png'),
      '-filter_complex',
      cardFilter(end),
      '-frames:v',
      '1',
      '-q:v',
      '3',
      join(dir, `${name}.jpg`),
    ]);
    rmSync(tmp, { recursive: true, force: true });
    console.log(`${name}.jpg · ${words.label} · ${words.heading}`);
  }
  await browser.close();
  process.exit(0);
}

// The cut: each shot rendered and set in its card, then dissolved one into the next, with its own sound.
/** How long a rendered clip runs, in seconds. */
function clipSeconds(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return Number(String(r.stdout).trim());
}

const work = join(out, 'demo');
mkdirSync(work, { recursive: true });
const cut = [...SHOTS, END].filter((s) => !opt('only') || s.beat === opt('only'));
const clips = [];
for (const [n, shot] of cut.entries()) {
  const end = shot === END;
  const name = `${String(n + 1).padStart(2, '0')}-${shot.beat.replace(':', '-')}`;
  const dir = join(work, name);
  const clip = join(work, `${name}.mkv`);
  // Fades overlap the shots: each one runs a fade longer, except the last.
  const seconds = shot.length + (n < cut.length - 1 ? FADE : 0);
  // --resume keeps a clip only if it has the length this cut needs (a shot rendered alone with --only is shorter).
  if (!(flag('resume') && existsSync(clip) && Math.abs(clipSeconds(clip) - seconds) < 0.05)) {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const t0 = Date.now();
    const frames = Math.round(seconds * FPS);
    // Recorded footage still opens the journey for the shot's words; only the picture comes from the recording.
    const words = await renderShot(shot, dir, { frames: shot.footage ? 0 : frames, end });
    if (shot.footage) {
      const { file, from, crop } = shot.footage;
      ffmpeg([
        ...['-ss', String(from), '-i', resolve(file), '-frames:v', String(frames)],
        ...['-vf', `crop=${crop},fps=${FPS},scale=${VIEW.w}:${VIEW.h}:flags=lanczos`],
        ...['-start_number', '0', join(dir, 'f%05d.png')],
      ]);
    }
    await band(join(dir, 'band.png'), { ...words, end });
    // The shot's sound, from the score rendered offline, with a little run-up so pads and reverb are already sounding.
    const runUp = 4;
    const b64 = await (async () => {
      const page = await openJourney(browser, { url, width: 640, height: 360, quality: 'low', prefs });
      const r = await page.evaluate(({ s, from }) => window.__journey.renderAudio(s, from), {
        s: seconds + runUp,
        from: Math.max(words.start - runUp, 0),
      });
      await page.close();
      return r;
    })();
    const wav = join(dir, 'sound.wav');
    writeFileSync(wav, Buffer.from(b64, 'base64'));
    ffmpeg([
      '-framerate',
      String(FPS),
      '-i',
      join(dir, 'f%05d.png'),
      '-i',
      join(dir, 'band.png'),
      '-ss',
      String(Math.min(runUp, words.start)),
      '-t',
      String(seconds),
      '-i',
      wav,
      '-filter_complex',
      cardFilter(end),
      '-map',
      '2:a',
      '-c:v',
      'libx264',
      '-crf',
      '12',
      '-preset',
      'medium',
      // The score can end before the picture does (the end card): pad the sound with silence to the shot's length.
      '-af',
      'apad',
      '-c:a',
      'pcm_s16le',
      '-t',
      String(seconds),
      clip,
    ]);
    rmSync(dir, { recursive: true, force: true });
    console.log(`${name}: ${words.heading || '(end card)'} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  clips.push({ file: clip, seconds });
}
await browser.close();

// Dissolve the clips together (picture and sound), fade the sound out, and bring it to −14 LUFS.
const inputs = clips.flatMap((c) => ['-i', c.file]);
let v = '[0:v]';
let a = '[0:a]';
let filter = '';
let offset = 0;
for (let i = 1; i < clips.length; i++) {
  offset += clips[i - 1].seconds - FADE;
  filter += `${v}[${i}:v]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(3)}[v${i}];`;
  filter += `${a}[${i}:a]acrossfade=d=${FADE}[a${i}];`;
  v = `[v${i}]`;
  a = `[a${i}]`;
}
const total = clips.reduce((s, c) => s + c.seconds, 0) - FADE * (clips.length - 1);
filter += `${a}afade=t=out:st=${(total - 1.5).toFixed(3)}:d=1.5,loudnorm=I=-14:TP=-1.5:LRA=11[aout]`;
const mp4 = join(out, opt('only') ? 'demo-shot.mp4' : 'demo.mp4');
ffmpeg([
  ...inputs,
  '-filter_complex',
  filter,
  '-map',
  clips.length > 1 ? v : '0:v',
  '-map',
  '[aout]',
  '-c:v',
  'libx264',
  '-crf',
  '18',
  '-pix_fmt',
  'yuv420p',
  '-r',
  String(FPS),
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-ar',
  '48000',
  '-movflags',
  '+faststart',
  mp4,
]);
console.log(`video → ${mp4} (${total.toFixed(1)} s)`);
