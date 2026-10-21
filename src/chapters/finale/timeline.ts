import { runtime } from '../../engine/runtime';
import { shot } from '../../engine/camera/shots';
import { station } from '../../engine/world/stations';
import { ICON_ORDER } from '../../engine/dust/shapes';
import { pyth } from '../../audio/tuning';
import type { JourneyBuilder } from '../../journey/builder';
import { CHAPTERS } from '../registry';
import { iconAt, INVARIANTS, STARS, type V3 } from './layout';
import { DUST_SCALE, finaleRig, FINALE_DEFAULTS, SLUG } from './rig';

/** The whole constellation, from in front, a little high in the picture to keep it clear of the captions. */
const WIDE = { pos: [0, -1, 100] as V3, target: [0, -4, 0] as V3, portrait: 0.9 };
/** The same as the index: on a wide screen, slid so the stars stay clear of the panel on the right. */
export const INDEX_FRAME = { ...WIDE, side: 12 };
const ICON_SCALE = 1.6;

/** Close on one star and its chapter's icon beside it, framed between the two. */
function closeOn(i: number) {
  const s = STARS[i]!;
  const c = iconAt(i);
  const mid: V3 = [(s[0] + c[0]) / 2, (s[1] + c[1]) / 2, (s[2] + c[2]) / 2];
  return { pos: [mid[0], mid[1], mid[2] + 32] as V3, target: mid, portrait: 1 };
}

/** The finale: up from the fairground to the stars, which gather into the constellation; what each chapter kept the
 * same, star by star; Noether's reason why; and the constellation left as the index of the journey. */
export function buildFinale(j: JourneyBuilder) {
  const rig = finaleRig();
  const dust = runtime.dust;
  const o = station(SLUG);

  j.beat(SLUG, { id: 'flight', kind: 'flight', minDuration: 7 }, ({ tl, cue }) => {
    const d = 6.6;
    tl.set(rig, { ...FINALE_DEFAULTS, on: 1 }, 0);
    // Up from the fairground into the night, after the sparks, to where they have become stars.
    shot(tl, SLUG, { ...WIDE, fov: 40, dof: 0, shake: 0.3 }, d, 0, 'power2.inOut');
    tl.to(dust, { x: o.x, y: o.y, z: o.z, duration: d, ease: 'power2.inOut' }, 0);
    tl.to(runtime.camera, { lift: 10, duration: d / 2, ease: 'sine.out' }, 0);
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
      body: 'Ten ideas from two and a half thousand years: a triangle in the sand, a crown in a bath, an apple, a curve, a wave, a siren, a ride at a fair. Look at them together, and one thread runs through them all.',
      minDuration: 13,
    },
    ({ tl, cue }) => {
      // The night's stars gather into ten, one for each chapter, and light up in the order they were told.
      tl.set(dust, { from: 'stars', to: 'constellation', morph: 0 }, 0.6);
      tl.to(dust, { morph: 1, duration: 5, ease: 'power2.inOut' }, 0.6);
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
          duration: 5,
          ease: 'power2.inOut',
        },
        0.6,
      );
      tl.to(rig, { lit: STARS.length, duration: 4.5, ease: 'none' }, 2.6);
      STARS.forEach((_, i) =>
        cue(2.6 + i * 0.45 + 0.2, 'star', { hz: pyth(INVARIANTS[i]!.note, 5), gain: 0.5 }),
      );
      tl.to(rig, { thread: 1, duration: 5, ease: 'power1.inOut' }, 4.2);
      tl.to(rig, { labels: 1, duration: 1 }, 7.5);
    },
  );

  // One star at a time: what its chapter kept the same, its icon remembered beside it.
  INVARIANTS.forEach((inv, i) => {
    const meta = CHAPTERS[i]!;
    j.beat(
      SLUG,
      { id: inv.slug, heading: `${meta.numeral} · ${inv.heading}`, body: inv.body },
      ({ tl, cue }) => {
        shot(tl, SLUG, { ...closeOn(i), fov: 40, dof: 0, shake: 0.25 }, 1.8, 0, 'power2.inOut');
        tl.set(rig, { focus: i }, 0);
        tl.to(rig, { focusAmt: 1, duration: 0.8 }, 0);
        tl.to(rig, { visited: i + 1, duration: 1, ease: 'power1.inOut' }, 0.4);
        const from = i === 0 ? 'constellation' : ICON_ORDER[i - 1]!;
        const at = iconAt(i);
        tl.set(dust, { from, to: ICON_ORDER[i]!, morph: 0 }, 0.1);
        tl.to(dust, { morph: 1, duration: 1.8, ease: 'power2.inOut' }, 0.1);
        tl.to(
          dust,
          {
            x: o.x + at[0],
            y: o.y + at[1],
            z: o.z + at[2],
            scale: ICON_SCALE,
            size: 2.4,
            spin: 0,
            rotX: 0,
            rotY: 0,
            swirl: 0.8,
            drift: 0.2,
            colorA: meta.accent,
            colorB: '#fff1d8',
            duration: 1.8,
            ease: 'power2.inOut',
          },
          0.1,
        );
        cue(0.5, 'star', { hz: pyth(inv.note, 5), gain: 0.8 });
      },
    );
  });

  j.beat(
    SLUG,
    {
      id: 'noether',
      heading: 'Why something stays the same',
      body: 'In 1918 Emmy Noether showed that each kept quantity comes from a symmetry. Laws that are the same at every moment keep energy; the same in every direction, angular momentum; the same everywhere, momentum.',
      minDuration: 14,
    },
    ({ tl, cue }) => {
      // Every star in its colour and the thread lit, as the constellation is turned: turned, it is still the same.
      tl.to(rig, { focusAmt: 0, glow: 1, visited: STARS.length, duration: 2 }, 0);
      tl.set(runtime.camera, { orbitAngle: Math.PI / 2, orbitRadius: 96, orbitHeight: 3 }, 0);
      shot(
        tl,
        SLUG,
        { target: WIDE.target, orbit: { mix: 1 }, portrait: 0.9, fov: 40 },
        2.6,
        0,
        'power2.inOut',
      );
      shot(tl, SLUG, { orbit: { angle: Math.PI / 2 - 0.42 } }, 5, 2.6, 'sine.inOut');
      shot(tl, SLUG, { orbit: { angle: Math.PI / 2 + 0.3 } }, 5.5, 7.6, 'sine.inOut');
      // The last icon goes back up into the stars.
      tl.set(dust, { from: ICON_ORDER[ICON_ORDER.length - 1]!, to: 'constellation', morph: 0 }, 0.3);
      tl.to(dust, { morph: 1, duration: 2.6, ease: 'power2.inOut' }, 0.3);
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
          duration: 2.6,
          ease: 'power2.inOut',
        },
        0.3,
      );
      cue(0.6, 'gather');
    },
  );

  j.beat(
    SLUG,
    {
      id: 'end',
      kind: 'end',
      heading: 'From sand to stars',
      body: 'Every star is a chapter. Choose one to go back to it.',
      minDuration: 6,
    },
    ({ tl, cue }) => {
      // Back round to the front, where the constellation waits as the index of the journey.
      shot(
        tl,
        SLUG,
        { ...INDEX_FRAME, fov: 40, dof: 0, shake: 0.2, orbit: { mix: 0 } },
        3.2,
        0,
        'power2.inOut',
      );
      tl.to(rig, { glow: 0.6, duration: 2 }, 1);
      cue(0.4, 'resolve');
      tl.set(rig, { index: 1 }, 5.99);
    },
  );
}
