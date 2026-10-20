import { describe, expect, it } from 'vitest';
import {
  BALMER,
  firstHeard,
  groundRing,
  heard,
  heardAlong,
  machAngle,
  observed,
  recession,
  redshift,
  runM,
  runX,
  shells,
  sirenTone,
  SOUND,
  stretch,
  wavelengthRGB,
  type Run,
  type V3,
} from './math';

const still: V3 = [0, 0, 0];

describe("Doppler's formula", () => {
  it('raises the pitch of a source coming towards you and lowers it going away', () => {
    expect(observed(440, SOUND, 0, 0)).toBe(440);
    expect(observed(440, SOUND, 0, SOUND / 10)).toBeCloseTo(440 / 0.9, 9);
    expect(observed(440, SOUND, 0, -SOUND / 10)).toBeCloseTo(440 / 1.1, 9);
    // Walking towards a still source is not quite the same as it coming towards you.
    expect(observed(440, SOUND, SOUND / 10, 0)).toBeCloseTo(440 * 1.1, 9);
  });

  it('drops by about three and a half semitones as a source at a tenth of the speed of sound goes by', () => {
    const drop = observed(1, SOUND, 0, 34.3) / observed(1, SOUND, 0, -34.3);
    expect(12 * Math.log2(drop)).toBeCloseTo(3.47, 2);
  });
});

describe('what a listener hears of a moving source', () => {
  it('hears a still source as it is, as long after it was sent as sound takes to come', () => {
    const h = heard([0, 0, 0], still, [343, 0, 0], still, SOUND)!;
    expect(h.delay).toBeCloseTo(1, 12);
    expect(h.ratio).toBeCloseTo(1, 12);
  });

  it('hears the sound from where the source was when it sent it', () => {
    const s: V3 = [10, 1.5, 0];
    const vs: V3 = [34.3, 0, 0];
    const l: V3 = [40, 1.6, 5];
    const h = heard(s, vs, l, still, SOUND)!;
    const from: V3 = [s[0] - vs[0] * h.delay, s[1], s[2]];
    expect(h.from[0]).toBeCloseTo(from[0], 9);
    expect(Math.hypot(l[0] - from[0], l[1] - from[1], l[2] - from[2])).toBeCloseTo(SOUND * h.delay, 9);
  });

  it("agrees with Doppler's formula straight ahead of the source and straight behind it", () => {
    const vs: V3 = [34.3, 0, 0];
    const ahead = heard([0, 0, 0], vs, [500, 0, 0], still, SOUND)!;
    const behind = heard([0, 0, 0], vs, [-500, 0, 0], still, SOUND)!;
    expect(ahead.ratio).toBeCloseTo(observed(1, SOUND, 0, 34.3), 12);
    expect(behind.ratio).toBeCloseTo(observed(1, SOUND, 0, -34.3), 12);
    // A listener walking towards a still source.
    const walking = heard([0, 0, 0], still, [100, 0, 0], [-34.3, 0, 0], SOUND)!;
    expect(walking.ratio).toBeCloseTo(observed(1, SOUND, 34.3, 0), 12);
  });

  it('falls smoothly through the true pitch as the source goes past', () => {
    const vs: V3 = [30, 0, 0];
    const l: V3 = [0, 0, 6];
    let last = Infinity;
    for (let x = -200; x <= 200; x += 5) {
      const r = heard([x, 0, 0], vs, l, still, SOUND)!.ratio;
      expect(r).toBeLessThan(last);
      last = r;
    }
    // The true pitch is heard from the moment the source was level with you, a little after it has passed.
    const level = heard([30 * (6.0 / SOUND), 0, 0], vs, l, still, SOUND)!;
    expect(level.ratio).toBeCloseTo(1, 3);
  });

  it('hears nothing ahead of a source faster than sound, until its cone sweeps over', () => {
    const vs: V3 = [2 * SOUND, 0, 0];
    expect(heard([0, 0, 0], vs, [100, 0, 0], still, SOUND)).toBeNull();
    // Abeam, 100 m to the side: the cone (half-angle 30°) reaches you once the source is 100·√3 m past.
    expect(heard([150, 0, 0], vs, [0, 0, 100], still, SOUND)).toBeNull();
    const inside = heard([200, 0, 0], vs, [0, 0, 100], still, SOUND)!;
    expect(inside).not.toBeNull();
    expect(inside.ratio).toBeGreaterThan(0);
  });

  it('at exactly the speed of sound, is heard only from behind', () => {
    const vs: V3 = [SOUND, 0, 0];
    expect(heard([0, 0, 0], vs, [50, 0, 0], still, SOUND)).toBeNull();
    const behind = heard([0, 0, 0], vs, [-50, 0, 0], still, SOUND)!;
    expect(behind.ratio).toBeCloseTo(0.5, 12);
  });
});

describe('a run and its waves', () => {
  const steady: Run = { x0: -3, c: 3, knots: [[0, 0.4]] };
  const speeding: Run = {
    x0: 0,
    c: 3,
    knots: [
      [2, 0.5],
      [6, 1.5],
      [8, 1.5],
      [9, 2],
    ],
  };

  it('moves at its Mach number times the speed of sound, smoothly through a change of speed', () => {
    expect(runX(steady, 2)).toBeCloseTo(-3 + 2.4, 12);
    expect(runM(speeding, 1)).toBe(0.5);
    expect(runM(speeding, 4)).toBeCloseTo(1, 12);
    expect(runM(speeding, 7)).toBe(1.5);
    expect(runM(speeding, 20)).toBe(2);
    // Steady at first, so 3 m/s × 0.5 for two seconds.
    expect(runX(speeding, 2)).toBeCloseTo(3, 12);
    expect(runX(speeding, -1)).toBeCloseTo(-1.5, 12);
    for (const t of [1, 2, 3.3, 6, 7, 8.5, 10]) {
      const h = 1e-5;
      expect((runX(speeding, t + h) - runX(speeding, t - h)) / (2 * h)).toBeCloseTo(3 * runM(speeding, t), 4);
    }
  });

  it('sends a wave every period, each centred where the source was, growing at the speed of sound', () => {
    const along = (run: Run) => (t: number) => runX(run, t);
    const ws = shells(along(steady), 3, 5, 0.5, 0, 3);
    expect(ws.map((w) => w.sent)).toEqual([5, 4.5, 4, 3.5, 3, 2.5, 2]);
    for (const w of ws) {
      expect(w.r).toBeCloseTo(3 * (5 - w.sent), 12);
      expect(w.x).toBeCloseTo(runX(steady, w.sent), 12);
    }
    expect(shells(along(steady), 3, 1, 0.5, 0.6, 3).map((w) => w.sent)).toEqual([1]);
  });

  it('bunches its waves ahead and stretches them behind by 1 ∓ M', () => {
    const ws = shells((t) => runX(steady, t), 3, 6, 0.5, 0, 6);
    const lambda = 3 * 0.5;
    for (let i = 0; i + 1 < ws.length; i++) {
      const [a, b] = [ws[i]!, ws[i + 1]!];
      expect(b.x + b.r - (a.x + a.r)).toBeCloseTo(lambda * stretch(0.4, 1), 9);
      expect(a.x - a.r - (b.x - b.r)).toBeCloseTo(lambda * stretch(0.4, -1), 9);
    }
  });

  it('piles its waves into a cone of half-angle sin μ = 1/M past the speed of sound', () => {
    expect(machAngle(0.9)).toBeNull();
    expect(machAngle(1)).toBeCloseTo(Math.PI / 2, 12);
    expect(machAngle(2)).toBeCloseTo(Math.PI / 6, 12);
    const fast: Run = { x0: 0, c: 3, knots: [[0, 2]] };
    const t = 4;
    const tip = runX(fast, t);
    const mu = machAngle(2)!;
    // Every wave just touches the cone from the tip: its centre is r / sin μ behind the tip.
    for (const w of shells((u) => runX(fast, u), 3, t, 0.5, 0, 4)) {
      if (w.r === 0) continue;
      expect(tip - w.x).toBeCloseTo(w.r / Math.sin(mu), 9);
    }
  });

  it('finds when the sound first reaches a listener: at once below the speed of sound, with a boom above it', () => {
    const slow: Run = { x0: -10, c: 3, knots: [[0, 0.5]] };
    const l: V3 = [5, 0, 4];
    const first = firstHeard((t) => runX(slow, t), 0, 0, 3, l, 0, 20);
    expect(first.sent).toBeCloseTo(0, 6);
    expect(first.at).toBeCloseTo(Math.hypot(15, 4) / 3, 6);
    // Faster than sound: the cone of half-angle 30° sweeps over a listener 4 m to the side when the source is
    // 4·√3 m past.
    const fast: Run = { x0: -30, c: 3, knots: [[0, 2]] };
    const boom = firstHeard((t) => runX(fast, t), 0, 0, 3, l, 0, 20);
    expect(runX(fast, boom.at) - l[0]).toBeCloseTo(4 * Math.sqrt(3), 4);
    expect(boom.sent).toBeGreaterThan(0.5);
  });

  it('hears a source whose speed changed as the waves it sent say, the same as for a steady one when steady', () => {
    const steady: Run = { x0: -10, c: 3, knots: [[0, 0.5]] };
    const l: V3 = [6, 1.5, 4];
    const t = 9;
    const along = heardAlong(
      (u) => runX(steady, u),
      (u) => runM(steady, u),
      2,
      1,
      3,
      l,
      0,
      0,
      t,
    )!;
    const exact = heard([runX(steady, t), 2, 1], [1.5, 0, 0], l, [0, 0, 0], 3)!;
    expect(along.delay).toBeCloseTo(exact.delay, 6);
    expect(along.ratio).toBeCloseTo(exact.ratio, 6);
    // Faster than sound, nothing is heard until the first arrival, and then something is.
    const speeding: Run = {
      x0: -30,
      c: 3,
      knots: [
        [0, 0.7],
        [3, 0.7],
        [8, 1.6],
      ],
    };
    const path = (u: number) => runX(speeding, u);
    const mach = (u: number) => runM(speeding, u);
    const first = firstHeard(path, 9, 0, 3, l, 0, 30).at;
    expect(heardAlong(path, mach, 9, 0, 3, l, 0, 0, first - 0.05)).toBeNull();
    const after = heardAlong(path, mach, 9, 0, 3, l, 0, 0, first + 0.05)!;
    expect(after).not.toBeNull();
    expect(after.delay + (first + 0.05 - after.delay)).toBeCloseTo(first + 0.05, 9);
    expect(Math.hypot(l[0] - after.from[0], l[1] - 9, l[2]) / 3).toBeCloseTo(after.delay, 6);
    // Nothing is heard from before the source started sending.
    expect(heardAlong(path, mach, 9, 0, 3, [100, 0, 0], 0, 0, 1)).toBeNull();
  });

  it('draws a ring on the ground once a wave sent from above reaches it', () => {
    expect(groundRing(1, 1.5)).toBe(0);
    expect(groundRing(2.5, 1.5)).toBeCloseTo(2, 12);
  });
});

describe('light', () => {
  it("is red-shifted by √((1+β)/(1−β)) − 1, close to sound's β when slow", () => {
    expect(redshift(0)).toBe(0);
    expect(redshift(0.001)).toBeCloseTo(0.001, 5);
    expect(redshift(0.6)).toBeCloseTo(1, 12);
    expect(recession(redshift(0.25))).toBeCloseTo(0.25, 12);
  });

  it("shifts hydrogen's lines by one factor, keeping their pattern", () => {
    const z = 0.1;
    const shifted = BALMER.map((l) => l.nm * (1 + z));
    expect(shifted[0]! / shifted[1]!).toBeCloseTo(BALMER[0]!.nm / BALMER[1]!.nm, 12);
    expect(shifted[1]! - BALMER[1]!.nm).toBeCloseTo(48.61, 9);
  });

  it('colours red light red, blue light blue, and nothing outside the visible', () => {
    const red = wavelengthRGB(650);
    const blue = wavelengthRGB(460);
    expect(red[0]).toBeGreaterThan(red[2]);
    expect(blue[2]).toBeGreaterThan(blue[0]);
    expect(wavelengthRGB(300)).toEqual([0, 0, 0]);
    expect(wavelengthRGB(800)).toEqual([0, 0, 0]);
  });
});

describe('the siren', () => {
  it('alternates its two tones, high first', () => {
    expect(sirenTone(0.1, 2, 1, 0.5)).toBe(2);
    expect(sirenTone(0.6, 2, 1, 0.5)).toBe(1);
    expect(sirenTone(1.1, 2, 1, 0.5)).toBe(2);
    expect(sirenTone(-0.1, 2, 1, 0.5)).toBe(1);
  });
});
