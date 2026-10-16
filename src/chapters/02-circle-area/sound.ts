import type { Levels, Meter } from '../sound';
import { circleRig, type CircleRig } from './rig';

export interface CircleSoundSample {
  cut: number;
}

export function circleSample(rig: CircleRig): CircleSoundSample {
  return { cut: rig.cut };
}

/** The knife's scrape follows the speed of the cut strokes. Pure, so offline renders use it too. */
export function circleLevels(prev: CircleSoundSample, cur: CircleSoundSample, dt: number): Levels {
  const step = Math.max(dt, 1 / 240);
  const cutRate = Math.abs(cur.cut - prev.cut) / step;
  return { chalk: Math.min(1, cutRate * 2.2), pour: 0 };
}

/** Tracks chapter 2's rig between frames and returns its continuous levels. */
export function circleMeter(): Meter {
  const rig = circleRig();
  let prev = circleSample(rig);
  return (dt) => {
    const cur = circleSample(rig);
    const levels = circleLevels(prev, cur, dt);
    prev = cur;
    return levels;
  };
}
