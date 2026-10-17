import { describe, expect, it } from 'vitest';
import { newtonLevels, type NewtonSoundSample } from './sound';

describe("the cannonball's whistle", () => {
  const at = (fly: number, speed: number, song = 1): NewtonSoundSample => ({ song, speed, fly, curve: 0 });

  it('whistles while the ball flies, higher the faster it goes', () => {
    const slow = newtonLevels(at(1, 0.5), at(1.02, 0.5), 1 / 30);
    const fast = newtonLevels(at(1, 1.2), at(1.02, 1.2), 1 / 30);
    expect(slow.voice).toBeGreaterThan(0);
    expect(fast.voiceHz!).toBeGreaterThan(slow.voiceHz! * 3);
  });

  it('falls silent when the ball stops (the journey is paused) or has landed', () => {
    expect(newtonLevels(at(1, 1), at(1, 1), 1 / 30).voice).toBe(0);
    expect(newtonLevels(at(1, 1, 0), at(1.02, 1, 0), 1 / 30).voice).toBe(0);
  });
});
