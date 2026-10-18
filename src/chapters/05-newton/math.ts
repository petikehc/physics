/**
 * Pure physics for chapter 5 (Newton's gravitation). Lengths are in Earth radii and the Earth's pull is GM = 1,
 * so the unit of speed is that of an orbit skimming the ground (7.9 km/s) and the unit of time is 806.8 s.
 * Newton's cannon stands on a mountain at the top of the planet (+y) and fires towards +x, so its shots go
 * round clockwise in the x–y plane.
 */

const TAU = Math.PI * 2;

/** The real Earth: its radius, its pull (GM) and the surface gravity that gives. */
export const EARTH_KM = 6371;
export const MU_KM3_S2 = 398600.4418;
export const G_SURFACE = (MU_KM3_S2 / (EARTH_KM * EARTH_KM)) * 1000;

/** km/s in one unit of speed, and seconds in one unit of time. */
export const SPEED_UNIT = Math.sqrt(MU_KM3_S2 / EARTH_KM);
export const TIME_UNIT = Math.sqrt((EARTH_KM * EARTH_KM * EARTH_KM) / MU_KM3_S2);

export const kms = (v: number) => v * SPEED_UNIT;
export const fromKms = (v: number) => v / SPEED_UNIT;

/** Newton's mountain: far taller than any real one, its top is high above the air. */
export const MOUNTAIN_KM = 1600;
/** Where the cannon fires from: the mountain top, in Earth radii from the centre. */
export const LAUNCH_R = 1 + MOUNTAIN_KM / EARTH_KM;

/** The speed of a circular orbit at distance r, and the speed that escapes for good. */
export const circularSpeed = (r: number) => 1 / Math.sqrt(r);
export const escapeSpeed = (r: number) => Math.sqrt(2 / r);

export type Outcome = 'lands' | 'orbits' | 'escapes';

export interface Flight {
  outcome: Outcome;
  /** The launch: speed (units of SPEED_UNIT) and angle above the horizon (radians). */
  v: number;
  angle: number;
  /** Samples along the path, in time order. */
  t: Float64Array;
  x: Float64Array;
  y: Float64Array;
  vx: Float64Array;
  vy: Float64Array;
  /** How long the flight lasts: until it lands, one full orbit, or until it is far away. */
  duration: number;
  /** The orbit's shape, for a ball that never lands: eccentricity, semi-major axis, period. */
  e: number;
  a: number;
  period: number;
  /** For a ball that lands, how far round the planet it got (radians). */
  range: number;
  /** Farthest from the centre it gets. */
  apo: number;
}

/** Specific orbital energy and the eccentricity of the conic through a launch from the mountain top. */
export function conic(v: number, angle: number, r0 = LAUNCH_R) {
  const energy = (v * v) / 2 - 1 / r0;
  const h = r0 * v * Math.cos(angle);
  const e = Math.sqrt(Math.max(0, 1 + 2 * energy * h * h));
  const a = energy < 0 ? -1 / (2 * energy) : Infinity;
  return { energy, h, e, a, peri: energy < 0 ? a * (1 - e) : (h * h) / (1 + e) };
}

/** How far a flight's escape is followed, in Earth radii. */
const FAR = 14;
const MAX_SAMPLES = 1600;

/**
 * Fires the cannon: integrates the ball's flight under the planet's pull (velocity Verlet), from the mountain top
 * until it hits the ground, completes one orbit, or is far away and still leaving.
 */
export function fire(v: number, angle = 0, r0 = LAUNCH_R): Flight {
  const c = conic(v, angle, r0);
  const bound = c.energy < 0;
  const orbits = bound && c.peri > 1 + 1e-9;
  const period = bound ? TAU * Math.pow(c.a, 1.5) : Infinity;
  const outcome: Outcome = orbits ? 'orbits' : bound ? 'lands' : 'escapes';
  // An orbit is integrated for exactly one period in 4000 even steps; any other flight in steps of 1.6 s.
  const dt = orbits ? period / 4000 : 0.002;
  const limit = orbits ? period : 400;

  const T: number[] = [0];
  const X: number[] = [0];
  const Y: number[] = [r0];
  const VX: number[] = [v * Math.cos(angle)];
  const VY: number[] = [v * Math.sin(angle)];
  let x = 0;
  let y = r0;
  let vx = VX[0]!;
  let vy = VY[0]!;
  let r3 = r0 * r0 * r0;
  let ax = -x / r3;
  let ay = -y / r3;
  let t = 0;
  let apo = r0;
  let ended = false;
  while (!ended) {
    const step = Math.min(dt, limit - t);
    const px = x;
    const py = y;
    const pvx = vx;
    const pvy = vy;
    vx += ax * step * 0.5;
    vy += ay * step * 0.5;
    x += vx * step;
    y += vy * step;
    const r = Math.hypot(x, y);
    r3 = r * r * r;
    ax = -x / r3;
    ay = -y / r3;
    vx += ax * step * 0.5;
    vy += ay * step * 0.5;
    t += step;
    apo = Math.max(apo, r);
    if (r < 1 && outcome !== 'orbits') {
      // Hit the ground: back up to where the step crossed the surface.
      const r0p = Math.hypot(px, py);
      const k = (r0p - 1) / (r0p - r);
      x = px + (x - px) * k;
      y = py + (y - py) * k;
      vx = pvx + (vx - pvx) * k;
      vy = pvy + (vy - pvy) * k;
      t -= step * (1 - k);
      ended = true;
    } else if (t >= limit - 1e-12 || (outcome === 'escapes' && r > FAR)) ended = true;
    T.push(t);
    X.push(x);
    Y.push(y);
    VX.push(vx);
    VY.push(vy);
  }

  // Keep at most MAX_SAMPLES, evenly spaced through the steps, always including both ends.
  const n = T.length;
  const keep = Math.min(n, MAX_SAMPLES);
  const pick = (src: number[]) =>
    Float64Array.from({ length: keep }, (_, i) => src[Math.round((i * (n - 1)) / (keep - 1))]!);
  const duration = T[n - 1]!;
  const endAngle = Math.atan2(X[n - 1]!, Y[n - 1]!);
  return {
    outcome,
    v,
    angle,
    t: pick(T),
    x: pick(X),
    y: pick(Y),
    vx: pick(VX),
    vy: pick(VY),
    duration,
    e: c.e,
    a: c.a,
    period,
    range: outcome === 'lands' ? (endAngle < 0 ? endAngle + TAU : endAngle) : 0,
    apo,
  };
}

export interface FlightPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Where the ball is `time` after firing. An orbit goes round and round; a flight that ends stays where it ended. */
export function flightAt(f: Flight, time: number): FlightPoint {
  let t = time;
  if (f.outcome === 'orbits') t = ((t % f.duration) + f.duration) % f.duration;
  else t = Math.min(Math.max(t, 0), f.duration);
  const n = f.t.length;
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (f.t[mid]! <= t) lo = mid;
    else hi = mid;
  }
  const span = f.t[hi]! - f.t[lo]!;
  const k = span > 0 ? (t - f.t[lo]!) / span : 0;
  const mix = (a: Float64Array) => a[lo]! + (a[hi]! - a[lo]!) * k;
  return { x: mix(f.x), y: mix(f.y), vx: mix(f.vx), vy: mix(f.vy) };
}

/** Energy per unit mass at a point: it stays the same all the way along a flight. */
export const energyAt = (p: FlightPoint) => (p.vx * p.vx + p.vy * p.vy) / 2 - 1 / Math.hypot(p.x, p.y);

/** What a shot does, in the units the readout uses. */
export function describe(f: Flight) {
  return {
    outcome: f.outcome,
    speedKms: kms(f.v),
    /** Along the ground to where it lands, and how long it takes. */
    rangeKm: f.range * EARTH_KM,
    minutes: ((f.outcome === 'orbits' ? f.period : f.duration) * TIME_UNIT) / 60,
    /** A circle (to within 1 %) rather than an ellipse. */
    circle: f.outcome === 'orbits' && f.e < 0.01,
    /** Highest it gets above the ground. */
    highKm: (f.apo - 1) * EARTH_KM,
  };
}

/** The Moon: its distance from the Earth's centre, its month, its size. */
export const MOON = { distanceKm: 384_400, periodDays: 27.3217, radiusKm: 1737 };

/**
 * Newton's Moon test. The Moon is 60 Earth radii away and goes round once a month, so in one second it falls
 * 1.36 mm towards the Earth (off the straight line it would otherwise follow). An apple at the surface falls
 * 4.9 m in its first second: 3,600 times as far, and 3,600 is 60 × 60.
 */
export function moonTest() {
  const r = MOON.distanceKm * 1000;
  const T = MOON.periodDays * 86400;
  const pull = (4 * Math.PI * Math.PI * r) / (T * T);
  const moonFall = pull / 2;
  const appleFall = G_SURFACE / 2;
  const distance = MOON.distanceKm / EARTH_KM;
  return {
    /** Metres fallen in the first second. */
    moonFall,
    appleFall,
    ratio: appleFall / moonFall,
    /** The Moon's distance in Earth radii, and its square. */
    distance,
    square: distance * distance,
  };
}

/**
 * Distances an apple has fallen at equal times, in units of the first one: 0, 1, 4, 9, 16… The gaps between them
 * grow 1, 3, 5, 7…, as Galileo found.
 */
export const fallAt = (k: number) => k * k;
