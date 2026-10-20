import { audio, HARMONICS } from '../audio';
import { pythagorasMeter, pythagorasSides } from './01-pythagoras/sound';
import { circleMeter } from './02-circle-area/sound';
import { archimedesMeter } from './03-archimedes/sound';
import { keplerMeter } from './04-kepler/sound';
import { newtonMeter } from './05-newton/sound';
import { calculusMeter } from './06-calculus/sound';
import { eulerMeter } from './07-euler/sound';
import { fourierMeter } from './08-fourier/sound';
import { dopplerMeter } from './09-doppler/sound';
import { energyMeter } from './10-energy/sound';

/** Levels of the continuous sound layers, 0..1. */
export interface Levels {
  chalk: number;
  pour: number;
  /**
   * A singing planet (chapter 4), a whistling cannonball (chapter 5), a curve sung (chapter 6) or a point going
   * round (chapter 7): how loud, its pitch, and where it sits, left (−1) to right (1).
   */
  voice?: number;
  voiceHz?: number;
  voicePan?: number;
  /** Chapter 8's additive voice: each harmonic's loudness (the fundamental first), over a fundamental in Hz. */
  harmonics?: number[];
  harmonicsHz?: number;
  /** Chapter 9's ambulance siren as heard: how loud, its pitch, where it sits. */
  siren?: number;
  sirenHz?: number;
  sirenPan?: number;
  /** Chapter 9's jet as heard, or chapter 10's coaster rushing by: how loud, how bright (Hz), where it sits. */
  roar?: number;
  roarHz?: number;
  roarPan?: number;
}

/** Called once per frame with the elapsed time; returns the continuous levels since the last call. */
export type Meter = (dt: number) => Levels;

/** One meter over every chapter's rig: each layer plays at the loudest level any chapter asks for. */
export function continuousMeter(): Meter {
  const meters = [
    pythagorasMeter(),
    circleMeter(),
    archimedesMeter(),
    keplerMeter(),
    newtonMeter(),
    calculusMeter(),
    eulerMeter(),
    fourierMeter(),
    dopplerMeter(),
    energyMeter(),
  ];
  return (dt) => {
    const out: Required<Levels> = {
      chalk: 0,
      pour: 0,
      voice: 0,
      voiceHz: 0,
      voicePan: 0,
      harmonics: new Array<number>(HARMONICS).fill(0),
      harmonicsHz: 0,
      siren: 0,
      sirenHz: 0,
      sirenPan: 0,
      roar: 0,
      roarHz: 0,
      roarPan: 0,
    };
    let loudest = 0;
    for (const m of meters) {
      const l = m(dt);
      out.chalk = Math.max(out.chalk, l.chalk);
      out.pour = Math.max(out.pour, l.pour);
      if ((l.voice ?? 0) > out.voice) {
        out.voice = l.voice ?? 0;
        out.voiceHz = l.voiceHz ?? 0;
        out.voicePan = l.voicePan ?? 0;
      }
      if ((l.siren ?? 0) > out.siren) {
        out.siren = l.siren ?? 0;
        out.sirenHz = l.sirenHz ?? 0;
        out.sirenPan = l.sirenPan ?? 0;
      }
      if ((l.roar ?? 0) > out.roar) {
        out.roar = l.roar ?? 0;
        out.roarHz = l.roarHz ?? 0;
        out.roarPan = l.roarPan ?? 0;
      }
      const sum = (l.harmonics ?? []).reduce((a, b) => a + b, 0);
      if (sum > loudest) {
        loudest = sum;
        out.harmonics = l.harmonics!;
        out.harmonicsHz = l.harmonicsHz ?? 0;
      }
    }
    return out;
  };
}

/**
 * Per-frame sound for the journey and the Labs: the continuous layers, plus the interactive tones of the
 * chapter the viewer is playing with (`interactive`), if any. `playing` is false while the journey is paused,
 * scrubbed or skipping: a planet whizzing round under a fast seek stays quiet.
 */
export function createSoundFrame() {
  const meter = continuousMeter();
  return (dt: number, interactive: string | null, playing = true) => {
    const l = meter(dt);
    audio.continuous('chalk', l.chalk);
    audio.continuous('pour', l.pour);
    audio.continuous('voice', playing || interactive ? (l.voice ?? 0) : 0, {
      hz: l.voiceHz ?? 0,
      pan: l.voicePan ?? 0,
    });
    audio.harmonics(playing || interactive ? (l.harmonics ?? []) : [], l.harmonicsHz ?? 0);
    audio.continuous('siren', playing || interactive ? (l.siren ?? 0) : 0, {
      hz: l.sirenHz ?? 0,
      pan: l.sirenPan ?? 0,
    });
    audio.continuous('roar', playing || interactive ? (l.roar ?? 0) : 0, {
      hz: l.roarHz ?? 0,
      pan: l.roarPan ?? 0,
    });
    pythagorasSides(interactive === 'pythagoras');
  };
}
