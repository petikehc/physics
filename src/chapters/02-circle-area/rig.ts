import { chapterRig } from '../../engine/runtime';

/** Everything chapter 2 animates. Timelines tween these numbers; the station derives all geometry from them. */
export interface CircleRig {
  /** Radius of the disc, in world units. */
  r: number;
  /** Solid bronze disc rising out of the sand, 0..1. */
  disc: number;
  /** 1 shows the uncut disc; 0 shows it as separate pieces (swapped the instant the cuts are done). */
  whole: number;
  /** Knife strokes across the disc, 0..1 (the n/2 diameters, one after another). */
  cut: number;
  /** Radial gap between the pieces while they still form a disc. */
  explode: number;
  /** Radius line and its label on the disc. */
  radius: number;
  /** Number of pieces now (a power of two). */
  n: number;
  /** Where the pieces start: 0 = the disc, otherwise the count of the previous row (each piece starts inside its parent). */
  fromN: number;
  /** 0..1 progress from the start poses to the row. */
  deal: number;
  /** How high pieces arc while being dealt. */
  lift: number;
  /** Width / height brackets and labels on the row. */
  dims: number;
  /** Outline of the πr × r rectangle over the row. */
  ghost: number;
  /** Pieces sinking back into the sand. */
  piecesSink: number;
  /** Disc of thin rings rising for the onion proof. */
  rings: number;
  /** 0..1: rings uncoil (outermost first) and stack into a triangle. */
  unroll: number;
  /** Triangle brackets and labels. */
  triDims: number;
  /** Rings sinking back into the sand. */
  ringsSink: number;
  interactive: number;
  lab: number;
}

export const CIRCLE_DEFAULTS: CircleRig = {
  r: 1.4,
  disc: 0,
  whole: 1,
  cut: 0,
  explode: 0,
  radius: 0,
  n: 8,
  fromN: 0,
  deal: 0,
  lift: 0.7,
  dims: 0,
  ghost: 0,
  piecesSink: 0,
  rings: 0,
  unroll: 0,
  triDims: 0,
  ringsSink: 0,
  interactive: 0,
  lab: 0,
};

export function circleRig(): CircleRig {
  return chapterRig('circle-area', () => ({ ...CIRCLE_DEFAULTS }));
}

/** Thickness of the bronze disc and its pieces (world units). */
export const DISC_THICKNESS = 0.16;
/** Thickness of the onion rings. */
export const RING_THICKNESS = 0.07;
/** Number of rings in the onion proof. */
export const RING_COUNT = 24;
/** Radius range of the controls. */
export const R_MIN = 0.8;
export const R_MAX = 2;
/** Piece counts the story and the controls use. */
export const SLICE_COUNTS = [4, 8, 16, 32, 64, 128, 256] as const;

/** Station-local world position of a (u, v) point: u to the right, v away from the camera. */
export function uv(u: number, v: number, y = 0): [number, number, number] {
  return [u, y, -v];
}

export const SYM2 = {
  r: '#f2b04a',
  pi: '#8fd3ff',
  bronzeA: '#b97a3c',
  bronzeB: '#e0a663',
};
