import type { Levels, Meter } from '../sound';
import { archimedesRig, type ArchimedesRig } from './rig';

export interface ArchimedesSoundSample {
  spilled: number;
}

export function archimedesSample(rig: ArchimedesRig): ArchimedesSoundSample {
  return { spilled: rig.spillA + rig.spillB };
}

/** The pour follows how fast water is running from the spout into a beaker. Pure, so offline renders use it. */
export function archimedesLevels(
  prev: ArchimedesSoundSample,
  cur: ArchimedesSoundSample,
  dt: number,
): Levels {
  const step = Math.max(dt, 1 / 240);
  const rate = Math.max(0, cur.spilled - prev.spilled) / step;
  return { chalk: 0, pour: Math.min(1, rate * 1.2) };
}

/** Tracks chapter 3's rig between frames and returns its continuous levels. */
export function archimedesMeter(): Meter {
  const rig = archimedesRig();
  let prev = archimedesSample(rig);
  return (dt) => {
    const cur = archimedesSample(rig);
    const levels = archimedesLevels(prev, cur, dt);
    prev = cur;
    return levels;
  };
}
