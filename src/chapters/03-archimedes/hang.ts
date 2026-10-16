import { clamp01, lerp } from '../../engine/ease';
import { BAR, CROWN, scaleReading, storyNumbers } from './math';
import { BAR_SIZE, BRIM, CROWN_SIZE, HANG_BOTTOM, TANK, type ArchimedesRig } from './rig';

const NUMBERS = storyNumbers();

/** Height of the water surface for a level (1 = to the brim). */
export function waterY(level: number): number {
  return TANK.floor + (BRIM - TANK.floor) * level;
}

/** Where the object on the hook is and what the scale reads (grams), derived from the rig. */
export function hangState(rig: Pick<ArchimedesRig, 'bar' | 'lower' | 'hookOut' | 'level'>) {
  const isBar = rig.bar >= 0.5;
  const height = isBar ? BAR_SIZE.h : CROWN_SIZE.h;
  const bottom = lerp(HANG_BOTTOM.above, HANG_BOTTOM.under, rig.lower) + rig.hookOut * 1.4;
  const submerged = clamp01((waterY(rig.level) - bottom) / height);
  const grams = isBar ? BAR.grams : CROWN.grams;
  const volume = isBar ? NUMBERS.barVolume : NUMBERS.crownVolume;
  return {
    isBar,
    height,
    bottom,
    top: bottom + height,
    submerged,
    volume,
    weight: grams,
    reading: scaleReading(grams, volume, submerged),
  };
}

/**
 * The `lower` values at which an object of `height` first touches the water and is fully under it (water at
 * the brim). Timelines use them to spill exactly while the object goes under.
 */
export function immersionWindow(height: number, level = 1) {
  const span = HANG_BOTTOM.above - HANG_BOTTOM.under;
  const w = waterY(level);
  return {
    touch: (HANG_BOTTOM.above - w) / span,
    under: (HANG_BOTTOM.above - (w - height)) / span,
  };
}
