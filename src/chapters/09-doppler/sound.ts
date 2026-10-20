import { pyth } from '../../audio/tuning';
import type { Levels, Meter } from '../sound';
import { heard, heardAlong, sirenTone, type V3 } from './math';
import { dopplerRig, EAR, KERB, source, UNDER, type DopplerRig } from './rig';

/** The ambulance's siren: a falling fourth, D then A, each held half a second, like a European two-tone horn. */
export const SIREN = { hi: pyth('D', 5), lo: pyth('A', 4), each: 0.5 };
/** The jet's roar, filtered to this brightness when heard at its own pitch. */
const ROAR_HZ = 900;
/** A listener's ears are this far above where they stand. */
export const EAR_H = 1.55;

/** How loud a source sounds from `d` metres away: in full close by, then falling off with distance. */
export const loudness = (d: number) => Math.min(1, Math.pow(8 / Math.max(d, 1e-3), 0.8));

export interface Hearing {
  /** What is heard over what is sent, how loud (0..1), and from where, left (−1) to right (1). */
  ratio: number;
  level: number;
  pan: number;
  /** The siren's own pitch when it sent the sound heard now. */
  sent: number;
}

/** Who is listening: you at the kerb for the real pass, the person under the jet's path, or the viewer's listener. */
function ear(rig: DopplerRig): { at: V3; m: number } | null {
  if (rig.mode < 0.5) return { at: EAR, m: 0 };
  if (rig.mode < 1.5) return rig.kind > 0.5 ? { at: [UNDER[0], UNDER[1] + EAR_H, UNDER[2]], m: 0 } : null;
  return { at: [rig.lx, KERB + EAR_H, rig.lz], m: rig.lm };
}

/** What a listener with ears at `at`, walking along the street at Mach `m`, hears now, or null if nothing has yet. */
export function hearingAt(rig: DopplerRig, at: V3, m = 0): Hearing | null {
  const s = source(rig);
  // The real pass is at a steady speed: solved exactly. The slowed runs change speed (and the viewer's loop goes
  // round), so the wave heard is found along the path the source really took.
  const h =
    rig.mode < 0.5
      ? heard(s.at, [s.v, 0, 0], at, [m * s.c, 0, 0], s.c)
      : heardAlong(s.path, s.machAt, s.at[1], s.at[2], s.c, at, m * s.c, rig.from, s.now);
  if (!h) return null;
  // Every scene looks across the street (towards −z), so the street's +x is to the right.
  const pan = Math.max(-1, Math.min(1, ((h.from[0] - at[0]) / Math.max(h.distance, 1)) * 0.85));
  return {
    ratio: h.ratio,
    level: loudness(h.distance),
    pan,
    sent: sirenTone(s.now - h.delay, SIREN.hi, SIREN.lo, SIREN.each),
  };
}

/** What the scene's listener hears of the source now, or null if nothing has reached them yet. */
export function hearing(rig: DopplerRig): Hearing | null {
  const who = ear(rig);
  return who ? hearingAt(rig, who.at, who.m) : null;
}

/** The siren and the jet as heard, from the rig alone. Pure, for offline renders. */
export function dopplerLevels(rig: DopplerRig): Levels {
  const out: Levels = { chalk: 0, pour: 0 };
  if (rig.siren <= 0 && rig.roar <= 0) return out;
  const h = hearing(rig);
  if (!h) return out;
  if (rig.kind < 0.5 && rig.siren > 0) {
    out.siren = Math.min(1, rig.siren) * h.level;
    out.sirenHz = h.sent * h.ratio;
    out.sirenPan = h.pan;
  }
  if (rig.kind > 0.5 && rig.roar > 0) {
    out.roar = Math.min(1, rig.roar) * h.level;
    out.roarHz = ROAR_HZ * Math.max(0.2, Math.min(h.ratio, 6));
    out.roarPan = h.pan;
  }
  return out;
}

/** Tracks chapter 9's rig and returns its continuous levels. */
export function dopplerMeter(): Meter {
  const rig = dopplerRig();
  return () => dopplerLevels(rig);
}
