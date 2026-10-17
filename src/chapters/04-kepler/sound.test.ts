import { describe, expect, it } from 'vitest';
import { keplerLevels, type KeplerSoundSample } from './sound';

describe("the planet's song", () => {
  const at = (phase: number): KeplerSoundSample => ({ draw: 1, circle: 0, song: 1, e: 0.5, phase });

  it('sings while the planet moves, at a pitch that rises near the Sun', () => {
    const far = keplerLevels(at(0.5), at(0.505), 1 / 30);
    const near = keplerLevels(at(0), at(0.005), 1 / 30);
    expect(far.voice).toBe(1);
    expect(near.voiceHz!).toBeGreaterThan(far.voiceHz! * 4);
  });

  it('falls silent when the planet stops (the journey is paused)', () => {
    expect(keplerLevels(at(0.3), at(0.3), 1 / 30).voice).toBe(0);
  });
});
