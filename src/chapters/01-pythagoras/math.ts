/**
 * Pure geometry for chapter 1. All coordinates are in "triangle units" on the (u, v) plane; the station
 * maps them onto the beach. Nothing here touches three.js, so it is unit-tested directly.
 */

export type V2 = [number, number];

export const DEG = Math.PI / 180;

export function hypotenuse(a: number, b: number): number {
  return Math.hypot(a, b);
}

/** Law of cosines: the side opposite the angle `gammaDeg` between sides a and b. */
export function lawOfCosines(a: number, b: number, gammaDeg: number): number {
  return Math.sqrt(Math.max(0, a * a + b * b - 2 * a * b * Math.cos(gammaDeg * DEG)));
}

export interface Triangle {
  /** Vertex where sides a and b meet (the right angle when gamma = 90°). */
  P0: V2;
  /** End of side a, on the u-axis. */
  P1: V2;
  /** End of side b. */
  P2: V2;
  a: number;
  b: number;
  c: number;
}

export function triangle(a: number, b: number, gammaDeg = 90): Triangle {
  const g = gammaDeg * DEG;
  return {
    P0: [0, 0],
    P1: [a, 0],
    P2: [b * Math.cos(g), b * Math.sin(g)],
    a,
    b,
    c: lawOfCosines(a, b, gammaDeg),
  };
}

export interface SquareOnSide {
  corners: [V2, V2, V2, V2];
  center: V2;
  side: number;
  /** Rotation (radians, CCW in uv) that aligns a unit square's local u-axis with the square's outward normal. */
  angle: number;
}

/** The square built outward on segment A→B, on the side away from point `away`. */
export function squareOnSide(A: V2, B: V2, away: V2): SquareOnSide {
  const ex = B[0] - A[0];
  const ey = B[1] - A[1];
  const len = Math.hypot(ex, ey);
  let nx = -ey / len;
  let ny = ex / len;
  if (nx * (away[0] - A[0]) + ny * (away[1] - A[1]) > 0) {
    nx = -nx;
    ny = -ny;
  }
  const C: V2 = [B[0] + nx * len, B[1] + ny * len];
  const D: V2 = [A[0] + nx * len, A[1] + ny * len];
  return {
    corners: [A, B, C, D],
    center: [(A[0] + B[0]) / 2 + (nx * len) / 2, (A[1] + B[1]) / 2 + (ny * len) / 2],
    side: len,
    angle: Math.atan2(ny, nx),
  };
}

export function squaresOn(t: Triangle) {
  return {
    a: squareOnSide(t.P0, t.P1, t.P2),
    b: squareOnSide(t.P0, t.P2, t.P1),
    c: squareOnSide(t.P1, t.P2, t.P0),
  };
}

export function polygonArea(pts: V2[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!;
    const q = pts[(i + 1) % pts.length]!;
    s += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(s) / 2;
}

/**
 * Water levels in the big tank, as fractions of its depth, after pouring a fraction of each small tank.
 * Tanks share one depth, so volume ∝ area and the a-layer is a²/c² of the height.
 */
export function pourLevels(a: number, b: number, c: number, drainedA: number, drainedB: number) {
  const layerA = ((a * a) / (c * c)) * drainedA;
  const layerB = ((b * b) / (c * c)) * drainedB;
  return { layerA, layerB, total: layerA + layerB };
}

/** Pose of a triangle tile: right-angle vertex at (x, y), rotated `rot` radians CCW. */
export interface TilePose {
  x: number;
  y: number;
  rot: number;
}

/**
 * The two classic arrangements of four copies of the triangle inside an (a+b)-square frame.
 * Layout A leaves two empty squares, a² and b²; layout B leaves one tilted square, c².
 * Tile i in A slides to tile i in B (tile 2 does not move at all).
 */
export function tileLayouts(a: number, b: number) {
  const s = a + b;
  const H = Math.PI / 2;
  const A: TilePose[] = [
    { x: 0, y: a, rot: 0 },
    { x: a, y: s, rot: 2 * H },
    { x: s, y: 0, rot: H },
    { x: a, y: a, rot: 3 * H },
  ];
  const B: TilePose[] = [
    { x: 0, y: 0, rot: 0 },
    { x: s, y: s, rot: 2 * H },
    { x: s, y: 0, rot: H },
    { x: 0, y: s, rot: 3 * H },
  ];
  const holesA: V2[][] = [
    [
      [0, 0],
      [a, 0],
      [a, a],
      [0, a],
    ],
    [
      [a, a],
      [s, a],
      [s, s],
      [a, s],
    ],
  ];
  const holeB: V2[] = [
    [a, 0],
    [s, a],
    [b, s],
    [0, b],
  ];
  return { size: s, A, B, holesA, holeB };
}

/** Corners of the tile (right triangle with legs a along local u and b along local v) at a pose. */
export function tileCorners(a: number, b: number, pose: TilePose): [V2, V2, V2] {
  const c = Math.cos(pose.rot);
  const s = Math.sin(pose.rot);
  const tr = (u: number, v: number): V2 => [pose.x + u * c - v * s, pose.y + u * s + v * c];
  return [tr(0, 0), tr(a, 0), tr(0, b)];
}

export function pointInTriangle(p: V2, t: [V2, V2, V2]): boolean {
  const [A, B, C] = t;
  const d1 = (p[0] - B[0]) * (A[1] - B[1]) - (A[0] - B[0]) * (p[1] - B[1]);
  const d2 = (p[0] - C[0]) * (B[1] - C[1]) - (B[0] - C[0]) * (p[1] - C[1]);
  const d3 = (p[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (p[1] - A[1]);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

export function isPythagoreanTriple(a: number, b: number, c: number, eps = 1e-6): boolean {
  const ints = [a, b, c].every((x) => Math.abs(x - Math.round(x)) < eps && x > 0);
  if (!ints) return false;
  const [x, y, z] = [a, b, c].map(Math.round) as [number, number, number];
  return x * x + y * y === z * z;
}

/** Shortest signed angular difference from `from` to `to`. */
export function angleDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Point along the scratched perimeter: draw ∈ [0, 3] runs side a (P0→P1), then c (P1→P2), then b (P2→P0). */
export function perimeterPoint(t: Triangle, draw: number): V2 {
  const d = Math.min(Math.max(draw, 0), 3);
  const order: [V2, V2][] = [
    [t.P0, t.P1],
    [t.P1, t.P2],
    [t.P2, t.P0],
  ];
  const i = Math.min(Math.floor(d), 2);
  const f = d - i;
  const [A, B] = order[i]!;
  return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f];
}
