/**
 * Chapter 7's maths: complex numbers as arrows in a plane, multiplication by i as a quarter turn, the point e^{iθ}
 * going round the circle, and the series that says why: e^{iθ} = 1 + iθ + (iθ)²/2! + (iθ)³/3! + …
 */

export type Complex = [number, number];

export const add = (a: Complex, b: Complex): Complex => [a[0] + b[0], a[1] + b[1]];
export const mul = (a: Complex, b: Complex): Complex => [
  a[0] * b[0] - a[1] * b[1],
  a[0] * b[1] + a[1] * b[0],
];
export const abs = (a: Complex) => Math.hypot(a[0], a[1]);
export const I: Complex = [0, 1];

/** e^{iθ}: the point an angle θ round the circle of radius 1, (cos θ, sin θ). */
export const expi = (theta: number): Complex => [Math.cos(theta), Math.sin(theta)];

/** i^k: 1, i, −1, −i, round and round. */
export function iPower(k: number): Complex {
  let z: Complex = [1, 0];
  for (let n = 0; n < ((k % 4) + 4) % 4; n++) z = mul(z, I);
  return z;
}

export interface Series {
  /** The terms (iθ)^k / k!, each a quarter turn on from the last and (past k > θ) smaller. */
  terms: Complex[];
  /** The running totals: the arrows laid head to tail end at these points. */
  sums: Complex[];
}

/** The first `n` terms of e^{iθ}'s series, and where each partial sum lands. */
export function series(theta: number, n: number): Series {
  const terms: Complex[] = [];
  const sums: Complex[] = [];
  let term: Complex = [1, 0];
  let sum: Complex = [0, 0];
  for (let k = 0; k < n; k++) {
    if (k > 0) term = mul(term, [0, theta / k]);
    terms.push(term);
    sum = add(sum, term);
    sums.push(sum);
  }
  return { terms, sums };
}

/** How far the first `n` terms land from the point e^{iθ} itself. */
export const seriesError = (theta: number, n: number) => {
  const s = series(theta, n).sums[n - 1] ?? [0, 0];
  const [c, si] = expi(theta);
  return Math.hypot(s[0] - c, s[1] - si);
};

/** The point's push: i times where it is, a quarter turn on from its arrow and as long. */
export const push = (theta: number): Complex => mul(I, expi(theta));

/**
 * The handoff: a point on an arrow of length 1 turning at speed 1, with an arrow of length r turning at speed k on its
 * tip, starting `phase` round.
 */
export const epicycle = (theta: number, r: number, k: number, phase = 0): Complex =>
  add(expi(theta), [r * Math.cos(k * theta + phase), r * Math.sin(k * theta + phase)]);

/** θ in words, as a multiple of π where it is a simple one ("π/2", "π", "2π"), else in radians. */
export function thetaText(theta: number): string {
  if (theta < 0 && thetaText(-theta) !== '0') return `−${thetaText(-theta)}`;
  const q = theta / Math.PI;
  for (const [num, den] of [
    [0, 1],
    [1, 4],
    [1, 2],
    [3, 4],
    [1, 1],
    [5, 4],
    [3, 2],
    [7, 4],
    [2, 1],
  ] as const) {
    if (Math.abs(q - num / den) < 0.004) {
      if (num === 0) return '0';
      const top = num === 1 ? 'π' : `${num}π`;
      return den === 1 ? top : `${top}/${den}`;
    }
  }
  return theta.toFixed(2);
}
