import { CHAPTERS } from '../registry';

export type V3 = [number, number, number];

/**
 * The constellation, in the finale station's own metres: one star per chapter, in the order the story told them,
 * rising from the beach chapters low on the left to the fairground high on the right, with a little depth between
 * them so they shift against each other as the camera moves.
 */
export const STARS: V3[] = [
  [-36, -11, 3],
  [-27, -15, -3],
  [-19, -8, 4],
  [-12, 1, -2],
  [-3, 5, 3],
  [5, -1, -4],
  [13, 4, 2],
  [20, 11, -3],
  [28, 7, 3],
  [36, 15, 0],
];

/** What each chapter kept the same: a name, a sentence or two to say so, and a tag of a word or two for its star. */
export interface Invariant {
  slug: string;
  heading: string;
  body: string;
  tag: string;
  /** The chapter's key, for the note its star sings (its score's tonic). */
  note: 'C' | 'D' | 'E' | 'F' | 'G' | 'A';
}

export const INVARIANTS: Invariant[] = [
  {
    slug: 'pythagoras',
    tag: 'area',
    heading: 'Area',
    body: 'Cut squares into pieces and move them about: the area stays the same. That is how a² + b² became c².',
    note: 'C',
  },
  {
    slug: 'circle-area',
    tag: 'area',
    heading: 'Area, again',
    body: 'Slice a disc and lay the slices in a row: they still cover πr², however thin the slices.',
    note: 'A',
  },
  {
    slug: 'archimedes',
    tag: 'weight',
    heading: 'Weight',
    body: 'Lower a crown into water: the weight it loses is exactly the weight of the water it pushes aside.',
    note: 'D',
  },
  {
    slug: 'kepler',
    tag: 'angular momentum',
    heading: 'Equal areas',
    body: 'Near the Sun or far from it, a planet sweeps out equal areas in equal times: its angular momentum never changes.',
    note: 'E',
  },
  {
    slug: 'newton',
    tag: 'one law',
    heading: 'One law',
    body: 'The pull that drops an apple holds the Moon in its orbit: the same law of gravity on Earth and in the sky.',
    note: 'G',
  },
  {
    slug: 'calculus',
    tag: 'the total change',
    heading: 'The total change',
    body: 'Slice the way from a to b as finely as you like: the climbs of the slices always add up to the same whole climb, F(b) − F(a).',
    note: 'F',
  },
  {
    slug: 'euler',
    tag: 'length one',
    heading: 'Length one',
    body: 'As the point turns round the circle its arrow’s length never changes: always 1, so cos²θ + sin²θ = 1. Pythagoras again.',
    note: 'D',
  },
  {
    slug: 'fourier',
    tag: 'the same wave',
    heading: 'The same wave',
    body: 'Built from circles, the wave keeps its energy: the circles’ squared sizes add up to the whole, a² + b² = c² for waves.',
    note: 'D',
  },
  {
    slug: 'doppler',
    tag: 'the speed of sound',
    heading: 'The speed of sound',
    body: 'Whoever moves, the waves spread at the same speed; only how often they arrive changes, and with it the pitch.',
    note: 'A',
  },
  {
    slug: 'energy',
    tag: 'energy',
    heading: 'Energy',
    body: 'Height, speed and heat trade places all the way round the ride; their total never changes.',
    note: 'C',
  },
];

/** The thread that joins the stars in the order the story told them. */
export function threadLength(stars: V3[] = STARS): number {
  let total = 0;
  for (let i = 1; i < stars.length; i++) {
    const a = stars[i - 1]!;
    const b = stars[i]!;
    total += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  }
  return total;
}

/** How far along the thread (0..1) each star sits: where the drawing reaches it. */
export function starsAlongThread(stars: V3[] = STARS): number[] {
  const total = threadLength(stars);
  const out = [0];
  let run = 0;
  for (let i = 1; i < stars.length; i++) {
    const a = stars[i - 1]!;
    const b = stars[i]!;
    run += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    out.push(run / total);
  }
  return out;
}

/** How far from its star each chapter's icon forms. */
export const ICON_DISTANCE = 8;

/**
 * Where a chapter's icon forms: beside its star, square to the thread there, on the outside of the bend the thread
 * makes at it (above a peak, below a dip), so the icon never lands on the stars either side.
 */
export function iconAt(i: number, stars: V3[] = STARS): V3 {
  const s = stars[i]!;
  const a = stars[Math.max(i - 1, 0)]!;
  const b = stars[Math.min(i + 1, stars.length - 1)]!;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  // Which side of the line from its neighbour before to its neighbour after the star stands (the ends: above).
  const across = dx * (s[1] - a[1]) - dy * (s[0] - a[0]);
  const side = i > 0 && i < stars.length - 1 && across < 0 ? -1 : 1;
  // A quarter turn anticlockwise from the thread's way (up, for a thread running to the right), to that side.
  return [s[0] - (dy / l) * ICON_DISTANCE * side, s[1] + (dx / l) * ICON_DISTANCE * side, s[2]];
}

/** The chapter each star stands for. */
export const STAR_CHAPTERS = CHAPTERS.map((c) => c.slug);
