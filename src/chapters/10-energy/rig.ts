import { chapterRig } from '../../engine/runtime';
import {
  buildTrack,
  rideAt,
  sAtX,
  simulate,
  type RideOptions,
  type RideSample,
  type Track,
  type V3,
} from './math';

/** Everything chapter 10 animates. Timelines tween these numbers; the station derives all geometry from them. */
export interface EnergyRig {
  /** The fairground's lights, 0..1. */
  fair: number;
  /** The coaster's train shown, 0..1, and where it is on its ride (seconds into the story's ride). */
  train: number;
  rideT: number;
  /** The test track and its car shown, 0..1; which of its story runs (0 without friction, 1 with); its clock. */
  test: number;
  run: number;
  testT: number;
  /** The tanks shown, 0..1; the heat tank among them, 0..1; whose energy they show (0 the coaster, 1 the test car). */
  tanks: number;
  heat: number;
  gauge: number;
  /** Where the tanks stand (x, z). */
  gx: number;
  gz: number;
  /** Sparks where friction works hard, 0..1. */
  sparks: number;
  /** The viewer's test track: start and far hill heights (m), friction, the car's mass (kg), and its clock. */
  h0: number;
  h4: number;
  mu: number;
  mass: number;
  sandT: number;
  interactive: number;
  lab: number;
}

export const ENERGY_DEFAULTS: EnergyRig = {
  fair: 0,
  train: 0,
  rideT: 0,
  test: 0,
  run: 0,
  testT: 0,
  tanks: 0,
  heat: 0,
  gauge: 0,
  gx: 46,
  gz: 18,
  sparks: 0,
  h0: 12,
  h4: 16,
  mu: 0,
  mass: 400,
  sandT: 0,
  interactive: 0,
  lab: 0,
};

export function energyRig(): EnergyRig {
  return chapterRig('energy', () => ({ ...ENERGY_DEFAULTS }));
}

// ---------- Layout (station space, metres) ----------

/** The loop's centre and radius; its exit runs LOOP_SHIFT to the side of its entry, so the track misses itself. */
const LOOP_C: [number, number] = [25.5, 10.5];
const LOOP_R = 8;
const LOOP_SHIFT = -3;

/**
 * The big coaster, along x: the station platform, a lift hill to 30 m, the first drop, a vertical loop, a camel-back
 * hill and the brake run.
 */
export const COASTER_POINTS: V3[] = [
  [-44, 2, 0],
  [-38, 2, 0],
  [-33, 2.6, 0],
  [-26, 9.5, 0],
  [-19, 17, 0],
  [-13, 24, 0],
  [-9, 28.6, 0],
  [-5.5, 30.2, 0],
  [-2.5, 29.4, 0],
  [0.5, 25.5, 0],
  [4, 17, 0],
  [7, 9, 0],
  [10, 4, 0],
  [14, 2.3, 0],
  [19, 2, 0],
  ...Array.from({ length: 17 }, (_, k): V3 => {
    const a = -Math.PI / 2 + (k / 16) * Math.PI * 2;
    return [LOOP_C[0] + LOOP_R * Math.cos(a), LOOP_C[1] + LOOP_R * Math.sin(a), (LOOP_SHIFT * k) / 16];
  }),
  [32, 2.3, LOOP_SHIFT],
  [38, 4, LOOP_SHIFT],
  [43, 10, LOOP_SHIFT],
  [48, 15.5, LOOP_SHIFT],
  [52, 17, LOOP_SHIFT],
  [56, 15.5, LOOP_SHIFT],
  [61, 9, LOOP_SHIFT],
  [66, 3.5, LOOP_SHIFT],
  [71, 2, LOOP_SHIFT],
  [80, 2, LOOP_SHIFT],
  [95, 2, LOOP_SHIFT],
  [110, 2, LOOP_SHIFT],
];

/** The test track runs along x in front of the coaster, this far out towards the camera. */
export const TEST_Z = 22;
/** The test track's ends and the bottom of its valley. */
const TEST_X = 24;
const TEST_LOW = 0.6;

/** A valley between a start at h0 and a far hill at h4: where the test car is let go and what it faces. */
export function testPoints(h0: number, h4: number): V3[] {
  return [
    [-TEST_X, h0, TEST_Z],
    [-19, h0, TEST_Z],
    [-10, TEST_LOW + (h0 - TEST_LOW) * 0.42, TEST_Z],
    [0, TEST_LOW, TEST_Z],
    [10, TEST_LOW + (h4 - TEST_LOW) * 0.42, TEST_Z],
    [19, h4, TEST_Z],
    [TEST_X, h4, TEST_Z],
  ];
}

/** Where the test car is let go: just over the edge of the start's platform. */
export const testStart = (track: Track) => sAtX(track, -18);

/** The coaster train: three cars, this far apart (front to front); the coaster's and the test car's masses (kg). */
export const CARS = 3;
export const CAR_GAP = 2.9;
export const TRAIN_MASS = 2400;

export const SYM10 = {
  /** Height's part of the energy, the chapter's orange. */
  pe: '#f28a3c',
  /** Speed's part. */
  ke: '#4fc8e8',
  /** Friction's heat. */
  heat: '#ff4d5e',
  chalk: '#f4efe6',
  /** The bulbs along the track and round the wheel. */
  bulb: '#ffd9a0',
};

// ---------- The story's rides, worked out once ----------

let coaster: Track | null = null;
/** The big coaster's track. */
export function coasterTrack(): Track {
  coaster ??= buildTrack(COASTER_POINTS, 0.25);
  return coaster;
}

/** How the story's coaster ride is run: hauled up the lift at 5 m/s, a little rolling friction, firm brakes at the end. */
export function coasterRide(): RideOptions {
  const t = coasterTrack();
  const loopEnd = sAtX(t, 32, sAtX(t, 19));
  return {
    // Out of the station and straight onto the chain.
    s0: sAtX(t, -37),
    v0: 0,
    duration: 34,
    mu: 0.015,
    lift: { from: sAtX(t, -38), to: sAtX(t, -5.5), speed: 5 },
    brakes: { from: sAtX(t, 74, loopEnd), mu: 0.9 },
  };
}

let story: RideSample[] | null = null;
/** The story's coaster ride, worked out once. */
export function storyRide(): RideSample[] {
  story ??= simulate(coasterTrack(), coasterRide());
  return story;
}

/** The test track the story uses: let go at 12 m, facing a 16 m hill. */
export const STORY_TEST = { h0: 12, h4: 16 };
let storyTest: Track | null = null;
export function storyTestTrack(): Track {
  storyTest ??= buildTrack(testPoints(STORY_TEST.h0, STORY_TEST.h4));
  return storyTest;
}

const testRuns: Array<RideSample[] | null> = [null, null];
/** The test car's story runs: without friction (0), and with it (1). */
export function testRide(run: number): RideSample[] {
  const k = run > 0.5 ? 1 : 0;
  const track = storyTestTrack();
  testRuns[k] ??= simulate(track, { s0: testStart(track), v0: 0.3, duration: 40, mu: k ? 0.06 : 0 });
  return testRuns[k]!;
}

/** The coaster's train now: where its front car is on the story's ride. */
export const trainNow = (rig: EnergyRig) => rideAt(storyRide(), rig.rideT);
