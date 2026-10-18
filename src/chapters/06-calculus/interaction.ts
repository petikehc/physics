import gsap from 'gsap';
import { audio } from '../../audio';
import { CONTROLS, STORY_YS, X_MAX, Y_MAX } from './math';
import { calculusRig, columnCount, heights, type CalculusRig } from './rig';

/** Where a and b may go, and how finely. */
export const BOUND_STEP = 0.05;
/** The Lab's column counts: 4 × 2^level, from 4 to 512. */
export const LEVELS = 8;

const key = (i: number) => `k${i}` as keyof CalculusRig;

/** Sets the curve's height at control point i (dragged, or from the keyboard). */
export function setControl(i: number, y: number) {
  const rig = calculusRig();
  if (i < 0 || i >= CONTROLS) return;
  (rig[key(i)] as number) = Math.min(Math.max(y, 0), Y_MAX);
}

/** Moves a or b along the x axis. */
export function setBound(which: 'a' | 'b', x: number) {
  const rig = calculusRig();
  rig[which] = Math.round(Math.min(Math.max(x, 0), X_MAX) / BOUND_STEP) * BOUND_STEP;
}

/** Reshapes the curve into one of the shapes to try. */
export function chooseShape(ys: readonly number[]) {
  audio.ui('click');
  gsap.to(calculusRig(), { ...heights(ys), duration: 0.6, ease: 'power2.inOut', overwrite: 'auto' });
}

/** Lab: how many columns fill the area (4 × 2^level). */
export function setLevel(level: number) {
  const rig = calculusRig();
  const l = Math.min(Math.max(Math.round(level), 0), LEVELS - 1);
  gsap.to(rig, { split: l, duration: 0.6, ease: 'power2.inOut', overwrite: 'auto' });
}

/** The column count `split` stands for once it settles. */
export const countFor = (split: number) => {
  const { n, frac } = columnCount(split);
  return frac > 0.5 ? 2 * n : n;
};

export function leaveCalculusYourTurn(restore: boolean) {
  const rig = calculusRig();
  rig.interactive = 0;
  // The story's curve comes back for the handoff.
  if (restore) gsap.to(rig, { ...heights(STORY_YS), a: 1, b: 3, duration: 0.8, ease: 'power2.inOut' });
}
