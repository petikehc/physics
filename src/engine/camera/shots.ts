import { runtime } from '../runtime';
import { station } from '../world/stations';

type V3 = [number, number, number];

/** A camera move in station-local coordinates. Unset fields keep their current value. */
export interface Shot {
  pos?: V3;
  target?: V3;
  focus?: V3;
  fov?: number;
  shake?: number;
  dof?: number;
  roll?: number;
  lift?: number;
  veil?: number;
  orbit?: { mix?: number; angle?: number; radius?: number; height?: number };
}

export function shotVars(slug: string, s: Shot): Record<string, number> {
  const o = station(slug);
  const v: Record<string, number> = {};
  if (s.pos) Object.assign(v, { px: o.x + s.pos[0], py: o.y + s.pos[1], pz: o.z + s.pos[2] });
  if (s.target) Object.assign(v, { tx: o.x + s.target[0], ty: o.y + s.target[1], tz: o.z + s.target[2] });
  if (s.focus) Object.assign(v, { fx: o.x + s.focus[0], fy: o.y + s.focus[1], fz: o.z + s.focus[2] });
  if (s.fov !== undefined) v.fov = s.fov;
  if (s.shake !== undefined) v.shake = s.shake;
  if (s.dof !== undefined) v.dof = s.dof;
  if (s.roll !== undefined) v.roll = s.roll;
  if (s.lift !== undefined) v.lift = s.lift;
  if (s.veil !== undefined) v.veil = s.veil;
  if (s.orbit) {
    if (s.orbit.mix !== undefined) v.orbitMix = s.orbit.mix;
    if (s.orbit.angle !== undefined) v.orbitAngle = s.orbit.angle;
    if (s.orbit.radius !== undefined) v.orbitRadius = s.orbit.radius;
    if (s.orbit.height !== undefined) v.orbitHeight = s.orbit.height;
  }
  return v;
}

/** Adds a camera move to a timeline. */
export function shot(
  tl: gsap.core.Timeline,
  slug: string,
  s: Shot,
  duration: number,
  position?: gsap.Position,
  ease = 'power2.inOut',
) {
  tl.to(runtime.camera, { ...shotVars(slug, s), duration, ease }, position);
}

/** Sets camera fields instantly at a point in a timeline. */
export function cut(tl: gsap.core.Timeline, slug: string, s: Shot, position?: gsap.Position) {
  tl.set(runtime.camera, shotVars(slug, s), position);
}
