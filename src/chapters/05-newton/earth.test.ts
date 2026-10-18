import { describe, expect, it } from 'vitest';
import { isLand, placeOnTop, surface, WOOLSTHORPE } from './earth';

const apply = (m: number[], v: number[]) =>
  [0, 1, 2].map((r) => m[r * 3]! * v[0]! + m[r * 3 + 1]! * v[1]! + m[r * 3 + 2]! * v[2]!);
/** The determinant of a row-major 3 × 3 matrix. */
const det = (m: number[]) => {
  const at = (i: number) => m[i]!;
  return (
    at(0) * (at(4) * at(8) - at(5) * at(7)) -
    at(1) * (at(3) * at(8) - at(5) * at(6)) +
    at(2) * (at(3) * at(7) - at(4) * at(6))
  );
};

describe("the planet's map", () => {
  it('has land and sea where the Earth does', () => {
    expect(isLand(WOOLSTHORPE.lat, WOOLSTHORPE.lon)).toBe(true);
    // Paris, Cairo, Chicago, Sydney, the South Pole.
    for (const [lat, lon] of [
      [48.86, 2.35],
      [30.04, 31.24],
      [41.88, -87.63],
      [-33.87, 151.2],
      [-89, 0],
    ]) {
      expect(isLand(lat!, lon!)).toBe(true);
    }
    // The middle of the Atlantic, the Pacific and the Indian Ocean.
    for (const [lat, lon] of [
      [30, -40],
      [0, -150],
      [-20, 75],
    ]) {
      expect(isLand(lat!, lon!)).toBe(false);
    }
  });

  it('turns the globe so Woolsthorpe is on top, its east along +x and its north away from the viewer', () => {
    const m = placeOnTop(WOOLSTHORPE.lat, WOOLSTHORPE.lon);
    const top = apply(m, surface(WOOLSTHORPE.lat, WOOLSTHORPE.lon));
    expect(top[0]).toBeCloseTo(0, 9);
    expect(top[1]).toBeCloseTo(1, 9);
    expect(top[2]).toBeCloseTo(0, 9);
    // A little east of it is a little towards +x; a little north is a little towards −z.
    const east = apply(m, surface(WOOLSTHORPE.lat, WOOLSTHORPE.lon + 1));
    const north = apply(m, surface(WOOLSTHORPE.lat + 1, WOOLSTHORPE.lon));
    expect(east[0]).toBeGreaterThan(0.01);
    expect(Math.abs(east[2]!)).toBeLessThan(1e-3);
    expect(north[2]).toBeLessThan(-0.01);
    // A rotation, not a reflection.
    expect(det(m)).toBeCloseTo(1, 9);
  });
});
