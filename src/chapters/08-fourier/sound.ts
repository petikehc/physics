import { HARMONICS } from '../../audio';
import { pyth } from '../../audio/tuning';
import type { Levels, Meter } from '../sound';
import type { Harmonic } from './math';
import { fourierRig, rigHarmonics, type FourierRig } from './rig';

/** The clockwork's note: D3, the score's key. Each circle adds the harmonic at its own speed. */
export const FUNDAMENTAL = pyth('D', 3);

/**
 * The clockwork as a sound: each circle is a harmonic, as loud (next to the first) as it is big. A square wave's
 * circles sound hollow and reedy, like a clarinet; a sawtooth's, bright and buzzing; a triangle's, soft and flute-like.
 */
export function harmonicLevels(hs: readonly Harmonic[], level: number): number[] {
  const out = new Array<number>(HARMONICS).fill(0);
  const first = hs[0]?.a ?? 0;
  if (first <= 0 || level <= 0) return out;
  for (const h of hs) if (h.n >= 1 && h.n <= HARMONICS) out[h.n - 1] = Math.min(1, (h.a / first) * level);
  return out;
}

export interface FourierSoundSample {
  /** How loud the clockwork sings, 0..1, and the harmonics it sings. */
  sing: number;
  harmonics: Harmonic[];
  /** Lines being drawn: the chart, the trace, the spectrum's bars, the drawing's path. */
  stage: number;
  trace: number;
  bars: number;
  dtrace: number;
  dt: number;
}

export function fourierSample(rig: FourierRig): FourierSoundSample {
  return {
    sing: rig.sing,
    harmonics: rig.sing > 0 ? rigHarmonics(rig) : [],
    stage: rig.stage,
    trace: rig.trace,
    bars: rig.bars,
    dtrace: rig.dtrace,
    dt: rig.dt,
  };
}

/** The clockwork sings its harmonics while asked to; the chalk scratches while lines draw. Pure, for offline renders. */
export function fourierLevels(prev: FourierSoundSample, cur: FourierSoundSample, dt: number): Levels {
  const step = Math.max(dt, 1 / 240);
  const drawing =
    (Math.abs(cur.stage - prev.stage) + Math.abs(cur.trace - prev.trace) + Math.abs(cur.bars - prev.bars)) /
    step;
  const tracing = cur.dtrace > 0.5 && Math.abs(cur.dt - prev.dt) / step > 1e-3 ? 0.3 : 0;
  return {
    chalk: Math.min(1, drawing * 0.8 + tracing),
    pour: 0,
    harmonics: harmonicLevels(cur.harmonics, Math.min(cur.sing, 1)),
    harmonicsHz: FUNDAMENTAL,
  };
}

/** Tracks chapter 8's rig between frames and returns its continuous levels. */
export function fourierMeter(): Meter {
  const rig = fourierRig();
  let prev = fourierSample(rig);
  return (dt) => {
    const cur = fourierSample(rig);
    const levels = fourierLevels(prev, cur, dt);
    prev = cur;
    return levels;
  };
}
