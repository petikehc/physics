import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { audio } from '../../audio';
import { nearestInterval, speedRange, STORY, turnRange } from './math';
import { keplerRig } from './rig';

/** Seconds per orbit while the viewer plays with it. */
export const PLAY_PERIOD = 8;

/** Earth years per second in the Lab's solar-system view. */
const LAB_YEARS_PER_SECOND = 0.35;

/** Runs the planet's year while the viewer has the controls (Your turn and the Lab). */
export function useKeplerClock() {
  const rig = keplerRig();
  useFrame((_, dt) => {
    if (rig.interactive < 0.5) return;
    const step = Math.min(dt, 0.1);
    if (rig.lab > 0.5 && rig.system > 0.01) rig.years += step * LAB_YEARS_PER_SECOND;
    else rig.phase += step / PLAY_PERIOD;
  });
}

export function setEccentricity(e: number) {
  keplerRig().e = Math.min(Math.max(e, 0), 0.9);
}

export function setFanCount(n: number) {
  const rig = keplerRig();
  if (Math.round(rig.fanCount) === n) return;
  rig.fanCount = n;
  audio.cue('tick');
}

/** Orbits to try: three real planets and a long comet-like one. */
export const PRESETS = [
  { id: 'earth', name: 'Earth', e: 0.0167 },
  { id: 'mars', name: 'Mars', e: 0.0934 },
  { id: 'mercury', name: 'Mercury', e: 0.2056 },
  { id: 'comet', name: 'A comet', e: 0.9 },
] as const;

/** Glides the orbit to a preset's shape. */
export function choosePreset(e: number) {
  audio.ui('click');
  gsap.to(keplerRig(), { e, duration: 0.9, ease: 'power2.inOut', overwrite: 'auto' });
}

/**
 * What the current orbit does, for the readouts: its speed range, and the swing in its turning speed as a musical
 * interval, named when one of Kepler's is within 80 cents (less than a semitone) of it.
 */
export function orbitFacts(e: number) {
  const turn = turnRange(e);
  const near = nearestInterval(turn);
  return {
    speed: speedRange(e),
    turn,
    circle: e < 0.004,
    interval: Math.abs(near.cents) <= 80 ? near : null,
    octaves: Math.log2(turn),
  };
}

export function leaveKeplerYourTurn(restore: boolean) {
  const rig = keplerRig();
  rig.interactive = 0;
  // Back to the story's orbit before the camera pulls out to the solar system.
  if (restore) gsap.to(rig, { e: STORY.e, fanCount: STORY.fans, duration: 0.7, ease: 'power2.inOut' });
}
