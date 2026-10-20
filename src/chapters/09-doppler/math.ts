/**
 * Chapter 9's maths: the waves a moving source sends out, what a listener hears of them, the cone they pile into past
 * the speed of sound, and light's own Doppler shift, the red shift of a receding galaxy.
 */

export type V3 = [number, number, number];

/** The speed of sound in air at 20 °C, in metres a second. */
export const SOUND = 343;

/**
 * Doppler's formula: the frequency heard from a source of frequency `f`, where sound travels at `v`, the listener moves
 * towards the source at `vo` and the source towards the listener at `vs` (negative: away).
 */
export const observed = (f: number, v: number, vo: number, vs: number) => (f * (v + vo)) / (v - vs);

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export interface Heard {
  /** How long ago the sound being heard now was sent, and how far it has come. */
  delay: number;
  distance: number;
  /** The frequency heard over the frequency sent. */
  ratio: number;
  /** Where the source was when it sent it. */
  from: V3;
}

/**
 * What a listener at `l` (moving at `vl`) hears now of a source that is at `s` now, moving at a steady `vs`, with sound
 * travelling at `c`. The sound arriving now was sent a time Δ ago from where the source was then, s − vs·Δ, and has
 * come c·Δ since: |l − s + vs·Δ| = c·Δ, a quadratic in Δ. Its pitch is changed by how fast the two close along that
 * line, (c − û·vl) / (c − û·vs), û pointing from where the sound was sent to the listener. Faster than sound, a
 * listener outside the cone the source drags behind it hears nothing yet (null); inside it, two sounds arrive at
 * once, and this is the one sent more recently, the one heard the right way round.
 */
export function heard(s: V3, vs: V3, l: V3, vl: V3, c: number): Heard | null {
  const a0 = sub(l, s);
  const a = dot(vs, vs) - c * c;
  const b = 2 * dot(a0, vs);
  const k = dot(a0, a0);
  if (k < 1e-18) return { delay: 0, distance: 0, ratio: 1, from: [...s] };
  const roots: number[] = [];
  if (Math.abs(a) < 1e-12) {
    if (b < 0) roots.push(-k / b);
  } else {
    const disc = b * b - 4 * a * k;
    if (disc >= 0) {
      const q = Math.sqrt(disc);
      roots.push((-b - q) / (2 * a), (-b + q) / (2 * a));
    }
  }
  const delay = Math.min(...roots.filter((r) => r > 0));
  if (!Number.isFinite(delay)) return null;
  const from: V3 = [s[0] - vs[0] * delay, s[1] - vs[1] * delay, s[2] - vs[2] * delay];
  const d = sub(l, from);
  const distance = Math.hypot(...d);
  const u: V3 = [d[0] / distance, d[1] / distance, d[2] / distance];
  return { delay, distance, ratio: (c - dot(u, vl)) / (c - dot(u, vs)), from };
}

/**
 * What a listener at `l`, walking along x at `vl`, hears now of a source that has moved along `path` (its x at each
 * time; it keeps to height y and side z) at the Mach numbers `machAt`, sending since `from`. The same as `heard`, but
 * for a source whose speed has changed: the wave heard now is the one sent most recently among those that have
 * arrived, found by stepping back from now to the first wave that has, then halving.
 */
export function heardAlong(
  path: (t: number) => number,
  machAt: (t: number) => number,
  y: number,
  z: number,
  c: number,
  l: V3,
  vl: number,
  from: number,
  now: number,
  lookBack = 30,
): Heard | null {
  const dist = (tau: number) => Math.hypot(l[0] - path(tau), l[1] - y, l[2] - z);
  // Positive while the wave sent at tau is still on its way.
  const late = (tau: number) => tau + dist(tau) / c - now;
  if (dist(now) < 1e-9) return { delay: 0, distance: 0, ratio: 1, from: [path(now), y, z] };
  const step = 0.02;
  const oldest = Math.max(from, now - lookBack);
  let hi = now;
  let lo: number;
  for (;;) {
    if (hi <= oldest) return null;
    lo = Math.max(oldest, hi - step);
    if (late(lo) <= 0) break;
    hi = lo;
  }
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (late(mid) <= 0) lo = mid;
    else hi = mid;
  }
  const tau = lo;
  const at: V3 = [path(tau), y, z];
  const d = sub(l, at);
  const distance = Math.hypot(...d);
  const ux = d[0] / distance;
  const vs = machAt(tau) * c;
  return { delay: now - tau, distance, ratio: (c - ux * vl) / (c - ux * vs), from: at };
}

/**
 * A source's run along the x axis: it is at `x0` at time 0, and its Mach number (its speed over sound's, `c`) goes
 * straight from one knot (time, Mach number) to the next, holding before the first and after the last.
 */
export interface Run {
  x0: number;
  c: number;
  knots: Array<[number, number]>;
}

/** The run's Mach number at time t. */
export function runM(run: Run, t: number): number {
  const k = run.knots;
  if (t <= k[0]![0]) return k[0]![1];
  for (let i = 1; i < k.length; i++) {
    const [t1, m1] = k[i]!;
    if (t < t1) {
      const [t0, m0] = k[i - 1]!;
      return m0 + ((m1 - m0) * (t - t0)) / (t1 - t0);
    }
  }
  return k[k.length - 1]![1];
}

/** Where the run's source is at time t: the area under its speed since time 0. */
export function runX(run: Run, t: number): number {
  // The area under the Mach number from time 0 to t, a trapezium at a time between the knots.
  const area = (to: number) => {
    const pts: Array<[number, number]> = [[0, runM(run, 0)]];
    for (const [tk] of run.knots) if (tk > 0 && tk < to) pts.push([tk, runM(run, tk)]);
    pts.push([to, runM(run, to)]);
    let a = 0;
    for (let i = 1; i < pts.length; i++)
      a += ((pts[i]![1] + pts[i - 1]![1]) / 2) * (pts[i]![0] - pts[i - 1]![0]);
    return a;
  };
  if (t >= 0) return run.x0 + run.c * area(t);
  // Before time 0, back along the first knot's speed (or the speed at time 0).
  return run.x0 + run.c * runM(run, 0) * t;
}

export interface Shell {
  /** Where the wave was sent from (x along the run), when, and how big it has grown. */
  x: number;
  sent: number;
  r: number;
}

/**
 * The waves spreading at time t from a source whose x is `x(t)`: one sent every `period` (from time `from` on), each a
 * sphere centred where the source was when it sent it, its radius c times its age. Only waves younger than `maxAge`
 * are kept, the newest first.
 */
export function shells(
  x: (t: number) => number,
  c: number,
  t: number,
  period: number,
  from: number,
  maxAge: number,
): Shell[] {
  const out: Shell[] = [];
  const first = Math.ceil((Math.max(from, t - maxAge) - 1e-9) / period);
  for (let k = Math.floor((t + 1e-9) / period); k >= first; k--) {
    const sent = k * period;
    out.push({ x: x(sent), sent, r: c * (t - sent) });
  }
  return out;
}

/**
 * The spacing of the waves a source moving at Mach m leaves along a direction at angle θ to its motion, over the
 * spacing it would leave standing still: 1 − m·cos θ. Bunched ahead, stretched behind.
 */
export const stretch = (m: number, cosTheta: number) => 1 - m * cosTheta;

/** The half-angle of the cone a source faster than sound drags behind it: sin μ = 1/M. Null below the speed of sound. */
export const machAngle = (m: number): number | null => (m >= 1 ? Math.asin(1 / m) : null);

/**
 * When the sound first reaches the point `l` from a source moving along `path` (its x at each time; it keeps to height
 * y and side z), sending from time `from` up to `to`. The wave sent at τ arrives at τ + |l − S(τ)| / c, so the first
 * arrival is the least of those. Slower than sound, that is usually the first wave sent; faster, it is a wave from
 * the middle of the run, and every wave sent around then arrives at almost the same moment: the boom.
 */
export function firstHeard(
  path: (t: number) => number,
  y: number,
  z: number,
  c: number,
  l: V3,
  from: number,
  to: number,
): { at: number; sent: number } {
  const arrive = (tau: number) => tau + Math.hypot(l[0] - path(tau), l[1] - y, l[2] - z) / c;
  const steps = 400;
  let best = from;
  for (let i = 0; i <= steps; i++) {
    const tau = from + ((to - from) * i) / steps;
    if (arrive(tau) < arrive(best)) best = tau;
  }
  // Narrow in around the best sample.
  let lo = Math.max(from, best - (to - from) / steps);
  let hi = Math.min(to, best + (to - from) / steps);
  for (let i = 0; i < 60; i++) {
    const a = lo + (hi - lo) / 3;
    const b = hi - (hi - lo) / 3;
    if (arrive(a) < arrive(b)) hi = b;
    else lo = a;
  }
  const sent = (lo + hi) / 2;
  return { at: arrive(sent), sent };
}

/** Where a wave sent from height h crosses the ground: the radius of the ring it draws there (0 before it lands). */
export const groundRing = (r: number, h: number) => (r > Math.abs(h) ? Math.sqrt(r * r - h * h) : 0);

// ---------- Light ----------

/**
 * Light from something moving away at a fraction β of light's speed has every wavelength stretched by the same
 * factor, 1 + z = √((1 + β)/(1 − β)): its red shift z. (Slowly, z ≈ β, sound's formula again.)
 */
export const redshift = (beta: number) => Math.sqrt((1 + beta) / (1 - beta)) - 1;

/** The speed (as a fraction of light's) that gives a red shift z. */
export const recession = (z: number) => {
  const s = (1 + z) * (1 + z);
  return (s - 1) / (s + 1);
};

/** Hydrogen's visible lines (Balmer's series), in nanometres: the fingerprint that shifts. */
export const BALMER = [
  { name: 'Hα', nm: 656.3 },
  { name: 'Hβ', nm: 486.1 },
  { name: 'Hγ', nm: 434.0 },
  { name: 'Hδ', nm: 410.2 },
];

/** The visible spectrum's ends, in nanometres. */
export const VISIBLE: [number, number] = [380, 750];

/**
 * The colour of light of one wavelength, roughly as the eye sees it (red, green, blue, 0..1), dimming towards the
 * ends of the visible spectrum and black beyond them.
 */
export function wavelengthRGB(nm: number): [number, number, number] {
  if (!(nm >= VISIBLE[0] && nm <= VISIBLE[1])) return [0, 0, 0];
  let r = 0;
  let g = 0;
  let b = 0;
  if (nm < 440) {
    r = (440 - nm) / 60;
    b = 1;
  } else if (nm < 490) {
    g = (nm - 440) / 50;
    b = 1;
  } else if (nm < 510) {
    g = 1;
    b = (510 - nm) / 20;
  } else if (nm < 580) {
    r = (nm - 510) / 70;
    g = 1;
  } else if (nm < 645) {
    r = 1;
    g = (645 - nm) / 65;
  } else {
    r = 1;
  }
  const k = nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 700 ? 0.3 + (0.7 * (750 - nm)) / 50 : 1;
  return [r * k, g * k, b * k];
}

// ---------- The siren ----------

/** A two-tone siren: `hi` and `lo` in turn, each held for `each` seconds, starting with `hi` at time 0. */
export function sirenTone(t: number, hi: number, lo: number, each: number): number {
  const k = Math.floor(t / each);
  return ((k % 2) + 2) % 2 === 0 ? hi : lo;
}
