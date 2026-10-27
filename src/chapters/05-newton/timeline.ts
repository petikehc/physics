import { runtime } from '../../engine/runtime';
import { shot } from '../../engine/camera/shots';
import { station } from '../../engine/world/stations';
import type { JourneyBuilder } from '../../journey/builder';
import { keplerRig } from '../04-kepler/rig';
import { flightAt, type Flight } from './math';
import {
  flat,
  MOON_ORBIT,
  NEWTON_DEFAULTS,
  newtonRig,
  RADIUS,
  SHOT,
  STORY_FLIGHTS,
  STROBE,
  STROBE_TOP,
} from './rig';

const SLUG = 'newton';
type V3 = [number, number, number];
/** The Dust apple's scale here (its body is about 2.5 wide), and how far its middle sits above its origin. */
const APPLE = 0.048;
const APPLE_MID = 0.2 * APPLE;
/** Where the Moon stands for the Moon test, and the middle of the line out to it. */
const MOON_AT = 1.12;
const MID: V3 = [Math.cos(MOON_AT) * MOON_ORBIT * 0.5, Math.sin(MOON_AT) * MOON_ORBIT * 0.5, 0];

/**
 * A camera following a ball along `f` from flight time `from` to `to`, `dur` seconds from `at`: behind it, out of
 * the plane, rolled so the ground stays below. It first glides into place over `approach` seconds.
 */
function chase(
  tl: gsap.core.Timeline,
  f: Flight,
  from: number,
  to: number,
  at: number,
  dur: number,
  approach: number,
  n = 30,
) {
  const o = station(SLUG);
  const keyframes = [];
  for (let i = 0; i <= n; i++) {
    const p = flightAt(f, from + ((to - from) * i) / n);
    const r = Math.hypot(p.x, p.y);
    const [ux, uy] = [p.x / r, p.y / r];
    const sp = Math.hypot(p.vx, p.vy);
    const [vx, vy] = [p.vx / sp, p.vy / sp];
    const [bx, by] = flat(p.x, p.y);
    keyframes.push({
      px: o.x + bx - vx * 0.9 + ux * 0.45,
      py: o.y + by - vy * 0.9 + uy * 0.45,
      pz: o.z + 1.9,
      tx: o.x + bx + vx * 0.55 - ux * 0.08,
      ty: o.y + by + vy * 0.55 - uy * 0.08,
      tz: o.z,
      roll: -Math.atan2(p.x, p.y),
      duration: i === 0 ? approach : dur / n,
      ease: i === 0 ? 'power2.inOut' : 'none',
    });
  }
  tl.to(runtime.camera, { keyframes }, at - approach);
}

/** Fires story shot `i` at `at` and flies it for `dur` seconds (to flight time `until`, or to where it lands). */
function fireShot(
  tl: gsap.core.Timeline,
  cue: (time: number, id: string, params?: Record<string, number>) => void,
  i: number,
  at: number,
  dur: number,
  until?: number,
) {
  const rig = newtonRig();
  const f = STORY_FLIGHTS[i]!;
  tl.set(rig, { shot: i, fly: 0 }, at);
  tl.to(rig, { fly: until ?? f.duration, duration: dur, ease: 'none' }, at);
  cue(at, 'cannon');
  if (f.outcome === 'lands') cue(at + dur, 'thud');
}

/** Story-mode timeline for chapter 5: the flight to Newton's planet, then the chapter beat by beat. */
export function buildNewton(j: JourneyBuilder) {
  const rig = newtonRig();
  const dust = runtime.dust;
  const o = station(SLUG);
  const top = o.y + RADIUS;

  j.beat(SLUG, { id: 'flight', kind: 'flight', minDuration: 5.6 }, ({ tl, cue }) => {
    const d = 5.4;
    tl.set(rig, { ...NEWTON_DEFAULTS }, 0);
    // Chapter 4's Sun goes out behind us: this planet has a sun of its own.
    tl.to(keplerRig(), { sun: 0, duration: 1.5 }, d * 0.3);
    // The apple flies ahead to hang over the top of the planet, which fades in out of the dark.
    tl.to(dust, { x: o.x, y: top + 0.75, z: o.z, duration: d, ease: 'power2.inOut' }, 0);
    tl.to(dust, { scale: APPLE, spin: 0.25, size: 0.8, duration: d }, 0);
    tl.to(rig, { planet: 1, air: 1, duration: 2.2, ease: 'power1.inOut' }, d * 0.5);
    shot(
      tl,
      SLUG,
      { pos: [-1.5, 2.95, 4.2], target: [0, 2.35, 0], focus: [0, RADIUS, 0], fov: 40, dof: 0, shake: 0.4 },
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
      body: 'Woolsthorpe, 1666. Plague has closed Cambridge, and young Isaac Newton is home on the family farm. An apple falls, he later recalled, and he wonders: does that pull reach the Moon?',
      minDuration: 9,
    },
    ({ tl, cue }) => {
      // The apple falls…
      tl.to(dust, { y: top + APPLE * 1.1 + 0.005, duration: 0.55, ease: 'power2.in' }, 0.5);
      tl.to(dust, { spin: 0, duration: 0.5 }, 0.5);
      cue(1.05, 'land');
      // …and as the camera looks up, the Moon rises over the planet's edge…
      tl.fromTo(
        rig,
        { moon: 0, moonAngle: -0.12 },
        { moon: 1, moonAngle: 0.28, duration: 9, ease: 'none' },
        1.6,
      );
      shot(
        tl,
        SLUG,
        {
          pos: [-3.0, 2.3, 1.6],
          target: [1.6, 3.0, -0.8],
          focus: [0, RADIUS, 0],
          fov: 42,
          dof: 0,
          shake: 0.4,
        },
        5,
        1.4,
        'power2.inOut',
      );
      // …and the apple dissolves into the stars around it.
      tl.set(dust, { from: 'apple', to: 'stars', morph: 0 }, 6.2);
      tl.to(dust, { morph: 1, duration: 4, ease: 'power2.inOut' }, 6.2);
      tl.to(
        dust,
        {
          x: o.x,
          y: o.y,
          z: o.z,
          scale: 3.2,
          size: 0.6,
          spin: 0.002,
          swirl: 0.4,
          drift: 0.2,
          colorA: '#f4efe6',
          colorB: '#bcd4ff',
          duration: 4,
          ease: 'power2.inOut',
        },
        6.2,
      );
    },
  );

  j.beat(
    SLUG,
    {
      id: 'cannon',
      heading: "Newton's cannon",
      body: 'Newton pictured a cannon on a mountain so tall its top is above the air. Fire it, and the ball falls to the ground. Faster, and it lands farther round: the ground curves away beneath it.',
    },
    ({ tl, cue }) => {
      tl.to(rig, { moon: 0, duration: 1 }, 0);
      tl.to(rig, { mountain: 1, duration: 1.6, ease: 'power2.out' }, 0.2);
      cue(0.2, 'rise', { gain: 0.6 });
      tl.to(rig, { cannon: 1, duration: 0.5, ease: 'back.out(2)' }, 1.5);
      cue(1.6, 'pin', { i: 0 });
      shot(
        tl,
        SLUG,
        { pos: [1.3, 2.85, 2.1], target: [0.3, 2.3, 0], focus: [0, 2.4, 0], fov: 40, dof: 0.2, shake: 0.3 },
        2.4,
        0,
        'power2.inOut',
      );
      tl.to(rig, { ball: 1, ghosts: 1, voice: 1, duration: 0.01 }, 2.5);
      fireShot(tl, cue, 0, 2.6, 1.9);
      shot(tl, SLUG, { pos: [2.0, 3.1, 4.3], target: [1.0, 1.7, 0], dof: 0 }, 2.6, 4.2, 'power2.inOut');
      fireShot(tl, cue, 1, 5.2, 2.5);
      shot(tl, SLUG, { pos: [2.6, 2.3, 7.4], target: [1.3, 0.9, 0], dof: 0 }, 3, 7.6, 'power2.inOut');
      fireShot(tl, cue, 2, 8.4, 3.4);
    },
  );

  const orbit = STORY_FLIGHTS[SHOT.orbit]!;
  const P = orbit.period;
  /** Where the slow-motion look at the forces holds: a twelfth of the way round. */
  const HOLD = 2 * P + P / 12;
  j.beat(
    SLUG,
    {
      id: 'orbit',
      heading: 'Falling, and missing',
      body: 'At 7.1 km/s the ground curves away as fast as the ball falls, so it never lands. An orbit is falling, and forever missing. The Space Station does just this, lower down.',
    },
    ({ tl, cue }) => {
      // Behind the cannon, then after the ball as it goes over the edge of the world…
      tl.to(rig, { ghosts: 0.4, duration: 1 }, 0);
      fireShot(tl, cue, SHOT.orbit, 1.8, 3.4, P / 4);
      chase(tl, orbit, 0, P / 4, 1.8, 3.4, 1.6);
      // …then out to see the whole of its circle, as it comes round again and again.
      tl.to(rig, { fly: HOLD, duration: 10, ease: 'none' }, 5.2);
      shot(
        tl,
        SLUG,
        { pos: [0, 0.2, 10.5], target: [0, 0, 0], focus: [0, 0, 0], roll: 0, dof: 0, shake: 0.3 },
        4,
        5.2,
        'power2.inOut',
      );
    },
  );

  j.beat(
    SLUG,
    {
      id: 'laws',
      heading: 'Straight on, pulled in',
      body: "Left alone, the ball would fly on [v:in a straight line]: Newton's first law. [pull:The pull towards the centre] bends it off that line at every moment. That bend is its fall.",
    },
    ({ tl }) => {
      tl.to(rig, { voice: 0, ghosts: 0, duration: 0.6 }, 0);
      tl.to(rig, { fly: HOLD + P / 30, duration: 14, ease: 'none' }, 0);
      const ball = flightAt(orbit, HOLD);
      const [bx, by] = flat(ball.x, ball.y);
      shot(
        tl,
        SLUG,
        { pos: [bx + 0.8, by - 0.1, 3.4], target: [bx + 0.65, by - 0.4, 0], focus: [bx, by, 0], dof: 0 },
        2.6,
        0,
        'power2.inOut',
      );
      tl.to(rig, { arrows: 1, duration: 0.8 }, 1.6);
      tl.to(rig, { straight: 1, duration: 1.2 }, 4);
    },
  );

  j.beat(
    SLUG,
    {
      id: 'moon',
      heading: 'The Moon is falling too',
      body: "Newton tried it on the Moon, 60 times as far from the Earth's centre as the apple. In a second the apple falls 4.9 m, the Moon just 1.36 mm: 3,600 times less, and 3,600 is 60 × 60.",
    },
    ({ tl, cue }) => {
      tl.to(rig, { arrows: 0, straight: 0, ball: 0, duration: 0.8 }, 0);
      tl.set(rig, { moonAngle: MOON_AT }, 0);
      tl.to(rig, { moon: 1, duration: 1.5 }, 0.8);
      tl.to(rig, { moonAngle: MOON_AT - 0.03, duration: 16, ease: 'none' }, 0.8);
      // Far out, to see the Moon's orbit to scale, the Earth held up clear of the caption.
      shot(
        tl,
        SLUG,
        {
          pos: [MID[0] - 11, MID[1] - 36, 228],
          target: [MID[0] - 2, MID[1] - 13, 0],
          focus: MID,
          dof: 0,
          shake: 0.2,
          // Upright already: a phone steps back only a little, to keep the Earth above its taller caption.
          portrait: 0.25,
        },
        5.5,
        0.2,
        'power3.inOut',
      );
      tl.to(rig, { sixty: 1, duration: 3.6, ease: 'none' }, 5.2);
      cue(5.2, 'count');
      tl.to(rig, { falls: 1, duration: 3, ease: 'none' }, 9.6);
      cue(9.6, 'glow', { which: 0 });
    },
  );

  j.beat(
    SLUG,
    {
      id: 'shells',
      heading: 'Spread over a sphere',
      body: 'Why the square? The pull spreads out in every direction, like light from a lamp. Twice as far, it covers four times the area; three times as far, nine. So it weakens with the square of the distance.',
    },
    ({ tl, cue }) => {
      tl.to(rig, { sixty: 0, falls: 0, duration: 1 }, 0);
      tl.to(rig, { moon: 0, duration: 2 }, 1.5);
      shot(
        tl,
        SLUG,
        { pos: [-3, 7.5, 34], target: [5.4, 1.8, 7.4], focus: [4, 1.5, 6], dof: 0, shake: 0.3, portrait: 1 },
        5,
        0,
        'power3.inOut',
      );
      tl.to(rig, { shells: 1, duration: 3.6, ease: 'none' }, 2.2);
      cue(2.2, 'glow', { which: 0 });
      tl.to(rig, { tiles: 1, duration: 3.6, ease: 'none' }, 6.4);
      cue(6.4, 'tink', { i: 0 });
      cue(7.6, 'tink', { i: 2 });
      cue(8.8, 'tink', { i: 4 });
    },
  );

  j.beat(
    SLUG,
    {
      id: 'formula',
      kind: 'formula',
      body: "Newton's law of universal gravitation, 1687: every mass pulls on every other, more for bigger masses, and less with the square of the distance between them.",
      minDuration: 6.5,
    },
    ({ tl, cue }) => {
      cue(0.35, 'formula', { chapter: 5 });
      tl.to(rig, { shells: 0, tiles: 0, duration: 1.6 }, 0);
      // The planet below the formula, the ball circling it again.
      tl.set(rig, { shot: SHOT.orbit, fly: HOLD }, 0);
      tl.to(rig, { ball: 1, duration: 1 }, 1);
      tl.to(rig, { fly: HOLD + P * 0.9, duration: 8, ease: 'none' }, 0);
      shot(
        tl,
        SLUG,
        { pos: [-1.6, -3.4, 11.5], target: [0, 1.6, 0], focus: [0, 0, 0], dof: 0, shake: 0.35 },
        4.5,
        0,
        'power2.inOut',
      );
    },
  );

  const ellipse = STORY_FLIGHTS[SHOT.ellipse]!;
  const lowest = -ellipse.apo * RADIUS;
  const middle = (RADIUS * 1.07 + lowest) / 2;
  j.beat(
    SLUG,
    {
      id: 'ellipse',
      heading: 'Kepler, explained',
      body: "With his laws of motion, this one law gives all three of Kepler's laws. Fire faster still and the ball swings out on an ellipse, the planet's centre at one focus, sweeping equal areas in equal times.",
    },
    ({ tl, cue }) => {
      shot(
        tl,
        SLUG,
        { pos: [0.6, middle, 33], target: [0, middle, 0], focus: [0, middle, 0], dof: 0, shake: 0.3 },
        3,
        0,
        'power2.inOut',
      );
      tl.to(rig, { voice: 1, duration: 0.01 }, 1.4);
      fireShot(tl, cue, SHOT.ellipse, 1.6, 9, ellipse.period);
      tl.to(rig, { kepler: 1, duration: 1.6 }, 4.2);
      cue(4.2, 'glow', { which: 0 });
    },
  );

  j.beat(
    SLUG,
    {
      id: 'yourTurn',
      kind: 'yourTurn',
      heading: 'Your turn',
      body: 'Set the speed and fire. Too slow and it lands; at about 7.1 km/s it circles; faster, it stretches into an ellipse; past 10 km/s it never comes back.',
    },
    ({ tl, pauseHere, cue }) => {
      tl.to(rig, { kepler: 0, voice: 0, duration: 0.6 }, 0);
      tl.set(rig, { speed: 6.5, elevation: 0 }, 0);
      shot(
        tl,
        SLUG,
        { pos: [2.2, -0.7, 14.5], target: [2.2, -0.7, 0], focus: [0, 0, 0], fov: 40, dof: 0, shake: 0.25 },
        2.6,
        0,
        'power3.inOut',
      );
      tl.set(rig, { interactive: 1, fly: 0, ball: 1 }, 2.6);
      cue(2.62, 'cannon');
      pauseHere(2.7);
      tl.set(rig, { interactive: 0 }, 2.8);
      tl.to({}, { duration: 0.7 }, 2.8);
    },
  );

  // The handoff, at the top of the planet: the strobe's apple falls beside where the mountain stood.
  const fall = 1.6;
  j.beat(
    SLUG,
    {
      id: 'handoff',
      heading: 'A new kind of mathematics',
      body: 'Newton needed new mathematics for things whose speed changes every instant, like a falling apple. Under a strobe, each flash finds it farther down than the last. Spread the flashes out in time and they draw a curve.',
    },
    ({ tl, cue }) => {
      tl.to(rig, { ball: 0, mountain: 0, cannon: 0, duration: 1.2, ease: 'power2.in' }, 0);
      const width = STROBE.flashes * STROBE.spacing;
      shot(
        tl,
        SLUG,
        {
          pos: [width / 2 - 0.2, STROBE_TOP - 0.35, 5.2],
          target: [width / 2 - 0.2, STROBE_TOP - 0.85, 0],
          focus: [width / 2, STROBE_TOP - 0.8, 0],
          fov: 40,
          dof: 0,
          shake: 0.3,
        },
        3,
        0,
        'power2.inOut',
      );
      // The stars gather into an apple at the top of the strobe…
      tl.set(dust, { from: 'stars', to: 'apple', morph: 0 }, 0.4);
      tl.to(dust, { morph: 1, duration: 2.6, ease: 'power2.inOut' }, 0.4);
      tl.to(
        dust,
        {
          x: o.x,
          y: o.y + STROBE_TOP - APPLE_MID,
          z: o.z + 0.02,
          scale: APPLE,
          size: 0.85,
          spin: 0,
          swirl: 0.8,
          drift: 0,
          colorA: '#ffe7d6',
          colorB: '#d9534f',
          duration: 2.6,
          ease: 'power2.inOut',
        },
        0.4,
      );
      cue(0.5, 'gather');
      // …it falls, a flash at every equal time…
      const t0 = 3.6;
      tl.to(dust, { y: o.y + STROBE_TOP - STROBE.drop - APPLE_MID, duration: fall, ease: 'power2.in' }, t0);
      // A little past the last flash, so it lights too.
      tl.to(rig, { strobe: 1.04, duration: fall * 1.04, ease: 'none' }, t0);
      for (let k = 0; k <= STROBE.flashes; k++) cue(t0 + (fall * k) / STROBE.flashes, 'flash', { k });
      cue(t0 + fall, 'land');
      // …then time is laid out sideways, one step per flash, and the flashes trace a curve.
      tl.to(rig, { turn: 1, duration: 1.8, ease: 'power2.inOut' }, t0 + fall + 0.6);
      tl.to(dust, { x: o.x + width, duration: 1.8, ease: 'power2.inOut' }, t0 + fall + 0.6);
      tl.to(rig, { curve: 1, duration: 1.8, ease: 'power1.inOut' }, t0 + fall + 2.6);
      // The graph clears, and the apple becomes the next chapter's icon.
      const t1 = t0 + fall + 4.6;
      tl.to(rig, { clear: 1, duration: 1.4 }, t1);
      tl.set(dust, { from: 'apple', to: 'calculus', morph: 0 }, t1);
      tl.to(dust, { morph: 1, duration: 2.6, ease: 'power2.inOut' }, t1);
      tl.to(
        dust,
        {
          x: o.x + width / 2,
          y: o.y + STROBE_TOP - 0.7,
          scale: 0.32,
          size: 0.9,
          swirl: 0.6,
          colorA: '#efe8ff',
          colorB: '#9b7bf0',
          duration: 2.6,
          ease: 'power2.inOut',
        },
        t1,
      );
      cue(t1, 'gather');
    },
  );
}
