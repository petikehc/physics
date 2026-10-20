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
  /** Its lowest height, which height's part of the energy is counted from. */
  low: number;
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
  return { pts, tan, up, step: ds, length, low: Math.min(...pts.map((p) => p[1])) };
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
export const lowest = (track: Track) => track.low;

/** A train's state along a track: where it is, how fast it goes, and the heat and work so far (per kilogram). */
export interface RideState {
  s: number;
  v: number;
  heat: number;
  work: number;
}

/**
 * One step of a ride, `dt` seconds: gravity along the slope, friction against the motion (it can stop the train but
 * never push it), the chain holding the train at its speed up the lift (its work is whatever that takes) and the
 * buffers at either end stopping it dead (its speed into them as heat). Energy is kept account of as it goes, so that
 * height's part + speed's part + heat − work never changes (checked in the tests).
 */
export function stepRide(track: Track, st: RideState, o: Omit<RideOptions, 's0' | 'v0' | 'duration'>, dt: number) {
  const base = lowest(track);
  const muAt = (x: number) => (o.brakes && x >= o.brakes.from ? o.brakes.mu : o.mu);
  const energy = (x: number, u: number) => G * (heightAt(track, x) - base) + 0.5 * u * u;
  const lift = o.lift;
  if (lift && st.s >= lift.from && st.s < lift.to && st.v <= lift.speed) {
    const before = energy(st.s, st.v);
    const ds = lift.speed * dt;
    const friction = o.mu * G * ds;
    st.s += ds;
    st.v = lift.speed;
    st.heat += friction;
    st.work += energy(st.s, st.v) - before + friction;
  } else {
    const mu = muAt(st.s);
    const pull = -G * slopeAt(track, st.s);
    const grip = mu * G;
    if (Math.abs(st.v) < 1e-6 && Math.abs(pull) <= grip) {
      st.v = 0;
    } else {
      const dir = Math.abs(st.v) > 1e-6 ? Math.sign(st.v) : Math.sign(pull);
      // Half a step of acceleration, a full step of motion, then the other half at the new place (velocity Verlet).
      const a0 = pull - grip * dir;
      let vh = st.v + 0.5 * a0 * dt;
      if (Math.sign(vh) !== dir && Math.abs(st.v) > 1e-6) vh = 0;
      const s1 = st.s + vh * dt;
      const a1 = -G * slopeAt(track, s1) - muAt(s1) * G * dir;
      let v1 = vh + 0.5 * a1 * dt;
      if (Math.sign(v1) !== dir && v1 !== 0) v1 = 0;
      // Friction's heat: its force times the distance it acted over.
      st.heat += 0.5 * (mu + muAt(s1)) * G * Math.abs(s1 - st.s);
      st.s = s1;
      st.v = v1;
    }
  }
  if (st.s <= 0 || st.s >= track.length) {
    st.s = Math.min(Math.max(st.s, 0), track.length);
    st.heat += 0.5 * st.v * st.v;
    st.v = 0;
  }
}

/** The state as a sample: its energies, at time t. */
export function sampleOf(track: Track, st: RideState, t: number): RideSample {
  return {
    t,
    s: st.s,
    v: st.v,
    pe: G * (heightAt(track, st.s) - lowest(track)),
    ke: 0.5 * st.v * st.v,
    heat: st.heat,
    work: st.work,
  };
}

/** Runs the train along the track for `o.duration` seconds, step by step (see `stepRide`). Samples every 1/60 s. */
export function simulate(track: Track, o: RideOptions): RideSample[] {
  const dt = o.dt ?? 1 / 480;
  const st: RideState = { s: o.s0, v: o.v0, heat: 0, work: 0 };
  const out: RideSample[] = [sampleOf(track, st, 0)];
  const every = Math.max(1, Math.round(1 / 60 / dt));
  const steps = Math.round(o.duration / dt);
  for (let i = 1; i <= steps; i++) {
    stepRide(track, st, o, dt);
    if (i % every === 0) out.push(sampleOf(track, st, i * dt));
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
