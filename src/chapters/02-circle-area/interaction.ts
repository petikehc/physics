import gsap from 'gsap';
import { audio } from '../../audio';
import { circleRig } from './rig';

const DEAL_TWEEN = 'circle-deal';

/**
 * Re-cuts the disc into `n` pieces and deals them into the row. Doubling (or more) splits the pieces already
 * in the row; fewer pieces are re-cut from a fresh disc.
 */
export function dealTo(n: number, duration = 1.1) {
  const rig = circleRig();
  if (n === rig.n && rig.deal >= 1) return;
  const prev = rig.n;
  const settled = rig.deal >= 0.999;
  gsap.getById(DEAL_TWEEN)?.kill();
  Object.assign(rig, {
    n,
    fromN: settled && n > prev && n % prev === 0 ? prev : 0,
    explode: 0,
    deal: 0,
    lift: n >= 64 ? 0.12 : 0.45,
  });
  gsap.to(rig, { id: DEAL_TWEEN, deal: 1, duration, ease: 'none' });
  audio.cue('double', { k: Math.max(0, Math.log2(n) - 3) });
  audio.cue('riffle', { n: Math.min(n, 24), dur: duration * 0.5, delay: duration * 0.5 });
}

/** Ends the Your-turn moment. On Continue the row is settled where it is, and the story takes it from there. */
export function leaveCircleYourTurn(restore: boolean) {
  const rig = circleRig();
  rig.interactive = 0;
  gsap.getById(DEAL_TWEEN)?.kill();
  if (restore) Object.assign(rig, { fromN: 0, deal: 1 });
}
