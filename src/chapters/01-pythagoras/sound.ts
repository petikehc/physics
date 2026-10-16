import { audio } from '../../audio';
import { clamp01 } from '../../engine/ease';
import type { Levels, Meter } from '../sound';
import { triangle } from './math';
import { pythagorasRig, type PythagorasRig } from './rig';

/** The rig fields the soundtrack listens to. */
export interface SoundSample {
  draw: number;
  circle: number;
  pourA: number;
  pourB: number;
  stick: number;
}

const drainOf = (p: number) => clamp01((p - 0.3) / 0.5);

export function sample(rig: PythagorasRig): SoundSample {
  return { draw: rig.draw, circle: rig.circle, pourA: rig.pourA, pourB: rig.pourB, stick: rig.stick };
}

/**
 * Continuous sound levels from how fast the rig changes: the chalk scratch follows the stick and the
 * swinging radius, the pour follows the drain rate. Pure, so offline renders use it too.
 */
export function continuousLevels(prev: SoundSample, cur: SoundSample, dt: number): Levels {
  const step = Math.max(dt, 1 / 240);
  const drawRate = Math.abs(cur.draw - prev.draw) / step;
  const circleRate = Math.abs(cur.circle - prev.circle) / step;
  const chalk =
    Math.min(1, drawRate * 0.9 + circleRate * 2.2) * (cur.stick > 0.1 || circleRate > 0 ? 1 : 0.6);
  const pourRate =
    (Math.abs(drainOf(cur.pourA) - drainOf(prev.pourA)) +
      Math.abs(drainOf(cur.pourB) - drainOf(prev.pourB))) /
    step;
  const pour = Math.min(1, pourRate * 1.6);
  return { chalk, pour };
}

/** Tracks chapter 1's rig between frames and returns its continuous levels. */
export function pythagorasMeter(): Meter {
  const rig = pythagorasRig();
  let prev = sample(rig);
  return (dt) => {
    const cur = sample(rig);
    const levels = continuousLevels(prev, cur, dt);
    prev = cur;
    return levels;
  };
}

const prevShape = { a: 3, b: 4, gamma: 90 };

/** The three side tones while the viewer reshapes the triangle (silent when `interactive` is false). */
export function pythagorasSides(interactive: boolean) {
  const rig = pythagorasRig();
  const t = triangle(rig.a, rig.b, rig.gamma);
  const moved = rig.a !== prevShape.a || rig.b !== prevShape.b || rig.gamma !== prevShape.gamma;
  audio.sides(interactive ? t : null, moved);
  prevShape.a = rig.a;
  prevShape.b = rig.b;
  prevShape.gamma = rig.gamma;
}
