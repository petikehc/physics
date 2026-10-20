import gsap from 'gsap';
import { audio } from '../../audio';
import { loopReset } from './loop';
import { dopplerRig, LOOP, PAVEMENT, SIREN_NEAR } from './rig';

/** Puts the listener at (x, z) on the street, kept within the loop and the pavements. */
export function placeListener(x: number, z: number) {
  const rig = dopplerRig();
  rig.lx = Math.min(Math.max(x, -LOOP), LOOP);
  rig.lz = Math.min(Math.max(z, -PAVEMENT + 0.4), PAVEMENT - 0.4);
}

/** How fast the source goes, as a Mach number (its speed over sound's). */
export function setSourceSpeed(m: number) {
  gsap.to(dopplerRig(), { sm: m, duration: 0.35, ease: 'power1.out', overwrite: 'auto' });
}

/** How fast the listener walks along the street, as a Mach number (negative: the other way). */
export function setListenerSpeed(m: number) {
  dopplerRig().lm = m;
}

/** Lab: the ambulance (up to just under the speed of sound) or the jet (up to twice it). */
export function chooseSource(kind: 'ambulance' | 'jet') {
  audio.ui('click');
  const rig = dopplerRig();
  const jet = kind === 'jet';
  const m = jet ? Math.max(rig.sm, 1.4) : Math.min(rig.sm, 0.9);
  Object.assign(rig, {
    kind: jet ? 1 : 0,
    ambulance: jet ? 0 : 1,
    jet: jet ? 1 : 0,
    sm: m,
    cone: jet ? 1 : 0,
  });
  rig.siren = jet ? 0 : SIREN_NEAR;
  rig.roar = jet ? 1 : 0;
  loopReset(m, rig.sandT);
}

export function leaveDopplerYourTurn() {
  dopplerRig().interactive = 0;
}
