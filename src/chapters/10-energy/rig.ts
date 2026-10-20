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
  /** Sparks where friction works hard, 0..1. */
  sparks: number;
  /** Riding in the front car (the sound is heard from there), 0 or 1. */
  pov: number;
  /** A line across the test track at the height the car was let go from, 0..1. */
  level: number;
  /** The viewer's test track: start and far hill heights (m), friction, the car's mass (kg), and its clock. */
  h0: number;
  h4: number;
  mu: number;
  mass: number;
  sandT: number;
  /** Lab: the coaster's ride going round and round by itself, 0 or 1. */
  loop: number;
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
  sparks: 0,
  pov: 0,
  level: 0,
  h0: 12,
  h4: 16,
  mu: 0,
  mass: 400,
  sandT: 0,
  loop: 0,
  interactive: 0,
  lab: 0,
};

export function energyRig(): EnergyRig {
  return chapterRig('energy', () => ({ ...ENERGY_DEFAULTS }));
}

// ---------- Layout (station space, metres) ----------

/** The loop's centre and radius; its exit runs LOOP_SHIFT to the side of its entry, so the track misses itself. */
const LOOP_C: [number, number] = [28.5, 10.5];
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
  [-14, 22.6, 0],
  // A long, round crest: the train tips over it gently, and the riders see the drop open up ahead.
  [-10, 26.8, 0],
  [-6, 29.4, 0],
  [-2, 30.3, 0],
  [2, 29.6, 0],
  [5.5, 27.2, 0],
  [8.5, 22.5, 0],
  [11, 16, 0],
  [13, 9.5, 0],
  [15.5, 4.5, 0],
  [18.5, 2.4, 0],
  [22, 2, 0],
  ...Array.from({ length: 17 }, (_, k): V3 => {
    const a = -Math.PI / 2 + (k / 16) * Math.PI * 2;
    return [LOOP_C[0] + LOOP_R * Math.cos(a), LOOP_C[1] + LOOP_R * Math.sin(a), (LOOP_SHIFT * k) / 16];
  }),
  [35, 2.3, LOOP_SHIFT],
  [41, 4, LOOP_SHIFT],
  [46, 10, LOOP_SHIFT],
  [51, 15.5, LOOP_SHIFT],
  [55, 17, LOOP_SHIFT],
  [59, 15.5, LOOP_SHIFT],
  [64, 9, LOOP_SHIFT],
  [69, 3.5, LOOP_SHIFT],
  [74, 2, LOOP_SHIFT],
  [83, 2, LOOP_SHIFT],
  [98, 2, LOOP_SHIFT],
  [113, 2, LOOP_SHIFT],
];

/**
 * The test track stands off to the right of the coaster, past the Ferris wheel (with open fairground behind it, not the
 * coaster), and runs along x, centred at TEST_CX, this far out towards the camera.
 */
export const TEST_CX = 150;
export const TEST_Z = 22;
/** The test track's half-length and the bottom of its valley. */
const TEST_X = 24;
const TEST_LOW = 0.6;

/** A valley between a start at h0 and a far hill at h4: where the test car is let go and what it faces. */
export function testPoints(h0: number, h4: number): V3[] {
  const pts: Array<[number, number]> = [
    [-TEST_X, h0],
    [-19, h0],
    [-10, TEST_LOW + (h0 - TEST_LOW) * 0.42],
    [0, TEST_LOW],
    [10, TEST_LOW + (h4 - TEST_LOW) * 0.42],
    [19, h4],
    [TEST_X, h4],
  ];
  return pts.map(([x, y]) => [TEST_CX + x, y, TEST_Z]);
}

/** Where the test car is let go: at the edge of the start's platform, at its full height. */
export const testStart = (track: Track) => sAtX(track, TEST_CX - 19);

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
  const loopEnd = sAtX(t, 35, sAtX(t, 22));
  return {
    // Out of the station and straight onto the chain.
    s0: sAtX(t, -37),
    v0: 0,
    duration: 34,
    mu: 0.015,
    lift: { from: sAtX(t, -38), to: sAtX(t, -3), speed: 5 },
    brakes: { from: sAtX(t, 77, loopEnd), mu: 0.9 },
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

/** The friction the test car's second story run has. */
export const TEST_MU = 0.08;
const testRuns: Array<RideSample[] | null> = [null, null];
/** The test car's story runs: without friction (0), and with it (1). */
export function testRide(run: number): RideSample[] {
  const k = run > 0.5 ? 1 : 0;
  const track = storyTestTrack();
  testRuns[k] ??= simulate(track, { s0: testStart(track), v0: 0.3, duration: 40, mu: k ? TEST_MU : 0 });
  return testRuns[k]!;
}

/** The coaster's train now: where its front car is on the story's ride. */
export const trainNow = (rig: EnergyRig) => rideAt(storyRide(), rig.rideT);
