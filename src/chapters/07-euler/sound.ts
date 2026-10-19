import type { Levels, Meter } from '../sound';
import { epicycle, expi, type Complex } from './math';
import { EPI, eulerRig, type EulerRig } from './rig';

/**
 * The point's voice is the point itself: its real part (cos θ) sets where it sits, left to right, and its imaginary
 * part (sin θ) its pitch, half an octave either side of E4. Going round, it swings across and rises and falls.
 */
export const voicePan = (re: number) => Math.min(Math.max(re * 0.8, -1), 1);
export const voiceHz = (im: number) => 330 * Math.pow(2, im * 0.5);

export interface EulerSoundSample {
  /** The voice asked for, 0..1, and the point it sings. */
  voice: number;
  at: Complex;
  /** What it was sung from: the point's θ, or the shadows' head as they draw. */
  sung: number;
  /** Lines being drawn: the plane, the shadows, the triangle, the handoff's path. */
  plane: number;
  shadows: number;
  triangle: number;
  trace: number;
}

export function eulerSample(rig: EulerRig): EulerSoundSample {
  const drawing = rig.shadows > 0 && rig.shadows < 1;
  const sung = drawing ? rig.shadows * rig.theta : rig.theta;
  const at =
    rig.epicycle > 0.01 ? epicycle(sung, EPI.r * Math.min(rig.epicycle, 1), EPI.k, EPI.phase) : expi(sung);
  return {
    voice: rig.voice,
    at,
    sung,
    plane: rig.plane,
    shadows: rig.shadows,
    triangle: rig.triangle,
    trace: rig.trace,
  };
}

/**
 * While the point moves, it sings (pan from cos θ, pitch from sin θ); held still, it falls quiet. The chalk scratches
 * while the plane, the shadows or the triangle draw, and while the handoff's tip traces its path. Pure, so offline
 * renders use it.
 */
export function eulerLevels(prev: EulerSoundSample, cur: EulerSoundSample, dt: number): Levels {
  const step = Math.max(dt, 1 / 240);
  const moving = Math.abs(cur.sung - prev.sung) / step > 1e-3 ? 1 : 0;
  const drawing =
    (Math.abs(cur.plane - prev.plane) +
      Math.abs(cur.shadows - prev.shadows) * 2 +
      Math.abs(cur.triangle - prev.triangle)) /
    step;
  const tracing = cur.trace > 0.5 && moving ? 0.35 : 0;
  return {
    chalk: Math.min(1, drawing * 0.9 + tracing),
    pour: 0,
    voice: Math.min(cur.voice, 1) * moving * 0.8,
    voiceHz: voiceHz(cur.at[1]),
    voicePan: voicePan(cur.at[0]),
  };
}

/** Tracks chapter 7's rig between frames and returns its continuous levels. */
export function eulerMeter(): Meter {
  const rig = eulerRig();
  let prev = eulerSample(rig);
  return (dt) => {
    const cur = eulerSample(rig);
    const levels = eulerLevels(prev, cur, dt);
    prev = cur;
    return levels;
  };
}
