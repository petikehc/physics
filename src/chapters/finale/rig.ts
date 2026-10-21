import { chapterRig } from '../../engine/runtime';
import { mulberry32, registerShape } from '../../engine/dust/shapes';
import { STARS } from './layout';

export const SLUG = 'finale';

/** What the finale's timeline animates. */
export interface FinaleRig {
  /** The constellation shown at all (0..1). */
  on: number;
  /** How many stars have lit, one after another (0..10, fractional while one is lighting). */
  lit: number;
  /** How much of the thread joining them is drawn (0..1). */
  thread: number;
  /** How many stars the sweep has reached, each keeping its chapter's colour once it has (0..10). */
  visited: number;
  /** The star the sweep is at (−1: none), and how strongly the others step back for it (0..1). */
  focus: number;
  focusAmt: number;
  /** What the star in focus kept the same, in a word or two beside it (0..1). */
  tag: number;
  /** Every star at full brightness and colour, the thread too (Noether). */
  glow: number;
  /** The stars' numerals beside them (0..1). */
  labels: number;
  /** The constellation is the index: stars can be pointed at and chosen. */
  index: number;
}

export const FINALE_DEFAULTS: FinaleRig = {
  on: 0,
  lit: 0,
  thread: 0,
  visited: 0,
  focus: -1,
  focusAmt: 0,
  tag: 0,
  glow: 0,
  labels: 0,
  index: 0,
};

export function finaleRig(): FinaleRig {
  return chapterRig(SLUG, () => ({ ...FINALE_DEFAULTS }));
}

/** The Dust's scale while it is the constellation: the same as the night's star shell, so one can become the other. */
export const DUST_SCALE = 4.2;

/** The Dust gathered into the constellation: a knot of light at each star and a faint trail along the thread. */
function constellation(n: number): Float32Array {
  const rng = mulberry32(31);
  const out = new Float32Array(n * 3);
  const gauss = () => {
    const u = Math.max(rng(), 1e-9);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  };
  for (let i = 0; i < n; i++) {
    let p: [number, number, number];
    if (rng() < 0.72) {
      const s = STARS[Math.floor(rng() * STARS.length)]!;
      const r = 0.8;
      p = [s[0] + gauss() * r, s[1] + gauss() * r, s[2] + gauss() * r];
    } else {
      const k = Math.floor(rng() * (STARS.length - 1));
      const a = STARS[k]!;
      const b = STARS[k + 1]!;
      const t = rng();
      const j = 0.25;
      p = [
        a[0] + (b[0] - a[0]) * t + gauss() * j,
        a[1] + (b[1] - a[1]) * t + gauss() * j,
        a[2] + (b[2] - a[2]) * t + gauss() * j,
      ];
    }
    out[i * 3] = p[0] / DUST_SCALE;
    out[i * 3 + 1] = p[1] / DUST_SCALE;
    out[i * 3 + 2] = p[2] / DUST_SCALE;
  }
  return out;
}

registerShape('constellation', constellation);
