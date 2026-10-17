import { orbitAt, PLANETS, type Planet } from './math';
import { AU, plane } from './rig';

const DEG = Math.PI / 180;

/**
 * Where each orbit's perihelion points (degrees, measured from Mars', which the story lays along +x) and where
 * each planet starts in its year. The perihelia are the real ones; the starting places just spread them out.
 */
const LAYOUT: Record<string, { peri: number; start: number }> = {
  mercury: { peri: 101.4, start: 0.15 },
  venus: { peri: 155.5, start: 0.55 },
  earth: { peri: 126.9, start: 0.82 },
  mars: { peri: 0, start: 0 },
  jupiter: { peri: 38.7, start: 0.35 },
  saturn: { peri: 116.4, start: 0.62 },
};

export const perihelionAngle = (p: Planet) => (LAYOUT[p.id]?.peri ?? 0) * DEG;

/** A point of planet `p`'s orbit plane, turned so its perihelion points the right way, in station space. */
export function systemPoint(p: Planet, x: number, y: number, h = 0): [number, number, number] {
  const a = perihelionAngle(p);
  return plane(x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), h);
}

/** Where planet `p` is after `years`, in station space (Mars is the story's planet: see Orbit). */
export function planetAt(p: Planet, years: number): [number, number, number] {
  const q = orbitAt(p.a * AU, p.e, (LAYOUT[p.id]?.start ?? 0) + years / p.T);
  return systemPoint(p, q.x, q.y);
}

export const EARTH = PLANETS.find((p) => p.id === 'earth')!;
