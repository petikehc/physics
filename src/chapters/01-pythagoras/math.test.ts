import { describe, expect, it } from 'vitest';
import {
  angleDelta,
  hypotenuse,
  isPythagoreanTriple,
  lawOfCosines,
  perimeterPoint,
  pointInTriangle,
  polygonArea,
  pourLevels,
  squaresOn,
  tileCorners,
  tileLayouts,
  triangle,
  type V2,
} from './math';

/** Fraction of grid sample points inside [0,s]² covered by 0, 1 or 2+ tiles. */
function coverage(a: number, b: number, poses: ReturnType<typeof tileLayouts>['A']) {
  const s = a + b;
  const n = 280;
  let empty = 0;
  let overlap = 0;
  const tiles = poses.map((p) => tileCorners(a, b, p));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const p: V2 = [((i + 0.5) / n) * s, ((j + 0.5) / n) * s];
      const hits = tiles.filter((t) => pointInTriangle(p, t)).length;
      if (hits === 0) empty++;
      if (hits > 1) overlap++;
    }
  }
  const cell = (s / n) ** 2;
  return { emptyArea: empty * cell, overlapArea: overlap * cell };
}

describe('triangle basics', () => {
  it('computes the hypotenuse', () => {
    expect(hypotenuse(3, 4)).toBe(5);
    expect(hypotenuse(5, 12)).toBe(13);
  });

  it('law of cosines reduces to Pythagoras at 90°', () => {
    for (const [a, b] of [
      [3, 4],
      [1.5, 7.25],
      [8, 15],
    ] as const) {
      expect(lawOfCosines(a, b, 90)).toBeCloseTo(Math.hypot(a, b), 10);
    }
    expect(lawOfCosines(3, 4, 60)).toBeLessThan(5);
    expect(lawOfCosines(3, 4, 120)).toBeGreaterThan(5);
  });

  it('builds outward squares whose areas are a², b², c²', () => {
    const t = triangle(3, 4);
    const sq = squaresOn(t);
    expect(polygonArea(sq.a.corners)).toBeCloseTo(9, 10);
    expect(polygonArea(sq.b.corners)).toBeCloseTo(16, 10);
    expect(polygonArea(sq.c.corners)).toBeCloseTo(25, 10);
    // Outward: no square's centre lies inside the triangle.
    for (const s of [sq.a, sq.b, sq.c]) expect(pointInTriangle(s.center, [t.P0, t.P1, t.P2])).toBe(false);
  });

  it('walks the perimeter in drawing order a → c → b', () => {
    const t = triangle(3, 4);
    expect(perimeterPoint(t, 0)).toEqual([0, 0]);
    expect(perimeterPoint(t, 1)).toEqual([3, 0]);
    expect(perimeterPoint(t, 1.5)[0]).toBeCloseTo(1.5);
    expect(perimeterPoint(t, 2)[1]).toBeCloseTo(4);
    expect(perimeterPoint(t, 3)[1]).toBeCloseTo(0);
  });
});

describe('the pour proof', () => {
  it('fills the big tank exactly to the brim for a right triangle', () => {
    for (const [a, b] of [
      [3, 4],
      [1, 1],
      [2.3, 6.1],
    ] as const) {
      const c = hypotenuse(a, b);
      expect(pourLevels(a, b, c, 1, 1).total).toBeCloseTo(1, 12);
      expect(pourLevels(a, b, c, 0, 0).total).toBe(0);
    }
  });

  it('overflows for an acute angle and underfills for an obtuse one', () => {
    const acute = lawOfCosines(3, 4, 70);
    const obtuse = lawOfCosines(3, 4, 110);
    expect(pourLevels(3, 4, acute, 1, 1).total).toBeGreaterThan(1);
    expect(pourLevels(3, 4, obtuse, 1, 1).total).toBeLessThan(1);
  });
});

describe('the rearrangement proof', () => {
  for (const [a, b] of [
    [3, 4],
    [2, 5],
    [4.5, 1.5],
  ] as const) {
    it(`tiles the (a+b)² frame without overlap for a=${a}, b=${b}`, () => {
      const L = tileLayouts(a, b);
      const c2 = a * a + b * b;
      const covA = coverage(a, b, L.A);
      const covB = coverage(a, b, L.B);
      const tol = 0.02 * (a + b) ** 2;
      expect(covA.overlapArea).toBeLessThan(tol * 0.5);
      expect(covB.overlapArea).toBeLessThan(tol * 0.5);
      expect(covA.emptyArea).toBeCloseTo(c2, 0);
      expect(Math.abs(covA.emptyArea - c2)).toBeLessThan(tol);
      expect(Math.abs(covB.emptyArea - c2)).toBeLessThan(tol);
      // The holes are exactly a², b² (layout A) and c² (layout B).
      expect(polygonArea(L.holesA[0]!)).toBeCloseTo(a * a, 10);
      expect(polygonArea(L.holesA[1]!)).toBeCloseTo(b * b, 10);
      expect(polygonArea(L.holeB)).toBeCloseTo(c2, 10);
    });
  }

  it('keeps every tile inside the frame', () => {
    const L = tileLayouts(3, 4);
    for (const pose of [...L.A, ...L.B]) {
      for (const [x, y] of tileCorners(3, 4, pose)) {
        expect(x).toBeGreaterThanOrEqual(-1e-9);
        expect(y).toBeGreaterThanOrEqual(-1e-9);
        expect(x).toBeLessThanOrEqual(L.size + 1e-9);
        expect(y).toBeLessThanOrEqual(L.size + 1e-9);
      }
    }
  });

  it('only slides tiles between layouts (no rotation needed)', () => {
    const L = tileLayouts(3, 4);
    L.A.forEach((p, i) => expect(p.rot).toBeCloseTo(L.B[i]!.rot, 12));
  });
});

describe('triples and angles', () => {
  it('recognises Pythagorean triples', () => {
    expect(isPythagoreanTriple(3, 4, 5)).toBe(true);
    expect(isPythagoreanTriple(5, 12, 13)).toBe(true);
    expect(isPythagoreanTriple(8, 15, 17)).toBe(true);
    expect(isPythagoreanTriple(4, 4, Math.hypot(4, 4))).toBe(false);
    expect(isPythagoreanTriple(2, 3, 4)).toBe(false);
  });

  it('takes the short way round', () => {
    expect(angleDelta(0, (3 * Math.PI) / 2)).toBeCloseTo(-Math.PI / 2);
    expect(angleDelta(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
  });
});
