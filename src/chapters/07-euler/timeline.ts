import { runtime } from '../../engine/runtime';
import { shot } from '../../engine/camera/shots';
import { station } from '../../engine/world/stations';
import type { JourneyBuilder } from '../../journey/builder';
import { calculusRig } from '../06-calculus/rig';
import { C, EULER_DEFAULTS, eulerRig, R, SYM7, TERMS, THETA_MAX } from './rig';

const SLUG = 'euler';
type V3 = [number, number, number];
type Frame = { pos: V3; target: V3; portrait: number };

/**
 * The plane face on, a little right of centre and up, so the caption (low on the left) leaves it clear. A phone steps
 * back until the axes fit across it.
 */
const FACE: Frame = { pos: [-0.6, 2.75, 10], target: [-0.6, 2.3, 0], portrait: 0.6 };
/** The helix from the front and to the right, above it: the plane in front, time running back, both walls in view. */
const HELIX: Frame = { pos: [5.6, 5.4, 4.6], target: [-0.4, 2.1, -2.7], portrait: 0.8 };
/** Wide enough for the series' arrows at θ = π, which swing out to −3.9 and up to 3.1 before they spiral in. */
const SERIES: Frame = { pos: [-2.9, 3.6, 15.2], target: [-2.9, 3.4, 0], portrait: 0.5 };

/** How long each of the series' arrows takes to lay down: slow for the big early ones, quick for the small. */
const TERM_TIMES = [1, 1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.35, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3];

/** Story-mode timeline for chapter 7: the flight among the stars, then the chapter beat by beat. */
export function buildEuler(j: JourneyBuilder) {
  const rig = eulerRig();
  const dust = runtime.dust;
  const o = station(SLUG);

  j.beat(SLUG, { id: 'flight', kind: 'flight', minDuration: 5.6 }, ({ tl, cue }) => {
    const d = 5.4;
    tl.set(rig, { ...EULER_DEFAULTS }, 0);
    // Chapter 6's realm goes out behind us.
    tl.to(calculusRig(), { realm: 0, duration: 1.5 }, d * 0.3);
    // The helix flies ahead and settles where the chapter's own helix will be: its circle at the front, in the plane,
    // and time running back from it.
    tl.to(dust, { x: o.x + C[0], y: o.y + C[1], z: o.z + C[2] - 3.68, duration: d, ease: 'power2.inOut' }, 0);
    tl.to(dust, { scale: R, rotY: Math.PI / 2, spin: 0, size: 0.9, duration: d }, 0);
    shot(
      tl,
      SLUG,
      {
        pos: [6.2, 4.6, 6.4],
        target: [0, 2.4, -2.6],
        focus: [0, 2.4, -2.6],
        fov: 40,
        dof: 0,
        shake: 0.4,
        portrait: 0.8,
      },
      d,
      0,
      'power2.inOut',
    );
    tl.to(runtime.camera, { lift: 6, duration: d / 2, ease: 'sine.out' }, 0);
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
      body: "Berlin, 1748. Leonhard Euler finds that turning chapter VI's growth sideways makes it go round a circle, and that half way round, five great numbers meet in one line.",
      minDuration: 10,
    },
    ({ tl, cue }) => {
      // The camera comes round to face the plane, which draws itself in where the helix's circle was…
      shot(tl, SLUG, { ...FACE, focus: C, dof: 0, shake: 0.35 }, 6, 0.4, 'power2.inOut');
      tl.to(rig, { plane: 1, duration: 2.2, ease: 'power1.inOut' }, 1.2);
      tl.to(rig, { marks: 1, duration: 0.8 }, 3.4);
      cue(1.2, 'rise', { gain: 0.4 });
      // …and the helix scatters into the stars around it.
      tl.set(dust, { from: 'helix', to: 'stars', morph: 0 }, 5);
      tl.to(dust, { morph: 1, duration: 4, ease: 'power2.inOut' }, 5);
      tl.to(
        dust,
        {
          x: o.x,
          y: o.y + 2.6,
          z: o.z - 2,
          scale: 4.2,
          rotY: 0,
          size: 0.6,
          spin: 0.002,
          swirl: 0.4,
          drift: 0.2,
          colorA: '#f4efe6',
          colorB: '#a8ecf5',
          duration: 4,
          ease: 'power2.inOut',
        },
        5,
      );
    },
  );

  j.beat(
    SLUG,
    {
      id: 'quarters',
      heading: 'A quarter turn',
      body: 'Numbers can be arrows: [cos:real] ones point left and right, [sin:imaginary] ones up and down. Multiplying by [sin:i] turns an arrow a quarter turn: 1 becomes i, and i becomes −1.',
    },
    ({ tl, cue }) => {
      tl.to(rig, { quarters: 1, duration: 0.6 }, 0.4);
      for (let k = 0; k < 4; k++) {
        const at = 2 + k * 1.9;
        tl.to(rig, { quarter: k + 1, duration: 1, ease: 'power2.inOut' }, at);
        cue(at + 1, 'quarter', { k: k + 1 });
      }
    },
  );

  j.beat(
    SLUG,
    {
      id: 'circle',
      heading: 'Pushed sideways',
      body: 'Push the point at right angles to its arrow, [sin:i times] itself, and it never gets further out: it goes round. At time θ it is at e[sup:iθ]; at θ = π, it reaches −1.',
    },
    ({ tl, cue }) => {
      tl.to(rig, { quarters: 0, duration: 0.6 }, 0);
      tl.set(rig, { theta: 0, trail: 1 }, 0);
      tl.to(rig, { point: 1, duration: 0.6 }, 0.4);
      tl.to(rig, { tag: 1, duration: 0.6 }, 0.8);
      tl.to(rig, { push: 1, duration: 0.6 }, 1.4);
      tl.to(rig, { angle: 1, duration: 0.6 }, 2.2);
      tl.set(rig, { voice: 1 }, 2.6);
      tl.to(rig, { theta: Math.PI, duration: 7, ease: 'sine.inOut' }, 2.6);
      tl.set(rig, { voice: 0 }, 9.8);
      cue(9.6, 'quarter', { k: 2 });
    },
  );

  j.beat(
    SLUG,
    {
      id: 'helix',
      heading: 'Drawn out in time',
      body: 'Let time run back, away from us, as the point goes round. Its path stretches out into a helix: the circle, drawn out along θ.',
    },
    ({ tl }) => {
      tl.to(rig, { push: 0, angle: 0, tag: 0, duration: 0.6 }, 0);
      shot(tl, SLUG, { ...HELIX, focus: [0, 2.4, -2.6], dof: 0, shake: 0.35 }, 3.4, 0.2, 'power2.inOut');
      tl.to(rig, { along: 1, duration: 2.2, ease: 'power1.inOut' }, 1.2);
      tl.set(rig, { voice: 1 }, 2.8);
      tl.to(rig, { theta: THETA_MAX, duration: 7, ease: 'sine.inOut' }, 2.8);
      tl.set(rig, { voice: 0 }, 9.8);
    },
  );

  j.beat(
    SLUG,
    {
      id: 'shadows',
      heading: 'Two shadows',
      body: 'Light it from above: its shadow on the floor swings left and right, [cos:cos θ]. Light it from the side: its shadow on the wall rises and falls, [sin:sin θ]. So e[sup:iθ] = cos θ + i sin θ.',
    },
    ({ tl }) => {
      tl.to(rig, { walls: 1, duration: 1.4, ease: 'power1.inOut' }, 0.3);
      tl.to(rig, { rays: 1, duration: 0.6 }, 1.6);
      tl.set(rig, { voice: 1 }, 2);
      tl.to(rig, { shadows: 1, duration: 8, ease: 'none' }, 2);
      tl.set(rig, { voice: 0 }, 10);
      // Round, lower, until the floor and the wall face us about equally.
      shot(
        tl,
        SLUG,
        {
          pos: [6.4, 3.3, 3.6],
          target: [-0.6, 1.9, -2.8],
          focus: [0, 2, -2.8],
          dof: 0,
          shake: 0.3,
          portrait: 0.8,
        },
        9,
        1,
        'sine.inOut',
      );
    },
  );

  j.beat(
    SLUG,
    {
      id: 'triangle',
      heading: 'Pythagoras, all along',
      body: 'The point carries a right triangle: across [cos:cos θ], up [sin:sin θ], long side 1. So cos² θ + sin² θ = 1, for every θ: chapter I, all the way round.',
    },
    ({ tl, cue }) => {
      tl.to(rig, { walls: 0, rays: 0, duration: 1 }, 0);
      tl.set(rig, { shadows: 0 }, 1.1);
      shot(tl, SLUG, { ...FACE, focus: C, dof: 0, shake: 0.3 }, 3.2, 0, 'power2.inOut');
      // The helix folds back into the circle, and the point starts again from 1.
      tl.to(rig, { along: 0, duration: 2.4, ease: 'power1.inOut' }, 0.4);
      tl.to(rig, { trail: 0, duration: 0.8 }, 2.4);
      tl.set(rig, { theta: 0 }, 3.3);
      tl.to(rig, { theta: Math.PI / 3, duration: 1.2, ease: 'power2.inOut' }, 3.4);
      tl.to(rig, { triangle: 1, duration: 1, ease: 'power1.inOut' }, 4.4);
      tl.to(rig, { squares: 1, duration: 0.8 }, 5.8);
      cue(5.8, 'triple');
      // It rides along as the point goes round.
      tl.set(rig, { voice: 1 }, 7);
      tl.to(rig, { theta: (5 * Math.PI) / 6, duration: 2.2, ease: 'sine.inOut' }, 7);
      tl.to(rig, { theta: Math.PI / 4, duration: 2.2, ease: 'sine.inOut' }, 9.2);
      tl.set(rig, { voice: 0 }, 11.4);
    },
  );

  const termsAt = 2.4;
  j.beat(
    SLUG,
    {
      id: 'series',
      heading: 'Why a circle?',
      body: "Euler's reason: e[sup:iθ] = 1 + iθ + (iθ)²/2! + (iθ)³/3! + … Each i turns the next arrow a quarter turn; the factorials shrink them. Head to tail, at θ = π, they spiral in onto −1.",
    },
    ({ tl, cue }) => {
      tl.to(rig, { triangle: 0, squares: 0, duration: 0.6 }, 0);
      tl.to(rig, { theta: Math.PI, duration: 1.6, ease: 'power2.inOut' }, 0.2);
      shot(tl, SLUG, { ...SERIES, focus: C, dof: 0, shake: 0.3 }, 3, 0.4, 'power2.inOut');
      tl.set(rig, { series: 1, terms: 0 }, 1.8);
      let at = termsAt;
      TERM_TIMES.slice(0, TERMS).forEach((d, k) => {
        tl.to(rig, { terms: k + 1, duration: d, ease: 'power1.out' }, at);
        cue(at, 'term', { k });
        at += d;
      });
      tl.to(rig, { tag: 1, duration: 0.6 }, at);
    },
  );

  j.beat(
    SLUG,
    {
      id: 'identity',
      heading: 'Five numbers',
      body: 'At θ = π the point is at −1. One more step, [cos:+1], brings it home to 0. Five numbers meet there: e from growth, i from turning, π from the circle, 1 and 0.',
    },
    ({ tl, cue }) => {
      tl.to(rig, { series: 0, duration: 0.8 }, 0);
      tl.set(rig, { terms: 0 }, 0.9);
      // Room above the circle for the five to line up in.
      shot(
        tl,
        SLUG,
        { pos: [-0.6, 3.25, 10.8], target: [-0.6, 2.85, 0], focus: C, dof: 0, shake: 0.3, portrait: 0.6 },
        2.6,
        0,
        'power2.inOut',
      );
      tl.to(rig, { plus: 1, duration: 1.4, ease: 'power2.inOut' }, 1.6);
      cue(3, 'pin', { i: 0 });
      // They land one after another (the station staggers them by 0.12 of the way, each taking 0.52 of it).
      const d = 4;
      tl.to(rig, { constants: 1, duration: d, ease: 'none' }, 3.4);
      for (let i = 0; i < 5; i++) cue(3.4 + d * (0.52 + 0.12 * i), 'sighting', { i: i * 2 });
    },
  );

  j.beat(
    SLUG,
    {
      id: 'formula',
      kind: 'formula',
      body: "Euler's formula, e[sup:iθ] = cos θ + i sin θ, published in 1748. At θ = π it gives Euler's identity.",
      minDuration: 7,
    },
    ({ tl, cue }) => {
      cue(0.35, 'formula', { chapter: 7 });
      tl.to(rig, { gone: 1, duration: 1 }, 0.2);
      shot(
        tl,
        SLUG,
        // Between the formula over the top of the picture and the player at the foot of it.
        { pos: [-0.6, 2.7, 11.4], target: [-0.6, 3.1, 0], focus: C, dof: 0, shake: 0.3, portrait: 0.6 },
        4,
        0,
        'power2.inOut',
      );
    },
  );

  j.beat(
    SLUG,
    {
      id: 'yourTurn',
      kind: 'yourTurn',
      heading: 'Your turn',
      body: 'Drag the point round the circle. The triangle shows its cos θ and sin θ, and cos² θ + sin² θ is always 1.',
    },
    ({ tl, pauseHere }) => {
      tl.set(
        rig,
        {
          theta: Math.PI,
          plane: 1,
          marks: 1,
          point: 1,
          tag: 1,
          angle: 1,
          triangle: 1,
          squares: 0,
          plus: 0,
          gone: 1,
        },
        0,
      );
      shot(
        tl,
        SLUG,
        // Left of centre, clear of the panel on a wide screen; on a phone the panel fills the lower half, so the plane
        // steps back to fit above it.
        {
          pos: [1.5, 2.2, 10.4],
          target: [1.5, 1.9, 0],
          focus: C,
          fov: 40,
          dof: 0,
          shake: 0.25,
          portrait: 0.9,
        },
        2.6,
        0,
        'power3.inOut',
      );
      tl.set(rig, { interactive: 1 }, 2.6);
      pauseHere(2.7);
      tl.set(rig, { interactive: 0 }, 2.8);
      tl.to({}, { duration: 0.7 }, 2.8);
    },
  );

  // The handoff: a smaller arrow on the tip of the first, and the shape its tip draws.
  j.beat(
    SLUG,
    {
      id: 'handoff',
      heading: 'Circles on circles',
      body: 'Put a smaller arrow on the tip of the first, turning three times as fast the other way. Its tip draws a rounded square. With enough circles, Fourier found, you can draw any shape.',
    },
    ({ tl, cue }) => {
      tl.to(rig, { triangle: 0, angle: 0, tag: 0, marks: 0.4, duration: 0.6 }, 0);
      shot(
        tl,
        SLUG,
        { pos: [-0.3, 2.7, 7.6], target: [-0.3, 2.5, 0], focus: C, dof: 0, shake: 0.3, portrait: 0.75 },
        2.4,
        0,
        'power2.inOut',
      );
      tl.set(rig, { from: Math.PI }, 0.8);
      tl.to(rig, { epicycle: 1, duration: 1, ease: 'power2.out' }, 0.8);
      cue(0.8, 'pin', { i: 1 });
      tl.set(rig, { trace: 1, voice: 1 }, 1.8);
      tl.to(rig, { theta: Math.PI * 3, duration: 7.2, ease: 'none' }, 1.8);
      tl.set(rig, { voice: 0 }, 9);
      // The stars gather into the next chapter's icon: circles riding on circles, and the wave they draw.
      tl.set(dust, { from: 'stars', to: 'epicycles', morph: 0 }, 7.4);
      tl.to(dust, { morph: 1, duration: 2.8, ease: 'power2.inOut' }, 7.4);
      tl.to(
        dust,
        {
          x: o.x + C[0] + 0.6,
          y: o.y + C[1],
          z: o.z + C[2] - 1.2,
          scale: 1.5,
          size: 0.9,
          spin: 0,
          swirl: 0.6,
          drift: 0,
          colorA: '#ffe3f4',
          colorB: SYM7.small,
          duration: 2.8,
          ease: 'power2.inOut',
        },
        7.4,
      );
      cue(7.4, 'gather');
      shot(
        tl,
        SLUG,
        { pos: [3.6, 3.9, 7.4], target: [0.3, 2.5, -0.6], focus: C, dof: 0, shake: 0.3, portrait: 0.75 },
        3.6,
        8,
        'power2.inOut',
      );
      tl.to(rig, { point: 0, epicycle: 0, trace: 0, plane: 0, marks: 0, duration: 1.2 }, 11);
    },
  );
}
