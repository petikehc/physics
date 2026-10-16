import { runtime } from '../../engine/runtime';
import { shot } from '../../engine/camera/shots';
import { station } from '../../engine/world/stations';
import type { JourneyBuilder } from '../../journey/builder';
import { circleRig, CIRCLE_DEFAULTS, RING_COUNT } from './rig';

const SLUG = 'circle-area';
const R = CIRCLE_DEFAULTS.r;
/** The slices the story re-cuts into, after the first 8, and how long each re-deal takes. */
const REFINE: Array<[n: number, duration: number, lift: number]> = [
  [16, 1.6, 0.45],
  [32, 1.4, 0.3],
  [64, 1.2, 0.2],
  [128, 1.1, 0.12],
  [256, 1.0, 0.08],
];
/** Fraction of a deal before the first piece lands (see Pieces: stagger ≤ 0.5 in total for n ≥ 8). */
const DEAL_LANDING = 0.5;
/** Pieces in the Your-turn row. */
export const YOUR_TURN_N = 16;

/** Story-mode timeline for chapter 2: the flight in from chapter 1, then the chapter beat by beat. */
export function buildCircleArea(j: JourneyBuilder) {
  const rig = circleRig();
  const dust = runtime.dust;
  const o = station(SLUG);

  j.beat(SLUG, { id: 'flight', kind: 'flight', minDuration: 5.6 }, ({ tl, cue }) => {
    const d = 5.4;
    tl.set(rig, { ...CIRCLE_DEFAULTS }, 0);
    // The flat circle rises off the beach and turns upright to face the camera as it flies.
    tl.set(dust, { from: 'circleFlat', to: 'circle', morph: 0 }, 0);
    tl.to(dust, { morph: 1, duration: d * 0.6, ease: 'power2.inOut' }, 0.2);
    tl.to(dust, { x: o.x, y: o.y + 1.8, z: o.z, duration: d, ease: 'power2.inOut' }, 0);
    tl.to(dust, { spin: 0.35, scale: 0.62, size: 1.05, duration: d }, 0);
    shot(
      tl,
      SLUG,
      { pos: [0, 2.4, 9.2], target: [0, 2.0, 0], focus: [0, 1.8, 0], shake: 0.5 },
      d,
      0,
      'power2.inOut',
    );
    tl.to(runtime.camera, { lift: 7, duration: d / 2, ease: 'sine.out' }, 0);
    tl.to(runtime.camera, { lift: 0, duration: d / 2, ease: 'sine.in' }, d / 2);
    tl.to(runtime.camera, { veil: 1, duration: d * 0.3, ease: 'power1.in' }, d * 0.15);
    tl.to(runtime.camera, { veil: 0, duration: d * 0.3, ease: 'power1.out' }, d * 0.55);
    cue(0.15, 'whoosh', { gain: 1 });
  });

  j.beat(
    SLUG,
    {
      id: 'title',
      kind: 'title',
      body: 'Syracuse, about 250 BC. How much space does a circle cover? To answer, Archimedes cut it into more and more pieces.',
      minDuration: 7.5,
    },
    ({ tl, cue }) => {
      // The circle of dust lies down on the sand at exactly the disc's radius…
      tl.set(dust, { from: 'circle', to: 'circleFlat', morph: 0 }, 0);
      tl.to(dust, { morph: 1, duration: 2.2, ease: 'power2.inOut' }, 0);
      tl.to(dust, { y: o.y + 0.04, scale: R / 2, spin: 0, duration: 2.4, ease: 'power2.inOut' }, 0);
      // …and a bronze disc rises through it, scattering the dust back into glinting sand.
      tl.to(rig, { disc: 1, duration: 1.8, ease: 'power2.out' }, 2.5);
      cue(2.5, 'rise', { gain: 0.7 });
      tl.set(dust, { from: 'circleFlat', to: 'sand', morph: 0 }, 2.7);
      tl.to(dust, { morph: 1, duration: 2.6, ease: 'expo.out' }, 2.7);
      tl.to(
        dust,
        {
          y: o.y,
          scale: 1,
          size: 0.55,
          swirl: 0.5,
          drift: 0.3,
          colorA: '#ffe7c4',
          colorB: '#ffb46a',
          duration: 2.6,
        },
        2.7,
      );
      shot(
        tl,
        SLUG,
        { pos: [-3.4, 2.4, 5.6], target: [0, 1.0, -1.0], focus: [0, 0.1, 0], fov: 36, dof: 0.6, shake: 0.5 },
        5.6,
        0.4,
        'power3.inOut',
      );
    },
  );

  j.beat(
    SLUG,
    {
      id: 'slice',
      heading: 'Cut it like a pie',
      body: 'A bronze disc of radius [r:r]. Slice it straight through the centre, again and again, into 8 equal wedges.',
    },
    ({ tl, cue }) => {
      tl.set(runtime.camera, { orbitAngle: Math.PI / 2 + 0.75, orbitRadius: 5.8, orbitHeight: 2.0 }, 0);
      shot(
        tl,
        SLUG,
        {
          target: [0, 0.1, 0],
          focus: [0, 0.1, 0],
          orbit: { mix: 1, radius: 5.4, height: 3.6 },
          dof: 0.35,
          shake: 0.5,
        },
        1.8,
        0,
      );
      shot(tl, SLUG, { orbit: { angle: Math.PI / 2 - 0.45 } }, 6.5, 0.2, 'sine.inOut');
      tl.to(rig, { radius: 1, duration: 0.8, ease: 'power2.out' }, 0.3);
      cue(1.0, 'tick');
      const t0 = 1.6;
      const stroke = 0.8;
      tl.to(rig, { cut: 1, duration: stroke * 4, ease: 'none' }, t0);
      for (let i = 0; i < 4; i++) cue(t0 + i * stroke, 'cut', { i });
      // The cuts are through: the disc is now eight separate pieces that part slightly.
      tl.set(rig, { whole: 0 }, t0 + stroke * 4 + 0.1);
      tl.to(rig, { explode: 0.06, duration: 0.7, ease: 'back.out(2)' }, t0 + stroke * 4 + 0.15);
      cue(t0 + stroke * 4 + 0.15, 'tink', { i: 0 });
    },
  );

  j.beat(
    SLUG,
    {
      id: 'deal',
      heading: 'Deal them into a row',
      body: 'Flip every other wedge and set them side by side: point down, point up. It is still the same bronze, so it covers the same area as the disc.',
    },
    ({ tl, cue }) => {
      tl.to(rig, { radius: 0, duration: 0.5 }, 0);
      shot(
        tl,
        SLUG,
        {
          pos: [0.4, 5.0, 4.8],
          target: [0, 0, 0],
          focus: [0, 0, 0],
          orbit: { mix: 0 },
          fov: 40,
          dof: 0,
          shake: 0.4,
        },
        2.2,
        0,
        'power3.inOut',
      );
      const t0 = 0.6;
      const d = 3.6;
      tl.to(rig, { deal: 1, duration: d, ease: 'none' }, t0);
      cue(t0, 'lift');
      cue(t0 + d * DEAL_LANDING, 'riffle', { n: 8, dur: d * (1 - DEAL_LANDING) });
    },
  );

  j.beat(
    SLUG,
    {
      id: 'refine',
      heading: 'Thinner and thinner',
      body: 'Cut every slice in half, then again, and again. The bumps flatten out and the row turns into a rectangle.',
    },
    ({ tl, cue }) => {
      // Face-on for the reading moment.
      shot(
        tl,
        SLUG,
        { pos: [0, 7.6, 1.2], target: [0, 0, 0.05], fov: 38, shake: 0.25 },
        2.4,
        0,
        'power3.inOut',
      );
      let t = 0.5;
      let from = 8;
      REFINE.forEach(([n, d, lift], k) => {
        tl.set(rig, { fromN: from, n, deal: 0, lift }, t);
        tl.to(rig, { deal: 1, duration: d, ease: 'none' }, t);
        cue(t, 'double', { k });
        cue(t + d * DEAL_LANDING, 'riffle', { n: Math.min(n, 24), dur: d * (1 - DEAL_LANDING) });
        from = n;
        t += d + 0.35;
      });
      tl.to(rig, { ghost: 1, duration: 0.9, ease: 'power1.out' }, t);
      cue(t, 'glow', { which: 0 });
    },
  );

  j.beat(
    SLUG,
    {
      id: 'rectangle',
      heading: 'Measure the rectangle',
      body: 'It is [r:r] tall: the radius. It is [pi:πr] long: half the circle’s edge runs along the top and half along the bottom. So its area is [pi:πr] × [r:r].',
    },
    ({ tl, cue }) => {
      tl.to(rig, { dims: 1, duration: 1.2, ease: 'power2.out' }, 0.3);
      cue(0.3, 'count');
      shot(tl, SLUG, { pos: [0, 7.0, 1.7] }, 9, 0, 'sine.inOut');
    },
  );

  j.beat(
    SLUG,
    {
      id: 'formula',
      kind: 'formula',
      body: 'Pi times [r:r] times [r:r]. True for every circle, from a coin to the Moon.',
      minDuration: 6.5,
    },
    ({ tl, cue }) => {
      cue(0.35, 'formula', { chapter: 2 });
      tl.to(rig, { dims: 0, duration: 0.6 }, 0);
      shot(tl, SLUG, { pos: [0.9, 3.6, 5.6], target: [0, 0, 0], shake: 0.4 }, 5, 0.2, 'power2.inOut');
    },
  );

  j.beat(
    SLUG,
    {
      id: 'onion',
      heading: 'Or peel it like an onion',
      body: 'A second way to see it: think of the disc as thin rings and unroll each one into a straight strip. Stacked up, the strips make a triangle with base [pi:2πr] and height [r:r]. Half of base times height: [pi:π][r:r²] again.',
    },
    ({ tl, cue }) => {
      tl.to(rig, { ghost: 0, duration: 0.8 }, 0);
      tl.to(rig, { piecesSink: 1, duration: 1.4, ease: 'power2.in' }, 0.2);
      cue(0.2, 'sink');
      tl.set(runtime.camera, { orbitAngle: Math.PI / 2 + 0.2, orbitRadius: 6.2, orbitHeight: 3.6 }, 0);
      shot(
        tl,
        SLUG,
        {
          target: [0, 0.1, 0],
          focus: [0, 0.1, 0],
          orbit: { mix: 1, radius: 4.4, height: 2.6 },
          dof: 0.3,
          shake: 0.5,
        },
        2.2,
        0,
      );
      shot(tl, SLUG, { orbit: { angle: Math.PI / 2 - 0.5 } }, 3.2, 0.4, 'sine.inOut');
      tl.to(rig, { rings: 1, duration: 1.4, ease: 'power2.out' }, 1.4);
      cue(1.4, 'rise', { gain: 0.6 });
      // The rings uncoil, outermost first; the camera lands face-on to read the triangle.
      const t0 = 3.4;
      const d = 6;
      tl.to(rig, { unroll: 1, duration: d, ease: 'none' }, t0);
      shot(
        tl,
        SLUG,
        { pos: [0, 10.4, 1.7], target: [0, 0, 0.1], orbit: { mix: 0 }, fov: 40, dof: 0, shake: 0.25 },
        3.6,
        t0 - 0.2,
        'power3.inOut',
      );
      cue(t0, 'uncoil');
      const stagger = 0.55 / (RING_COUNT - 1);
      const span = 1 - stagger * (RING_COUNT - 1);
      // A tink as every third ring lands, rising in pitch as the strips get shorter.
      for (let i = 0, k = 0; i < RING_COUNT; i += 3, k++)
        cue(t0 + d * (span + i * stagger), 'tink', { i: k + 1 });
      tl.to(rig, { triDims: 1, duration: 1.0, ease: 'power2.out' }, t0 + d + 0.1);
      cue(t0 + d + 0.1, 'glow', { which: 0 });
    },
  );

  j.beat(
    SLUG,
    {
      id: 'yourTurn',
      kind: 'yourTurn',
      heading: 'Your turn',
      body: 'Choose how many slices. The more you cut, the closer the row comes to a perfect πr × r rectangle.',
    },
    ({ tl, pauseHere }) => {
      tl.to(rig, { triDims: 0, duration: 0.6 }, 0);
      tl.to(rig, { ringsSink: 1, duration: 1.4, ease: 'power2.in' }, 0.1);
      tl.set(
        rig,
        { rings: 0, unroll: 0, ringsSink: 0, n: YOUR_TURN_N, fromN: 0, deal: 1, lift: 0.5, r: R },
        1.55,
      );
      tl.to(rig, { piecesSink: 0, duration: 1.2, ease: 'power2.out' }, 1.6);
      shot(
        tl,
        SLUG,
        { pos: [1.5, 6.2, 4.6], target: [1.5, 0, 0.3], fov: 42, shake: 0.25, dof: 0 },
        2.6,
        0,
        'power3.inOut',
      );
      tl.set(rig, { interactive: 1 }, 2.6);
      pauseHere(2.7);
      tl.set(rig, { interactive: 0 }, 2.8);
      tl.to({}, { duration: 0.3 }, 2.8);
    },
  );

  j.beat(
    SLUG,
    {
      id: 'handoff',
      heading: 'A golden puzzle',
      body: 'King Hiero of Syracuse had another question for Archimedes: was his new crown pure gold, or had the goldsmith cheated?',
    },
    ({ tl, cue }) => {
      // The slices fly home into one disc, which sinks as the sand gathers into a crown.
      tl.set(rig, { fromN: 0, explode: 0 }, 0);
      tl.to(rig, { r: R, duration: 0.8, ease: 'power2.inOut' }, 0);
      tl.to(rig, { deal: 0, duration: 2.4, ease: 'none' }, 0.3);
      cue(0.3, 'lift');
      cue(0.3 + 2.4 * DEAL_LANDING, 'riffle', { n: 16, dur: 2.4 * (1 - DEAL_LANDING) });
      tl.set(rig, { whole: 1 }, 2.75);
      shot(
        tl,
        SLUG,
        { pos: [-2.8, 2.2, 5.4], target: [0, 0.6, 0], focus: [0, 0.8, 0], fov: 38, dof: 0.5, shake: 0.5 },
        3.2,
        0,
        'power3.inOut',
      );
      tl.to(rig, { disc: 0, duration: 1.6, ease: 'power2.in' }, 3.2);
      cue(3.2, 'sink');
      tl.set(dust, { from: 'sand', to: 'crown', morph: 0 }, 3.0);
      tl.to(dust, { morph: 1, duration: 2.8, ease: 'power2.inOut' }, 3.0);
      tl.to(
        dust,
        {
          x: o.x,
          y: o.y + 0.75,
          z: o.z,
          scale: 1,
          size: 1.1,
          swirl: 1.1,
          drift: 0.6,
          spin: 0.3,
          colorA: '#fff1c2',
          colorB: '#f2b04a',
          duration: 2.8,
          ease: 'power2.inOut',
        },
        3.0,
      );
      cue(3.0, 'gather');
      shot(
        tl,
        SLUG,
        { pos: [-3.4, 2.4, 6.2], target: [0, 0.9, 0], focus: [0, 0.9, 0] },
        4,
        4.2,
        'sine.inOut',
      );
    },
  );
}
