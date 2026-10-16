import { describe, expect, it } from 'vitest';
import { C3, PYTHAGOREAN_SCALE, pyth, pythagoreanRatio, sideToFrequency, triangleChord } from './tuning';

describe('Pythagorean tuning', () => {
  it('builds the scale from pure fifths', () => {
    expect(pythagoreanRatio(1)).toBeCloseTo(3 / 2, 12);
    expect(PYTHAGOREAN_SCALE.D).toBeCloseTo(9 / 8, 12);
    expect(PYTHAGOREAN_SCALE.E).toBeCloseTo(81 / 64, 12);
    expect(PYTHAGOREAN_SCALE.F).toBeCloseTo(4 / 3, 12);
    expect(PYTHAGOREAN_SCALE.A).toBeCloseTo(27 / 16, 12);
    expect(PYTHAGOREAN_SCALE.B).toBeCloseTo(243 / 128, 12);
  });

  it('keeps every fifth exactly 3:2', () => {
    expect(pyth('G', 3) / pyth('C', 3)).toBeCloseTo(1.5, 12);
    expect(pyth('D', 4) / pyth('G', 3)).toBeCloseTo(1.5, 12);
    expect(pyth('C', 4)).toBeCloseTo(C3 * 2, 9);
  });

  it('plays the 3-4-5 triangle as a 3:4:5 chord', () => {
    const [g, c, e] = triangleChord();
    expect(c / g).toBeCloseTo(4 / 3, 12);
    expect(e / c).toBeCloseTo(5 / 4, 12);
    expect(sideToFrequency(3) / sideToFrequency(5)).toBeCloseTo(3 / 5, 12);
    expect(sideToFrequency(4)).toBeCloseTo(C3 * 2, 9);
  });
});
