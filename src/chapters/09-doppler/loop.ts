import { LOOP, MAX_AGE, SLOW } from './rig';

/** One stretch of the viewer's loop: from time `t` the source, then at `x`, goes at Mach `m`. */
interface Segment {
  t: number;
  x: number;
  m: number;
}

/** Round the loop: −LOOP to LOOP, then back to −LOOP. */
const wrap = (x: number) => ((((x + LOOP) % (2 * LOOP)) + 2 * LOOP) % (2 * LOOP)) - LOOP;

/**
 * The viewer's loop remembers each speed it was given and when, so the waves already sent stay where they were sent
 * when the viewer changes the speed. Only the last few seconds are kept: older waves have faded out.
 */
let segments: Segment[] = [{ t: 0, x: 0, m: 0.5 }];

/** Starts the loop afresh: the source at the middle of the street at time `t`, going at Mach `m`. */
export function loopReset(m: number, t = 0) {
  segments = [{ t, x: 0, m }];
}

function at(t: number): Segment {
  let s = segments[0]!;
  for (const seg of segments) if (seg.t <= t) s = seg;
  return s;
}

/** Where the source is (or was) at time t. */
export function loopX(t: number): number {
  const s = at(t);
  return wrap(s.x + s.m * SLOW * (t - s.t));
}

/** How fast it was going at time t. */
export const loopM = (t: number) => at(t).m;

/**
 * Keeps the loop in step with the rig: a new stretch whenever the speed changes, and a fresh start if time went back
 * (the loop was left and come back to).
 */
export function loopSync(m: number, now: number) {
  const last = segments[segments.length - 1]!;
  if (now < last.t) loopReset(m, now);
  else if (Math.abs(m - last.m) > 1e-9) {
    segments.push({ t: now, x: loopX(now), m });
    // Stretches that ended before the oldest wave still showing are no longer needed.
    while (segments.length > 1 && segments[1]!.t < now - MAX_AGE - 1) segments.shift();
  }
}
