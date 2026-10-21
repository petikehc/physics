import { audio } from '../../audio';
import { energyRig } from './rig';
import { HEIGHT_RANGE, MASS_RANGE, sandboxRelease } from './sandbox';

const clamp = (x: number, [lo, hi]: [number, number]) => Math.min(Math.max(x, lo), hi);

/** Sets the start's height (h0) or the far hill's (h4), in metres; the car goes back to the start. */
export function setHill(which: 'h0' | 'h4', h: number) {
  const rig = energyRig();
  rig[which] = Math.round(clamp(h, HEIGHT_RANGE) * 10) / 10;
}

/** Rolling friction, as a fraction of the car's weight. */
export function setFriction(mu: number) {
  energyRig().mu = Math.min(Math.max(mu, 0), 0.2);
}

/** The test car's mass, kg. */
export function setMass(kg: number) {
  energyRig().mass = clamp(kg, MASS_RANGE);
}

/** Puts the car back at the start and lets it go again. */
export function release() {
  audio.ui('click');
  sandboxRelease(energyRig());
}

export function leaveEnergyYourTurn() {
  energyRig().interactive = 0;
}
