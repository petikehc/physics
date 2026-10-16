import { audio } from '../../audio';
import { clamp01 } from '../../engine/ease';
import { pourLevels, triangle } from './math';
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
export function continuousLevels(prev: SoundSample, cur: SoundSample, dt: number) {
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

let prev: SoundSample = { draw: 0, circle: 0, pourA: 0, pourB: 0, stick: 0 };
const prevShape = { a: 3, b: 4, gamma: 90 };

/** Called every frame by the journey and the Lab. */
export function pythagorasSoundFrame(dt: number, interactive: boolean) {
  const rig = pythagorasRig();
  const cur = sample(rig);
  const { chalk, pour } = continuousLevels(prev, cur, dt);
  audio.continuous('chalk', chalk);
  const t = triangle(rig.a, rig.b, rig.gamma);
  audio.continuous('pour', pour, {
    level: pourLevels(t.a, t.b, t.c, drainOf(rig.pourA), drainOf(rig.pourB)).total,
  });

  const moved = rig.a !== prevShape.a || rig.b !== prevShape.b || rig.gamma !== prevShape.gamma;
  audio.sides(interactive ? t : null, moved);
  prev = cur;
  prevShape.a = rig.a;
  prevShape.b = rig.b;
  prevShape.gamma = rig.gamma;
}
