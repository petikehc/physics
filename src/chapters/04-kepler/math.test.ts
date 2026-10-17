import { describe, expect, it } from 'vitest';
import {
  bestCircle,
  eccentricAnomaly,
  ellipseArea,
  ellipsePoint,
  fanOutline,
  foci,
  lawThree,
  minorAxis,
  nearestInterval,
  orbitAt,
  PLANETS,
  polygonArea,
  speedRange,
  STORY,
  turnRange,
  turnRate,
} from './math';

describe("Kepler's laws", () => {
  it("solves Kepler's equation", () => {
    for (const e of [0, 0.1, 0.5, 0.9, 0.97]) {
      for (let M = 0; M < Math.PI * 2; M += 0.37) {
        const E = eccentricAnomaly(M, e);
        expect(E - e * Math.sin(E)).toBeCloseTo(M, 12);
      }
    }
  });

  it('puts the planet closest to the Sun at the start of its year and farthest half a year later', () => {
    const { a, e } = STORY;
    const peri = orbitAt(a, e, 0);
    const aph = orbitAt(a, e, 0.5);
    expect(peri.x).toBeCloseTo(a * (1 - e), 9);
    expect(peri.y).toBeCloseTo(0, 9);
    expect(aph.x).toBeCloseTo(-a * (1 + e), 9);
    expect(aph.r).toBeCloseTo(a * (1 + e), 9);
    // The angle keeps counting through every turn.
    expect(orbitAt(a, e, 1.25).angle).toBeGreaterThan(orbitAt(a, e, 0.999).angle);
    expect(orbitAt(a, e, 1).angle).toBeCloseTo(Math.PI * 2, 9);
  });

  it('first law: an ellipse, its two distances to the foci always adding up to 2a', () => {
    const { a, e } = STORY;
    const [f1, f2] = foci(a, e);
    for (let E = 0; E < Math.PI * 2; E += 0.1) {
      const [x, y] = ellipsePoint(a, e, E);
      expect(Math.hypot(x - f1[0], y - f1[1]) + Math.hypot(x - f2[0], y - f2[1])).toBeCloseTo(2 * a, 9);
    }
    // The best circle misses it most at the sides, by a − b.
    expect(bestCircle(a, e).miss).toBeCloseTo(a - minorAxis(a, e), 12);
  });

  it('second law: equal times sweep out equal areas', () => {
    for (const e of [0.093, STORY.e, 0.9]) {
      const n = STORY.fans;
      const target = ellipseArea(STORY.a, e) / n;
      for (let k = 0; k < n; k++) {
        const area = polygonArea(fanOutline(STORY.a, e, k / n, (k + 1) / n, 4000));
        expect(Math.abs(area - target) / target).toBeLessThan(1e-6);
      }
    }
  });

  it('moves fastest near the Sun', () => {
    const { a, e } = STORY;
    const h = 1e-6;
    const speed = (p: number) => {
      const p0 = orbitAt(a, e, p - h);
      const p1 = orbitAt(a, e, p + h);
      return Math.hypot(p1.x - p0.x, p1.y - p0.y) / (2 * h);
    };
    expect(speed(0) / speed(0.5)).toBeCloseTo(speedRange(e), 5);
    expect(turnRate(e, 0)).toBeCloseTo(turnRange(e), 9);
    expect(turnRate(e, 0.5)).toBeCloseTo(1, 9);
  });

  it('third law: a year squared over a distance cubed is the same for all six planets', () => {
    for (const p of PLANETS) expect(Math.abs(lawThree(p) - 1)).toBeLessThan(0.002);
  });

  it("hears each planet's range of speeds as the interval Kepler gave it in 1619", () => {
    const heard = Object.fromEntries(PLANETS.map((p) => [p.id, nearestInterval(turnRange(p.e)).name]));
    expect(heard).toEqual({
      mercury: 'octave and a minor third',
      venus: 'diesis',
      earth: 'semitone',
      mars: 'fifth',
      jupiter: 'minor third',
      saturn: 'major third',
    });
  });

  it("names Kepler's interval only when the swing is close to one", async () => {
    const { orbitFacts } = await import('./interaction');
    expect(orbitFacts(0.0934).interval?.name).toBe('fifth');
    // The story's stretched orbit swings through over three octaves: no named interval is that wide.
    const story = orbitFacts(STORY.e);
    // 3× faster and 3× closer at its nearest, so it turns 9× faster.
    expect(story.speed).toBeCloseTo(3, 9);
    expect(story.turn).toBeCloseTo(9, 9);
    expect(story.interval).toBeNull();
    expect(story.octaves).toBeCloseTo(Math.log2(9), 9);
    expect(orbitFacts(0).circle).toBe(true);
  });
});
