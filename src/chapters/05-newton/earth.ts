import { LAND } from './land';

/** Newton's home at Woolsthorpe Manor, Lincolnshire, where the apple fell. */
export const WOOLSTHORPE = { lat: 52.809, lon: -0.631 };

const DEG = Math.PI / 180;

/** The land as polygons of rings, each ring a flat list of longitude, latitude pairs in degrees. */
export const LAND_RINGS: number[][][] = LAND.map((rings) =>
  rings.map((ring) => ring.split(' ').map((v) => Number(v) / 10)),
);

/** Whether a point is on land (inside an odd number of a polygon's rings: its outline but not a hole). */
export function isLand(lat: number, lon: number): boolean {
  for (const rings of LAND_RINGS) {
    let inside = false;
    for (const r of rings) {
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
        const [xi, yi, xj, yj] = [r[i]!, r[i + 1]!, r[j]!, r[j + 1]!];
        if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
      }
    }
    if (inside) return true;
  }
  return false;
}

type V3 = [number, number, number];

/**
 * A point of the globe as three's sphere wraps an equirectangular map round it (longitude −180° at the map's left
 * edge, north at its top): latitude and longitude to a unit vector in the sphere's own frame.
 */
export const surface = (lat: number, lon: number): V3 => [
  Math.cos(lat * DEG) * Math.cos(lon * DEG),
  Math.sin(lat * DEG),
  -Math.cos(lat * DEG) * Math.sin(lon * DEG),
];

/**
 * How to turn the globe so a place sits on top (+y), its east pointing along +x (the way the cannon fires, east
 * with the Earth's turning) and its north away from the viewer (−z). Row-major 3 × 3.
 */
export function placeOnTop(lat: number, lon: number): number[] {
  const up = surface(lat, lon);
  const east: V3 = [-Math.sin(lon * DEG), 0, -Math.cos(lon * DEG)];
  const north: V3 = [
    -Math.sin(lat * DEG) * Math.cos(lon * DEG),
    Math.cos(lat * DEG),
    Math.sin(lat * DEG) * Math.sin(lon * DEG),
  ];
  return [...east, ...up, -north[0], -north[1], -north[2]];
}
