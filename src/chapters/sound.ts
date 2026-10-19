import { audio } from '../audio';
import { pythagorasMeter, pythagorasSides } from './01-pythagoras/sound';
import { circleMeter } from './02-circle-area/sound';
import { archimedesMeter } from './03-archimedes/sound';
import { keplerMeter } from './04-kepler/sound';
import { newtonMeter } from './05-newton/sound';
import { calculusMeter } from './06-calculus/sound';

/** Levels of the continuous sound layers, 0..1. */
export interface Levels {
  chalk: number;
  pour: number;
  /** A singing planet (chapter 4), a whistling cannonball (chapter 5) or a curve sung (chapter 6): how loud, its pitch. */
  voice?: number;
  voiceHz?: number;
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
  ];
  return (dt) => {
    const out: Required<Levels> = { chalk: 0, pour: 0, voice: 0, voiceHz: 0 };
    for (const m of meters) {
      const l = m(dt);
      out.chalk = Math.max(out.chalk, l.chalk);
      out.pour = Math.max(out.pour, l.pour);
      if ((l.voice ?? 0) > out.voice) {
        out.voice = l.voice ?? 0;
        out.voiceHz = l.voiceHz ?? 0;
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
    audio.continuous('voice', playing || interactive ? (l.voice ?? 0) : 0, { hz: l.voiceHz ?? 0 });
    pythagorasSides(interactive === 'pythagoras');
  };
}
