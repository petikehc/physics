import { runtime } from '../../engine/runtime';
import { shot } from '../../engine/camera/shots';
import { station } from '../../engine/world/stations';
import { readingTime, type BeatDef, type JourneyBuilder } from '../../journey/builder';
import { firstHeard, heard, runX, SOUND, type V3 } from './math';
import {
  AHEAD,
  BEHIND,
  COURSES,
  DOPPLER_DEFAULTS,
  dopplerRig,
  EAR,
  JET_H,
  LANE,
  LOOP_START,
  SIREN_H,
  SIREN_NEAR,
  SKY_VIEW,
  SLOW,
  UNDER,
} from './rig';
import { SIREN } from './sound';

const SLUG = 'doppler';
type Frame = { pos: V3; target: V3; portrait: number };

/** Down the street from the near pavement, its lamps and windows going off into the haze. */
const STREET: Frame = { pos: [13, 3.1, 6.4], target: [-30, 4.4, -2.6], portrait: 0.5 };
/**
 * At the back of the pavement, where you stand as the ambulance goes by: looking up the street it comes from and
 * across it, so it grows out of the distance and sweeps past right in front.
 */
const KERB: Frame = { pos: [EAR[0] - 3, 1.5, EAR[2] + 0.6], target: [-16, 1.6, -1], portrait: 0.6 };
/** High over the street, looking down on the waves as rings and domes, both listeners in view. */
const CRANE: Frame = { pos: [1, 26, 26], target: [1, 0, -1], portrait: 1 };
/** As the crane, a little lower and further back, leaving the top of the picture for the formula. */
const FORMULA: Frame = { pos: [1.5, 23, 31], target: [1.5, 2.5, 0], portrait: 1 };
/** Side on to the jet's path, low, so its waves and its cone are seen as circles and a V. */
const JET: Frame = { pos: [-18, 8, 40], target: [-18, 7.5, 0], portrait: 1 };
/** Up among the galaxies, the two spectra in front. */
const SKY: Frame = { pos: SKY_VIEW, target: [0, 93, -130], portrait: 0.8 };
/** The viewer's street, from above, a little to the right so the panel leaves it clear. */
const PLAY: Frame = { pos: [8, 26, 36], target: [8, 0, -1], portrait: 1 };

/** The real pass: the ambulance's speed (a tenth of the speed of sound), where it starts, and how long it takes. */
const PASS = { v: SOUND / 10, from: -190, dur: 11.5 };

/** What a listener standing at `at` hears of the slowed ambulance at time `t` on its course: their pitch over its. */
function ratioAt(at: V3, t: number): number {
  const run = COURSES[0]!;
  const v = run.knots[0]![1] * SLOW;
  const s: V3 = [runX(run, t), SIREN_H, LANE];
  return heard(s, [v, 0, 0], [at[0], at[1] + 1.55, at[2]], [0, 0, 0], SLOW)?.ratio ?? 1;
}

/** Story-mode timeline for chapter 9: down from the stars to a street at night, then the chapter beat by beat. */
export function buildDoppler(j: JourneyBuilder) {
  const rig = dopplerRig();
  const dust = runtime.dust;
  const world = runtime.world;
  const o = station(SLUG);
  /** The slowed run's clock at the start of the beat being built. */
  let ST = 0;

  /** Keeps the slowed run going at `rate` for as long as the beat will last (its animation or its caption). */
  const keepRunning = (tl: gsap.core.Timeline, def: BeatDef, rate = 1) => {
    const len = Math.max(def.minDuration ?? 0, readingTime(def), tl.duration());
    tl.fromTo(
      rig,
      { st: ST },
      { st: ST + rate * len, duration: len, ease: 'none', immediateRender: false },
      0,
    );
    ST += rate * len;
  };

  j.beat(SLUG, { id: 'flight', kind: 'flight', minDuration: 5.6 }, ({ tl, cue }) => {
    const d = 5.4;
    tl.set(rig, { ...DOPPLER_DEFAULTS }, 0);
    // Down out of the stars to a street at night: the haze closes in, the ground comes back, the lamps come on. (Night
    // first, then out of space underneath it: the other way round, the dusk beach's orange would show between.)
    tl.to(world, { night: 1, duration: d * 0.5, ease: 'power1.inOut' }, d * 0.1);
    tl.to(world, { space: 0, duration: 0.8, ease: 'none' }, d * 0.62);
    tl.to(rig, { street: 1, duration: 1.6 }, d * 0.5);
    // The sound waves fly ahead and hang over the street.
    tl.to(dust, { x: o.x - 8, y: o.y + 8, z: o.z - 6, duration: d, ease: 'power2.inOut' }, 0);
    tl.to(dust, { scale: 1.6, rotY: 0, spin: 0, size: 0.9, duration: d }, 0);
    shot(tl, SLUG, { ...STREET, focus: [-10, 3, -2], fov: 40, dof: 0, shake: 0.4 }, d, 0, 'power2.inOut');
    tl.to(runtime.camera, { lift: 9, duration: d / 2, ease: 'sine.out' }, 0);
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
      body: 'Prague, 1842. Christian Doppler argues that the colour of a star should change with how fast it moves towards us or away. Three years later, horn players on a train near Utrecht prove the idea right, with sound.',
      minDuration: 10,
    },
    ({ tl }) => {
      // A slow drift down the street as the waves scatter up into the night sky as stars.
      shot(
        tl,
        SLUG,
        { pos: [9, 2.8, 6.2], target: [-30, 4.2, -2.6], focus: [-10, 3, -2], dof: 0, shake: 0.35 },
        9,
        0.2,
        'sine.inOut',
      );
      tl.set(dust, { from: 'waves', to: 'stars', morph: 0 }, 0.4);
      tl.to(dust, { morph: 1, duration: 3.6, ease: 'power2.inOut' }, 0.4);
      tl.to(
        dust,
        {
          x: o.x - 20,
          y: o.y + 2.6,
          z: o.z - 20,
          scale: 4.2,
          size: 0.55,
          spin: 0.001,
          swirl: 0.3,
          drift: 0.15,
          colorA: '#f4efe6',
          colorB: '#cdd9ff',
          duration: 3.6,
          ease: 'power2.inOut',
        },
        0.4,
      );
    },
  );

  // The real thing: an ambulance at a tenth of the speed of sound, and a listener at the kerb.
  const passAt = (EAR[0] - PASS.from) / PASS.v;
  j.beat(
    SLUG,
    {
      id: 'pass',
      heading: 'Going by',
      body: 'Stand at the kerb as an ambulance races past. As it comes, its siren sounds [hi:high]; the moment it passes, the note [lo:drops], and stays low as it drives away. Yet the siren itself never changed.',
      minDuration: PASS.dur,
    },
    ({ tl, cue }) => {
      tl.set(rig, { mode: 0, kind: 0, ambulance: 1, av: PASS.v, ax: PASS.from, clock: 0 }, 0);
      tl.to(rig, { ax: PASS.from + PASS.v * PASS.dur, clock: PASS.dur, duration: PASS.dur, ease: 'none' }, 0);
      tl.to(rig, { siren: 1, duration: 0.6 }, 0.1);
      tl.to(rig, { siren: 0, duration: 1 }, PASS.dur - 1);
      // Down to the kerb, looking up the street; then a quick turn to follow it as it goes by.
      shot(tl, SLUG, { ...KERB, focus: [-12, 1.5, 1.7], dof: 0, shake: 0.3 }, 1.4, 0, 'power2.inOut');
      shot(tl, SLUG, { target: [30, 1.8, -1] }, 1.8, passAt - 0.1, 'power2.inOut');
      tl.to(runtime.camera, { shake: 1.4, duration: 0.25 }, passAt - 0.1);
      tl.to(runtime.camera, { shake: 0.3, duration: 1.2 }, passAt + 0.2);
      cue(passAt - 0.35, 'whoosh', { gain: 0.6 });
    },
  );

  const shellsDef: BeatDef = {
    id: 'shells',
    heading: 'Bunched up, stretched out',
    body: 'Now slow time right down, and draw each wave of the siren as it spreads: a sphere round the spot it was sent from. The ambulance chases the waves it sends ahead, [hi:bunching them up]; behind, they [lo:stretch out].',
    minDuration: 13,
  };
  j.beat(SLUG, shellsDef, ({ tl, cue }) => {
    tl.set(rig, { mode: 1, kind: 0, course: 0, from: 0, siren: 0, ambulance: 1, hears: 0, listeners: 0 }, 0);
    tl.to(rig, { spheres: 1, rings: 1, duration: 1.4 }, 0.4);
    // Up over the street as the waves spread.
    shot(tl, SLUG, { ...CRANE, focus: [1, 0.5, 1.7], dof: 0, shake: 0.3 }, 5.5, 0.2, 'power2.inOut');
    // The two listeners, and what each one hears.
    tl.to(rig, { listeners: 1, duration: 0.8 }, 6);
    tl.to(rig, { hears: 1, duration: 0.6 }, 7.4);
    cue(7.6, 'hears', { ratio: ratioAt(AHEAD, ST + 7.6), hi: SIREN.hi, lo: SIREN.lo });
    cue(9.4, 'hears', { ratio: ratioAt(BEHIND, ST + 9.4), hi: SIREN.hi, lo: SIREN.lo });
    keepRunning(tl, shellsDef);
  });

  const formula: BeatDef = {
    id: 'formula',
    kind: 'formula',
    body: "Doppler's formula: the pitch heard, f′, is the siren's own f times (v + vₒ)/(v − vₛ), where v is the speed of sound, vₛ how fast the source comes towards you and vₒ how fast you go towards it.",
    minDuration: 8,
  };
  j.beat(SLUG, formula, ({ tl, cue }) => {
    cue(0.35, 'formula', { chapter: 9 });
    shot(tl, SLUG, { ...FORMULA, focus: [1, 0.5, 1.7], dof: 0, shake: 0.3 }, 3.5, 0, 'power2.inOut');
    // Time all but stops while the formula is read.
    keepRunning(tl, formula, 0.3);
  });

  // The jet: speeding up through the speed of sound, its cone sweeping over the listener with a boom.
  const jet = COURSES[1]!;
  const JET0 = 0.6;
  const boom = firstHeard(
    (t) => runX(jet, t),
    JET_H,
    0,
    SLOW,
    [UNDER[0], UNDER[1] + 1.55, UNDER[2]],
    0,
    30,
  ).at;
  const machDef: BeatDef = {
    id: 'mach',
    heading: 'Faster than sound',
    body: 'Swap the ambulance for a jet and speed it up. At the speed of sound it keeps pace with its own waves, and they pile into a wall at its nose. Faster still, they trail behind it in a cone; as the cone sweeps over you, the sound arrives all at once: a sonic boom.',
    minDuration: boom - JET0 + 2.6,
  };
  j.beat(SLUG, machDef, ({ tl, cue }) => {
    // Out with the ambulance and its waves; in with the jet, already flying.
    tl.to(rig, { spheres: 0, rings: 0, listeners: 0, hears: 0, duration: 0.6 }, 0);
    tl.set(rig, { ambulance: 0, kind: 1, course: 1, from: 0, jet: 1, cone: 1 }, 0.6);
    // The jet flies on for as long as the beat lasts, boom and all.
    const len = Math.max(machDef.minDuration!, readingTime(machDef));
    tl.fromTo(
      rig,
      { st: JET0 },
      { st: JET0 + len, duration: len, ease: 'none', immediateRender: false },
      0.6,
    );
    tl.to(rig, { roar: 0, duration: 2 }, 0.6 + len - 2);
    tl.to(rig, { spheres: 1, rings: 1, roar: 1, duration: 0.8 }, 0.7);
    // The listener under the jet's path, once the camera has come round far enough to see them on a phone too.
    tl.to(rig, { listeners: 1, hears: 1, duration: 0.6 }, 5.5);
    // Side on, following the jet across.
    shot(tl, SLUG, { ...JET, focus: [-18, 7, 0], dof: 0, shake: 0.3 }, 1.6, 0, 'power2.inOut');
    const at = 0.6 + boom - JET0;
    shot(tl, SLUG, { pos: [8, 7.4, 40], target: [8, 7, 0] }, at - 2.2, 2, 'sine.inOut');
    cue(at, 'boom');
    tl.to(runtime.camera, { shake: 5, duration: 0.08 }, at);
    tl.to(runtime.camera, { shake: 0.3, duration: 1.6, ease: 'power2.out' }, at + 0.1);
  });

  j.beat(
    SLUG,
    {
      id: 'redshift',
      heading: 'Light, stretched',
      body: 'Light is a wave too. A galaxy rushing away from us stretches its light, and every line of its hydrogen [lo:shifts towards the red]. Slipher found most galaxies red-shifted; in 1929 Hubble showed the farther, the faster. The universe is expanding.',
      minDuration: 12,
    },
    ({ tl, cue }) => {
      tl.to(rig, { jet: 0, cone: 0, spheres: 0, rings: 0, roar: 0, listeners: 0, hears: 0, duration: 1 }, 0);
      // Up and up, out of the city's haze into deep space.
      shot(tl, SLUG, { ...SKY, focus: [0, 88, -140], dof: 0, shake: 0.25 }, 6, 0.3, 'power2.inOut');
      tl.to(runtime.camera, { lift: 18, duration: 3, ease: 'sine.out' }, 0.3);
      tl.to(runtime.camera, { lift: 0, duration: 3, ease: 'sine.in' }, 3.3);
      // Into space under cover of the night, then the night's haze clears.
      tl.to(world, { space: 1, duration: 0.8, ease: 'none' }, 0.6);
      tl.to(world, { night: 0, duration: 3.6, ease: 'power1.inOut' }, 1.4);
      tl.to(rig, { street: 0, duration: 2 }, 3);
      tl.to(rig, { galaxy: 1, duration: 2 }, 3);
      tl.to(rig, { spectra: 1, duration: 1.2 }, 5.4);
      tl.to(rig, { z: 0.1, duration: 3.4, ease: 'power1.inOut' }, 6.8);
      cue(6.8, 'shift', { z: 0.1 });
    },
  );

  j.beat(
    SLUG,
    {
      id: 'yourTurn',
      kind: 'yourTurn',
      heading: 'Your turn',
      body: 'Set how fast the ambulance goes, and drag the listener anywhere along the street. Listen to what they hear.',
    },
    ({ tl, pauseHere }) => {
      tl.to(rig, { galaxy: 0, spectra: 0, duration: 0.8 }, 0);
      tl.to(world, { night: 1, duration: 1.6, ease: 'power1.inOut' }, 0.2);
      tl.to(world, { space: 0, duration: 0.6, ease: 'none' }, 1.8);
      tl.to(rig, { street: 1, duration: 1.2 }, 0.8);
      tl.set(
        rig,
        {
          mode: 2,
          kind: 0,
          sandT: LOOP_START.t,
          sm: LOOP_START.m,
          lm: 0,
          lx: LOOP_START.lx,
          lz: LOOP_START.lz,
          from: 0,
          ambulance: 1,
          jet: 0,
          cone: 0,
          you: 1,
          siren: SIREN_NEAR,
          roar: 0,
          z: 0,
        },
        1.2,
      );
      tl.to(rig, { spheres: 1, rings: 1, duration: 1 }, 1.4);
      shot(tl, SLUG, { ...PLAY, focus: [0, 0.5, 1.7], fov: 40, dof: 0, shake: 0.25 }, 2.6, 0, 'power3.inOut');
      tl.set(rig, { interactive: 1 }, 2.6);
      pauseHere(2.7);
      tl.set(rig, { interactive: 0 }, 2.8);
      tl.to({}, { duration: 0.7 }, 2.8);
    },
  );

  // The handoff: something else whooshes by, and the question for chapter 10.
  j.beat(
    SLUG,
    {
      id: 'handoff',
      heading: 'Coming and going',
      body: "Anything fast that goes by does it: a train, a racing car, a roller coaster's whoosh. A coaster's speed comes and goes as it climbs and dives. Where does its speed go on the way up, and where does it come back from?",
    },
    ({ tl, cue }) => {
      tl.to(rig, { siren: 0, you: 0, spheres: 0, rings: 0, duration: 1 }, 0);
      tl.to(rig, { ambulance: 0, duration: 0.01 }, 1);
      // Along the street the way chapter 10 lies, as the stars come down and gather into a coaster's loop.
      shot(
        tl,
        SLUG,
        {
          pos: [-6, 2.4, 6.2],
          target: [12, 4.4, -2],
          focus: [12, 4.4, -2],
          dof: 0,
          shake: 0.3,
          portrait: 0.6,
        },
        3,
        0,
        'power2.inOut',
      );
      tl.set(dust, { from: 'stars', to: 'coaster', morph: 0 }, 2.2);
      tl.to(dust, { morph: 1, duration: 3, ease: 'power2.inOut' }, 2.2);
      tl.to(
        dust,
        {
          x: o.x + 12,
          y: o.y + 4.4,
          z: o.z - 2,
          scale: 2.6,
          size: 0.9,
          spin: 0.15,
          swirl: 0.6,
          drift: 0,
          colorA: '#ffe2c4',
          colorB: '#f28a3c',
          duration: 3,
          ease: 'power2.inOut',
        },
        2.2,
      );
      cue(2.2, 'gather');
      cue(5.6, 'whoosh', { gain: 0.8 });
    },
  );
}
