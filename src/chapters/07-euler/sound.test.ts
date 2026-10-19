import { describe, expect, it } from 'vitest';
import { expi } from './math';
import { EULER_DEFAULTS } from './rig';
import { eulerLevels, eulerSample, voiceHz, voicePan, type EulerSoundSample } from './sound';

const at = (theta: number, voice = 1): EulerSoundSample => ({
  voice,
  at: expi(theta),
  sung: theta,
  plane: 1,
  shadows: 0,
  triangle: 0,
  trace: 0,
});

describe("chapter 7's sound", () => {
  it('pans with the real part and pitches with the imaginary part', () => {
    expect(voicePan(1)).toBeCloseTo(0.8, 9);
    expect(voicePan(-1)).toBeCloseTo(-0.8, 9);
    expect(voiceHz(0)).toBeCloseTo(330, 9);
    expect(voiceHz(1)).toBeCloseTo(330 * Math.SQRT2, 9);
    expect(voiceHz(-1)).toBeCloseTo(330 / Math.SQRT2, 9);
  });

  it('sings while the point goes round: right at 1, high at i, left at −1, low at −i', () => {
    const dt = 1 / 60;
    const l = (t: number) => eulerLevels(at(t - 0.02), at(t), dt);
    expect(l(0).voice).toBeGreaterThan(0.5);
    expect(l(0).voicePan).toBeGreaterThan(0.7);
    expect(l(Math.PI / 2).voiceHz).toBeGreaterThan(450);
    expect(l(Math.PI).voicePan).toBeLessThan(-0.7);
    expect(l(-Math.PI / 2).voiceHz).toBeLessThan(250);
  });

  it('falls quiet when the point is held still, or when it is not asked to sing', () => {
    expect(eulerLevels(at(1), at(1), 1 / 60).voice).toBe(0);
    expect(eulerLevels(at(1, 0), at(1.1, 0), 1 / 60).voice).toBe(0);
  });

  it('sings the head of the shadows while they draw', () => {
    const rig = { ...EULER_DEFAULTS, theta: 4 * Math.PI, shadows: 0.25, voice: 1 };
    expect(eulerSample(rig).sung).toBeCloseTo(Math.PI, 9);
    const a = eulerSample(rig);
    const b = eulerSample({ ...rig, shadows: 0.26 });
    const l = eulerLevels(a, b, 1 / 60);
    expect(l.voice).toBeGreaterThan(0.5);
    expect(l.chalk).toBeGreaterThan(0.5);
  });
});
