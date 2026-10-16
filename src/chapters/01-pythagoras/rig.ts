import { chapterRig } from '../../engine/runtime';

/** Everything chapter 1 animates. Timelines tween these numbers; the station derives all geometry from them. */
export interface PythagorasRig {
  /** Leg lengths and the angle between them, in triangle units / degrees. */
  a: number;
  b: number;
  gamma: number;
  /** World units per triangle unit (shrinks in Your turn / Lab so big triangles fit). */
  scale: number;

  /** Perimeter scratched so far: 0..3 (side a, then c, then b). */
  draw: number;
  /** Visibility of the triangle groove (smoothed away before the handoff). */
  groove: number;
  stick: number;
  labels: number;
  rightMark: number;

  /** Tanks rising out of the sand, 0..1. */
  tanks: number;
  /** Small tanks' pour progress: fly over, drain, fly home. */
  pourA: number;
  pourB: number;
  /** Shows the big tank full (a² and b² layers) regardless of the pour (Your turn / Lab display). */
  cFull: number;
  areaLabels: number;

  /** Rearrangement proof. */
  frame: number;
  tiles: number;
  layout: number;
  glowA: number;
  glowB: number;
  /** Sinks the whole rearrangement proof back into the sand. */
  proofSink: number;

  /** Handoff: the hypotenuse swings around P1 and carves a circle. */
  radius: number;
  circle: number;

  /** Drag handles on the free vertices. */
  interactive: number;
  /** Lab only: let the angle vary and show overflow / shortfall in the big tank. */
  lab: number;
}

export const PYTHAGORAS_DEFAULTS: PythagorasRig = {
  a: 3,
  b: 4,
  gamma: 90,
  scale: 0.55,
  draw: 0,
  groove: 1,
  stick: 0,
  labels: 0,
  rightMark: 0,
  tanks: 0,
  pourA: 0,
  pourB: 0,
  cFull: 0,
  areaLabels: 0,
  frame: 0,
  tiles: 0,
  layout: 0,
  glowA: 0,
  glowB: 0,
  proofSink: 0,
  radius: 0,
  circle: 0,
  interactive: 0,
  lab: 0,
};

export function pythagorasRig(): PythagorasRig {
  return chapterRig('pythagoras', () => ({ ...PYTHAGORAS_DEFAULTS }));
}

/** World units per triangle unit for the story triangle (3-4-5). */
export const BASE_SCALE = 0.55;
/** Depth of every tank, in world units (equal depths make volume proportional to area). */
export const TANK_DEPTH = 0.9;
/** Where triangle-uv (0,0) sits, in uv units relative to the station origin. */
export const UV_OFFSET: [number, number] = [-1.5, -2];
/** Frame of the rearrangement proof, in triangle-uv. */
export const FRAME_ORIGIN: [number, number] = [9.5, -1.5];

/** Stagger used for the tile flights; the timeline uses the same numbers to place the clack cues. */
export const TILE_STAGGER = 0.15;
export const SLIDE_STAGGER = 0.2;
/** Tiles that move between layout A and B (tile 2 already sits in place). */
export const SLIDING_TILES = [0, 1, 3] as const;

/** Scale used while the viewer drags (constant, so the handle stays under the pointer). */
export const INTERACTIVE_SCALE = 0.36;
/** Leg range offered to the viewer. */
export const LEG_MIN = 1;
export const LEG_MAX = 12;

/** Station-local world position of a triangle-uv point at the given scale. */
export function uvToLocal(u: number, v: number, scale: number, y = 0): [number, number, number] {
  return [(u + UV_OFFSET[0]) * scale, y, -(v + UV_OFFSET[1]) * scale];
}

export const SYM = {
  a: '#f2b04a',
  b: '#45c4b8',
  c: '#e2704f',
};
