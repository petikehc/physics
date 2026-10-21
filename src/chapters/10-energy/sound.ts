import type { Levels, Meter } from '../sound';
import { energyRig, trainNow, type EnergyRig } from './rig';
import { testNow } from './sandbox';

/** The rush of air and the rumble of wheels: as loud and as bright as the train is fast. */
export function rushOf(v: number, k = 1): { level: number; hz: number } {
  const speed = Math.abs(v);
  return { level: Math.min(1, speed / 22) * 0.75 * k, hz: 220 + speed * 75 };
}

/** The coaster's rush (from its front car while riding, else from where it is, left to right) and the test car's. */
export function energyLevels(rig: EnergyRig): Levels {
  const out: Levels = { chalk: 0, pour: 0 };
  if (rig.train > 0.5 && rig.gauge < 0.5) {
    const now = trainNow(rig);
    const r = rushOf(now.v);
    // Heard from the seat, the rush is all round; from the side, it sweeps across with the train.
    out.roar = r.level;
    out.roarHz = r.hz;
    out.roarPan = 0;
  } else if (rig.test > 0.5) {
    const t = testNow(rig);
    const r = rushOf(t.sample.v, 0.6);
    out.roar = r.level;
    out.roarHz = r.hz;
    out.roarPan = Math.max(-0.7, Math.min(0.7, Math.sign(t.sample.v) * 0.3));
  }
  return out;
}

/** Tracks chapter 10's rig and returns its continuous levels. */
export function energyMeter(): Meter {
  const rig = energyRig();
  return () => energyLevels(rig);
}
