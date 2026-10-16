/** World placement of every station. The journey flies the camera between them. */
export interface StationPlacement {
  x: number;
  y: number;
  z: number;
  /** Centre of the station's shadow frustum, as an (x, z) offset from the station. */
  shadow?: [number, number];
}

/** The landing teaser hangs in the dusk sky above the beach of chapter 1. */
export const TEASER: StationPlacement = { x: 0, y: 25.4, z: 0 };

export const STATIONS: Record<string, StationPlacement> = {
  // The proofs of chapter 1 sit to the right of the triangle.
  pythagoras: { x: 0, y: 0, z: 0, shadow: [3, 0] },
  // Archimedes drew his circles in the sand too: chapter 2 sits further along the same beach.
  'circle-area': { x: 46, y: 0, z: -38 },
  archimedes: { x: 90, y: 0, z: -80 },
  kepler: { x: 0, y: 400, z: -600 },
  newton: { x: 200, y: 400, z: -600 },
  calculus: { x: 400, y: 200, z: -400 },
  euler: { x: 600, y: 200, z: -400 },
  fourier: { x: 800, y: 200, z: -400 },
  doppler: { x: 1000, y: 0, z: 0 },
  energy: { x: 1200, y: 0, z: 0 },
};

export function station(slug: string): StationPlacement {
  return STATIONS[slug] ?? { x: 0, y: 0, z: 0 };
}

/** Converts station-local coordinates to world coordinates. */
export function toWorld(slug: string, x: number, y: number, z: number): [number, number, number] {
  const s = station(slug);
  return [s.x + x, s.y + y, s.z + z];
}
