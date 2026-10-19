import { describe, expect, it } from 'vitest';
import { abs, epicycle, expi, iPower, mul, push, series, seriesError, thetaText } from './math';

describe('quarter turns', () => {
  it('turn 1 into i, −1, −i and back to 1: i × i = −1', () => {
    const want = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
      [1, 0],
    ];
    want.forEach(([re, im], k) => {
      const z = iPower(k);
      expect(z[0]).toBeCloseTo(re!, 12);
      expect(z[1]).toBeCloseTo(im!, 12);
    });
    expect(mul([0, 1], [0, 1])).toEqual([-1, 0]);
  });
});

describe('e^{iθ}', () => {
  it('stays on the circle of radius 1: cos² θ + sin² θ = 1', () => {
    for (let t = -7; t <= 7; t += 0.37) expect(abs(expi(t))).toBeCloseTo(1, 12);
  });

  it('is pushed at right angles to itself, as hard as it is far out, so it goes round at speed 1', () => {
    const e = 1e-6;
    for (let t = 0; t < 7; t += 0.5) {
      const [x, y] = expi(t);
      const [vx, vy] = push(t);
      // The push is the point's own velocity…
      expect((expi(t + e)[0] - expi(t - e)[0]) / (2 * e)).toBeCloseTo(vx, 6);
      expect((expi(t + e)[1] - expi(t - e)[1]) / (2 * e)).toBeCloseTo(vy, 6);
      // …at right angles to its arrow, and as long.
      expect(x * vx + y * vy).toBeCloseTo(0, 12);
      expect(Math.hypot(vx, vy)).toBeCloseTo(1, 12);
    }
  });

  it('lands on −1 at θ = π: e^{iπ} + 1 = 0', () => {
    const [re, im] = expi(Math.PI);
    expect(re + 1).toBeCloseTo(0, 12);
    expect(im).toBeCloseTo(0, 12);
  });
});

describe('the series', () => {
  it('turns each term a quarter turn on from the last', () => {
    const { terms } = series(1.3, 8);
    for (let k = 1; k < 8; k++) {
      const [a, b] = [terms[k - 1]!, terms[k]!];
      // b is a positive multiple of i·a: at right angles, anticlockwise.
      expect(a[0] * b[0] + a[1] * b[1]).toBeCloseTo(0, 12);
      expect(a[0] * b[1] - a[1] * b[0]).toBeGreaterThan(0);
    }
  });

  it('spirals in onto e^{iθ}: onto −1 at θ = π', () => {
    const { sums } = series(Math.PI, 24);
    expect(sums[23]![0]).toBeCloseTo(-1, 10);
    expect(sums[23]![1]).toBeCloseTo(0, 10);
    // It swings wide first: the third partial sum is 1 − π²/2 ≈ −3.93 across.
    expect(sums[2]![0]).toBeCloseTo(1 - (Math.PI * Math.PI) / 2, 12);
    let last = Infinity;
    for (let n = 6; n <= 20; n += 2) {
      const err = seriesError(Math.PI, n);
      expect(err).toBeLessThan(last);
      last = err;
    }
  });

  it('splits into the cosine and sine series: real terms alternate 1, −θ²/2, θ⁴/24…', () => {
    const t = 0.8;
    const { terms } = series(t, 6);
    expect(terms[0]).toEqual([1, 0]);
    expect(terms[1]![1]).toBeCloseTo(t, 12);
    expect(terms[2]![0]).toBeCloseTo(-(t * t) / 2, 12);
    expect(terms[3]![1]).toBeCloseTo(-(t ** 3) / 6, 12);
    expect(terms[4]![0]).toBeCloseTo(t ** 4 / 24, 12);
  });
});

describe('the handoff', () => {
  it('puts a smaller arrow, turning k times as fast, on the tip of the first', () => {
    const p = epicycle(0, 0.3, 3);
    expect(p[0]).toBeCloseTo(1.3, 12);
    const q = epicycle(Math.PI / 2, 0.3, 3);
    expect(q[0]).toBeCloseTo(0, 12);
    expect(q[1]).toBeCloseTo(1 - 0.3, 12);
  });

  it('traces a rounded square when the smaller arrow turns three times as fast the other way, starting turned in', () => {
    const r = 0.16;
    const at = (t: number) => abs(epicycle(t, r, -3, Math.PI));
    // Pulled in on the axes, pushed out on the diagonals: the corners of a square…
    for (let k = 0; k < 4; k++) {
      expect(at((k * Math.PI) / 2)).toBeCloseTo(1 - r, 12);
      expect(at(((k + 0.5) * Math.PI) / 2)).toBeCloseTo(1 + r, 12);
    }
    // …with sides that stay convex: the middle of a side is further out than the straight line between corners.
    expect(at(0)).toBeGreaterThan((1 + r) * Math.SQRT1_2);
  });
});

describe('θ in words', () => {
  it('names simple multiples of π', () => {
    expect(thetaText(Math.PI)).toBe('π');
    expect(thetaText(Math.PI / 2)).toBe('π/2');
    expect(thetaText((3 * Math.PI) / 2)).toBe('3π/2');
    expect(thetaText(2 * Math.PI)).toBe('2π');
    expect(thetaText(0)).toBe('0');
    expect(thetaText(1)).toBe('1.00');
    expect(thetaText(-Math.PI / 2)).toBe('−π/2');
    expect(thetaText(-1e-9)).toBe('0');
  });
});
