import { buildTrack, rideAt, sampleOf, stepRide, type RideSample, type RideState, type Track } from './math';
import {
  energyRig,
  storyRide,
  storyTestTrack,
  STORY_TEST,
  testPoints,
  testRide,
  testStart,
  TRAIN_MASS,
  type EnergyRig,
} from './rig';
import { G } from './math';

/** The heaviest test car the viewer can choose, and the tallest hill: the tanks are scaled to hold that much. */
export const MASS_RANGE: [number, number] = [100, 600];
export const HEIGHT_RANGE: [number, number] = [4, 20];
const FULL = MASS_RANGE[1] * G * HEIGHT_RANGE[1];

/** The viewer's test track and car, run live (not by the timeline): rebuilt when its hills change. */
let track: Track | null = null;
let key = '';
let state: RideState = { s: 0, v: 0, heat: 0, work: 0 };

export function sandboxTrack(rig: EnergyRig): Track {
  const k = `${rig.h0.toFixed(3)}:${rig.h4.toFixed(3)}`;
  if (!track || k !== key) {
    track = buildTrack(testPoints(rig.h0, rig.h4));
    key = k;
    // A new track: the car goes back to the start.
    state = { s: testStart(track), v: 0.3, heat: 0, work: 0 };
  }
  return track;
}

/** Puts the car back at the start, to be let go again. */
export function sandboxRelease(rig: EnergyRig) {
  const t = sandboxTrack(rig);
  state = { s: testStart(t), v: 0.3, heat: 0, work: 0 };
}

/** Runs the viewer's car on by `dt` seconds (in small steps). */
export function sandboxStep(rig: EnergyRig, dt: number) {
  const t = sandboxTrack(rig);
  const steps = Math.max(1, Math.ceil(dt / (1 / 480)));
  for (let i = 0; i < steps; i++) stepRide(t, state, { mu: rig.mu }, dt / steps);
}

/** Whether the viewer is running the test track themselves (Your turn and the Lab). */
export const live = (rig: EnergyRig) => rig.interactive > 0.5 || rig.lab > 0.5;

export interface Reading {
  /** The energies in joules: height's, speed's, heat's; the chain's work; and the most the tanks are scaled to hold. */
  pe: number;
  ke: number;
  heat: number;
  work: number;
  full: number;
  /** The speed (m/s) and height above the lowest point (m). */
  v: number;
  h: number;
  mass: number;
}

const reading = (r: RideSample, mass: number, full: number): Reading => ({
  pe: r.pe * mass,
  ke: r.ke * mass,
  heat: r.heat * mass,
  work: r.work * mass,
  full,
  v: r.v,
  h: r.pe / G,
  mass,
});

/** The test car now: the story's runs, or the viewer's. */
export function testNow(rig: EnergyRig): { track: Track; sample: RideSample; live: boolean } {
  if (live(rig)) {
    const t = sandboxTrack(rig);
    return { track: t, sample: sampleOf(t, state, rig.sandT), live: true };
  }
  return { track: storyTestTrack(), sample: rideAt(testRide(rig.run), rig.testT), live: false };
}

/** What the tanks show: the coaster's energy, or the test car's. */
export function readGauge(rig: EnergyRig = energyRig()): Reading {
  if (rig.gauge < 0.5) {
    const ride = storyRide();
    const end = ride[ride.length - 1]!;
    // Scaled to everything the chain put in (and the little it started with): the total, once over the top.
    const full = (end.work + ride[0]!.pe) * TRAIN_MASS;
    return reading(rideAt(ride, rig.rideT), TRAIN_MASS, full);
  }
  const now = testNow(rig);
  if (now.live) return reading(now.sample, rig.mass, FULL);
  const first = testRide(rig.run)[0]!;
  const mass = 400;
  return reading(now.sample, mass, (first.pe + first.ke) * mass);
}

/** The story's test track's start and far hill, for captions. */
export const STORY_HEIGHTS = STORY_TEST;
