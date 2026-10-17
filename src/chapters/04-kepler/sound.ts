import { pyth } from '../../audio/tuning';
import type { Levels, Meter } from '../sound';
import { turnRate } from './math';
import { keplerRig, type KeplerRig } from './rig';

/** The planet's note at its slowest (aphelion); it rises in proportion to how fast the planet turns. */
const SLOWEST = pyth('C', 3);
const HIGHEST = 1600;

export interface KeplerSoundSample {
  draw: number;
  circle: number;
  song: number;
  e: number;
  phase: number;
}

export function keplerSample(rig: KeplerRig): KeplerSoundSample {
  return {
    draw: rig.draw,
    circle: rig.circle,
    song: Math.max(rig.voice, rig.interactive) * Math.min(1, rig.planet) * (1 - Math.min(1, rig.system)),
    e: rig.e,
    phase: rig.phase,
  };
}

/** How fast (orbits per second) the planet must go round to sing at full voice. */
const SINGING = 0.02;

/**
 * The pencil and the chalk circle scratch as they draw; the planet sings a note that follows how fast it turns
 * as seen from the Sun (Kepler's own idea, in Harmonices Mundi), but only while it moves: paused, it falls
 * silent, and it sings again when it sets off. Pure, so offline renders use it.
 */
export function keplerLevels(prev: KeplerSoundSample, cur: KeplerSoundSample, dt: number): Levels {
  const step = Math.max(dt, 1 / 240);
  const drawing = (Math.abs(cur.draw - prev.draw) * 1.6 + Math.abs(cur.circle - prev.circle) * 1.4) / step;
  return {
    chalk: Math.min(1, drawing * 0.9),
    pour: 0,
    voice: cur.song * Math.min(1, Math.abs(cur.phase - prev.phase) / step / SINGING),
    voiceHz: Math.min(HIGHEST, SLOWEST * turnRate(cur.e, cur.phase)),
  };
}

/** Tracks chapter 4's rig between frames and returns its continuous levels. */
export function keplerMeter(): Meter {
  const rig = keplerRig();
  let prev = keplerSample(rig);
  return (dt) => {
    const cur = keplerSample(rig);
    const levels = keplerLevels(prev, cur, dt);
    prev = cur;
    return levels;
  };
}
