import { describe as group, expect, it } from 'vitest';
import {
  circularSpeed,
  conic,
  describe,
  energyAt,
  escapeSpeed,
  fallAt,
  fire,
  flightAt,
  fromKms,
  kms,
  LAUNCH_R,
  moonTest,
} from './math';

group("Newton's cannon", () => {
  it('needs 7.1 km/s to circle from the top of a 1,600 km mountain, and 10 km/s to escape', () => {
    expect(kms(circularSpeed(LAUNCH_R))).toBeCloseTo(7.07, 2);
    expect(kms(escapeSpeed(LAUNCH_R))).toBeCloseTo(10.0, 2);
  });

  it('lands farther round the planet the faster it is fired', () => {
    const ranges = [1, 2, 4, 6, 6.3, 6.5].map((v) => fire(fromKms(v)));
    for (const f of ranges) expect(f.outcome).toBe('lands');
    for (let i = 1; i < ranges.length; i++) expect(ranges[i]!.range).toBeGreaterThan(ranges[i - 1]!.range);
    expect(describe(ranges[2]!).rangeKm).toBeGreaterThan(3000);
    expect(describe(ranges[2]!).rangeKm).toBeLessThan(3250);
    // It lands on the ground.
    const last = flightAt(ranges[2]!, Infinity);
    expect(Math.hypot(last.x, last.y)).toBeCloseTo(1, 6);
  });

  it('circles at the right speed: never closer, never farther, once every two hours', () => {
    const f = fire(circularSpeed(LAUNCH_R));
    expect(f.outcome).toBe('orbits');
    for (let i = 0; i < f.t.length; i++) expect(Math.hypot(f.x[i]!, f.y[i]!)).toBeCloseTo(LAUNCH_R, 5);
    const d = describe(f);
    expect(d.circle).toBe(true);
    expect(d.minutes).toBeCloseTo(118.0, 1);
    // It comes back round to where it started.
    const end = flightAt(f, f.duration - 1e-9);
    expect(end.x).toBeCloseTo(0, 4);
    expect(end.y).toBeCloseTo(LAUNCH_R, 4);
  });

  it('keeps its energy all the way along every kind of flight', () => {
    for (const v of [3, 7.3, 9, 11]) {
      const f = fire(fromKms(v));
      const e0 = energyAt(flightAt(f, 0));
      for (let k = 1; k <= 20; k++) {
        const e = energyAt(flightAt(f, (f.duration * k) / 20 - 1e-9));
        expect(Math.abs((e - e0) / e0)).toBeLessThan(1e-4);
      }
    }
  });

  it("fired faster still, swings out on Kepler's ellipse with the planet's centre at a focus, sweeping equal areas", () => {
    const f = fire(fromKms(8));
    expect(f.outcome).toBe('orbits');
    const c = conic(f.v, 0);
    expect(f.e).toBeCloseTo(c.e, 12);
    expect(f.apo).toBeCloseTo(c.a * (1 + c.e), 4);
    expect(f.period).toBeCloseTo(2 * Math.PI * Math.pow(c.a, 1.5), 9);
    // First law: the distances to the centre and to the empty focus (2ae below it) add up to 2a.
    for (let i = 0; i < f.t.length; i += 37) {
      const x = f.x[i]!;
      const y = f.y[i]!;
      expect(Math.hypot(x, y) + Math.hypot(x, y + 2 * c.a * c.e)).toBeCloseTo(2 * c.a, 4);
    }
    // Second law: the line from the centre sweeps area at a steady rate (r × v stays the same).
    const h0 = f.x[0]! * f.vy[0]! - f.y[0]! * f.vx[0]!;
    for (let i = 0; i < f.t.length; i += 37) {
      expect(f.x[i]! * f.vy[i]! - f.y[i]! * f.vx[i]!).toBeCloseTo(h0, 6);
    }
    expect(describe(f).highKm).toBeGreaterThan(7000);
  });

  it('escapes for good at escape speed and above, and only then', () => {
    expect(fire(escapeSpeed(LAUNCH_R) * 0.995).outcome).toBe('orbits');
    expect(fire(escapeSpeed(LAUNCH_R) * 1.005).outcome).toBe('escapes');
    expect(fire(fromKms(12)).outcome).toBe('escapes');
  });

  it('can be aimed upwards, and still lands if it is too slow', () => {
    const up = fire(fromKms(5), (30 * Math.PI) / 180);
    expect(up.outcome).toBe('lands');
    expect(up.apo).toBeGreaterThan(LAUNCH_R);
  });
});

group("Newton's Moon test", () => {
  const m = moonTest();

  it('has the Moon falling 1.36 mm in a second, and an apple 4.9 m', () => {
    expect(m.moonFall * 1000).toBeCloseTo(1.36, 2);
    expect(m.appleFall).toBeCloseTo(4.9, 1);
  });

  it('finds the apple falls 3,600 times as far, which is the Moon’s distance (60 Earth radii) squared', () => {
    expect(m.distance).toBeCloseTo(60.3, 1);
    expect(Math.abs(m.ratio / 3600 - 1)).toBeLessThan(0.01);
    expect(Math.abs(m.ratio / m.square - 1)).toBeLessThan(0.015);
  });

  it('drops the strobe apple 1, 3, 5, 7… times as far in each flash', () => {
    const gaps = [1, 2, 3, 4, 5].map((k) => fallAt(k) - fallAt(k - 1));
    expect(gaps).toEqual([1, 3, 5, 7, 9]);
  });
});
