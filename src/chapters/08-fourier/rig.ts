import { chapterRig } from '../../engine/runtime';
import { ambulance, blend, resample, transform, type Harmonic, type Term } from './math';

/** Everything chapter 8 animates. Timelines tween these numbers; the station derives all geometry from them. */
export interface FourierRig {
  /** The wave's chart (its axes) and the clockwork's base line, 0..1. */
  stage: number;
  /** Time, in radians: the first circle has turned this far. */
  t: number;
  /** How many circles (a fraction grows the next one in), and which recipe (0 square, 1 sawtooth, 2 triangle). */
  count: number;
  shape: number;
  /** The rings and their arrows, 0..1; the newest ring's name, 0..1. */
  clockwork: number;
  newest: number;
  /** The wave the tip traces on the chart, 0..1; the exact wave, faint, behind it, 0..1. */
  trace: number;
  ghost: number;
  /** The side view: the rings drawn apart in depth, one layer per speed, 0..1; slid onto one axis, 0..1; bars, 0..1. */
  layers: number;
  align: number;
  bars: number;
  /** The handoff's drawing: its clockwork, 0..1; how far round (a turn is 2π); how many arrows; its path, 0..1. */
  drawing: number;
  dt: number;
  dcount: number;
  dtrace: number;
  /** The harmonics heard, 0..1. */
  sing: number;
  interactive: number;
  lab: number;
}

export const FOURIER_DEFAULTS: FourierRig = {
  stage: 0,
  t: 0,
  count: 1,
  shape: 0,
  clockwork: 0,
  newest: 0,
  trace: 0,
  ghost: 0,
  layers: 0,
  align: 0,
  bars: 0,
  drawing: 0,
  dt: 0,
  dcount: 0,
  dtrace: 0,
  sing: 0,
  interactive: 0,
  lab: 0,
};

export function fourierRig(): FourierRig {
  return chapterRig('fourier', () => ({ ...FOURIER_DEFAULTS }));
}

// ---------- Layout (station space, world units) ----------

/** The clockwork's centre (it stands upright, facing +z), and world units per unit of the wave's height. */
export const P: [number, number, number] = [-3, 2.6, 0];
export const U = 1.2;
/** The wave's chart: where it starts (just right of the first ring), how wide it is, and world units per radian. */
export const CHART = { x0: P[0] + 2.2, width: 6, perRadian: 0.6 };
/** The most circles the clockwork can have, and the highest speed among them. */
export const MAX_COUNT = 16;
export const N_MAX = 2 * MAX_COUNT - 1;
/** In the side view, each speed's ring stands this far behind the last. */
export const DZ = 0.4;

/** The handoff's drawing: its centre, its size, and how many arrows draw it. */
export const Q: [number, number, number] = [0.4, 2.7, 0];
export const D = 1.15;
export const DRAW_TERMS = 101;

export const SYM8 = {
  /** The clockwork and its spectrum: the chapter's magenta. */
  ring: '#e05bb4',
  /** The wave it draws. */
  wave: '#ffd1ec',
  ghost: '#f4efe6',
  axis: '#f4efe6',
  /** The siren drawing, in the next chapter's blue. */
  siren: '#8fb4ff',
};

/** The harmonics the rig asks for now. */
export const rigHarmonics = (rig: FourierRig): Harmonic[] => blend(rig.shape, rig.count, N_MAX);

let shape: Term[] | null = null;
/** The ambulance's clockwork (computed once). */
export function sirenTerms(): Term[] {
  shape ??= transform(resample(ambulance(), 512), (DRAW_TERMS - 1) / 2);
  return shape;
}
