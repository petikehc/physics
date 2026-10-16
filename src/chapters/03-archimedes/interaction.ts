import { audio } from '../../audio';
import { FLUIDS, MATERIALS, settle } from './math';
import { archimedesRig } from './rig';

/** Drops a block of MATERIALS[i] into the tank (the station animates the fall and the bob). */
export function chooseMaterial(i: number) {
  const rig = archimedesRig();
  if (Math.round(rig.material) === i) return;
  rig.material = i;
  audio.cue('splash');
}

/** Fills the tank with FLUIDS[i]: the block rises or sinks to its new level. */
export function chooseFluid(i: number) {
  const rig = archimedesRig();
  if (Math.round(rig.fluid) === i) return;
  rig.fluid = i;
  audio.cue('plunk', { small: 1 });
}

/** What the current choice does, for the readouts. */
export function currentChoice() {
  const rig = archimedesRig();
  const m = MATERIALS[Math.round(rig.material)] ?? MATERIALS[2]!;
  const f = FLUIDS[Math.round(rig.fluid)] ?? FLUIDS[1]!;
  return { m, f, ...settle(m.density, f.density) };
}

export function leaveArchimedesYourTurn() {
  archimedesRig().interactive = 0;
}
