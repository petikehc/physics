import { describe, expect, it } from 'vitest';
import { calculusLevels, heightHz, type CalculusSoundSample } from './sound';

const quiet: CalculusSoundSample = {
  sing: 0,
  hz: 300,
  curve: 0,
  areaCurve: 0,
  vector: 0,
  grow: 0,
  round: 0,
};

describe("chapter 6's sound", () => {
  it('sings a height an octave higher for every 1.5 up', () => {
    expect(heightHz(0)).toBeCloseTo(196, 9);
    expect(heightHz(1.5)).toBeCloseTo(392, 9);
    expect(heightHz(3)).toBeCloseTo(784, 9);
  });

  it('is quiet when nothing sings, grows or is drawn', () => {
    const l = calculusLevels(quiet, quiet, 1 / 60);
    expect(l.voice).toBe(0);
    expect(l.chalk).toBe(0);
  });

  it("sings the curve's height while asked to", () => {
    const l = calculusLevels(quiet, { ...quiet, sing: 1, hz: 440 }, 1 / 60);
    expect(l.voice).toBeGreaterThan(0.5);
    expect(l.voiceHz).toBe(440);
  });

  it('hums higher as the point grows, and only while it moves', () => {
    const a = { ...quiet, vector: 1, grow: 0.2 };
    const b = { ...a, grow: 0.21 };
    const c = { ...a, grow: 0.8 };
    const d = { ...a, grow: 0.81 };
    expect(calculusLevels(a, b, 1 / 60).voice).toBeGreaterThan(0.5);
    expect(calculusLevels(c, d, 1 / 60).voiceHz).toBeGreaterThan(calculusLevels(a, b, 1 / 60).voiceHz!);
    expect(calculusLevels(b, b, 1 / 60).voice).toBe(0);
  });

  it('scratches the chalk while a line is drawn', () => {
    expect(calculusLevels(quiet, { ...quiet, curve: 0.02 }, 1 / 60).chalk).toBeGreaterThan(0.5);
  });
});
