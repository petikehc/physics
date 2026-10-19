import { describe, expect, it } from 'vitest';
import {
  ambulance,
  blend,
  chain,
  epicycles,
  harmonicsOf,
  peak,
  RECIPES,
  resample,
  traceAt,
  transform,
  value,
  type Complex,
} from './math';

describe('waves as sums of circles', () => {
  it('squares off as odd circles are added, 1/n as big', () => {
    const hs = harmonicsOf('square', 4);
    expect(hs.map((h) => h.n)).toEqual([1, 3, 5, 7]);
    expect(hs[1]!.a / hs[0]!.a).toBeCloseTo(1 / 3, 12);
    // Far from the jumps, many circles land on the square's level.
    const many = harmonicsOf('square', 200);
    expect(value(many, Math.PI / 2)).toBeCloseTo(1, 2);
    expect(value(many, -Math.PI / 2)).toBeCloseTo(-1, 2);
    expect(value(many, 0)).toBeCloseTo(0, 12);
  });

  it('overshoots each jump by about 9% however many circles there are (Gibbs)', () => {
    for (const n of [20, 60]) expect(peak('square', n, 20000)).toBeCloseTo(1.179, 2);
  });

  it('builds a sawtooth from every circle, and a triangle from odd ones at 1/n²', () => {
    const saw = harmonicsOf('sawtooth', 300);
    expect(saw.slice(0, 3).map((h) => h.n)).toEqual([1, 2, 3]);
    expect(value(saw, Math.PI / 2)).toBeCloseTo(RECIPES.sawtooth.wave(Math.PI / 2), 2);
    expect(value(saw, -2)).toBeCloseTo(RECIPES.sawtooth.wave(-2), 2);
    // The triangle is smooth enough that ten circles already land within 1%.
    const tri = harmonicsOf('triangle', 10);
    for (const t of [0.3, 1.2, Math.PI / 2, 2.5, -1])
      expect(value(tri, t)).toBeCloseTo(RECIPES.triangle.wave(t), 1);
    expect(tri[1]!.a / tri[0]!.a).toBeCloseTo(1 / 9, 12);
  });

  it('puts the wave at the tip of the clockwork', () => {
    const hs = harmonicsOf('square', 6);
    for (const t of [0.2, 1, 2.7, 4]) {
      const pts = chain(hs, t);
      expect(pts).toHaveLength(7);
      expect(pts[6]![1]).toBeCloseTo(value(hs, t), 12);
    }
  });

  it('grows the next circle in, and morphs smoothly from one recipe to the next', () => {
    const half = harmonicsOf('square', 2.5);
    expect(half[2]!.a).toBeCloseTo((0.5 * 4) / (Math.PI * 5), 12);
    const sq = blend(0, 5, 31);
    const saw = blend(1, 5, 31);
    expect(sq.map((h) => h.n)).toEqual([1, 3, 5, 7, 9]);
    expect(saw.map((h) => h.n)).toEqual([1, 2, 3, 4, 5]);
    const mid = blend(0.5, 5, 31);
    const one = mid.find((h) => h.n === 1)!;
    expect(one.a).toBeCloseTo((4 / Math.PI + 2 / Math.PI) / 2, 12);
  });
});

describe('any closed shape as a sum of circles', () => {
  const ellipse = Array.from({ length: 64 }, (_, j): Complex => {
    const t = (2 * Math.PI * j) / 64;
    return [2 * Math.cos(t), Math.sin(t)];
  });

  it('finds an ellipse is two circles turning opposite ways', () => {
    const terms = transform(ellipse, 8);
    expect(terms[0]!.k).toBe(0);
    expect(Math.hypot(...terms[0]!.c)).toBeCloseTo(0, 9);
    const big = terms.slice(1, 3);
    expect(big.map((t) => t.k).sort()).toEqual([-1, 1]);
    expect(Math.hypot(...big.find((t) => t.k === 1)!.c)).toBeCloseTo(1.5, 9);
    expect(Math.hypot(...big.find((t) => t.k === -1)!.c)).toBeCloseTo(0.5, 9);
    // The rest are nothing.
    for (const t of terms.slice(3)) expect(Math.hypot(...t.c)).toBeCloseTo(0, 9);
  });

  it('redraws the shape at the tip', () => {
    const terms = transform(ellipse, 8);
    for (let j = 0; j < 64; j += 7) {
      const [x, y] = traceAt(terms, (2 * Math.PI * j) / 64);
      expect(x).toBeCloseTo(ellipse[j]![0], 9);
      expect(y).toBeCloseTo(ellipse[j]![1], 9);
    }
  });

  it('draws the ambulance closely with about a hundred circles', () => {
    const pts = resample(ambulance(), 512);
    // Evenly spaced round the outline.
    const gaps = pts.map((p, i) => Math.hypot(p[0] - pts[(i + 1) % 512]![0], p[1] - pts[(i + 1) % 512]![1]));
    expect(Math.max(...gaps) / Math.min(...gaps)).toBeLessThan(1.6);
    const terms = transform(pts, 50);
    expect(terms).toHaveLength(101);
    let err = 0;
    for (let j = 0; j < 512; j += 4) {
      const [x, y] = traceAt(terms, (2 * Math.PI * j) / 512);
      err += Math.hypot(x - pts[j]![0], y - pts[j]![1]);
    }
    expect(err / 128).toBeLessThan(0.03);
    // A handful of circles gives only a blob; more circles, a closer drawing.
    const rough = (n: number) => {
      let e = 0;
      for (let j = 0; j < 512; j += 8) {
        const [x, y] = traceAt(terms, (2 * Math.PI * j) / 512, n);
        e += Math.hypot(x - pts[j]![0], y - pts[j]![1]);
      }
      return e / 64;
    };
    expect(rough(4)).toBeGreaterThan(rough(20));
    expect(rough(20)).toBeGreaterThan(rough(100));
    expect(epicycles(terms, 0, 10)).toHaveLength(10);
  });
});
