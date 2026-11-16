import { describe, expect, it } from 'vitest';
import { RunTracker } from './run';

const DURATION = 1320;

/** Plays `seconds` through chapters `from`…`to`, in steps like the ticker's. */
function play(run: RunTracker, seconds: number, chapters: number[]) {
  const per = seconds / chapters.length;
  for (const n of chapters) {
    run.reach(n);
    for (let t = 0; t < per; t += 1 / 60) run.played(Math.min(1 / 60, per - t));
  }
}

const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

describe('RunTracker (finished-one-go)', () => {
  it('qualifies a run watched from chapter I to the end', () => {
    const run = new RunTracker(DURATION, true);
    play(run, DURATION, ALL);
    run.end();
    expect(run.qualifies()).toBe(true);
  });

  it('does not qualify a run that started from a chapters-menu jump', () => {
    const run = new RunTracker(DURATION, false);
    play(run, DURATION, ALL);
    run.end();
    expect(run.qualifies()).toBe(false);
  });

  it('does not qualify a run that skipped a chapter', () => {
    const run = new RunTracker(DURATION, true);
    play(
      run,
      DURATION,
      ALL.filter((n) => n !== 6),
    );
    run.end();
    expect(run.qualifies()).toBe(false);
  });

  it('does not qualify a run that stepped through, playing under 80% of the runtime', () => {
    const run = new RunTracker(DURATION, true);
    play(run, DURATION * 0.75, ALL);
    run.end();
    expect(run.qualifies()).toBe(false);
  });

  it('does not qualify before the end is reached', () => {
    const run = new RunTracker(DURATION, true);
    play(run, DURATION, ALL);
    expect(run.qualifies()).toBe(false);
  });

  it('still qualifies after tabbing away: time away adds nothing, but takes nothing either', () => {
    const run = new RunTracker(DURATION, true);
    play(run, DURATION * 0.5, ALL.slice(0, 5));
    // Tabbed away: the ticker stops, so nothing is played (and no chapter is reached) until the viewer returns.
    play(run, DURATION * 0.5, ALL.slice(5));
    run.end();
    expect(run.qualifies()).toBe(true);
  });
});
