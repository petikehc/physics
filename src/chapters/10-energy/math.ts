/**
 * Chapter 10's maths: a coaster track as a smooth curve, a train run along it (hauled up a lift hill by a chain, then
 * left to gravity, friction and the brakes), and its energy kept account of: height's part mgh, speed's part ½mv²,
 * the heat friction makes, and the work the chain put in. Everything is per kilogram; a mass only scales it.
 */

export type V3 = [number, number, number];

/** Gravity at the Earth's surface, m/s². */
export const G = 9.81;

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const norm = (a: V3): V3 => scale(a, 1 / (len3(a) || 1));

/**
 * A point on the centripetal Catmull–Rom spline through p0..p3, between p1 (u = 0) and p2 (u = 1). Centripetal, so
 * it never overshoots into a loop or a cusp where the points are unevenly spaced.
 */
function catmullRom(p0: V3, p1: V3, p2: V3, p3: V3, u: number): V3 {
  const knot = (a: V3, b: V3) => Math.sqrt(len3(sub(b, a))) || 1e-6;
  const t1 = knot(p0, p1);
  const t2 = t1 + knot(p1, p2);
  const t3 = t2 + knot(p2, p3);
  const t = t1 + (t2 - t1) * u;
  const lerp = (a: V3, b: V3, ta: number, tb: number): V3 => {
    const k = (t - ta) / (tb - ta);
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  };
  const a1 = lerp(p0, p1, 0, t1);
  const a2 = lerp(p1, p2, t1, t2);
  const a3 = lerp(p2, p3, t2, t3);
  const b1 = lerp(a1, a2, 0, t2);
  const b2 = lerp(a2, a3, t1, t3);
  return lerp(b1, b2, t1, t2);
}

export interface Track {
  /** Points evenly spaced along the track, `step` metres apart, `length` metres in all. */
  pts: V3[];
  /** At each point: which way the track runs, and which way is up for a rider (out of the track, towards their head). */
  tan: V3[];
  up: V3[];
  step: number;
  length: number;
}

/**
 * A track through `controls`, sampled every `step` metres. It runs in (or near) one upright plane, so a rider's up is
 * the track's direction turned a quarter turn about the plane's normal (z): round a loop it points to the centre.
 */
export function buildTrack(controls: V3[], step = 0.25): Track {
  // A fine walk along the spline, extended past each end so the end segments have neighbours.
  const n = controls.length;
  const ext = [
    sub(scale(controls[0]!, 2), controls[1]!),
    ...controls,
    sub(scale(controls[n - 1]!, 2), controls[n - 2]!),
  ];
  const fine: V3[] = [];
  const per = 60;
  for (let i = 1; i < ext.length - 2; i++)
    for (let k = 0; k < per; k++)
      fine.push(catmullRom(ext[i - 1]!, ext[i]!, ext[i + 1]!, ext[i + 2]!, k / per));
  fine.push(controls[n - 1]!);
  // Arc length along the fine walk, then points at even steps of it.
  const acc = [0];
  for (let i = 1; i < fine.length; i++) acc.push(acc[i - 1]! + len3(sub(fine[i]!, fine[i - 1]!)));
  const length = acc[acc.length - 1]!;
  const count = Math.max(2, Math.round(length / step) + 1);
  const ds = length / (count - 1);
  const pts: V3[] = [];
  let j = 1;
  for (let i = 0; i < count; i++) {
    const s = i * ds;
    while (j < acc.length - 1 && acc[j]! < s) j++;
    const k = (s - acc[j - 1]!) / Math.max(acc[j]! - acc[j - 1]!, 1e-9);
    const a = fine[j - 1]!;
    const b = fine[j]!;
    pts.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]);
  }
  const tan: V3[] = pts.map((_, i) => norm(sub(pts[Math.min(i + 1, count - 1)]!, pts[Math.max(i - 1, 0)]!)));
  const up: V3[] = tan.map((t) => {
    const u: V3 = [-t[1], t[0], 0];
    const d = u[0] * t[0] + u[1] * t[1] + u[2] * t[2];
    return norm(sub(u, scale(t, d)));
  });
  return { pts, tan, up, step: ds, length };
}

export interface TrackPoint {
  p: V3;
  tan: V3;
  up: V3;
}

/** Where on the track a point `s` metres along it is, and which way it faces (clamped to the track's ends). */
export function trackAt(track: Track, s: number): TrackPoint {
  const x = Math.min(Math.max(s, 0), track.length) / track.step;
  const i = Math.min(Math.floor(x), track.pts.length - 2);
  const k = x - i;
  const mix = (a: V3, b: V3): V3 => [
    a[0] + (b[0] - a[0]) * k,
    a[1] + (b[1] - a[1]) * k,
    a[2] + (b[2] - a[2]) * k,
  ];
  return {
    p: mix(track.pts[i]!, track.pts[i + 1]!),
    tan: norm(mix(track.tan[i]!, track.tan[i + 1]!)),
    up: norm(mix(track.up[i]!, track.up[i + 1]!)),
  };
}

/** The track's height `s` metres along, and how steeply it climbs there (rise per metre of track). */
export const heightAt = (track: Track, s: number) => trackAt(track, s).p[1];
export const slopeAt = (track: Track, s: number) => trackAt(track, s).tan[1];

/** How the train is run along a track. */
export interface RideOptions {
  /** Where it starts (metres along) and how fast (m/s, positive is forwards). */
  s0: number;
  v0: number;
  /** How long to run it for, in seconds. */
  duration: number;
  /** Rolling friction: a force of μ times the train's weight against its motion. */
  mu: number;
  /** A chain lift: from `from` to `to` metres along, the chain holds the train at `speed` m/s (no slower). */
  lift?: { from: number; to: number; speed: number };
  /** Brakes from `from` metres along to the end: friction of `mu` times the weight. */
  brakes?: { from: number; mu: number };
  /** The time step, seconds. */
  dt?: number;
}

/** The train at one moment. Energies are per kilogram (J/kg); multiply by the mass for joules. */
export interface RideSample {
  t: number;
  s: number;
  v: number;
  /** Height's part (g h, above the track's lowest point), speed's part (½ v²), friction's heat, the chain's work. */
  pe: number;
  ke: number;
  heat: number;
  work: number;
}

/** The lowest point of a track, which height's part is counted from. */
export const lowest = (track: Track) => Math.min(...track.pts.map((p) => p[1]));

/**
 * Runs the train along the track: gravity along the slope, friction against the motion, the chain hauling it up the
 * lift and the brakes at the end; buffers stop it dead at either end. Energy is kept account of as it goes, so that
 * pe + ke + heat − work never changes (it is checked in the tests). Samples every 1/60 s.
 */
export function simulate(track: Track, o: RideOptions): RideSample[] {
  const dt = o.dt ?? 1 / 480;
  const base = lowest(track);
  const out: RideSample[] = [];
  let s = o.s0;
  let v = o.v0;
  let heat = 0;
  let work = 0;
  const muAt = (x: number) => (o.brakes && x >= o.brakes.from ? o.brakes.mu : o.mu);
  const inLift = (x: number) => !!o.lift && x >= o.lift.from && x < o.lift.to;
  const energy = (x: number, u: number) => G * (heightAt(track, x) - base) + 0.5 * u * u;
  const record = (t: number) =>
    out.push({ t, s, v, pe: G * (heightAt(track, s) - base), ke: 0.5 * v * v, heat, work });
  const every = Math.max(1, Math.round(1 / 60 / dt));
  record(0);
  const steps = Math.round(o.duration / dt);
  for (let i = 1; i <= steps; i++) {
    if (inLift(s) && v <= o.lift!.speed) {
      const before = energy(s, v);
      // The chain holds it at its speed: the chain's work is whatever that takes, friction's heat included.
      const ds = o.lift!.speed * dt;
      const friction = o.mu * G * ds;
      s += ds;
      v = o.lift!.speed;
      heat += friction;
      work += energy(s, v) - before + friction;
    } else {
      // Gravity along the slope, then friction against the motion; friction can stop the train but never push it.
      const mu = muAt(s);
      const pull = -G * slopeAt(track, s);
      const grip = mu * G;
      if (Math.abs(v) < 1e-6 && Math.abs(pull) <= grip) {
        v = 0;
      } else {
        const dir = Math.abs(v) > 1e-6 ? Math.sign(v) : Math.sign(pull);
        // Half a step of acceleration, a full step of motion, then the other half at the new place (velocity Verlet).
        const a0 = pull - grip * dir;
        let vh = v + 0.5 * a0 * dt;
        if (Math.sign(vh) !== dir && Math.abs(v) > 1e-6) vh = 0;
        const s1 = s + vh * dt;
        const a1 = -G * slopeAt(track, s1) - muAt(s1) * G * dir;
        let v1 = vh + 0.5 * a1 * dt;
        if (Math.sign(v1) !== dir && v1 !== 0) v1 = 0;
        // Friction's heat: its force times the distance it acted over.
        heat += 0.5 * (mu + muAt(s1)) * G * Math.abs(s1 - s);
        s = s1;
        v = v1;
      }
    }
    // The buffers at either end: the train stops dead, and its speed goes into them as heat.
    if (s <= 0 || s >= track.length) {
      s = Math.min(Math.max(s, 0), track.length);
      heat += 0.5 * v * v;
      v = 0;
    }
    if (i % every === 0) record(i * dt);
  }
  return out;
}

/** The ride at time t, between samples. */
export function rideAt(ride: RideSample[], t: number): RideSample {
  const dt = ride.length > 1 ? ride[1]!.t - ride[0]!.t : 1;
  const x = Math.min(Math.max(t / dt, 0), ride.length - 1);
  const i = Math.min(Math.floor(x), ride.length - 2);
  const a = ride[i]!;
  const b = ride[Math.max(i + 1, 0)] ?? a;
  const k = x - i;
  const m = (p: number, q: number) => p + (q - p) * k;
  return {
    t,
    s: m(a.s, b.s),
    v: m(a.v, b.v),
    pe: m(a.pe, b.pe),
    ke: m(a.ke, b.ke),
    heat: m(a.heat, b.heat),
    work: m(a.work, b.work),
  };
}

/** When the ride first passes `s` metres along (or null if it never does). */
export function timeAt(ride: RideSample[], s: number): number | null {
  for (let i = 1; i < ride.length; i++) {
    const a = ride[i - 1]!;
    const b = ride[i]!;
    if ((a.s - s) * (b.s - s) <= 0 && a.s !== b.s) return a.t + ((s - a.s) / (b.s - a.s)) * (b.t - a.t);
  }
  return null;
}

/** Without friction: the speed at height h of a train that had speed v0 at height h0 (null if it can't get there). */
export function speedAt(h0: number, v0: number, h: number): number | null {
  const v2 = v0 * v0 + 2 * G * (h0 - h);
  return v2 >= 0 ? Math.sqrt(v2) : null;
}

/** Without friction: the highest a train with speed v0 at height h0 can climb. */
export const highest = (h0: number, v0: number) => h0 + (v0 * v0) / (2 * G);

/** The arc length along the track nearest to the point with the given x (for the tracks here, which run along x). */
export function sAtX(track: Track, x: number, from = 0): number {
  let best = from;
  let d = Infinity;
  for (let i = Math.round(from / track.step); i < track.pts.length; i++) {
    const e = Math.abs(track.pts[i]![0] - x);
    if (e < d) {
      d = e;
      best = i * track.step;
    }
  }
  return best;
}
