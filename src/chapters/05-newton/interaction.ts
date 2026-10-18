import { useFrame } from '@react-three/fiber';
import { audio } from '../../audio';
import { circularSpeed, describe, escapeSpeed, fire, fromKms, kms, LAUNCH_R, type Flight } from './math';
import { newtonRig } from './rig';

/** Speeds the cannon can be set to (km/s). */
export const SPEED_RANGE = { min: 1, max: 12, step: 0.1 };
export const ELEVATION_RANGE = { min: 0, max: 60, step: 1 };

/** Shots to try: one that lands, the circle, an ellipse, and one that never comes back. */
export const PRESETS = [
  { id: 'lands', name: 'Falls short', speed: 6.5 },
  { id: 'circle', name: 'Circles', speed: Math.round(kms(circularSpeed(LAUNCH_R)) * 100) / 100 },
  { id: 'ellipse', name: 'Ellipse', speed: 8 },
  { id: 'escape', name: 'Escapes', speed: 10.5 },
] as const;

/** Real seconds a flight takes to play: short hops quickly, long orbits a little slower, all within a few seconds. */
export function playSeconds(f: Flight): number {
  const span = f.outcome === 'orbits' ? f.period : f.duration;
  return Math.min(9, Math.max(2.4, 2.6 + 1.25 * Math.log(span / 0.4)));
}

let current: { key: string; f: Flight } | null = null;
/** The viewer's shot, worked out once per setting. */
export function playerFlight(): Flight {
  const rig = newtonRig();
  const key = `${rig.speed.toFixed(3)}:${rig.elevation.toFixed(2)}`;
  if (current?.key !== key) current = { key, f: fire(fromKms(rig.speed), (rig.elevation * Math.PI) / 180) };
  return current.f;
}

/** Flies the viewer's shot while they have the controls (Your turn and the Lab). */
export function useNewtonClock() {
  const rig = newtonRig();
  useFrame((_, dt) => {
    if (rig.interactive < 0.5) return;
    const f = playerFlight();
    const step = Math.min(dt, 0.1);
    rig.fly += (step * (f.outcome === 'orbits' ? f.period : f.duration)) / playSeconds(f);
    // A flight that ends (it lands, or is gone) stays where it ended.
    if (f.outcome !== 'orbits') rig.fly = Math.min(rig.fly, f.duration);
  });
}

let lastBoom = 0;
/** Fires the cannon again from the top: the ball starts over (and the cannon booms, but not on every slider step). */
export function fireCannon() {
  const rig = newtonRig();
  rig.fly = 0;
  rig.ball = 1;
  const now = performance.now();
  if (now - lastBoom > 350) {
    lastBoom = now;
    audio.cue('cannon');
  }
}

export function setSpeed(kmPerS: number) {
  const rig = newtonRig();
  const v = Math.min(Math.max(kmPerS, SPEED_RANGE.min), SPEED_RANGE.max);
  if (Math.abs(v - rig.speed) < 1e-6) return;
  rig.speed = v;
  fireCannon();
}

export function setElevation(degrees: number) {
  const rig = newtonRig();
  const a = Math.min(Math.max(degrees, ELEVATION_RANGE.min), ELEVATION_RANGE.max);
  if (Math.abs(a - rig.elevation) < 1e-6) return;
  rig.elevation = a;
  fireCannon();
}

export function choosePreset(speed: number) {
  audio.ui('click');
  const rig = newtonRig();
  rig.elevation = 0;
  rig.speed = speed;
  fireCannon();
}

/** What the viewer's shot does, for the readout. */
export function shotFacts(speed: number, elevation: number) {
  const f = fire(fromKms(speed), (elevation * Math.PI) / 180);
  return {
    ...describe(f),
    circular: kms(circularSpeed(LAUNCH_R)),
    escape: kms(escapeSpeed(LAUNCH_R)),
  };
}

export function leaveNewtonYourTurn(restore: boolean) {
  const rig = newtonRig();
  rig.interactive = 0;
  // The viewer's ball goes as the story moves on (rather than turn back into one of the story's shots).
  if (restore) rig.ball = 0;
}
