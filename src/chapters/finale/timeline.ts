import { runtime } from '../../engine/runtime';
import { shot, shotVars } from '../../engine/camera/shots';
import { station } from '../../engine/world/stations';
import { ICON_ORDER } from '../../engine/dust/shapes';
import { pyth } from '../../audio/tuning';
import type { JourneyBuilder } from '../../journey/builder';
import { CHAPTERS } from '../registry';
import { iconAt, INVARIANTS, STARS, starsAlongThread, type V3 } from './layout';
import { DUST_SCALE, finaleRig, FINALE_DEFAULTS, SLUG } from './rig';

/** The whole constellation, from in front, a little high in the picture to keep it clear of the captions. */
const WIDE = { pos: [0, -3, 100] as V3, target: [0, -6, 0] as V3, portrait: 0.9 };
/** The same as the index: on a wide screen, slid so the stars stay clear of the panel on the right. */
export const INDEX_FRAME = { ...WIDE, side: 16 };
const ICON_SCALE = 1.6;
/** The sweep: in from the whole constellation to the first star, then this long from each star to the next. */
const INTO = 1.6;
const STEP = 2;

/** When the sweep reaches each star (seconds into its beat). */
export const reachAt = (i: number) => INTO + i * STEP;

/** Passing one star: framed a little towards its icon, near enough for both, with the stars either side in view. */
function passing(i: number) {
  const s = STARS[i]!;
  const c = iconAt(i);
  const t: V3 = [s[0] + (c[0] - s[0]) * 0.4, s[1] + (c[1] - s[1]) * 0.4, s[2]];
  // On a wide screen, slid so the star stands right of centre, clear of the caption at the bottom left.
  return { pos: [t[0], t[1] + 1, t[2] + 40] as V3, target: t, portrait: 1, side: -5 };
}

/** The finale: up from the fairground to the stars, which gather into ten; one sweep along them, each keeping
 * something the same; Noether's reason why; and the constellation left as the index of the journey. */
export function buildFinale(j: JourneyBuilder) {
  const rig = finaleRig();
  const dust = runtime.dust;
  const o = station(SLUG);

  j.beat(SLUG, { id: 'flight', kind: 'flight', minDuration: 4 }, ({ tl, cue }) => {
    const d = 3.8;
    tl.set(rig, { ...FINALE_DEFAULTS, on: 1 }, 0);
    // Up from the fairground into the night, after the sparks.
    shot(tl, SLUG, { ...WIDE, fov: 40, dof: 0, shake: 0.3 }, d, 0, 'power2.inOut');
    tl.to(dust, { x: o.x, y: o.y, z: o.z, duration: d, ease: 'power2.inOut' }, 0);
    tl.to(runtime.camera, { lift: 6, duration: d / 2, ease: 'sine.out' }, 0);
    tl.to(runtime.camera, { lift: 0, duration: d / 2, ease: 'sine.in' }, d / 2);
    tl.to(runtime.camera, { veil: 1, duration: d * 0.3, ease: 'power1.in' }, d * 0.15);
    tl.to(runtime.camera, { veil: 0, duration: d * 0.3, ease: 'power1.out' }, d * 0.55);
    cue(0.2, 'whoosh', { gain: 0.8 });
  });

  j.beat(
    SLUG,
    {
      id: 'title',
      kind: 'title',
      body: 'It began as a triangle scratched in the sand. The same grains have come all this way, and are stars now: one for each idea.',
      minDuration: 8,
    },
    ({ tl, cue }) => {
      // The sparks and the night's stars gather into ten, one for each chapter.
      tl.set(dust, { from: 'stars', to: 'constellation', morph: 0 }, 0.3);
      tl.to(dust, { morph: 1, duration: 3.6, ease: 'power2.inOut' }, 0.3);
      tl.to(
        dust,
        {
          x: o.x,
          y: o.y,
          z: o.z,
          scale: DUST_SCALE,
          size: 3,
          spin: 0,
          rotX: 0,
          rotY: 0,
          swirl: 1.2,
          drift: 0.15,
          colorA: '#fff1d8',
          colorB: '#ffd9a8',
          duration: 3.6,
          ease: 'power2.inOut',
        },
        0.3,
      );
      tl.to(rig, { lit: STARS.length, duration: 2.4, ease: 'none' }, 2.2);
      tl.to(rig, { labels: 1, duration: 0.8 }, 4.4);
      cue(0.4, 'gather');
    },
  );

  // One sweep along the thread: each star in turn takes its colour, rings its chapter's note and says, in a word or
  // two, what it kept the same, while its icon forms beside it and the thread draws on behind.
  const along = starsAlongThread();
  j.beat(
    SLUG,
    {
      id: 'sweep',
      heading: 'What each one kept',
      body: 'Whatever else changed, every idea along the way kept something the same.',
    },
    ({ tl, cue }) => {
      tl.set(runtime.camera, { fov: 40, dof: 0, shake: 0.25 }, 0);
      tl.to(
        runtime.camera,
        {
          keyframes: STARS.map((_, i) => ({
            ...shotVars(SLUG, passing(i)),
            duration: i === 0 ? INTO : STEP,
            ease: i === 0 ? 'power2.inOut' : 'sine.inOut',
          })),
        },
        0,
      );
      // The other stars' numerals step aside as the camera sets off (it will pass the far ones off the picture).
      tl.to(rig, { focusAmt: 1, duration: 0.8 }, 0);
      STARS.forEach((_, i) => {
        const at = reachAt(i);
        const meta = CHAPTERS[i]!;
        if (i > 0) {
          tl.to(rig, { thread: along[i]!, duration: STEP, ease: 'sine.inOut' }, at - STEP);
          tl.to(rig, { tag: 0, duration: 0.3 }, at - 0.9);
        }
        tl.set(rig, { focus: i }, i === 0 ? 0 : at - 0.6);
        tl.to(rig, { visited: i + 1, duration: 0.5 }, at - 0.4);
        tl.to(rig, { tag: 1, duration: 0.4 }, at - 0.3);
        cue(at - 0.3, 'star', { hz: pyth(INVARIANTS[i]!.note, 5), gain: 0.8 });
        // Its chapter's icon, out of the last one (the first, out of the constellation).
        const c = iconAt(i);
        const from = i === 0 ? 'constellation' : ICON_ORDER[i - 1]!;
        tl.set(dust, { from, to: ICON_ORDER[i]!, morph: 0 }, at - 1);
        tl.to(dust, { morph: 1, duration: 1.1, ease: 'power2.inOut' }, at - 1);
        tl.to(
          dust,
          {
            x: o.x + c[0],
            y: o.y + c[1],
            z: o.z + c[2],
            scale: ICON_SCALE,
            size: 2.4,
            swirl: 0.8,
            drift: 0.2,
            colorA: meta.accent,
            colorB: '#fff1d8',
            duration: 1.1,
            ease: 'power2.inOut',
          },
          at - 1,
        );
      });
      // A moment on the last star.
      tl.to({}, { duration: 1.4 }, reachAt(STARS.length - 1));
    },
  );

  j.beat(
    SLUG,
    {
      id: 'noether',
      heading: 'Noether’s answer',
      body: 'Emmy Noether, 1918: each continuous symmetry of the laws keeps something. The same at every moment: energy. In every direction: angular momentum. Everywhere: momentum.',
      minDuration: 10,
    },
    ({ tl }) => {
      // Every star in its colour and the thread lit, as the constellation is turned: turned, it is still the same.
      tl.to(rig, { tag: 0, duration: 0.4 }, 0);
      tl.to(rig, { glow: 1, visited: STARS.length, duration: 1.6 }, 0);
      // The other stars' numerals come back once the camera has drawn back far enough to show them all.
      tl.to(rig, { focusAmt: 0, duration: 1 }, 2.2);
      tl.set(runtime.camera, { orbitAngle: Math.PI / 2, orbitRadius: 96, orbitHeight: 3 }, 0);
      shot(
        tl,
        SLUG,
        { target: WIDE.target, orbit: { mix: 1 }, portrait: 0.9, fov: 40 },
        2.4,
        0,
        'power2.inOut',
      );
      shot(tl, SLUG, { orbit: { angle: Math.PI / 2 - 0.36 } }, 4, 2.4, 'sine.inOut');
      shot(tl, SLUG, { orbit: { angle: Math.PI / 2 + 0.2 } }, 3.6, 6.4, 'sine.inOut');
      // The last icon goes back up into the stars.
      tl.set(dust, { from: ICON_ORDER[ICON_ORDER.length - 1]!, to: 'constellation', morph: 0 }, 0.2);
      tl.to(dust, { morph: 1, duration: 2.4, ease: 'power2.inOut' }, 0.2);
      tl.to(
        dust,
        {
          x: o.x,
          y: o.y,
          z: o.z,
          scale: DUST_SCALE,
          size: 3,
          swirl: 1.2,
          colorA: '#fff1d8',
          colorB: '#ffd9a8',
          duration: 2.4,
          ease: 'power2.inOut',
        },
        0.2,
      );
    },
  );

  j.beat(
    SLUG,
    {
      id: 'end',
      kind: 'end',
      heading: 'From sand to stars',
      body: 'Every star is a chapter; choose one.',
      minDuration: 5,
    },
    ({ tl, cue }) => {
      // Back round to the front, where the constellation waits as the index of the journey.
      shot(
        tl,
        SLUG,
        { ...INDEX_FRAME, fov: 40, dof: 0, shake: 0.2, orbit: { mix: 0 } },
        2.6,
        0,
        'power2.inOut',
      );
      tl.to(rig, { glow: 0.6, duration: 2 }, 1);
      cue(0.3, 'resolve');
      tl.set(rig, { index: 1 }, 4.9);
    },
  );
}
