/**
 * Chapter 8's maths: repeating waves written as sums of sines, a sin(n t + φ), each one an arrow turning at a
 * whole-number speed n (chapter 7's e^{iθ}, n times as fast and a times as long); and any closed shape written as a
 * sum of arrows turning both ways, from its discrete Fourier transform.
 */

export type Complex = [number, number];

/** One harmonic of a wave: a sin(n t + phase). */
export interface Harmonic {
  n: number;
  a: number;
  phase: number;
}

export type RecipeId = 'square' | 'sawtooth' | 'triangle';

export interface Recipe {
  id: RecipeId;
  name: string;
  /** The k-th circle's speed (k = 0, 1, 2…): the harmonics the wave is built from, in order. */
  speed: (k: number) => number;
  /** The signed sine coefficient bₙ of harmonic n (0 for harmonics the wave doesn't use). */
  coefficient: (n: number) => number;
  /** The wave itself, period 2π, between −1 and 1. */
  wave: (t: number) => number;
}

const wrap = (t: number) => t - 2 * Math.PI * Math.floor((t + Math.PI) / (2 * Math.PI));

export const RECIPES: Record<RecipeId, Recipe> = {
  // Odd harmonics only, each 1/n as big: square.
  square: {
    id: 'square',
    name: 'Square',
    speed: (k) => 2 * k + 1,
    coefficient: (n) => (n % 2 === 1 ? 4 / (Math.PI * n) : 0),
    wave: (t) => {
      const s = Math.sin(t);
      return s > 1e-12 ? 1 : s < -1e-12 ? -1 : 0;
    },
  },
  // Every harmonic, 1/n as big, alternating in sign: a ramp that climbs and drops back.
  sawtooth: {
    id: 'sawtooth',
    name: 'Sawtooth',
    speed: (k) => k + 1,
    coefficient: (n) => (n % 2 === 1 ? 2 : -2) / (Math.PI * n),
    wave: (t) => wrap(t) / Math.PI,
  },
  // Odd harmonics only, 1/n² as big, alternating in sign: a triangle, smoother, so it needs fewer circles.
  triangle: {
    id: 'triangle',
    name: 'Triangle',
    speed: (k) => 2 * k + 1,
    coefficient: (n) => (n % 2 === 1 ? (((n - 1) / 2) % 2 === 0 ? 8 : -8) / (Math.PI * Math.PI * n * n) : 0),
    wave: (t) => (2 / Math.PI) * Math.asin(Math.sin(t)),
  },
};

export const RECIPE_ORDER: RecipeId[] = ['square', 'sawtooth', 'triangle'];

/** A signed coefficient as an arrow's length and starting angle: −b sin x = b sin(x + π). */
const harmonic = (n: number, b: number): Harmonic => ({ n, a: Math.abs(b), phase: b < 0 ? Math.PI : 0 });

/** The first `count` circles of a recipe (a fraction scales the last one in, so it can grow into place). */
export function harmonicsOf(id: RecipeId, count: number): Harmonic[] {
  const r = RECIPES[id];
  const out: Harmonic[] = [];
  for (let k = 0; k < Math.ceil(count); k++) {
    const n = r.speed(k);
    const grow = Math.min(Math.max(count - k, 0), 1);
    out.push(harmonic(n, r.coefficient(n) * grow));
  }
  return out;
}

/**
 * Part way from one recipe to the next (`shape` 0 = square, 1 = sawtooth, 2 = triangle), with `count` circles of each:
 * the coefficients of every harmonic slide from one recipe's to the other's, so the clockwork reshapes smoothly.
 */
export function blend(shape: number, count: number, nMax: number): Harmonic[] {
  const s = Math.min(Math.max(shape, 0), RECIPE_ORDER.length - 1);
  const i = Math.min(Math.floor(s), RECIPE_ORDER.length - 2);
  const f = s - i;
  const coefs = (id: RecipeId) => {
    const b = new Array<number>(nMax + 1).fill(0);
    for (const h of harmonicsOf(id, count)) if (h.n <= nMax) b[h.n] = h.phase ? -h.a : h.a;
    return b;
  };
  const p = coefs(RECIPE_ORDER[i]!);
  const q = coefs(RECIPE_ORDER[i + 1]!);
  const out: Harmonic[] = [];
  for (let n = 1; n <= nMax; n++) {
    const b = p[n]! * (1 - f) + q[n]! * f;
    if (Math.abs(b) > 1e-9) out.push(harmonic(n, b));
  }
  return out;
}

/** The wave the harmonics add up to at time t. */
export const value = (hs: readonly Harmonic[], t: number) =>
  hs.reduce((sum, h) => sum + h.a * Math.sin(h.n * t + h.phase), 0);

/**
 * The clockwork: each harmonic an arrow turning at its own speed, laid head to tail. Returns where each arrow starts
 * and, last, where the tip is; the tip's height is the wave.
 */
export function chain(hs: readonly Harmonic[], t: number): Complex[] {
  const pts: Complex[] = [[0, 0]];
  let x = 0;
  let y = 0;
  for (const h of hs) {
    x += h.a * Math.cos(h.n * t + h.phase);
    y += h.a * Math.sin(h.n * t + h.phase);
    pts.push([x, y]);
  }
  return pts;
}

/** The highest the first `count` circles of a recipe reach, over a whole turn (Gibbs: the square overshoots by 9%). */
export function peak(id: RecipeId, count: number, samples = 4000) {
  const hs = harmonicsOf(id, count);
  let best = -Infinity;
  for (let i = 0; i < samples; i++) best = Math.max(best, value(hs, (i / samples) * Math.PI * 2));
  return best;
}

// ---------- Any closed shape ----------

/** One arrow of a shape's clockwork: c e^{i k t}, k turns per round (negative: clockwise). */
export interface Term {
  k: number;
  c: Complex;
}

/** Points spaced evenly along a closed polyline, `m` of them. */
export function resample(points: readonly Complex[], m: number): Complex[] {
  const closed = [...points, points[0]!];
  const lens = [0];
  for (let i = 1; i < closed.length; i++) {
    const [ax, ay] = closed[i - 1]!;
    const [bx, by] = closed[i]!;
    lens.push(lens[i - 1]! + Math.hypot(bx - ax, by - ay));
  }
  const total = lens[lens.length - 1]!;
  const out: Complex[] = [];
  let j = 1;
  for (let i = 0; i < m; i++) {
    const d = (i / m) * total;
    while (j < lens.length - 1 && lens[j]! < d) j++;
    const seg = lens[j]! - lens[j - 1]!;
    const f = seg > 0 ? (d - lens[j - 1]!) / seg : 0;
    const [ax, ay] = closed[j - 1]!;
    const [bx, by] = closed[j]!;
    out.push([ax + (bx - ax) * f, ay + (by - ay) * f]);
  }
  return out;
}

/**
 * The discrete Fourier transform of a closed path sampled evenly round it: the arrows c_k e^{ikt} for k = −K…K
 * that add up to it. Returned with the fixed one (k = 0, the shape's centre) first, then biggest first.
 */
export function transform(points: readonly Complex[], K: number): Term[] {
  const m = points.length;
  const terms: Term[] = [];
  for (let k = -K; k <= K; k++) {
    let re = 0;
    let im = 0;
    for (let j = 0; j < m; j++) {
      const a = (-2 * Math.PI * k * j) / m;
      const [x, y] = points[j]!;
      re += x * Math.cos(a) - y * Math.sin(a);
      im += x * Math.sin(a) + y * Math.cos(a);
    }
    terms.push({ k, c: [re / m, im / m] });
  }
  const centre = terms.find((t) => t.k === 0)!;
  const rest = terms.filter((t) => t.k !== 0).sort((p, q) => Math.hypot(...q.c) - Math.hypot(...p.c));
  return [centre, ...rest];
}

/** The joints of a shape's clockwork at time t (a whole turn is 2π), using its first `count` arrows. */
export function epicycles(terms: readonly Term[], t: number, count = terms.length): Complex[] {
  const pts: Complex[] = [];
  let x = 0;
  let y = 0;
  const n = Math.min(Math.ceil(count), terms.length);
  for (let i = 0; i < n; i++) {
    const { k, c } = terms[i]!;
    const grow = i === n - 1 ? Math.min(Math.max(count - i, 0), 1) : 1;
    const a = k * t;
    x += (c[0] * Math.cos(a) - c[1] * Math.sin(a)) * grow;
    y += (c[0] * Math.sin(a) + c[1] * Math.cos(a)) * grow;
    pts.push([x, y]);
  }
  return pts;
}

/** Where the tip of the first `count` arrows is at time t. */
export const traceAt = (terms: readonly Term[], t: number, count?: number): Complex => {
  const p = epicycles(terms, t, count);
  return p[p.length - 1] ?? [0, 0];
};

// ---------- The handoff's drawing ----------

function arc(cx: number, cy: number, r: number, from: number, to: number, steps = 16): Complex[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / steps;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as Complex;
  });
}

/**
 * An ambulance, side on, as one closed outline (clockwise from the back bumper): its box body, the lower cab with its
 * sloping windscreen, the wheel arches, and the light on its roof. About 4.4 wide and 1.7 tall, centred on 0.
 */
export function ambulance(): Complex[] {
  const pts: Complex[] = [];
  const add = (...ps: Complex[]) => pts.push(...ps);
  const y0 = -0.62;
  add([-2.15, y0 + 0.08], [-2.05, y0]);
  // The rear wheel arch, then the front one: each bulges up into the body, over its wheel.
  add([-1.72, y0]);
  add(...arc(-1.3, y0, 0.38, Math.PI, 0));
  add([0.82, y0]);
  add(...arc(1.24, y0, 0.38, Math.PI, 0));
  add([2.08, y0], [2.18, y0 + 0.1]);
  // The front, the bonnet and the windscreen up to the cab roof.
  add([2.2, 0.08], [2.02, 0.22], [1.5, 0.66], [0.8, 0.7]);
  // Up to the box body's roof, with the light on it.
  add([0.72, 0.98], [0.52, 0.98]);
  add(...arc(0.32, 1.1, 0.2, 0, Math.PI, 10));
  add([0.12, 0.98], [-2.05, 0.98], [-2.15, 0.9]);
  return pts;
}
