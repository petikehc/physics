import { describe, expect, it } from 'vitest';
import {
  APPLE_YS,
  areaBetween,
  areaTo,
  columns,
  CONTROL_X,
  curve,
  fallen,
  heightAt,
  METRES_PER_AREA,
  SHAPES,
  slopeAt,
  STORY_YS,
  strips,
  X_MAX,
} from './math';

/** A plain numerical integral (Simpson's rule, finely), to check the exact one against. */
function simpson(f: (x: number) => number, a: number, b: number, n = 2000) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

describe('the curve', () => {
  const c = curve(STORY_YS);

  it('passes through its control points', () => {
    CONTROL_X.forEach((x, i) => expect(heightAt(c, x)).toBeCloseTo(STORY_YS[i]!, 12));
  });

  it('never dips below its lowest point or above its highest (no overshoot)', () => {
    for (const s of SHAPES) {
      const k = curve(s.ys);
      const lo = Math.min(...s.ys);
      const hi = Math.max(...s.ys);
      for (let x = 0; x <= X_MAX; x += 0.01) {
        expect(heightAt(k, x)).toBeGreaterThanOrEqual(lo - 1e-9);
        expect(heightAt(k, x)).toBeLessThanOrEqual(hi + 1e-9);
      }
    }
  });

  it('is smooth: its slope matches its rise, and has no jumps at the control points', () => {
    const e = 1e-6;
    for (let x = 0.05; x < X_MAX; x += 0.05) {
      expect(slopeAt(c, x)).toBeCloseTo((heightAt(c, x + e) - heightAt(c, x - e)) / (2 * e), 5);
    }
    for (const x of CONTROL_X.slice(1, -1)) {
      expect(heightAt(c, x - 1e-9)).toBeCloseTo(heightAt(c, x + 1e-9), 6);
      expect(slopeAt(c, x - 1e-9)).toBeCloseTo(slopeAt(c, x + 1e-9), 5);
    }
  });
});

describe('the area under it', () => {
  const c = curve(STORY_YS);

  it('is exact', () => {
    for (const s of SHAPES) {
      const k = curve(s.ys);
      for (const x of [0.3, 1.7, 2.4, X_MAX]) {
        expect(areaTo(k, x)).toBeCloseTo(
          simpson((t) => heightAt(k, t), 0, x),
          9,
        );
      }
    }
  });

  it("grows at the curve's height: the slope of A is f (the fundamental theorem)", () => {
    const e = 1e-6;
    for (let x = 0.02; x < X_MAX; x += 0.02) {
      expect((areaTo(c, x + e) - areaTo(c, x - e)) / (2 * e)).toBeCloseTo(heightAt(c, x), 6);
    }
  });

  it('from a to b is A(b) − A(a)', () => {
    expect(areaBetween(c, 1, 3)).toBeCloseTo(
      simpson((t) => heightAt(c, t), 1, 3),
      9,
    );
    expect(areaBetween(c, 3, 1)).toBeCloseTo(-areaBetween(c, 1, 3), 12);
  });

  it('is about 6 for the story, so the area wall fits', () => {
    expect(areaTo(c, X_MAX)).toBeGreaterThan(5.6);
    expect(areaTo(c, X_MAX)).toBeLessThan(6.4);
  });
});

describe('columns', () => {
  const c = curve(STORY_YS);
  const exact = areaTo(c, X_MAX);

  it('add up to the area as they get thinner (the error falls fourfold each time they halve)', () => {
    let last = Infinity;
    for (const n of [4, 8, 16, 32, 64, 128, 256, 512]) {
      const err = Math.abs(columns(c, n).sum - exact);
      expect(err).toBeLessThan(last);
      if (n >= 16) expect(err / last).toBeLessThan(0.35);
      last = err;
    }
    expect(Math.abs(columns(c, 512).sum - exact)).toBeLessThan(1e-4);
  });

  it('stack into a stair whose top is the running total', () => {
    const col = columns(c, 8);
    expect(col.before[0]).toBe(0);
    for (let i = 1; i < 8; i++) {
      expect(col.before[i]).toBeCloseTo(col.before[i - 1]! + col.heights[i - 1]! * col.width, 12);
    }
    // Each step climbs a column's area over a column's width: its slope is the column's height.
    col.heights.forEach((h, i) => {
      const rise = (i < 7 ? col.before[i + 1]! : col.sum) - col.before[i]!;
      expect(rise / col.width).toBeCloseTo(h, 12);
    });
  });
});

describe("the apple's speed", () => {
  const c = curve(APPLE_YS);

  it('is a straight line through 9.8 m/s at one second', () => {
    expect(heightAt(c, 0)).toBe(0);
    expect(heightAt(c, X_MAX) / 0.3).toBeCloseTo(9.8, 12);
    for (let x = 0; x <= X_MAX; x += 0.1) expect(heightAt(c, x)).toBeCloseTo((0.3 * 9.8 * x) / X_MAX, 12);
  });

  it('has the distance fallen as the area under it: 4.9 m in the first second', () => {
    expect(areaTo(c, X_MAX) * METRES_PER_AREA).toBeCloseTo(4.9, 12);
    expect(fallen(1)).toBeCloseTo(4.9, 12);
    expect(areaTo(c, 2) * METRES_PER_AREA).toBeCloseTo(fallen(0.5), 12);
  });

  it('cut at each flash, gives strips 1, 3, 5, 7 (the strobe from chapter 5)', () => {
    const s = strips(4);
    s.forEach((v, k) => expect(v / s[0]!).toBeCloseTo(2 * k + 1, 12));
    expect(s.reduce((a, b) => a + b, 0)).toBeCloseTo(4.9, 12);
  });
});
