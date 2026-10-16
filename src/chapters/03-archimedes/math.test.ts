import { describe, expect, it } from 'vitest';
import {
  alloyVolume,
  buoyancy,
  FLUIDS,
  GOLD,
  MATERIALS,
  scaleReading,
  settle,
  SILVER,
  storyNumbers,
  weight,
} from './math';
import { hangState, immersionWindow } from './hang';

describe("Archimedes' principle", () => {
  it('weighs a kilogram at 9.8 N', () => {
    expect(weight(1000)).toBeCloseTo(9.8, 9);
  });

  it('gives pure metals their own volume, and an alloy something in between', () => {
    expect(alloyVolume(1000, 1)).toBeCloseTo(1000 / GOLD, 9);
    expect(alloyVolume(1000, 0)).toBeCloseTo(1000 / SILVER, 9);
    const v = alloyVolume(1000, 0.7);
    expect(v).toBeGreaterThan(1000 / GOLD);
    expect(v).toBeLessThan(1000 / SILVER);
  });

  it('pushes up with exactly the weight of the displaced water', () => {
    // 100 mL of water weighs 0.98 N.
    expect(buoyancy(100)).toBeCloseTo(0.98, 9);
    // The scale drops by exactly that push.
    expect(weight(1000) - scaleReading(1000, 100, 1)).toBeCloseTo(buoyancy(100), 9);
    // Half under, half the push.
    expect(weight(1000) - scaleReading(1000, 100, 0.5)).toBeCloseTo(buoyancy(50), 9);
  });

  it('floats lighter things with density-ratio of their volume under, and sinks the rest', () => {
    expect(settle(0.92, 1).floats).toBe(true);
    expect(settle(0.92, 1).fraction).toBeCloseTo(0.92, 9);
    expect(settle(19.3, 1)).toEqual({ floats: false, fraction: 1 });
    // Iron floats on mercury; gold does not.
    expect(settle(7.87, 13.53).floats).toBe(true);
    expect(settle(19.3, 13.53).floats).toBe(false);
    // A floating block displaces exactly its own weight.
    const { fraction } = settle(0.5, 1.24);
    expect(buoyancy(100 * fraction, 1.24)).toBeCloseTo(weight(100 * 0.5), 9);
  });

  it("tells the story's numbers: same weight, the crown spills more water than the gold bar", () => {
    const n = storyNumbers();
    expect(n.crownVolume).toBeCloseTo(64.8, 1);
    expect(n.barVolume).toBeCloseTo(51.8, 1);
    expect(n.crownPush).toBeCloseTo(0.635, 3);
    expect(n.crownInWater).toBeCloseTo(9.165, 3);
    expect(n.crownInWater).toBeLessThan(n.barInWater);
  });

  it('lists materials and fluids in order of density', () => {
    for (const list of [MATERIALS, FLUIDS]) {
      const d = list.map((s) => s.density);
      expect(d).toEqual([...d].sort((a, b) => a - b));
    }
  });
});

describe('the hanging object', () => {
  const base = { bar: 0, lower: 0, hookOut: 0, level: 1 };

  it('reads the full weight above the water and less once under', () => {
    const above = hangState(base);
    expect(above.submerged).toBe(0);
    expect(above.reading).toBeCloseTo(9.8, 9);
    const under = hangState({ ...base, lower: 1 });
    expect(under.submerged).toBe(1);
    expect(under.reading).toBeCloseTo(storyNumbers().crownInWater, 9);
  });

  it('goes under exactly between the immersion window bounds', () => {
    const { touch, under } = immersionWindow(hangState(base).height);
    expect(touch).toBeGreaterThan(0);
    expect(under).toBeLessThan(1);
    expect(hangState({ ...base, lower: touch }).submerged).toBeCloseTo(0, 9);
    expect(hangState({ ...base, lower: under }).submerged).toBeCloseTo(1, 9);
    expect(hangState({ ...base, lower: (touch + under) / 2 }).submerged).toBeCloseTo(0.5, 9);
  });
});
