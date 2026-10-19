import { chapterRig } from '../../engine/runtime';
import { APPLE_YS, areaTo, CONTROLS, curve, STORY_YS, X_MAX, type Curve } from './math';

/** Everything chapter 6 animates. Timelines tween these numbers; the station derives all geometry from them. */
export interface CalculusRig {
  /** The realm: its glowing floor and the station's own light, 0..1. */
  realm: number;
  /** The curve's wall (in front, standing on the floor) and the area's wall (behind it and higher), 0..1. */
  wallF: number;
  wallA: number;
  /** The axes' words: 0 = time and speed (the falling apple), 1 = x and f(x). */
  words: number;
  /** The curve's wall's axis names shown, 0..1 (put away while the camera looks only at the area's wall). */
  named: number;
  /** The curve's heights at its six control points. */
  k0: number;
  k1: number;
  k2: number;
  k3: number;
  k4: number;
  k5: number;
  /** The curve drawn in, 0..1, and the area under it filled, 0..1. */
  curve: number;
  area: number;
  /** The apple's triangle cut into strips at each quarter second, 1, 3, 5, 7, 0..1. */
  strips: number;
  /** Columns rising from the floor (staggered), 0..1; there are 4 × 2^split of them (a fraction splits them). */
  columns: number;
  split: number;
  /** The columns' total, shown above them, 0..1. */
  total: number;
  /** The columns swinging up onto the area's wall, each landing on the ones before (staggered), 0..1. */
  stack: number;
  /** How solid the columns are drawn, 0..1 (they fade once the area's curve is drawn over them). */
  blocks: number;
  /** One step of the stair picked out with its rise and run, 0..1; which step. */
  rise: number;
  step: number;
  /** The smooth area curve, A(x), drawn on its wall, 0..1. */
  areaCurve: number;
  /** The probe at x = probeX: the curve's height there beside the area's slope, 0..1. */
  probe: number;
  probeX: number;
  /** The bounds a and b: the area between them under the curve, and how far A climbs between them, 0..1. */
  bounds: number;
  a: number;
  b: number;
  /** A voice singing the curve's height at x = singX, 0..1. */
  sing: number;
  singX: number;
  /** The handoff's point and its push, shown, 0..1. */
  vector: number;
  /** The handoff: a point pushed outwards by its own size (growing as eᵗ), 0..1; the push turned to the side, 0..1; how far round it has gone (radians). */
  grow: number;
  turn: number;
  round: number;
  interactive: number;
  lab: number;
}

export const CALCULUS_DEFAULTS: CalculusRig = {
  realm: 0,
  wallF: 0,
  wallA: 0,
  words: 0,
  named: 1,
  k0: APPLE_YS[0]!,
  k1: APPLE_YS[1]!,
  k2: APPLE_YS[2]!,
  k3: APPLE_YS[3]!,
  k4: APPLE_YS[4]!,
  k5: APPLE_YS[5]!,
  curve: 0,
  area: 0,
  strips: 0,
  columns: 0,
  split: 0,
  total: 0,
  stack: 0,
  blocks: 1,
  rise: 0,
  step: 5,
  areaCurve: 0,
  probe: 0,
  probeX: 0.3,
  bounds: 0,
  a: 1,
  b: 3,
  sing: 0,
  singX: 0,
  vector: 0,
  grow: 0,
  turn: 0,
  round: 0,
  interactive: 0,
  lab: 0,
};

export function calculusRig(): CalculusRig {
  return chapterRig('calculus', () => ({ ...CALCULUS_DEFAULTS }));
}

/** The curve's heights as tween targets: { k0: …, k5: … }. */
export function heights(ys: readonly number[]): Pick<CalculusRig, 'k0' | 'k1' | 'k2' | 'k3' | 'k4' | 'k5'> {
  return { k0: ys[0]!, k1: ys[1]!, k2: ys[2]!, k3: ys[3]!, k4: ys[4]!, k5: ys[5]! };
}

const keys = Array.from({ length: CONTROLS }, (_, i) => `k${i}` as keyof CalculusRig);
let cached: { key: string; c: Curve } | null = null;
/** The curve the rig shows now (worked out again only when a height changes). */
export function rigCurve(rig: CalculusRig = calculusRig()): Curve {
  const ys = keys.map((k) => rig[k] as number);
  const key = ys.map((y) => y.toFixed(5)).join(',');
  if (cached?.key !== key) cached = { key, c: curve(ys) };
  return cached.c;
}

export const STORY = curve(STORY_YS);

/** How many columns `split` stands for, and how far through splitting into twice as many it is. */
export function columnCount(split: number): { n: number; frac: number } {
  const s = Math.min(Math.max(split, 0), 7);
  const level = Math.min(Math.floor(s), 6);
  return { n: 4 * 2 ** level, frac: s - level };
}

// ---------- Layout (station space, world units) ----------

/** World units per unit of x, and per unit of the curve's height. */
export const SX = 1.5;
export const SY = 1;
/** The curve's wall: the plane z = 0, the x axis along the floor. */
export const WALL_F = { width: X_MAX * SX, height: 3.3 };
/** The area's wall: behind the curve's and above it, its x axis at height `y`. */
export const WALL_A = { z: -2.6, y: 4.4, height: 3.1 };
/** World units per unit of area on the area's wall, at most (a bigger area is drawn smaller to fit). */
export const AREA_SCALE = 0.45;
const AREA_FIT = 2.9;
/** The area's scale for a curve: AREA_SCALE, unless its whole area would not fit on the wall. */
export const areaScale = (c: Curve) => Math.min(AREA_SCALE, AREA_FIT / Math.max(areaTo(c, X_MAX), 1e-6));
/** How deep a column is. */
export const COLUMN_DEPTH = 0.22;

/** A point of the curve's wall: x and a height on the curve's scale. */
export const onF = (x: number, y: number, z = 0): [number, number, number] => [x * SX, y * SY, z];
/** A point of the area's wall: x and an area, on scale `s`. */
export const onA = (x: number, area: number, s: number, z = 0): [number, number, number] => [
  x * SX,
  WALL_A.y + area * s,
  WALL_A.z + z,
];

/** The handoff: where the growing point starts from, the way it grows, and how near and far it goes. */
export const GROWTH = { origin: [3.4, 1.35, 0.06] as const, angle: 0.42, from: 0.22, to: 1.25 };
/** How far out the point is after growing for `grow` (0..1) of the way: in step with itself, as eᵗ grows. */
export const radiusAt = (grow: number) =>
  GROWTH.from * Math.pow(GROWTH.to / GROWTH.from, Math.min(Math.max(grow, 0), 1));

export const SYM6 = {
  /** The curve f and its height: the chapter's violet. */
  f: '#b69cff',
  /** Area, and the area so far, A: amber, as in chapter 4. */
  area: '#f2b04a',
  axis: '#f4efe6',
  grid: '#9b7bf0',
  /** The handoff's turning push, in the next chapter's cyan. */
  turn: '#3fd0e8',
};
