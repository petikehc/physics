import { runtime } from '../../engine/runtime';
import { shot } from '../../engine/camera/shots';
import { station } from '../../engine/world/stations';
import { readingTime, type BeatDef, type JourneyBuilder } from '../../journey/builder';
import { heightAt, rideAt, sAtX, timeAt, trackAt, type RideSample, type V3 } from './math';
import {
  coasterRide,
  coasterTrack,
  ENERGY_DEFAULTS,
  energyRig,
  STORY_TEST,
  storyRide,
  TEST_CX,
  storyTestTrack,
  SYM10,
  testRide,
} from './rig';

const SLUG = 'energy';
type Frame = { pos: V3; target: V3; portrait: number; side?: number };

/** The fairground from the front and to the left: the coaster's lift hill, its loop, and the wheel behind. */
const FAIR: Frame = { pos: [-34, 7, 46], target: [12, 12, -6], portrait: 0.6 };
/** Side on to the loop and the camel-back, a little to their right: the tanks hang on the right of the picture. */
const SIDE: Frame = { pos: [55, 12, 64], target: [55, 9, -2], portrait: 0.8 };
/** The brake run, close, from in front and to the left; the tanks hang on the right. */
const BRAKES: Frame = { pos: [77, 5, 24], target: [93, 2.5, -3], portrait: 0.7 };
/** The test track, side on; on a wide screen, slid to its right, where the tanks hang. */
const TEST: Frame = { pos: [TEST_CX, 10, 98], target: [TEST_CX, 8, 22], portrait: 0.8, side: 17 };
/** As the test track, further back and lower in the picture, leaving room for the formula at the top. */
const FORMULA: Frame = { pos: [TEST_CX, 13, 92], target: [TEST_CX, 11, 22], portrait: 0.8, side: 6 };
/** The viewer's test track; on a wide screen, left of centre so the panel at the side leaves it clear. */
const PLAY: Frame = { pos: [TEST_CX, 11, 82], target: [TEST_CX, 7, 22], portrait: 1, side: 11 };

/** The camera on a ride in the front car: in its seat, looking along the track ahead. */
function pov(ride: RideSample[], t0: number, t1: number, at: number, approach: number, step = 0.1) {
  const track = coasterTrack();
  const o = station(SLUG);
  const keyframes: Array<Record<string, number | string>> = [];
  const n = Math.max(1, Math.round((t1 - t0) / step));
  for (let i = 0; i <= n; i++) {
    const s = rideAt(ride, t0 + ((t1 - t0) * i) / n).s;
    // In the front seat (the front car itself is not drawn while it is ridden in).
    const seat = trackAt(track, s + 0.3);
    // Looking the way the track runs a few metres ahead: along it, over the crest and down the drop.
    const along = trackAt(track, s + 5);
    const ahead: { p: V3; up: V3 } = {
      p: [seat.p[0] + along.tan[0] * 12, seat.p[1] + along.tan[1] * 12, seat.p[2] + along.tan[2] * 12],
      up: seat.up,
    };
    keyframes.push({
      px: o.x + seat.p[0] + seat.up[0] * 1.9,
      py: o.y + seat.p[1] + seat.up[1] * 1.9,
      pz: o.z + seat.p[2] + seat.up[2] * 1.9,
      tx: o.x + ahead.p[0] + ahead.up[0] * 0.6,
      ty: o.y + ahead.p[1] + ahead.up[1] * 0.6,
      tz: o.z + ahead.p[2] + ahead.up[2] * 0.6,
      fov: 62,
      portrait: 0,
      shake: 0.2,
      duration: i === 0 ? approach : (t1 - t0) / n,
      ease: i === 0 ? 'power2.inOut' : 'none',
    });
  }
  return { keyframes, at: at - approach };
}

/** Story-mode timeline for chapter 10: along the street to the fairground, then the chapter beat by beat. */
export function buildEnergy(j: JourneyBuilder) {
  const rig = energyRig();
  const dust = runtime.dust;
  const o = station(SLUG);
  const ride = storyRide();
  const track = coasterTrack();
  const opts = coasterRide();
  /** The moments that matter in the story's ride: over the top, at the foot of the loop, into the brakes, stopped. */
  const crest = timeAt(ride, opts.lift!.to)!;
  const loop = timeAt(ride, sAtX(track, 20))!;
  const brakes = timeAt(ride, opts.brakes!.from)!;
  const stopped = ride.find((r) => r.t > brakes && r.v === 0)?.t ?? brakes + 3;

  j.beat(SLUG, { id: 'flight', kind: 'flight', minDuration: 5.6 }, ({ tl, cue }) => {
    const d = 5.4;
    tl.set(rig, { ...ENERGY_DEFAULTS }, 0);
    // On down the street to the fairground at its end, its lights coming on; the coaster's loop flies ahead.
    tl.to(rig, { fair: 1, train: 1, duration: 1.6 }, d * 0.45);
    tl.to(dust, { x: o.x + 28.5, y: o.y + 10.5, z: o.z - 1.5, duration: d, ease: 'power2.inOut' }, 0);
    tl.to(dust, { scale: 3.4, spin: 0, size: 0.9, duration: d }, 0);
    shot(tl, SLUG, { ...FAIR, focus: [10, 10, 0], fov: 40, dof: 0, shake: 0.4 }, d, 0, 'power2.inOut');
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
      body: 'Heilbronn, Manchester and Berlin, the 1840s. A ship’s doctor, a brewer and a young physician each arrive at the same idea: energy is never made and never destroyed, only changed from one kind into another.',
      minDuration: 10,
    },
    ({ tl }) => {
      shot(tl, SLUG, { pos: [-28, 6.5, 42], target: [8, 12, -6], dof: 0, shake: 0.35 }, 9, 0.2, 'sine.inOut');
      // The coaster's loop scatters up into the night as stars.
      tl.set(dust, { from: 'coaster', to: 'stars', morph: 0 }, 0.4);
      tl.to(dust, { morph: 1, duration: 3.6, ease: 'power2.inOut' }, 0.4);
      tl.to(
        dust,
        {
          x: o.x,
          y: o.y + 2.6,
          z: o.z - 20,
          scale: 4.2,
          size: 0.55,
          spin: 0.001,
          swirl: 0.3,
          drift: 0.15,
          colorA: '#f4efe6',
          colorB: '#ffe2c4',
          duration: 3.6,
          ease: 'power2.inOut',
        },
        0.4,
      );
    },
  );

  // Riding in the front car: up the lift hill, over the top and down the first drop.
  const rideDef: BeatDef = {
    id: 'ride',
    heading: 'Hold on',
    body: 'Climb aboard. A chain hauls the train slowly up the lift hill, then lets it go at the top. From there nothing pushes it, yet down it plunges, round the loop and over the next hill. Where does all that speed come from?',
  };
  const settle = 1.6;
  const out = 2.4;
  j.beat(SLUG, rideDef, ({ tl, cue }) => {
    tl.set(rig, { train: 1, rideT: 0, pov: 1, tanks: 0 }, 0);
    const p = pov(ride, 0, loop, settle, settle);
    tl.to(runtime.camera, { keyframes: p.keyframes }, p.at);
    tl.fromTo(
      rig,
      { rideT: 0 },
      { rideT: loop, duration: loop, ease: 'none', immediateRender: false },
      settle,
    );
    cue(settle, 'chain', { dur: crest });
    cue(settle + crest - 0.2, 'whoosh', { gain: 0.6 });
    // Out of the car and round to the side, as time slows right down for what comes next.
    tl.set(rig, { pov: 0 }, settle + loop);
    tl.to(rig, { rideT: loop + 0.7, duration: out, ease: 'power2.out' }, settle + loop);
    shot(
      tl,
      SLUG,
      { ...SIDE, focus: [43, 8, 0], fov: 40, dof: 0, shake: 0.3 },
      out,
      settle + loop,
      'power2.inOut',
    );
    tl.to(runtime.camera, { lift: 0, roll: 0, duration: 0.1 }, settle + loop);
  });

  const tanksDef: BeatDef = {
    id: 'tanks',
    heading: 'Height into speed',
    body: 'Slowed right down, with its energy in tanks: [pe:height]’s part, mgh, and [ke:speed]’s part, ½mv². Down into the loop, height pours into speed; up and round, speed pours back into height. A little turns to [heat:heat]. All three together never change.',
  };
  j.beat(SLUG, tanksDef, ({ tl, cue }) => {
    tl.set(rig, { gauge: 0, heat: 1 }, 0);
    tl.to(rig, { tanks: 1, duration: 0.8 }, 0.3);
    cue(0.3, 'rise', { gain: 0.3 });
    const len = Math.max(readingTime(tanksDef), 12);
    tl.fromTo(
      rig,
      { rideT: loop + 0.7 },
      { rideT: brakes - 0.15, duration: len, ease: 'none', immediateRender: false },
      0,
    );
  });

  const brakesDef: BeatDef = {
    id: 'brakes',
    heading: 'Where it goes',
    body: 'At the end, the brakes clamp on. The energy doesn’t vanish: it becomes [heat:heat], in the brakes, the wheels, the air. James Joule measured it in the 1840s: so much work, churning water, always made so much warmth.',
  };
  j.beat(SLUG, brakesDef, ({ tl, cue }) => {
    // The camera follows the train into the brakes.
    shot(tl, SLUG, { ...BRAKES, focus: [89, 3, -3], dof: 0, shake: 0.3 }, 1.8, 0, 'power2.inOut');
    const slow = 1.6;
    const run = (stopped + 0.4 - (brakes - 0.15)) * slow;
    tl.fromTo(
      rig,
      { rideT: brakes - 0.15 },
      { rideT: stopped + 0.4, duration: run, ease: 'none', immediateRender: false },
      1.2,
    );
    tl.to(rig, { sparks: 1, duration: 0.2 }, 1.2);
    cue(1.2 + 0.15 * slow, 'brake', { dur: (stopped - brakes) * slow });
    tl.to(rig, { sparks: 0, duration: 0.6 }, 1.2 + run);
    tl.to({}, { duration: Math.max(0, readingTime(brakesDef) - 1.2 - run) }, 1.2 + run);
  });

  // The test track: a car let go from 12 m, facing a 16 m hill.
  const turns = (r: RideSample[]) =>
    r.filter((x, i) => i > 0 && Math.sign(r[i - 1]!.v) > 0 !== Math.sign(x.v) > 0 && x.t > 0.5);
  const rollDef: BeatDef = {
    id: 'rollback',
    heading: 'Never higher',
    body: `Let a car go on this test track from [pe:${STORY_TEST.h0} m]. However the track bends, it climbs back to ${STORY_TEST.h0} m, where its speed runs out, and no higher: facing a ${STORY_TEST.h4} m hill, it stops short and rolls back. Again, and again.`,
    minDuration: 13,
  };
  j.beat(SLUG, rollDef, ({ tl, cue }) => {
    tl.to(rig, { tanks: 0, duration: 0.4 }, 0);
    tl.set(rig, { gauge: 1, heat: 0, run: 0, testT: 0, train: 1 }, 0.45);
    tl.to(rig, { test: 1, duration: 0.6 }, 0.6);
    shot(tl, SLUG, { ...TEST, focus: [TEST_CX, 6, 22], dof: 0, shake: 0.3 }, 2.2, 0, 'power2.inOut');
    tl.to(rig, { tanks: 1, level: 1, duration: 0.8 }, 1.6);
    const len = Math.max(readingTime(rollDef), rollDef.minDuration!) - 2;
    tl.fromTo(rig, { testT: 0 }, { testT: len, duration: len, ease: 'none', immediateRender: false }, 2);
    const track = storyTestTrack();
    for (const turn of turns(testRide(0)).filter((x) => x.t < len))
      cue(2 + turn.t, 'peak', { h: heightAt(track, turn.s) });
  });

  const fast = 2.6;
  const frictionDef: BeatDef = {
    id: 'friction',
    heading: 'Friction’s share',
    body: 'Now with friction (sped up). Each swing climbs a little lower, as the wheels throw off sparks and the [heat:heat] tank fills, until the car rests at the bottom. Height, speed and heat together: the total is still the same.',
  };
  j.beat(SLUG, frictionDef, ({ tl, cue }) => {
    tl.set(rig, { run: 1, testT: 0, heat: 1, level: 1 }, 0);
    tl.to(rig, { sparks: 1, duration: 0.3 }, 0.4);
    const len = Math.max(readingTime(frictionDef), 12) - 0.4;
    const until = Math.min(len * fast, 36);
    tl.fromTo(rig, { testT: 0 }, { testT: until, duration: len, ease: 'none', immediateRender: false }, 0.4);
    const track = storyTestTrack();
    for (const turn of turns(testRide(1)).filter((x) => x.t < until))
      cue(0.4 + (turn.t * len) / until, 'peak', { h: heightAt(track, turn.s) });
  });

  const formula: BeatDef = {
    id: 'formula',
    kind: 'formula',
    body: 'Without friction, ½mv² + mgh stays the same; with it, the loss turns up as heat. Mass m is in every part, so it cancels: heavy and light cars roll alike.',
    minDuration: 8,
  };
  j.beat(SLUG, formula, ({ tl, cue }) => {
    cue(0.35, 'formula', { chapter: 10 });
    // The tanks step back for the formula (on a phone they would share the top of the picture with it).
    tl.to(rig, { sparks: 0, level: 0, tanks: 0, duration: 0.6 }, 0);
    shot(tl, SLUG, { ...FORMULA, focus: [TEST_CX, 6, 22], dof: 0, shake: 0.3 }, 3.5, 0, 'power2.inOut');
  });

  j.beat(
    SLUG,
    {
      id: 'yourTurn',
      kind: 'yourTurn',
      heading: 'Your turn',
      body: 'Drag the start and the far hill up or down, add friction, and let the car go.',
    },
    ({ tl, pauseHere }) => {
      tl.to(rig, { tanks: 0, duration: 0.5 }, 0);
      tl.set(rig, { h0: STORY_TEST.h0, h4: STORY_TEST.h4, mu: 0, mass: 400, sandT: 0, level: 1, heat: 1 }, 0);
      shot(
        tl,
        SLUG,
        { ...PLAY, focus: [TEST_CX, 6, 22], fov: 40, dof: 0, shake: 0.25 },
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

  // The handoff: the heat of the ride drifts up into the night and becomes stars.
  j.beat(
    SLUG,
    {
      id: 'handoff',
      heading: 'Into the night',
      body: 'The ride’s heat doesn’t vanish either: it drifts up off the brakes and out into the night.',
      minDuration: 10,
    },
    ({ tl, cue }) => {
      tl.to(rig, { test: 0, level: 0, duration: 1 }, 0);
      // Back to where the train stopped, sparks still rising off its brakes in front of the wheel...
      const brake = trackAt(track, ride[ride.length - 1]!.s).p;
      shot(
        tl,
        SLUG,
        { pos: [brake[0] - 30, 6, 44], target: [brake[0], 10, brake[2]], dof: 0, shake: 0.3, portrait: 0.7 },
        2.4,
        0,
        'power2.inOut',
      );
      // ...then tilting up after them as they climb into the night and scatter into stars.
      shot(
        tl,
        SLUG,
        {
          pos: [brake[0] - 36, 3, 50],
          target: [brake[0] - 6, 34, brake[2] - 10],
          dof: 0,
          shake: 0.25,
          portrait: 0.7,
        },
        5.6,
        2.4,
        'sine.inOut',
      );
      tl.set(
        dust,
        {
          from: 'embers',
          to: 'embers',
          morph: 1,
          x: o.x + brake[0],
          y: o.y + brake[1] + 0.6,
          z: o.z + brake[2],
          rotX: 0,
          rotY: 0,
          scale: 4.2,
          size: 2.4,
          opacity: 0,
          spin: 0.15,
          swirl: 0,
          drift: 30,
          colorA: '#ffd2a0',
          colorB: SYM10.pe,
        },
        0.3,
      );
      tl.to(dust, { opacity: 1, duration: 1 }, 0.3);
      tl.to(dust, { y: o.y + brake[1] + 10, duration: 4.2, ease: 'power1.in' }, 0.5);
      tl.set(dust, { from: 'embers', to: 'stars', morph: 0 }, 4.6);
      tl.to(dust, { morph: 1, duration: 4.4, ease: 'power2.inOut' }, 4.6);
      tl.to(
        dust,
        {
          x: o.x + 40,
          y: o.y + 2.6,
          z: o.z - 20,
          size: 0.6,
          spin: 0.002,
          swirl: 1,
          drift: 0.2,
          colorA: '#f4efe6',
          colorB: '#ffe9d0',
          duration: 4.4,
          ease: 'power2.inOut',
        },
        4.6,
      );
      cue(0.9, 'gather');
      tl.to(rig, { fair: 0.35, duration: 4 }, 3);
    },
  );
}
