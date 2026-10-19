/**
 * Chapter 6's maths: a smooth curve f through a few control points, the columns that fill the area under it (a
 * Riemann sum), and that area exactly, A(x) = ∫₀ˣ f. The curve is a monotone cubic (Fritsch–Carlson): smooth, and
 * never overshooting its points, so a curve dragged above the axis stays above it.
 */

/** Every curve lives on 0 ≤ x ≤ X_MAX. */
export const X_MAX = 4;
/** How many control points shape it, evenly spaced from 0 to X_MAX. */
export const CONTROLS = 6;
export const STEP = X_MAX / (CONTROLS - 1);
export const CONTROL_X = Array.from({ length: CONTROLS }, (_, i) => i * STEP);

export interface Curve {
  /** Heights at the control points. */
  ys: number[];
  /** Slopes there. */
  ms: number[];
  /** The area under the curve from 0 to each control point. */
  areas: number[];
}

const sign = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);

/** The curve through heights `ys` at CONTROL_X. */
export function curve(ys: readonly number[]): Curve {
  const n = ys.length;
  const h = X_MAX / (n - 1);
  const d = Array.from({ length: n - 1 }, (_, k) => (ys[k + 1]! - ys[k]!) / h);
  const ms = ys.map((_, k) => {
    if (k === 0 || k === n - 1) {
      // One-sided, kept from overshooting.
      const [d0, d1] = k === 0 ? [d[0]!, d[1] ?? d[0]!] : [d[n - 2]!, d[n - 3] ?? d[n - 2]!];
      const m = (3 * d0 - d1) / 2;
      if (sign(m) !== sign(d0)) return 0;
      if (sign(d0) !== sign(d1) && Math.abs(m) > 3 * Math.abs(d0)) return 3 * d0;
      return m;
    }
    const [a, b] = [d[k - 1]!, d[k]!];
    // Flat at a peak or a trough; otherwise the harmonic mean of the slopes either side.
    return a * b <= 0 ? 0 : 2 / (1 / a + 1 / b);
  });
  const areas = [0];
  for (let k = 0; k < n - 1; k++) {
    areas.push(areas[k]! + (h * (ys[k]! + ys[k + 1]!)) / 2 + (h * h * (ms[k]! - ms[k + 1]!)) / 12);
  }
  return { ys: ys.slice(), ms, areas };
}

/** Which piece of the curve x falls in, and how far along it (0..1). */
function piece(c: Curve, x: number): [number, number, number] {
  const h = X_MAX / (c.ys.length - 1);
  const k = Math.min(Math.max(Math.floor(x / h), 0), c.ys.length - 2);
  return [k, (x - k * h) / h, h];
}

/** f(x). */
export function heightAt(c: Curve, x: number): number {
  const [k, t, h] = piece(c, x);
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * c.ys[k]! +
    (t3 - 2 * t2 + t) * h * c.ms[k]! +
    (-2 * t3 + 3 * t2) * c.ys[k + 1]! +
    (t3 - t2) * h * c.ms[k + 1]!
  );
}

/** f′(x): the curve's own slope. */
export function slopeAt(c: Curve, x: number): number {
  const [k, t, h] = piece(c, x);
  const t2 = t * t;
  return (
    ((6 * t2 - 6 * t) * c.ys[k]! +
      (3 * t2 - 4 * t + 1) * h * c.ms[k]! +
      (-6 * t2 + 6 * t) * c.ys[k + 1]! +
      (3 * t2 - 2 * t) * h * c.ms[k + 1]!) /
    h
  );
}

/** A(x): the area under the curve from 0 to x (exactly: each piece is a cubic). */
export function areaTo(c: Curve, x: number): number {
  const [k, t, h] = piece(c, x);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  return (
    c.areas[k]! +
    h *
      ((t4 / 2 - t3 + t) * c.ys[k]! +
        (t4 / 4 - (2 * t3) / 3 + t2 / 2) * h * c.ms[k]! +
        (-t4 / 2 + t3) * c.ys[k + 1]! +
        (t4 / 4 - t3 / 3) * h * c.ms[k + 1]!)
  );
}

/** The area under the curve from a to b. */
export const areaBetween = (c: Curve, a: number, b: number) => areaTo(c, b) - areaTo(c, a);

export interface Columns {
  /** Each column's width, and its height (the curve's height at the middle of the column). */
  width: number;
  heights: number[];
  /** The columns' total area, and the running total before each one (the stair the columns stack into). */
  sum: number;
  before: number[];
}

/** `n` equal columns from a to b, each as tall as the curve at its middle: a Riemann sum. */
export function columns(c: Curve, n: number, a = 0, b = X_MAX): Columns {
  const width = (b - a) / n;
  const heights = Array.from({ length: n }, (_, i) => heightAt(c, a + (i + 0.5) * width));
  const before: number[] = [];
  let sum = 0;
  for (const h of heights) {
    before.push(sum);
    sum += h * width;
  }
  return { width, heights, sum, before };
}

// ---------- The falling apple (chapter 5's), its speed drawn as a curve ----------

export const G = 9.8;
/** Its first second of falling, drawn across the whole x axis: x = 4 t. */
export const APPLE_SECONDS = 1;
/** Graph height per m/s of speed. */
export const SPEED_SCALE = 0.3;
/** The apple's speed as a curve: a straight line, 9.8 m/s faster every second. */
export const APPLE_YS = CONTROL_X.map((x) => SPEED_SCALE * G * ((x / X_MAX) * APPLE_SECONDS));
/** Metres per unit of area on the graph (an x unit is a quarter second, a height unit 1/0.3 m/s). */
export const METRES_PER_AREA = APPLE_SECONDS / X_MAX / SPEED_SCALE;

/** How far the apple falls in t seconds: ½ g t². */
export const fallen = (t: number) => (G * t * t) / 2;

/**
 * The distance it falls in each of `n` equal slices of its first second: the triangle under its speed, cut at each
 * flash. They grow 1, 3, 5, 7…, as the strobe showed.
 */
export const strips = (n: number) => Array.from({ length: n }, (_, k) => fallen((k + 1) / n) - fallen(k / n));

// ---------- Curves to try ----------

/** The story's curve: a speed that rises, dips and rises again. */
export const STORY_YS = [1.2, 2.3, 1.5, 0.6, 1.3, 2.4];

export const SHAPES = [
  { id: 'wave', name: 'Wave', ys: STORY_YS },
  { id: 'hill', name: 'Hill', ys: [0.4, 1.5, 2.5, 2.5, 1.5, 0.4] },
  { id: 'ramp', name: "Apple's speed", ys: APPLE_YS },
  { id: 'flat', name: 'Flat', ys: [1.5, 1.5, 1.5, 1.5, 1.5, 1.5] },
] as const;

/** The tallest a control point may be dragged. */
export const Y_MAX = 3;
