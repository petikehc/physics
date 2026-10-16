import { describe, expect, it } from 'vitest';
import {
  childPoses,
  discPoses,
  estimateError,
  ringRadii,
  ringsArea,
  rowPoses,
  rowSize,
  sectorAngle,
  straightEstimate,
  triangleBars,
  wedgeCorners,
  type V2,
} from './math';

const close = (a: V2, b: V2, eps = 1e-9) => Math.hypot(a[0] - b[0], a[1] - b[1]) < eps;

describe('slicing the disc', () => {
  it('cuts the disc into wedges that cover every direction exactly once', () => {
    const n = 8;
    const poses = discPoses(n);
    const th = sectorAngle(n);
    poses.forEach((p, j) => expect(p.rot + Math.PI / 2).toBeCloseTo((j + 0.5) * th, 12));
    // Neighbouring wedges in the disc share an edge: the CCW end of one is the CW end of the next.
    for (let j = 0; j < n; j++) {
      const [, ccwEnd] = wedgeCorners(poses[j]!, n, 1);
      const [, , cwEndNext] = wedgeCorners(poses[(j + 1) % n]!, n, 1);
      expect(close(ccwEnd, cwEndNext)).toBe(true);
    }
  });
});

describe('dealing the wedges into a row', () => {
  for (const n of [8, 16, 64, 256]) {
    it(`makes neighbours share a straight side (n = ${n})`, () => {
      const r = 1.4;
      const row = rowPoses(n, r);
      for (let j = 0; j + 1 < n; j++) {
        const a = wedgeCorners(row[j]!, n, r);
        const b = wedgeCorners(row[j + 1]!, n, r);
        // Wedge j's apex is an arc end of wedge j+1 and vice versa: they share the side between them.
        const sharesApexA = close(a[0], b[1]) || close(a[0], b[2]);
        const sharesApexB = close(b[0], a[1]) || close(b[0], a[2]);
        expect(sharesApexA && sharesApexB).toBe(true);
      }
    });
  }

  it('alternates point-down and point-up wedges', () => {
    const row = rowPoses(8, 1);
    row.forEach((p, j) => expect(p.rot).toBeCloseTo(j % 2 === 0 ? 0 : Math.PI, 12));
  });

  it('tends to a πr × r rectangle as the slices get thinner', () => {
    const r = 1.4;
    const fine = rowSize(4096, r);
    expect(fine.width).toBeCloseTo(Math.PI * r, 2);
    expect(fine.height).toBeCloseTo(r, 4);
    expect(fine.bump).toBeLessThan(1e-5);
    expect(rowSize(8, r).bump).toBeGreaterThan(rowSize(64, r).bump);
  });
});

describe('the straight-edged estimate', () => {
  it('is the area of the inscribed polygon and converges to πr²', () => {
    expect(straightEstimate(4, 1)).toBeCloseTo(2, 12); // the inscribed square
    expect(straightEstimate(6, 1)).toBeCloseTo((3 * Math.sqrt(3)) / 2, 12); // the hexagon
    expect(estimateError(8, 1)).toBeCloseTo(0.0997, 3);
    expect(estimateError(256, 2)).toBeLessThan(1e-3);
    let prev = Infinity;
    for (const n of [8, 16, 32, 64, 128, 256]) {
      const e = estimateError(n, 1);
      expect(e).toBeLessThan(prev);
      prev = e;
    }
  });
});

describe('re-slicing', () => {
  it('places each child inside its parent', () => {
    const parents = rowPoses(8, 1);
    const kids = childPoses(8, 16, parents);
    expect(kids).toHaveLength(16);
    const t1 = sectorAngle(8);
    kids.forEach((c, i) => {
      const p = parents[Math.floor(i / 2)]!;
      expect(c.u).toBe(p.u);
      expect(c.v).toBe(p.v);
      expect(Math.abs(c.rot - p.rot)).toBeLessThan(t1 / 2);
    });
    // The two children of a parent together span exactly the parent's arc ends.
    const [, pL, pR] = wedgeCorners(parents[0]!, 8, 1);
    const [, , aR] = wedgeCorners(kids[0]!, 16, 1);
    const [, bL] = wedgeCorners(kids[1]!, 16, 1);
    expect(close(aR, pR)).toBe(true);
    expect(close(bL, pL)).toBe(true);
  });

  it('refuses counts that do not divide', () => {
    expect(() => childPoses(16, 24, rowPoses(16, 1))).toThrow();
  });
});

describe('the onion proof', () => {
  it('rings add up to exactly πr²', () => {
    for (const m of [4, 24, 100]) expect(ringsArea(m, 1.4)).toBeCloseTo(Math.PI * 1.4 * 1.4, 10);
  });

  it('stacks into a triangle of base 2πr and height r, longest ring at the bottom', () => {
    const r = 1.4;
    const bars = triangleBars(24, r);
    const longest = bars[bars.length - 1]!;
    const shortest = bars[0]!;
    expect(longest.length).toBeCloseTo(2 * Math.PI * ringRadii(24, r)[23]!, 12);
    expect(longest.v).toBeLessThan(shortest.v);
    expect(shortest.v - longest.v).toBeCloseTo(r - r / 24, 10);
    // Half base times height.
    expect(0.5 * (2 * Math.PI * r) * r).toBeCloseTo(Math.PI * r * r, 12);
  });
});
