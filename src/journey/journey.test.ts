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
import { eulerRig, TERMS, THETA_MAX } from '../chapters/07-euler/rig';
import { fourierRig } from '../chapters/08-fourier/rig';
import { dopplerRig } from '../chapters/09-doppler/rig';
import { dopplerLevels, SIREN } from '../chapters/09-doppler/sound';

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
      'euler:title',
      'euler:quarters',
      'euler:circle',
      'euler:helix',
      'euler:shadows',
      'euler:triangle',
      'euler:series',
      'euler:identity',
      'euler:formula',
      'euler:yourTurn',
      'euler:handoff',
      'fourier:flight',
      'fourier:title',
      'fourier:one',
      'fourier:build',
      'fourier:spectrum',
      'fourier:shapes',
      'fourier:formula',
      'fourier:yourTurn',
      'fourier:handoff',
      'doppler:flight',
      'doppler:title',
      'doppler:pass',
      'doppler:shells',
      'doppler:formula',
      'doppler:mach',
      'doppler:redshift',
      'doppler:yourTurn',
      'doppler:handoff',
      'energy:flight',
      'energy:soon',
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

  it('runs chapter 7 for roughly 100–145 seconds', () => {
    const ch7 = journey.chapters.find((c) => c.slug === 'euler')!;
    const len = ch7.end - ch7.start;
    expect(len).toBeGreaterThan(100);
    expect(len).toBeLessThan(145);
  });

  it('runs chapter 8 for roughly 90–140 seconds', () => {
    const ch8 = journey.chapters.find((c) => c.slug === 'fourier')!;
    const len = ch8.end - ch8.start;
    expect(len).toBeGreaterThan(90);
    expect(len).toBeLessThan(140);
  });

  it('runs chapter 9 for roughly 100–150 seconds', () => {
    const ch9 = journey.chapters.find((c) => c.slug === 'doppler')!;
    const len = ch9.end - ch9.start;
    expect(len).toBeGreaterThan(100);
    expect(len).toBeLessThan(150);
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
      'euler:yourTurn',
      'fourier:yourTurn',
      'doppler:yourTurn',
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
    // Chapter 7: four quarter turns and the landing on −1; an arrow laid for each of the series' terms.
    expect(journey.cues.filter((c) => c.id === 'quarter')).toHaveLength(5);
    expect(journey.cues.filter((c) => c.id === 'term')).toHaveLength(TERMS);
    // Chapter 8: a chime as each of seven circles arrives, and one for each change of recipe.
    expect(journey.cues.filter((c) => c.id === 'harmonic')).toHaveLength(9);
    expect(journey.cues.filter((c) => c.id === 'siren')).toHaveLength(1);
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

  it("turns chapter 7's point deterministically: round to −1, out into a helix, and home again", () => {
    const { master } = journey;
    const rig = eulerRig();
    const beat = (id: string) => journey.beats.find((b) => b.key === `euler:${id}`)!;
    const state = () => JSON.stringify(rig, (k, v) => (k === '_gsap' ? undefined : v));

    // Four quarter turns bring the arrow home.
    master.seek(beat('circle').start, false);
    expect(rig.quarter).toBe(4);
    // The point has gone half way round, to −1.
    master.seek(beat('helix').start, false);
    expect(rig.theta).toBeCloseTo(Math.PI, 5);
    // Two turns, drawn out along time.
    master.seek(beat('shadows').start, false);
    expect(rig.theta).toBeCloseTo(THETA_MAX, 5);
    expect(rig.along).toBe(1);
    // Back in the plane, and every arrow of the series laid at θ = π.
    const t = beat('identity').start;
    master.seek(t, false);
    expect(rig.along).toBe(0);
    expect(rig.terms).toBe(TERMS);
    expect(rig.theta).toBeCloseTo(Math.PI, 5);

    const snap = state();
    master.seek(0, false);
    master.seek(journey.duration - 0.1, false);
    expect(rig.from).toBeCloseTo(Math.PI, 5);
    master.seek(t, false);
    expect(state()).toBe(snap);
  });

  it("builds chapter 8's clockwork deterministically, turning steadily from beat to beat", () => {
    const { master } = journey;
    const rig = fourierRig();
    const beat = (id: string) => journey.beats.find((b) => b.key === `fourier:${id}`)!;
    const state = () => JSON.stringify(rig, (k, v) => (k === '_gsap' ? undefined : v));

    // One circle, then eight; side on; then back to front, reshaped into a triangle.
    master.seek(beat('build').start, false);
    expect(rig.count).toBe(1);
    master.seek(beat('spectrum').start, false);
    expect(rig.count).toBe(8);
    master.seek(beat('shapes').start, false);
    expect(rig.bars).toBe(1);
    expect(rig.layers).toBe(1);
    const t = beat('formula').start;
    master.seek(t, false);
    expect(rig.shape).toBe(2);
    expect(rig.bars).toBe(0);
    // The clockwork never stops or jumps between beats: time runs on at the same rate.
    const rate = (a: number, b: number) => {
      master.seek(a, false);
      const t0 = rig.t;
      master.seek(b, false);
      return (rig.t - t0) / (b - a);
    };
    const edge = beat('spectrum').start;
    expect(rate(edge - 0.5, edge + 0.5)).toBeCloseTo(0.9, 6);
    expect(rate(beat('one').start + 1, beat('formula').end - 0.1)).toBeCloseTo(0.9, 6);

    master.seek(t, false);
    const snap = state();
    master.seek(0, false);
    master.seek(journey.duration - 0.1, false);
    expect(rig.dt).toBeCloseTo(Math.PI * 2, 6);
    master.seek(t, false);
    expect(state()).toBe(snap);
  });

  it("comes down to chapter 9's street at night, and goes up among the galaxies and back", () => {
    const { master } = journey;
    const world = runtime.world;
    const rig = dopplerRig();
    const beat = (id: string) => journey.beats.find((b) => b.key === `doppler:${id}`)!;
    master.seek(beat('title').start + 0.1, false);
    expect(world.night).toBe(1);
    expect(world.space).toBe(0);
    expect(rig.street).toBe(1);
    master.seek(beat('redshift').end - 0.05, false);
    expect(world.night).toBe(0);
    expect(world.space).toBe(1);
    expect(rig.z).toBeCloseTo(0.1, 6);
    master.seek(beat('yourTurn').end - 0.05, false);
    expect(world.night).toBe(1);
    expect(world.space).toBe(0);
    // Back to the beach (and the night undone) on a seek to the start.
    master.seek(0, false);
    expect(world.night).toBe(0);
    expect(world.space).toBe(0);
  });

  it("drops chapter 9's siren as the ambulance goes by, by (1 + M)/(1 − M)", () => {
    const { master } = journey;
    const rig = dopplerRig();
    const pass = journey.beats.find((b) => b.key === 'doppler:pass')!;
    // Coming: the high tone heard 1/(1 − 0.1) higher; going: 1/(1 + 0.1) lower.
    master.seek(pass.start + 2, false);
    const coming = dopplerLevels(rig).sirenHz!;
    master.seek(pass.start + 9, false);
    const going = dopplerLevels(rig).sirenHz!;
    // Which of the siren's two tones was sent (they are a fourth apart; the shift is much less than that).
    const tone = (hz: number) => (hz > Math.sqrt(SIREN.hi * SIREN.lo) ? SIREN.hi : SIREN.lo);
    expect(coming / tone(coming)).toBeCloseTo(1 / 0.9, 2);
    expect(going / tone(going)).toBeCloseTo(1 / 1.1, 2);
  });

  it("booms when chapter 9's jet's cone reaches the listener under its path, and not before", () => {
    const { master } = journey;
    const rig = dopplerRig();
    const mach = journey.beats.find((b) => b.key === 'doppler:mach')!;
    const boom = journey.cues.find((c) => c.id === 'boom')!;
    expect(boom.time).toBeGreaterThan(mach.start);
    expect(boom.time).toBeLessThan(mach.end);
    master.seek(boom.time - 0.1, false);
    expect(dopplerLevels(rig).roar ?? 0).toBe(0);
    master.seek(boom.time + 0.1, false);
    expect(dopplerLevels(rig).roar ?? 0).toBeGreaterThan(0);
    expect(rig.st).toBeGreaterThan(0);
  });

  it("runs chapter 9's slowed waves deterministically, steadily from beat to beat", () => {
    const { master } = journey;
    const rig = dopplerRig();
    const beat = (id: string) => journey.beats.find((b) => b.key === `doppler:${id}`)!;
    const state = () => JSON.stringify(rig, (k, v) => (k === '_gsap' ? undefined : v));
    const rate = (a: number, b: number) => {
      master.seek(a, false);
      const t0 = rig.st;
      master.seek(b, false);
      return (rig.st - t0) / (b - a);
    };
    expect(rate(beat('shells').start + 0.5, beat('shells').end - 0.5)).toBeCloseTo(1, 6);
    const edge = beat('formula').start;
    expect(rate(edge + 0.1, edge + 2)).toBeCloseTo(0.3, 6);
    const t = beat('formula').start + 1;
    master.seek(t, false);
    const snap = state();
    master.seek(0, false);
    master.seek(journey.duration - 0.1, false);
    master.seek(t, false);
    expect(state()).toBe(snap);
  });
});
