import { chapterRig } from '../../engine/runtime';

/** Everything chapter 7 animates. Timelines tween these numbers; the station derives all geometry from them. */
export interface EulerRig {
  /** The complex plane: its disc of grid, its axes and the circle of radius 1, 0..1; the names 1, i, −1, −i, 0..1; the axes' names, 0..1. */
  plane: number;
  marks: number;
  names: number;
  /** The quarter turns: an arrow from 1 turned `quarter` quarter turns (a fraction is part way), shown 0..1. */
  quarter: number;
  quarters: number;
  /** The point e^{iθ}, its arrow from the centre, 0..1; its name beside it, 0..1; where it is (θ, radians); its push, at right angles, 0..1. */
  point: number;
  tag: number;
  theta: number;
  push: number;
  /** The way the point has come, from θ = 0, 0..1; how far it is drawn out along time (0 = round the circle, 1 = a helix). */
  trail: number;
  along: number;
  /** The angle θ marked with an arc, 0..1. */
  angle: number;
  /** The two walls the helix's shadows fall on, and their lights, 0..1; the shadows (cosine and sine), 0..1; lines from the point to its shadows, 0..1. */
  walls: number;
  shadows: number;
  rays: number;
  /** The right triangle riding the point, legs cos θ and sin θ, 0..1; and cos² + sin² = 1, 0..1. */
  triangle: number;
  squares: number;
  /** The series' arrows laid head to tail: how many (a fraction draws the next), and shown, 0..1. */
  terms: number;
  series: number;
  /** The +1 that walks the point at −1 home to 0, drawn 0..1. */
  plus: number;
  /** The five constants flying in from earlier chapters (staggered), 0..1, and then gone, 0..1. */
  constants: number;
  gone: number;
  /** The handoff: a smaller arrow on the tip of the point's, 0..1; the θ its tip's path starts from; that path, 0..1. */
  epicycle: number;
  from: number;
  trace: number;
  /** The point's voice, 0..1: it pans with cos θ and rises and falls with sin θ. */
  voice: number;
  interactive: number;
  lab: number;
}

export const EULER_DEFAULTS: EulerRig = {
  plane: 0,
  marks: 0,
  names: 0,
  quarter: 0,
  quarters: 0,
  point: 0,
  tag: 0,
  theta: 0,
  push: 0,
  trail: 0,
  along: 0,
  angle: 0,
  walls: 0,
  shadows: 0,
  rays: 0,
  triangle: 0,
  squares: 0,
  terms: 0,
  series: 0,
  plus: 0,
  constants: 0,
  gone: 0,
  epicycle: 0,
  from: 0,
  trace: 0,
  voice: 0,
  interactive: 0,
  lab: 0,
};

export function eulerRig(): EulerRig {
  return chapterRig('euler', () => ({ ...EULER_DEFAULTS }));
}

// ---------- Layout (station space, world units) ----------

/** The centre of the complex plane (it stands upright, facing +z) and the radius of its circle. */
export const C: [number, number, number] = [0, 2.6, 0];
export const R = 1.6;
/** Time runs back along −z: world units per radian, and how far the helix goes (two turns). */
export const K = 0.42;
export const THETA_MAX = 4 * Math.PI;
/** The walls the helix's shadows fall on: the floor below it, and a wall to its left. */
export const FLOOR_Y = C[1] - R - 0.7;
export const WALL_X = -R - 0.7;
export const WALL_Z: [number, number] = [0.7, -K * THETA_MAX - 0.7];
/** The series' arrows: as many as the story lays down. */
export const TERMS = 16;
/**
 * The handoff's smaller arrow: its length (as a share of the first's), how many times as fast it turns (the other
 * way), and where it starts (pointing back in), so the tip traces a rounded square.
 */
export const EPI = { r: 0.16, k: -3, phase: Math.PI };

/** A complex number (re, im) as a point of the plane, drawn out `t` radians along time (0 = in the plane). */
export const onPlane = (re: number, im: number, t = 0): [number, number, number] => [
  C[0] + re * R,
  C[1] + im * R,
  C[2] - K * t,
];

export const SYM7 = {
  /** The real part, cos θ: amber. */
  cos: '#ffb35c',
  /** The imaginary part, sin θ, and i itself: the chapter's cyan. */
  sin: '#3fd0e8',
  point: '#f4efe6',
  grid: '#3fd0e8',
  /** The handoff's smaller arrow, in the next chapter's magenta. */
  small: '#e05bb4',
  /** The constants' own colours: e from chapter 6, π from chapter 2. */
  e: '#b69cff',
  pi: '#8fd3ff',
};
