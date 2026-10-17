/**
 * Pure orbital geometry for chapter 4 (Kepler's laws). An orbit lies in a plane with the Sun at the origin and
 * perihelion (the closest point) along +x. Time is counted in orbits since perihelion: `phase` 0.25 is a
 * quarter of the planet's year. Distances are in whatever unit `a` is given in.
 */

const TAU = Math.PI * 2;

/** Semi-minor axis of an ellipse with semi-major axis `a` and eccentricity `e`. */
export const minorAxis = (a: number, e: number) => a * Math.sqrt(1 - e * e);

/**
 * The eccentric anomaly E for a mean anomaly M: the solution of Kepler's equation M = E − e·sin E, by Newton's
 * method. (M grows evenly with time; E is the angle that places the planet on its ellipse.)
 */
export function eccentricAnomaly(M: number, e: number): number {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 50; i++) {
    const step = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= step;
    if (Math.abs(step) < 1e-14) break;
  }
  return E;
}

export interface OrbitPoint {
  x: number;
  y: number;
  /** Distance from the Sun. */
  r: number;
  /** Angle seen from the Sun (true anomaly), counted on through every turn so it never jumps back. */
  angle: number;
  /** Eccentric anomaly, counted on through every turn. */
  E: number;
}

/** Where a planet is `phase` orbits after perihelion. */
export function orbitAt(a: number, e: number, phase: number): OrbitPoint {
  const turns = Math.floor(phase);
  const E0 = eccentricAnomaly(TAU * (phase - turns), e);
  const x = a * (Math.cos(E0) - e);
  const y = minorAxis(a, e) * Math.sin(E0);
  let nu = Math.atan2(y, x);
  if (nu < 0) nu += TAU;
  // Just short of a full turn, atan2 can round to 0: keep the angle running forwards.
  if (E0 > Math.PI && nu < Math.PI) nu += TAU;
  return { x, y, r: Math.hypot(x, y), angle: nu + TAU * turns, E: E0 + TAU * turns };
}

/** The point at eccentric anomaly E (also how a pencil held by a loop of string round the two foci draws it). */
export function ellipsePoint(a: number, e: number, E: number): [number, number] {
  return [a * (Math.cos(E) - e), minorAxis(a, e) * Math.sin(E)];
}

/** The two foci: the Sun's, and the empty one. */
export function foci(a: number, e: number): [[number, number], [number, number]] {
  return [
    [0, 0],
    [-2 * a * e, 0],
  ];
}

/**
 * The best circle through the ellipse's ends (its auxiliary circle): centred mid-way between the foci, with
 * radius a. It misses the ellipse most at the sides, by a − b; Kepler found exactly such a crescent in Mars.
 */
export function bestCircle(a: number, e: number) {
  return { cx: -a * e, cy: 0, r: a, miss: a - minorAxis(a, e) };
}

/** Area of the whole ellipse. */
export const ellipseArea = (a: number, e: number) => Math.PI * a * minorAxis(a, e);

/**
 * Kepler's second law: the line from the Sun sweeps out area at a steady rate, so after `phase` orbits it has
 * swept that fraction of the whole ellipse.
 */
export const sweptArea = (a: number, e: number, phase: number) => ellipseArea(a, e) * phase;

/**
 * The fan swept between two moments: the Sun, then points along the orbit from `p0` to `p1` (sampled evenly
 * along the ellipse, so the outline stays smooth where the planet races).
 */
export function fanOutline(
  a: number,
  e: number,
  p0: number,
  p1: number,
  steps = 48,
): Array<[number, number]> {
  const E0 = orbitAt(a, e, p0).E;
  const E1 = orbitAt(a, e, p1).E;
  const out: Array<[number, number]> = [[0, 0]];
  for (let i = 0; i <= steps; i++) out.push(ellipsePoint(a, e, E0 + ((E1 - E0) * i) / steps));
  return out;
}

/** Area of a simple polygon (shoelace formula). */
export function polygonArea(pts: Array<[number, number]>): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i]!;
    const [x1, y1] = pts[(i + 1) % pts.length]!;
    s += x0 * y1 - x1 * y0;
  }
  return Math.abs(s) / 2;
}

/**
 * How fast the planet turns as seen from the Sun, relative to its slowest (at aphelion). Kepler heard this
 * ratio as a musical interval.
 */
export function turnRate(e: number, phase: number): number {
  const { angle } = orbitAt(1, e, phase);
  return Math.pow((1 + e * Math.cos(angle)) / (1 - e), 2);
}

/** Fastest over slowest turning rate: ((1 + e) / (1 − e))². */
export const turnRange = (e: number) => Math.pow((1 + e) / (1 - e), 2);

/** Fastest over slowest speed along the orbit: (1 + e) / (1 − e). */
export const speedRange = (e: number) => (1 + e) / (1 - e);

export interface Interval {
  name: string;
  /** Upper : lower. */
  ratio: [number, number];
}

/** The consonances of Kepler's Harmonices Mundi (1619), smallest first. */
export const INTERVALS: Interval[] = [
  { name: 'diesis', ratio: [25, 24] },
  { name: 'semitone', ratio: [16, 15] },
  { name: 'whole tone', ratio: [9, 8] },
  { name: 'minor third', ratio: [6, 5] },
  { name: 'major third', ratio: [5, 4] },
  { name: 'fourth', ratio: [4, 3] },
  { name: 'fifth', ratio: [3, 2] },
  { name: 'minor sixth', ratio: [8, 5] },
  { name: 'major sixth', ratio: [5, 3] },
  { name: 'octave', ratio: [2, 1] },
  { name: 'octave and a minor third', ratio: [12, 5] },
  { name: 'octave and a fifth', ratio: [3, 1] },
  { name: 'two octaves', ratio: [4, 1] },
];

/** The consonance nearest to a frequency ratio, and how far off it is in cents (hundredths of a semitone). */
export function nearestInterval(ratio: number): Interval & { cents: number } {
  let best = INTERVALS[0]!;
  let off = Infinity;
  for (const iv of INTERVALS) {
    const c = 1200 * Math.log2(ratio / (iv.ratio[0] / iv.ratio[1]));
    if (Math.abs(c) < Math.abs(off)) {
      best = iv;
      off = c;
    }
  }
  return { ...best, cents: off };
}

export interface Planet {
  id: string;
  name: string;
  /** Semi-major axis in astronomical units (Earth–Sun distances). */
  a: number;
  /** Orbital period in years. */
  T: number;
  e: number;
  color: string;
  /** Drawn radius (not to scale). */
  size: number;
}

/** The six planets Kepler knew, from the Sun outwards. */
export const PLANETS: Planet[] = [
  { id: 'mercury', name: 'Mercury', a: 0.3871, T: 0.2408, e: 0.2056, color: '#b9b2a6', size: 0.07 },
  { id: 'venus', name: 'Venus', a: 0.7233, T: 0.6152, e: 0.0068, color: '#f0d9a8', size: 0.1 },
  { id: 'earth', name: 'Earth', a: 1, T: 1, e: 0.0167, color: '#6fa8ff', size: 0.11 },
  { id: 'mars', name: 'Mars', a: 1.5237, T: 1.8809, e: 0.0934, color: '#e0764a', size: 0.09 },
  { id: 'jupiter', name: 'Jupiter', a: 5.2029, T: 11.862, e: 0.0484, color: '#e3b98a', size: 0.32 },
  { id: 'saturn', name: 'Saturn', a: 9.5367, T: 29.457, e: 0.0539, color: '#e8d39a', size: 0.27 },
];

/** Kepler's third law: a year squared over a distance cubed comes out the same for every planet. */
export const lawThree = (p: Pick<Planet, 'a' | 'T'>) => (p.T * p.T) / (p.a * p.a * p.a);

/** The story's orbit: Mars, stretched (its real eccentricity is 0.093) so the shape can be seen. */
export const STORY = { a: 3, e: 0.5, fans: 12 };
export const MARS = PLANETS[3]!;
