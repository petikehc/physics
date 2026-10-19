import gsap from 'gsap';
import { audio } from '../../audio';
import { eulerRig, TERMS } from './rig';

/** θ runs once round, from −π to π: the series' arrows stay on screen, and π and −π are the same point, −1. */
export const THETA_MIN = -Math.PI;
export const THETA_MAX_TURN = Math.PI;
/** How close to one of the four quarter points a dragged θ snaps onto it. */
export const SNAP = 0.06;
const QUARTER = Math.PI / 2;

/** Which of 1, i, −1, −i (0..3) θ sits exactly on, if any. */
export function quarterAt(theta: number): number | null {
  const k = Math.round(theta / QUARTER);
  return Math.abs(theta - k * QUARTER) < 1e-9 ? ((k % 4) + 4) % 4 : null;
}

let landed: number | null = null;
let hush = 0;

/**
 * Moves the point to θ (dragged, or from the slider), snapping onto 1, i, −1 and −i with a chime as it lands. `sing`
 * lets the point's voice sound for a moment (the slider's way of singing; a drag sings for as long as it lasts).
 */
export function setTheta(theta: number, snap = true, sing = false) {
  const rig = eulerRig();
  if (sing) {
    rig.voice = 1;
    window.clearTimeout(hush);
    hush = window.setTimeout(() => (rig.voice = 0), 300);
  }
  let t = Math.min(Math.max(theta, THETA_MIN), THETA_MAX_TURN);
  if (snap) {
    const q = Math.round(t / QUARTER) * QUARTER;
    if (Math.abs(t - q) < SNAP) t = q;
  }
  const k = quarterAt(t);
  if (k !== null && k !== landed) audio.cue('arrive', { k });
  landed = k;
  rig.theta = t;
}

/** Sends the point round to θ, singing on the way (a preset). */
export function goTo(theta: number) {
  const rig = eulerRig();
  audio.ui('click');
  const t = Math.min(Math.max(theta, THETA_MIN), THETA_MAX_TURN);
  const d = 0.5 + Math.abs(t - rig.theta) * 0.25;
  gsap.killTweensOf(rig, 'theta,voice');
  rig.voice = 1;
  gsap.to(rig, {
    theta: t,
    duration: d,
    ease: 'power2.inOut',
    onComplete: () => {
      rig.voice = 0;
      setTheta(t);
    },
  });
}

/** How many of the series' terms are laid down. */
export function setTerms(n: number) {
  const rig = eulerRig();
  const to = Math.min(Math.max(Math.round(n), 0), TERMS);
  gsap.to(rig, { terms: to, series: to > 0 ? 1 : 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
}

export function leaveEulerYourTurn(restore: boolean) {
  const rig = eulerRig();
  rig.interactive = 0;
  rig.voice = 0;
  landed = null;
  // The story's point goes back to −1 for the handoff.
  if (restore) gsap.to(rig, { theta: Math.PI, terms: 0, series: 0, duration: 0.8, ease: 'power2.inOut' });
}
