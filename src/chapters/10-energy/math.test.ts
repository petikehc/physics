import { describe, expect, it } from 'vitest';
import {
  buildTrack,
  G,
  heightAt,
  highest,
  lowest,
  rideAt,
  sAtX,
  simulate,
  speedAt,
  timeAt,
  trackAt,
  type RideSample,
  type V3,
} from './math';

/** A valley: let go at 15 m on the left, a 20 m hill on the right. */
const valley = buildTrack([
  [-22, 15, 0],
  [-12, 7, 0],
  [0, 0.5, 0],
  [12, 9, 0],
  [22, 20, 0],
]);

/** A loop of radius 6 round (0, 7), entered going along +x at the bottom, leaving 2 m to the side. */
const loopPts: V3[] = [[-12, 1, 0]];
for (let k = 0; k <= 16; k++) {
  const a = -Math.PI / 2 + (k / 16) * Math.PI * 2;
  loopPts.push([6 * Math.cos(a), 7 + 6 * Math.sin(a), (-2 * k) / 16]);
}
loopPts.push([12, 1, -2]);
const loop = buildTrack(loopPts);

const total = (r: RideSample) => r.pe + r.ke + r.heat - r.work;
/** How far the energy account strays from where it started, as a fraction of the most energy in play. */
const drift = (ride: RideSample[]) => {
  const e0 = total(ride[0]!);
  const most = Math.max(...ride.map((r) => Math.max(r.pe + r.ke, r.work, r.heat)));
  return Math.max(...ride.map((r) => Math.abs(total(r) - e0))) / Math.max(most, 1e-9);
};

describe('a track', () => {
  it('is sampled evenly along its length and passes through its control points', () => {
    for (let i = 1; i < valley.pts.length; i++) {
      const [a, b] = [valley.pts[i - 1]!, valley.pts[i]!];
      expect(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])).toBeCloseTo(valley.step, 2);
    }
    for (const c of [
      [-12, 7],
      [0, 0.5],
      [12, 9],
    ]) {
      const near = Math.min(...valley.pts.map((p) => Math.hypot(p[0] - c[0]!, p[1] - c[1]!)));
      // Within half a sample of it.
      expect(near).toBeLessThan(valley.step / 2 + 0.01);
    }
    expect(heightAt(valley, 0)).toBeCloseTo(15, 6);
    expect(heightAt(valley, valley.length)).toBeCloseTo(20, 6);
    expect(lowest(valley)).toBeCloseTo(0.5, 1);
  });

  it("knows which way is up for a rider: out of the track, towards a loop's centre at its top", () => {
    const bottom = trackAt(valley, sAtX(valley, 0));
    expect(bottom.up[1]).toBeGreaterThan(0.99);
    // At the top of the loop the rider is upside down, their head towards the centre below.
    let top = 0;
    loop.pts.forEach((p, i) => {
      if (p[1] > loop.pts[top]![1]) top = i;
    });
    expect(loop.pts[top]![1]).toBeCloseTo(13, 1);
    expect(loop.up[top]![1]).toBeLessThan(-0.99);
    expect(loop.tan[top]![0]).toBeLessThan(-0.99);
    for (let i = 0; i < loop.pts.length; i += 7) {
      const t = loop.tan[i]!;
      const u = loop.up[i]!;
      expect(Math.abs(t[0] * u[0] + t[1] * u[1] + t[2] * u[2])).toBeLessThan(1e-9);
    }
  });
});

describe('a ride, energy kept account of', () => {
  it('without friction, climbs back to the height it was let go from, and no higher', () => {
    const ride = simulate(valley, { s0: 0, v0: 0, mu: 0, duration: 30 });
    expect(drift(ride)).toBeLessThan(1e-3);
    // Facing a 20 m hill, it stops at 15 m and rolls back; again and again.
    const peak = Math.max(...ride.filter((r) => r.t > 2).map((r) => heightAt(valley, r.s)));
    expect(peak).toBeCloseTo(15, 1);
    expect(peak).toBeLessThan(20);
    expect(Math.min(...ride.map((r) => r.v))).toBeLessThan(-5);
    // At the bottom, all of its height has turned into speed: v = √(2gΔh).
    const s0 = sAtX(valley, 0);
    const at = ride.find((r) => Math.abs(r.s - s0) < 0.2 && r.v > 0)!;
    expect(at.v).toBeCloseTo(speedAt(15, 0, heightAt(valley, at.s))!, 1);
  });

  it('with friction, keeps every joule: the heat is exactly what the height and speed lost', () => {
    const ride = simulate(valley, { s0: 0, v0: 0, mu: 0.05, duration: 60 });
    expect(drift(ride)).toBeLessThan(1e-3);
    const end = ride[ride.length - 1]!;
    expect(end.v).toBe(0);
    expect(end.ke).toBe(0);
    expect(end.heat).toBeGreaterThan(0.5 * ride[0]!.pe);
    // Each swing climbs less high than the last.
    const peaks: number[] = [];
    for (let i = 1; i < ride.length - 1; i++)
      if (ride[i - 1]!.v > 0 && ride[i]!.v <= 0) peaks.push(heightAt(valley, ride[i]!.s));
    expect(peaks.length).toBeGreaterThan(1);
    for (let i = 1; i < peaks.length; i++) expect(peaks[i]!).toBeLessThan(peaks[i - 1]!);
  });

  it("gets its energy from the chain: the lift's work is the height it gives plus friction's heat", () => {
    const hill = buildTrack([
      [0, 1, 0],
      [8, 1, 0],
      [20, 13, 0],
      [26, 15, 0],
      [34, 9, 0],
      [44, 1, 0],
      [70, 1, 0],
    ]);
    const crest = sAtX(hill, 26);
    const ride = simulate(hill, {
      s0: 1,
      v0: 0,
      mu: 0.02,
      duration: 40,
      lift: { from: 0, to: crest, speed: 3 },
      brakes: { from: sAtX(hill, 50), mu: 0.8 },
    });
    expect(drift(ride)).toBeLessThan(1e-3);
    const top = rideAt(ride, timeAt(ride, crest)!);
    expect(top.v).toBeCloseTo(3, 1);
    // (It started a little above the track's lowest point, which height is counted from.)
    const start = ride[0]!.pe;
    expect(top.work).toBeCloseTo(top.pe + top.ke + top.heat - start, 1);
    // Down the far side the train goes fast, then the brakes stop it short of the end, all its energy now heat.
    expect(Math.max(...ride.map((r) => r.v))).toBeGreaterThan(14);
    const end = ride[ride.length - 1]!;
    expect(end.v).toBe(0);
    expect(end.s).toBeLessThan(hill.length);
    expect(end.heat + end.pe).toBeCloseTo(end.work + start, 0);
  });

  it('goes round a loop, slower at the top, as fast again at the bottom', () => {
    const ride = simulate(loop, { s0: 0, v0: 18, mu: 0, duration: 4 });
    expect(drift(ride)).toBeLessThan(1e-3);
    const top = ride.reduce((a, r) => (heightAt(loop, r.s) > heightAt(loop, a.s) ? r : a));
    expect(heightAt(loop, top.s)).toBeCloseTo(13, 1);
    expect(top.v).toBeCloseTo(speedAt(1, 18, heightAt(loop, top.s))!, 2);
    expect(ride[ride.length - 1]!.s).toBeGreaterThan(loop.length * 0.9);
  });

  it('stops dead at the buffers, its speed turned into heat', () => {
    const flat = buildTrack([
      [0, 1, 0],
      [10, 1, 0],
      [20, 1, 0],
    ]);
    const ride = simulate(flat, { s0: 15, v0: 5, mu: 0, duration: 2 });
    const end = ride[ride.length - 1]!;
    expect(end.s).toBe(flat.length);
    expect(end.v).toBe(0);
    expect(end.heat).toBeCloseTo(12.5, 6);
    expect(end.heat).toBeGreaterThan(0);
    expect(drift(ride)).toBeLessThan(1e-3);
  });

  it('can climb no higher than its height plus v²/2g, whatever its mass', () => {
    expect(highest(10, 0)).toBe(10);
    expect(highest(0, Math.sqrt(2 * G * 5))).toBeCloseTo(5, 12);
    expect(speedAt(5, 0, 10)).toBeNull();
    // Per kilogram, so a heavier train's energies are bigger but its speed is the same.
    const v = speedAt(30, 0, 2)!;
    expect(0.5 * 600 * v * v).toBeCloseTo(600 * G * 28, 6);
  });
});
