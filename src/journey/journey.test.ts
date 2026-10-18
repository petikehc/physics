import { describe, expect, it } from 'vitest';
import { beatAt, cuesBetween, readingTime } from './builder';
import { buildJourney } from './journey';
import { runtime } from '../engine/runtime';
import { pythagorasRig } from '../chapters/01-pythagoras/rig';
import { circleRig } from '../chapters/02-circle-area/rig';
import { archimedesRig } from '../chapters/03-archimedes/rig';
import { hangState } from '../chapters/03-archimedes/hang';
import { keplerRig } from '../chapters/04-kepler/rig';
import { MARS, STORY } from '../chapters/04-kepler/math';
import { newtonRig, SHOT, STORY_FLIGHTS } from '../chapters/05-newton/rig';
import { calculusRig } from '../chapters/06-calculus/rig';
import { STORY_YS } from '../chapters/06-calculus/math';

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
      'archimedes:title',
      'archimedes:weigh',
      'archimedes:lower',
      'archimedes:push',
      'archimedes:formula',
      'archimedes:eureka',
      'archimedes:float',
      'archimedes:yourTurn',
      'archimedes:handoff',
      'kepler:flight',
      'kepler:title',
      'kepler:circle',
      'kepler:ellipse',
      'kepler:areas',
      'kepler:compare',
      'kepler:formula',
      'kepler:yourTurn',
      'kepler:harmony',
      'kepler:handoff',
      'newton:flight',
      'newton:title',
      'newton:cannon',
      'newton:orbit',
      'newton:laws',
      'newton:moon',
      'newton:shells',
      'newton:formula',
      'newton:ellipse',
      'newton:yourTurn',
      'newton:handoff',
      'calculus:flight',
      'calculus:title',
      'calculus:speed',
      'calculus:columns',
      'calculus:stack',
      'calculus:slope',
      'calculus:match',
      'calculus:formula',
      'calculus:yourTurn',
      'calculus:handoff',
      'euler:flight',
      'euler:soon',
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

  it('runs chapter 3 for roughly 70–120 seconds', () => {
    const ch3 = journey.chapters.find((c) => c.slug === 'archimedes')!;
    const len = ch3.end - ch3.start;
    expect(len).toBeGreaterThan(70);
    expect(len).toBeLessThan(120);
  });

  it('runs chapter 4 for roughly 80–120 seconds', () => {
    const ch4 = journey.chapters.find((c) => c.slug === 'kepler')!;
    const len = ch4.end - ch4.start;
    expect(len).toBeGreaterThan(80);
    expect(len).toBeLessThan(120);
  });

  it('runs chapter 5 for roughly 100–145 seconds', () => {
    const ch5 = journey.chapters.find((c) => c.slug === 'newton')!;
    const len = ch5.end - ch5.start;
    expect(len).toBeGreaterThan(100);
    expect(len).toBeLessThan(145);
  });

  it('runs chapter 6 for roughly 100–145 seconds', () => {
    const ch6 = journey.chapters.find((c) => c.slug === 'calculus')!;
    const len = ch6.end - ch6.start;
    expect(len).toBeGreaterThan(100);
    expect(len).toBeLessThan(145);
  });

  it('pauses once per chapter, inside its Your-turn beat', () => {
    const paused = journey.beats.filter((b) => b.pauseAt !== undefined);
    expect(paused.map((b) => b.key)).toEqual([
      'pythagoras:yourTurn',
      'circle-area:yourTurn',
      'archimedes:yourTurn',
      'kepler:yourTurn',
      'newton:yourTurn',
      'calculus:yourTurn',
    ]);
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
    const ch2 = journey.chapters.find((c) => c.slug === 'circle-area')!;
    const ch6 = journey.chapters.find((c) => c.slug === 'calculus')!;
    const inside = (ch: { start: number; end: number }) => (c: { time: number }) =>
      c.time >= ch.start && c.time <= ch.end;
    expect(journey.cues.filter((c) => c.id === 'double').filter(inside(ch2))).toHaveLength(5);
    // Chapter 6: four columns rise with a note each, then each split climbs a step; eight land on the stair.
    expect(journey.cues.filter((c) => c.id === 'column')).toHaveLength(4);
    expect(journey.cues.filter((c) => c.id === 'step')).toHaveLength(8);
    expect(journey.cues.filter((c) => c.id === 'double').filter(inside(ch6))).toHaveLength(13);
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

  it('runs the crown test deterministically: the crown spills more than the gold bar of the same weight', () => {
    const { master } = journey;
    const rig = archimedesRig();
    const state = () => JSON.stringify(rig, (k, v) => (k === '_gsap' ? undefined : v));
    const beat = (id: string) => journey.beats.find((b) => b.key === `archimedes:${id}`)!;

    // After lowering: the crown is fully under, its whole volume spilled, the scale reads less.
    master.seek(beat('push').start + 0.1, false);
    const crown = hangState(rig);
    expect(crown.isBar).toBe(false);
    expect(crown.submerged).toBe(1);
    expect(rig.spillA).toBe(1);
    expect(Math.round(crown.reading)).toBe(935);

    // After the eureka beat: the bar is under too, and the tank is back to the brim.
    const t = beat('float').start;
    master.seek(t, false);
    const bar = hangState(rig);
    expect(bar.isBar).toBe(true);
    expect(bar.submerged).toBe(1);
    expect(rig.spillB).toBe(1);
    expect(rig.level).toBe(1);
    expect(bar.reading).toBeGreaterThan(crown.reading);

    const snap = state();
    master.seek(0, false);
    master.seek(journey.duration - 0.1, false);
    master.seek(t, false);
    expect(state()).toBe(snap);
  });

  it('rises into space for chapter 4, sweeps the fans in step with Mars, and comes back down on a seek', () => {
    const { master } = journey;
    const rig = keplerRig();
    const world = runtime.world;
    const beat = (id: string) => journey.beats.find((b) => b.key === id)!;
    const state = () => JSON.stringify({ rig, world }, (k, v) => (k === '_gsap' ? undefined : v));

    master.seek(beat('archimedes:handoff').start + 1, false);
    expect(world.space).toBe(0);
    master.seek(beat('kepler:title').start, false);
    expect(world.space).toBe(1);

    // Half-way through the sweep, half the fans are swept and Mars is half a year past perihelion.
    const areas = beat('kepler:areas');
    master.seek(areas.start + 0.8 + 4.5, false);
    expect(rig.swept).toBeCloseTo(STORY.fans / 2, 6);
    expect(rig.phase % 1).toBeCloseTo(0.5, 6);

    // By the dive to Earth the orbit is Mars' own, the other planets and all six pillars are up.
    const t = beat('kepler:handoff').start;
    master.seek(t, false);
    expect(rig.e).toBeCloseTo(MARS.e, 9);
    expect(rig.system).toBe(1);
    expect(rig.pillars).toBe(1);
    const snap = state();
    master.seek(0, false);
    expect(world.space).toBe(0);
    master.seek(journey.duration - 0.1, false);
    master.seek(t, false);
    expect(state()).toBe(snap);
  });

  it("fires Newton's shots in order, lands each where it should, and seeks back to the same state", () => {
    const { master } = journey;
    const rig = newtonRig();
    const beat = (id: string) => journey.beats.find((b) => b.key === `newton:${id}`)!;
    const state = () => JSON.stringify(rig, (k, v) => (k === '_gsap' ? undefined : v));

    // By the end of the cannon beat the third shot has landed; the first two are left as faint paths.
    master.seek(beat('orbit').start - 0.05, false);
    expect(rig.shot).toBe(2);
    expect(rig.fly).toBeCloseTo(STORY_FLIGHTS[2]!.duration, 5);
    expect(rig.ghosts).toBe(1);
    expect(rig.mountain).toBe(1);

    // The orbit goes round twice and a twelfth before the slow look at the forces.
    master.seek(beat('laws').start, false);
    expect(rig.shot).toBe(SHOT.orbit);
    expect(rig.fly / STORY_FLIGHTS[SHOT.orbit]!.period).toBeCloseTo(2 + 1 / 12, 5);

    // The ellipse shot comes back round to the mountain top in its beat.
    const t = beat('ellipse').end - 0.05;
    master.seek(t, false);
    expect(rig.shot).toBe(SHOT.ellipse);
    expect(rig.fly).toBeCloseTo(STORY_FLIGHTS[SHOT.ellipse]!.period, 4);
    expect(rig.kepler).toBe(1);

    const snap = state();
    master.seek(0, false);
    master.seek(journey.duration - 0.1, false);
    expect(rig.curve).toBe(1);
    master.seek(t, false);
    expect(state()).toBe(snap);
  });

  it('builds the area in chapter 6 deterministically: columns, the stair, then the smooth curve', () => {
    const { master } = journey;
    const rig = calculusRig();
    const beat = (id: string) => journey.beats.find((b) => b.key === `calculus:${id}`)!;
    const state = () => JSON.stringify(rig, (k, v) => (k === '_gsap' ? undefined : v));

    // The apple's straight line has become the story's curve, split into 512 columns.
    master.seek(beat('stack').start, false);
    expect(rig.split).toBe(7);
    expect([rig.k0, rig.k1, rig.k2, rig.k3, rig.k4, rig.k5]).toEqual(STORY_YS);
    // Eight columns, all stacked on the area's wall.
    master.seek(beat('slope').start, false);
    expect(rig.split).toBe(1);
    expect(rig.stack).toBe(1);
    // The stair smoothed into the area curve.
    const t = beat('match').start;
    master.seek(t, false);
    expect(rig.split).toBe(7);
    expect(rig.areaCurve).toBe(1);

    const snap = state();
    master.seek(0, false);
    master.seek(journey.duration - 0.1, false);
    expect(rig.turn).toBe(1);
    master.seek(t, false);
    expect(state()).toBe(snap);
  });
});
