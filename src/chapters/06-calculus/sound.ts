import type { Levels, Meter } from '../sound';
import { heightAt } from './math';
import { calculusRig, GROWTH, radiusAt, rigCurve, type CalculusRig } from './rig';

/** The pitch of a height on the curve: G3 at the floor, an octave higher every 1.5 up. */
export const heightHz = (h: number) => 196 * Math.pow(2, Math.max(h, 0) / 1.5);

export interface CalculusSoundSample {
  /** The voice singing the curve's height at singX, 0..1, and that pitch. */
  sing: number;
  hz: number;
  /** Lines being drawn: the curve, and the area's curve. */
  curve: number;
  areaCurve: number;
  /** The handoff's point: shown, 0..1; how far it has grown and gone round. */
  vector: number;
  grow: number;
  round: number;
}

export function calculusSample(rig: CalculusRig): CalculusSoundSample {
  return {
    sing: rig.sing,
    hz: heightHz(heightAt(rigCurve(rig), rig.singX)),
    curve: rig.curve,
    areaCurve: rig.areaCurve,
    vector: rig.vector,
    grow: rig.grow,
    round: rig.round,
  };
}

/**
 * A voice sings the curve's height wherever the story points (a split sweeping along, the probe, a point being
 * dragged), so the slope of the area, which is that same height, is heard too. The handoff's point hums higher as it
 * grows, and holds its note once it only goes round. The chalk scratches while a line is drawn. Pure, so offline
 * renders use it.
 */
export function calculusLevels(prev: CalculusSoundSample, cur: CalculusSoundSample, dt: number): Levels {
  const step = Math.max(dt, 1 / 240);
  const drawing = (Math.abs(cur.curve - prev.curve) + Math.abs(cur.areaCurve - prev.areaCurve)) / step;
  const moving = (Math.abs(cur.grow - prev.grow) + Math.abs(cur.round - prev.round)) / step > 1e-3 ? 1 : 0;
  const hum = cur.vector * moving * 0.75;
  const voice = Math.max(cur.sing * 0.8, hum);
  return {
    chalk: Math.min(1, drawing * 0.9),
    pour: 0,
    voice,
    voiceHz: hum > cur.sing * 0.8 ? 196 * Math.pow(radiusAt(cur.grow) / GROWTH.from, 0.6) : cur.hz,
  };
}

/** Tracks chapter 6's rig between frames and returns its continuous levels. */
export function calculusMeter(): Meter {
  const rig = calculusRig();
  let prev = calculusSample(rig);
  return (dt) => {
    const cur = calculusSample(rig);
    const levels = calculusLevels(prev, cur, dt);
    prev = cur;
    return levels;
  };
}
