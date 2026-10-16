import { describe, expect, it } from 'vitest';
import { beatAt, cuesBetween, readingTime } from './builder';
import { buildJourney } from './journey';
import { runtime } from '../engine/runtime';
import { pythagorasRig } from '../chapters/01-pythagoras/rig';
import { circleRig } from '../chapters/02-circle-area/rig';

describe('the journey timeline', () => {
  const journey = buildJourney();

  it('labels every beat in story order', () => {
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
      'circle-area:title',
      'circle-area:slice',
      'circle-area:deal',
      'circle-area:refine',
      'circle-area:rectangle',
      'circle-area:formula',
      'circle-area:onion',
      'circle-area:yourTurn',
      'circle-area:handoff',
      'archimedes:flight',
      'archimedes:soon',
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

  it('runs chapter 2 for roughly 70–110 seconds', () => {
    const ch2 = journey.chapters.find((c) => c.slug === 'circle-area')!;
    const len = ch2.end - ch2.start;
    expect(len).toBeGreaterThan(70);
    expect(len).toBeLessThan(110);
  });

  it('pauses once per chapter, inside its Your-turn beat', () => {
    const paused = journey.beats.filter((b) => b.pauseAt !== undefined);
    expect(paused.map((b) => b.key)).toEqual(['pythagoras:yourTurn', 'circle-area:yourTurn']);
    for (const b of paused) {
      expect(b.pauseAt!).toBeGreaterThan(b.start);
      expect(b.pauseAt!).toBeLessThan(b.end);
    }
  });

  it('keeps cues sorted and inside the timeline', () => {
    const times = journey.cues.map((c) => c.time);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(times[0]).toBeGreaterThanOrEqual(0);
    expect(times[times.length - 1]).toBeLessThanOrEqual(journey.duration);
    expect(journey.cues.filter((c) => c.id === 'clack')).toHaveLength(7);
    expect(journey.cues.filter((c) => c.id === 'cut')).toHaveLength(4);
    expect(journey.cues.filter((c) => c.id === 'double')).toHaveLength(5);
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

  it('re-slices chapter 2 deterministically, ending on 256 pieces in a row', () => {
    const { master } = journey;
    const rig = circleRig();
    const state = () => JSON.stringify(rig, (k, v) => (k === '_gsap' ? undefined : v));
    const at = (id: string, dt: number) =>
      journey.beats.find((b) => b.key === `circle-area:${id}`)!.start + dt;

    master.seek(at('deal', 0.1), false);
    expect(rig.n).toBe(8);
    expect(rig.whole).toBe(0);

    const t = at('rectangle', 1);
    master.seek(t, false);
    const snap = state();
    expect(rig.n).toBe(256);
    expect(rig.fromN).toBe(128);
    expect(rig.deal).toBe(1);
    expect(rig.ghost).toBe(1);
    master.seek(journey.duration - 0.1, false);
    master.seek(0, false);
    master.seek(t, false);
    expect(state()).toBe(snap);
  });

  it('keeps the dust circle above the sand while it stands up, flies to chapter 2 and lies down again', () => {
    const { master } = journey;
    const dust = runtime.dust;
    const from = journey.beats.find((b) => b.key === 'pythagoras:slices')!.start;
    const to = journey.beats.find((b) => b.key === 'circle-area:title')!.end;
    // Worst case over the points, as the Dust shader moves them: each point's morph is staggered by up to
    // STAGGER and smoothstepped, and mid-morph it swirls by up to 0.9·swirl (icon units, before scaling).
    const STAGGER = 0.35;
    const smooth = (x: number) => {
      const m = Math.min(Math.max(x, 0), 1);
      return m * m * (3 - 2 * m);
    };
    let worst = Infinity;
    for (let t = from; t <= to; t += 0.05) {
      master.seek(t, false);
      const k = dust.morph * (1 + STAGGER);
      // How upright the most upright point is (the circle icon has radius 2; lying flat it has no height).
      const upright = dust.to === 'circle' ? smooth(k) : dust.from === 'circle' ? 1 - smooth(k - STAGGER) : 0;
      // Lying flat it rests on its groove; standing at all, its lowest point must clear the sand.
      if (upright < 0.02) continue;
      const swirling = dust.morph > 0 && dust.morph < 1 ? 0.9 * dust.swirl : 0;
      const lowest = dust.y - (upright * 2 + swirling) * dust.scale;
      worst = Math.min(worst, lowest);
      expect(lowest, `at ${t.toFixed(2)} s`).toBeGreaterThan(0.02);
    }
    expect(worst).toBeLessThan(Infinity);
  });
});
