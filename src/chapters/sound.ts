import { audio } from '../audio';
import { pythagorasMeter, pythagorasSides } from './01-pythagoras/sound';
import { circleMeter } from './02-circle-area/sound';
import { archimedesMeter } from './03-archimedes/sound';

/** Levels of the continuous sound layers, 0..1. */
export interface Levels {
  chalk: number;
  pour: number;
}

/** Called once per frame with the elapsed time; returns the continuous levels since the last call. */
export type Meter = (dt: number) => Levels;

/** One meter over every chapter's rig: each layer plays at the loudest level any chapter asks for. */
export function continuousMeter(): Meter {
  const meters = [pythagorasMeter(), circleMeter(), archimedesMeter()];
  return (dt) => {
    const out: Levels = { chalk: 0, pour: 0 };
    for (const m of meters) {
      const l = m(dt);
      out.chalk = Math.max(out.chalk, l.chalk);
      out.pour = Math.max(out.pour, l.pour);
    }
    return out;
  };
}

/**
 * Per-frame sound for the journey and the Labs: the continuous layers, plus the interactive tones of the
 * chapter the viewer is playing with (`interactive`), if any.
 */
export function createSoundFrame() {
  const meter = continuousMeter();
  return (dt: number, interactive: string | null) => {
    const l = meter(dt);
    audio.continuous('chalk', l.chalk);
    audio.continuous('pour', l.pour);
    pythagorasSides(interactive === 'pythagoras');
  };
}
