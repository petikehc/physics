/**
 * Animation rigs: plain mutable objects that GSAP timelines tween and that 3D components read every frame.
 * Keeping animation state as data (not three.js objects) lets the same timeline drive the journey, the Labs
 * and the tests, and lets stations mount and unmount without losing their place.
 */

export interface CameraRig {
  px: number;
  py: number;
  pz: number;
  tx: number;
  ty: number;
  tz: number;
  /** Extra height added to the position (used for arcing flights). */
  lift: number;
  /** Orbit around the target: mixes the cartesian position with a polar one. */
  orbitMix: number;
  orbitAngle: number;
  orbitRadius: number;
  orbitHeight: number;
  fov: number;
  roll: number;
  /** Handheld "breathing" amplitude, 0 = locked off. */
  shake: number;
  /** World-space point kept in focus by the depth-of-field effect. */
  fx: number;
  fy: number;
  fz: number;
  /** 0 = no depth of field, 1 = full bokeh. */
  dof: number;
  /** Black veil used to hide flights for reduced-motion viewers. */
  veil: number;
}

export function createCameraRig(): CameraRig {
  return {
    // Defaults match the landing teaser's hand-over pose, so the journey starts without a jump.
    px: 0,
    py: 25.1,
    pz: 11.5,
    tx: 0,
    ty: 25.4,
    tz: 0,
    lift: 0,
    orbitMix: 0,
    orbitAngle: 0,
    orbitRadius: 10,
    orbitHeight: 4,
    fov: 40,
    roll: 0,
    shake: 0.5,
    fx: 0,
    fy: 26,
    fz: 0,
    dof: 0,
    veil: 0,
  };
}

export interface DustRig {
  from: string;
  to: string;
  morph: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  rotY: number;
  /** Continuous spin speed (radians per second) added on top of rotY. */
  spin: number;
  size: number;
  opacity: number;
  colorA: string;
  colorB: string;
  /** Curl-noise swirl strength during a morph. */
  swirl: number;
  /** Idle drift strength once settled. */
  drift: number;
}

export function createDustRig(): DustRig {
  return {
    from: 'pythagoras',
    to: 'pythagoras',
    morph: 1,
    x: 0,
    y: 27,
    z: 0,
    scale: 0.85,
    rotY: 0,
    spin: 0.08,
    size: 1,
    opacity: 1,
    colorA: '#f4efe6',
    colorB: '#e2704f',
    swirl: 1,
    drift: 1,
  };
}

/** Copies every own property of `src` onto `dst` (used to reset rigs between modes). */
export function resetRig<T extends object>(dst: T, src: T): T {
  Object.assign(dst, src);
  return dst;
}
