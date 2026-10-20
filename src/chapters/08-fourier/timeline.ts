import { runtime } from '../../engine/runtime';
import { shot } from '../../engine/camera/shots';
import { station } from '../../engine/world/stations';
import { readingTime, type BeatDef, type JourneyBuilder } from '../../journey/builder';
import { FOURIER_DEFAULTS, fourierRig, P, Q, SYM8 } from './rig';
import { FUNDAMENTAL } from './sound';

const SLUG = 'fourier';
type V3 = [number, number, number];
type Frame = { pos: V3; target: V3; portrait: number };

/**
 * The clockwork and its chart face on: held a little high, so the caption (low on the left) leaves them clear; a
 * phone steps back until the chart's full width fits.
 */
const FRONT: Frame = { pos: [0.45, 1.9, 13], target: [0.45, 1.7, 0], portrait: 0.9 };
/** Side on, from the right: the rings, slid onto one axis and set back by speed, stand edge on as bars. */
const SIDE: Frame = { pos: [P[0] + 10, P[1] + 1.8, -2.8], target: [P[0], P[1] - 0.2, -2.8], portrait: 1 };
/** The handoff's drawing, face on. */
const DRAW: Frame = { pos: [Q[0], 2.4, 10], target: [Q[0], 2.2, 0], portrait: 0.8 };

/** How fast the clockwork turns through the story (radians a second): a whole turn every seven seconds. */
const RATE = 0.9;

/** Story-mode timeline for chapter 8: the flight among the stars, then the chapter beat by beat. */
export function buildFourier(j: JourneyBuilder) {
  const rig = fourierRig();
  const dust = runtime.dust;
  const o = station(SLUG);
  /** How far the clockwork has turned by the start of the beat being built. */
  let T = 0;

  /** Keeps the clockwork turning steadily for as long as the beat will last (its animation or its caption). */
  const keepTurning = (tl: gsap.core.Timeline, def: BeatDef) => {
    const len = Math.max(def.minDuration ?? 0, readingTime(def), tl.duration());
    tl.fromTo(rig, { t: T }, { t: T + RATE * len, duration: len, ease: 'none', immediateRender: false }, 0);
    T += RATE * len;
  };

  j.beat(SLUG, { id: 'flight', kind: 'flight', minDuration: 5.6 }, ({ tl, cue }) => {
    const d = 5.4;
    tl.set(rig, { ...FOURIER_DEFAULTS }, 0);
    // Chapter 7's circles on circles fly ahead and settle where this chapter's clockwork will turn.
    tl.to(dust, { x: o.x + P[0] + 1.2, y: o.y + P[1], z: o.z, duration: d, ease: 'power2.inOut' }, 0);
    tl.to(dust, { scale: 1.3, rotY: 0, spin: 0, size: 0.9, duration: d }, 0);
    shot(
      tl,
      SLUG,
      {
        pos: [0.45, 2.6, 11],
        target: [0.45, 2.3, 0],
        focus: [0, 2.4, 0],
        fov: 40,
        dof: 0,
        shake: 0.4,
        portrait: 0.9,
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
      body: 'Grenoble, 1807. Working out how heat spreads through a solid, Joseph Fourier makes a startling claim: any repeating shape, however jagged, is a sum of plain waves, circles turning at whole-number speeds.',
      minDuration: 10,
    },
    ({ tl }) => {
      // The circles scatter into the stars as the title comes up; the stage is left empty behind it.
      shot(tl, SLUG, { ...FRONT, focus: P, dof: 0, shake: 0.35 }, 6, 0.4, 'power2.inOut');
      tl.set(dust, { from: 'epicycles', to: 'stars', morph: 0 }, 0.4);
      tl.to(dust, { morph: 1, duration: 3.4, ease: 'power2.inOut' }, 0.4);
      tl.to(
        dust,
        {
          x: o.x,
          y: o.y + 2.6,
          z: o.z - 2,
          scale: 4.2,
          size: 0.6,
          spin: 0.002,
          swirl: 0.4,
          drift: 0.2,
          colorA: '#f4efe6',
          colorB: '#f6c6e3',
          duration: 3.4,
          ease: 'power2.inOut',
        },
        0.4,
      );
    },
  );

  const one: BeatDef = {
    id: 'one',
    heading: 'One circle',
    body: "Take chapter VII's turning arrow and watch only its height. Traced out over time, it rises and falls in a sine wave. Played as a sound, that is the purest tone there is.",
  };
  j.beat(SLUG, one, ({ tl, cue }) => {
    tl.set(rig, { count: 1, shape: 0 }, 0);
    // The chart draws itself in, then the circle appears beside it.
    tl.to(rig, { stage: 1, duration: 1.4, ease: 'power1.inOut' }, 0);
    cue(0, 'rise', { gain: 0.35 });
    tl.to(rig, { clockwork: 1, duration: 0.8 }, 0.6);
    tl.set(rig, { since: T + RATE * 1.2 }, 0);
    tl.to(rig, { trace: 1, duration: 0.4 }, 1.2);
    tl.to(rig, { sing: 0.9, duration: 0.8 }, 1.2);
    keepTurning(tl, one);
  });

  // Each new circle grows in on the last one's tip: slowly at first, then quicker.
  const adds: Array<[number, number]> = [
    [1.6, 1.2],
    [3.6, 1],
    [5.4, 0.9],
    [7, 0.6],
    [7.9, 0.6],
    [8.8, 0.6],
    [9.7, 0.6],
  ];
  const build: BeatDef = {
    id: 'build',
    heading: 'Circles on circles',
    body: 'On its tip, put a circle turning three times as fast and a third as big; then one five times as fast, a fifth as big… Each adds a ripple, squaring the wave off. Listen: you can hear each one arrive.',
  };
  j.beat(SLUG, build, ({ tl, cue }) => {
    // The square the circles are aiming at, faint behind the wave.
    tl.to(rig, { ghost: 1, duration: 0.8 }, 0.4);
    adds.forEach(([at, d], k) => {
      tl.to(rig, { count: k + 2, duration: d, ease: 'power1.inOut' }, at);
      cue(at, 'harmonic', { n: 2 * k + 3, hz: FUNDAMENTAL });
    });
    // The newest circle's name, for the first few.
    tl.to(rig, { newest: 1, duration: 0.5 }, 1.8);
    tl.to(rig, { newest: 0, duration: 0.5 }, 6.8);
    keepTurning(tl, build);
  });

  const spectrum: BeatDef = {
    id: 'spectrum',
    heading: 'Front and side',
    body: "Turn the clockwork side on, and each circle is a bar: as tall as it is big, standing at its speed. Front on, it is a wave; side on, it is the wave's recipe, its spectrum: 1, 1/3, 1/5…",
  };
  j.beat(SLUG, spectrum, ({ tl, cue }) => {
    tl.to(rig, { trace: 0, ghost: 0, stage: 0, duration: 0.8 }, 0);
    // The rings slide onto one axis, then draw apart in depth, one layer per speed…
    tl.to(rig, { align: 1, duration: 1.6, ease: 'power2.inOut' }, 0.6);
    tl.to(rig, { layers: 1, duration: 2, ease: 'power2.inOut' }, 1.8);
    // …as the camera comes round to look at them side on.
    shot(tl, SLUG, { ...SIDE, focus: [P[0], P[1], -3], dof: 0, shake: 0.3 }, 3.6, 0.8, 'power2.inOut');
    tl.to(rig, { bars: 1, duration: 1.4 }, 3.8);
    cue(3.8, 'spectrum', { hz: FUNDAMENTAL });
    keepTurning(tl, spectrum);
  });

  const shapes: BeatDef = {
    id: 'shapes',
    heading: 'Any repeating wave',
    body: 'Change the recipe and the same clockwork plays another wave: every speed at 1/n gives a sawtooth, bright and buzzing; odd speeds at 1/n² a triangle, soft as a flute. Every repeating sound is some mix of circles.',
  };
  j.beat(SLUG, shapes, ({ tl, cue }) => {
    tl.to(rig, { bars: 0, duration: 0.6 }, 0);
    tl.to(rig, { layers: 0, align: 0, duration: 1.6, ease: 'power2.inOut' }, 0.4);
    shot(tl, SLUG, { ...FRONT, focus: P, dof: 0, shake: 0.3 }, 3, 0.2, 'power2.inOut');
    tl.set(rig, { since: T + RATE * 2 }, 0);
    tl.to(rig, { stage: 1, trace: 1, ghost: 1, duration: 0.6 }, 2);
    tl.to(rig, { shape: 1, duration: 1.6, ease: 'power2.inOut' }, 4.4);
    cue(4.4, 'harmonic', { n: 2, hz: FUNDAMENTAL });
    tl.to(rig, { shape: 2, duration: 1.6, ease: 'power2.inOut' }, 9);
    cue(9, 'harmonic', { n: 3, hz: FUNDAMENTAL });
    keepTurning(tl, shapes);
  });

  const formula: BeatDef = {
    id: 'formula',
    kind: 'formula',
    body: "Fourier's series: a repeating signal f(t) is a sum of sine waves at whole-number multiples n of one frequency ω, each with its own size aₙ and starting angle φₙ.",
    minDuration: 7,
  };
  j.beat(SLUG, formula, ({ tl, cue }) => {
    cue(0.35, 'formula', { chapter: 8 });
    tl.to(rig, { ghost: 0, sing: 0.6, duration: 1 }, 0);
    // Below the formula over the top of the picture.
    shot(
      tl,
      SLUG,
      { pos: [0.45, 1.8, 14], target: [0.45, 2.6, 0], focus: P, dof: 0, shake: 0.3, portrait: 0.9 },
      4,
      0,
      'power2.inOut',
    );
    keepTurning(tl, formula);
  });

  j.beat(
    SLUG,
    {
      id: 'yourTurn',
      kind: 'yourTurn',
      heading: 'Your turn',
      body: 'Pick a wave and how many circles build it. Listen to how its sound changes as the circles add up.',
    },
    ({ tl, pauseHere }) => {
      tl.set(
        rig,
        {
          shape: 0,
          count: 4,
          stage: 1,
          clockwork: 1,
          trace: 1,
          ghost: 1,
          sing: 0.7,
          bars: 0,
          layers: 0,
          align: 0,
        },
        0,
      );
      shot(
        tl,
        SLUG,
        // Left of centre, clear of the panel on a wide screen; on a phone the panel fills the lower half.
        { pos: [2.5, 1.9, 14], target: [2.5, 1.9, 0], focus: P, fov: 40, dof: 0, shake: 0.25, portrait: 1 },
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

  // The handoff: a hundred circles, turning both ways, draw the next chapter's ambulance.
  j.beat(
    SLUG,
    {
      id: 'handoff',
      heading: 'Any closed shape',
      body: 'Let circles turn both ways, at every speed, and their tip can draw any closed shape at all. A hundred of them draw an ambulance. Its siren sounds higher as it comes, lower as it goes. Why?',
    },
    ({ tl, cue }) => {
      tl.to(rig, { clockwork: 0, trace: 0, ghost: 0, stage: 0, sing: 0, duration: 1 }, 0);
      shot(tl, SLUG, { ...DRAW, focus: Q, dof: 0, shake: 0.3 }, 2.4, 0, 'power2.inOut');
      tl.set(rig, { dt: 0, dcount: 101, dtrace: 1 }, 0);
      tl.to(rig, { drawing: 1, duration: 0.8 }, 1.2);
      tl.to(rig, { dt: Math.PI * 2, duration: 7.4, ease: 'none' }, 1.6);
      cue(9.1, 'siren');
      // The stars gather into the next chapter's icon round the drawing: sound spreading out in rings.
      tl.set(dust, { from: 'stars', to: 'waves', morph: 0 }, 9.4);
      tl.to(dust, { morph: 1, duration: 2.8, ease: 'power2.inOut' }, 9.4);
      tl.to(
        dust,
        {
          x: o.x + Q[0] + 1.4,
          y: o.y + Q[1] + 0.6,
          z: o.z - 0.6,
          scale: 1,
          size: 0.9,
          spin: 0,
          swirl: 0.6,
          drift: 0,
          colorA: '#e8f0ff',
          colorB: SYM8.siren,
          duration: 2.8,
          ease: 'power2.inOut',
        },
        9.4,
      );
      cue(9.4, 'gather');
      tl.to(rig, { drawing: 0, duration: 1.2 }, 12);
    },
  );
}
