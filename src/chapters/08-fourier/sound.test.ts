import { describe, expect, it } from 'vitest';
import { harmonicsOf } from './math';
import { FOURIER_DEFAULTS } from './rig';
import { fourierLevels, fourierSample, harmonicLevels } from './sound';

describe("chapter 8's sound", () => {
  it('sounds each circle as a harmonic, as loud as it is big next to the first', () => {
    const square = harmonicLevels(harmonicsOf('square', 4), 1);
    expect(square[0]).toBeCloseTo(1, 12);
    expect(square[1]).toBe(0);
    expect(square[2]).toBeCloseTo(1 / 3, 12);
    expect(square[6]).toBeCloseTo(1 / 7, 12);
    const saw = harmonicLevels(harmonicsOf('sawtooth', 4), 0.5);
    expect(saw.slice(0, 4)).toEqual([0.5, 0.25, 0.5 / 3, 0.125]);
    // Harmonics past the sixteenth are left out.
    expect(harmonicLevels(harmonicsOf('square', 16), 1)).toHaveLength(16);
  });

  it('is silent until asked to sing, and scratches chalk while lines draw', () => {
    const quiet = fourierSample({ ...FOURIER_DEFAULTS });
    const l = fourierLevels(quiet, quiet, 1 / 60);
    expect(l.harmonics!.every((a) => a === 0)).toBe(true);
    expect(l.chalk).toBe(0);
    const singing = fourierSample({ ...FOURIER_DEFAULTS, sing: 1, count: 3 });
    expect(fourierLevels(singing, singing, 1 / 60).harmonics![4]).toBeCloseTo(1 / 5, 12);
    const drawn = fourierSample({ ...FOURIER_DEFAULTS, stage: 0.5 });
    expect(fourierLevels(quiet, drawn, 1 / 60).chalk).toBeGreaterThan(0.5);
  });
});
