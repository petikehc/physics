import type { Levels, Meter } from '../sound';
import { flightAt } from './math';
import { playerFlight } from './interaction';
import { newtonRig, STORY_FLIGHTS, type NewtonRig } from './rig';

/** The ball's whistle at the speed of a ground-skimming orbit (7.9 km/s); it follows the speed as a power. */
const WHISTLE = 330;
const HIGHEST = 1400;

export interface NewtonSoundSample {
  /** How loud the ball may whistle, 0..1 (0 once it has landed or is far away). */
  song: number;
  /** Its speed, in units of 7.9 km/s, and the flight's clock. */
  speed: number;
  fly: number;
  /** The handoff's curve being drawn, 0..1. */
  curve: number;
}

export function newtonSample(rig: NewtonRig): NewtonSoundSample {
  const play = rig.interactive > 0.5;
  const f = play
    ? playerFlight()
    : STORY_FLIGHTS[Math.min(Math.max(Math.round(rig.shot), 0), STORY_FLIGHTS.length - 1)]!;
  const p = flightAt(f, rig.fly);
  const flying = f.outcome === 'orbits' || rig.fly < f.duration - 1e-6;
  return {
    song: (play ? 1 : rig.voice) * Math.min(1, rig.ball) * (flying && rig.fly > 0 ? 1 : 0),
    speed: Math.hypot(p.vx, p.vy),
    fly: rig.fly,
    curve: rig.curve,
  };
}

/**
 * The cannonball whistles while it flies, higher the faster it goes: swooping up as it falls in close, sinking as
 * it climbs away (so an ellipse sounds its equal areas). It falls silent when it lands, or when the journey is
 * paused. The chalk scratches while the handoff's curve is drawn. Pure, so offline renders use it.
 */
export function newtonLevels(prev: NewtonSoundSample, cur: NewtonSoundSample, dt: number): Levels {
  const step = Math.max(dt, 1 / 240);
  const moving = Math.abs(cur.fly - prev.fly) / step > 1e-3 ? 1 : 0;
  return {
    chalk: Math.min(1, (Math.abs(cur.curve - prev.curve) / step) * 1.2),
    pour: 0,
    voice: cur.song * moving * 0.8,
    voiceHz: Math.min(HIGHEST, WHISTLE * Math.pow(Math.max(cur.speed, 0.05), 1.6)),
  };
}

/** Tracks chapter 5's rig between frames and returns its continuous levels. */
export function newtonMeter(): Meter {
  const rig = newtonRig();
  let prev = newtonSample(rig);
  return (dt) => {
    const cur = newtonSample(rig);
    const levels = newtonLevels(prev, cur, dt);
    prev = cur;
    return levels;
  };
}
