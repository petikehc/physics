import { describe, expect, it } from 'vitest';
import { EngagedClock, MAX_MINUTES } from './engaged';

/** Runs the clock a second at a time, as the interval does, and collects the minutes it reports. */
function run(clock: EngagedClock, seconds: number, engaged: boolean): number[] {
  const out: number[] = [];
  for (let i = 0; i < seconds; i++) out.push(...clock.advance(1, engaged));
  return out;
}

describe('EngagedClock', () => {
  it('reports each minute of engaged time as it completes', () => {
    const clock = new EngagedClock();
    expect(run(clock, 59, true)).toEqual([]);
    expect(run(clock, 1, true)).toEqual([1]);
    expect(run(clock, 120, true)).toEqual([2, 3]);
  });

  it('pauses while the tab is hidden or the journey is paused (not engaged)', () => {
    const clock = new EngagedClock();
    run(clock, 30, true);
    expect(run(clock, 600, false)).toEqual([]);
    expect(run(clock, 30, true)).toEqual([1]);
  });

  it(`stops at ${MAX_MINUTES} minutes`, () => {
    const clock = new EngagedClock();
    const minutes = run(clock, 3600, true);
    expect(minutes).toHaveLength(MAX_MINUTES);
    expect(minutes.at(-1)).toBe(MAX_MINUTES);
    expect(run(clock, 600, true)).toEqual([]);
  });

  it('never reports a minute twice', () => {
    const clock = new EngagedClock();
    const minutes = run(clock, 2000, true);
    expect(new Set(minutes).size).toBe(minutes.length);
  });

  it('caps one long step, so a throttled background timer adds no burst', () => {
    const clock = new EngagedClock();
    expect(clock.advance(600, true)).toEqual([]);
  });
});
