import { describe, expect, it } from 'vitest';
import { beatAt, cuesBetween, readingTime } from './builder';
import { buildJourney } from './journey';
import { runtime } from '../engine/runtime';
import { pythagorasRig } from '../chapters/01-pythagoras/rig';

describe('the journey timeline', () => {
  const journey = buildJourney();

  it('labels every beat of chapter 1 in story order', () => {
    const keys = journey.beats.map((b) => b.key);
    expect(keys).toEqual([
      'pythagoras:title',
      'pythagoras:draw',
      'pythagoras:squares',
      'pythagoras:pour',
      'pythagoras:brim',
      'pythagoras:rearrangeA',
      'pythagoras:rearrangeB',
      'pythagoras:formula',
      'pythagoras:yourTurn',
      'pythagoras:handoff',
      'pythagoras:slices',
      'circle-area:flight',
      'circle-area:soon',
    ]);
    for (const b of journey.beats) expect(journey.master.labels[b.key]).toBeCloseTo(b.start, 6);
  });

  it('gives every caption enough time to be read', () => {
    for (const b of journey.beats) {
      if (b.kind === 'yourTurn' || b.kind === 'flight') continue;
      expect(b.end - b.start + 1e-6).toBeGreaterThanOrEqual(readingTime(b));
    }
  });

  it('runs chapter 1 for roughly 75–110 seconds', () => {
    const ch1 = journey.chapters.find((c) => c.slug === 'pythagoras')!;
    const len = ch1.end - ch1.start;
    expect(len).toBeGreaterThan(75);
    expect(len).toBeLessThan(110);
  });

  it('pauses once, inside the Your-turn beat', () => {
    const paused = journey.beats.filter((b) => b.pauseAt !== undefined);
    expect(paused.map((b) => b.id)).toEqual(['yourTurn']);
    const b = paused[0]!;
    expect(b.pauseAt!).toBeGreaterThan(b.start);
    expect(b.pauseAt!).toBeLessThan(b.end);
  });

  it('keeps cues sorted and inside the timeline', () => {
    const times = journey.cues.map((c) => c.time);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(times[0]).toBeGreaterThanOrEqual(0);
    expect(times[times.length - 1]).toBeLessThanOrEqual(journey.duration);
    expect(journey.cues.filter((c) => c.id === 'clack')).toHaveLength(7);
  });

  it('finds the beat at a time and the cues crossed between two times', () => {
    const draw = journey.beats[1]!;
    expect(beatAt(journey.beats, draw.start + 0.5)?.id).toBe('draw');
    expect(beatAt(journey.beats, 0)?.id).toBe('title');
    const crossed = cuesBetween(journey.cues, draw.start, draw.end);
    expect(crossed.some((c) => c.id === 'tick')).toBe(true);
    expect(cuesBetween(journey.cues, draw.end, draw.start)).toEqual([]);
  });

  it('is deterministic under seeking: jumping back and forth lands on the same rig state', () => {
    const { master } = journey;
    const rig = pythagorasRig();
    const t = journey.beats.find((b) => b.id === 'rearrangeB')!.start + 2;
    master.seek(t, false);
    const state = () =>
      JSON.stringify({ rig, cam: runtime.camera }, (k, v) => (k === '_gsap' ? undefined : v));
    const snap = state();
    master.seek(0, false);
    master.seek(journey.duration - 0.1, false);
    master.seek(t, false);
    expect(state()).toBe(snap);
    // Drawing finished and both small tanks poured by then.
    expect(rig.draw).toBe(3);
    expect(rig.pourA).toBe(1);
    expect(rig.pourB).toBe(1);
  });
});
