import { chapterRig } from '../../engine/runtime';
import { circularSpeed, fire, fromKms, LAUNCH_R, MOON, EARTH_KM, type Flight } from './math';

/** Everything chapter 5 animates. Timelines tween these numbers; the station derives all geometry from them. */
export interface NewtonRig {
  /** The planet (the Earth that swelled at the end of chapter 4), 0..1, and its thin shell of air, 0..1. */
  planet: number;
  air: number;
  /** Newton's mountain rising at the top of the planet, 0..1, and the cannon on it, 0..1. */
  mountain: number;
  cannon: number;
  /** Which story shot is flying (an index into SHOTS), and how long since it was fired (in the maths' time unit). */
  shot: number;
  fly: number;
  /** The ball, 0..1 (its path is drawn behind it). */
  ball: number;
  /** The paths of the shots before this one, left faint, 0..1. */
  ghosts: number;
  /** On the ball: its velocity and the pull towards the centre, 0..1; the straight line it would take without the pull, 0..1. */
  arrows: number;
  straight: number;
  /** The Moon on its orbit, 0..1, and how far round it is (radians from the +x axis, anticlockwise). */
  moon: number;
  moonAngle: number;
  /** The Moon's distance marked off in Earth radii, 0..1; the two falls compared, 0..1. */
  sixty: number;
  falls: number;
  /** The inverse square: three shells spreading out (staggered), 0..1; the patch through each cut into 1, 4, 9 tiles, 0..1. */
  shells: number;
  tiles: number;
  /** Kepler's ellipse laid over the fast shot's path, with the planet's centre at its focus, 0..1. */
  kepler: number;
  /** Handoff: the strobe's ghost apples (staggered), 0..1; the column turning to lie along a time axis, 0..1; the curve through them, 0..1. */
  strobe: number;
  turn: number;
  curve: number;
  /** The strobe's graph fading away as the next chapter's icon forms, 0..1. */
  clear: number;
  /** The cannonball's whistle, 0..1 (its pitch follows its speed). */
  voice: number;
  /** Your turn and the Lab: the cannon's speed (km/s) and its angle above the horizon (degrees). */
  speed: number;
  elevation: number;
  interactive: number;
  lab: number;
}

/** The story's shots, all fired level: three that land farther and farther round, the orbit, and an ellipse. */
export const SHOTS = [fromKms(3), fromKms(5), fromKms(6.3), circularSpeed(LAUNCH_R), fromKms(9)];
export const SHOT = { orbit: 3, ellipse: 4 } as const;

/** Every story shot's flight, worked out once. */
export const STORY_FLIGHTS: Flight[] = SHOTS.map((v) => fire(v));

export const NEWTON_DEFAULTS: NewtonRig = {
  planet: 0,
  air: 0,
  mountain: 0,
  cannon: 0,
  shot: 0,
  fly: 0,
  ball: 0,
  ghosts: 0,
  arrows: 0,
  straight: 0,
  moon: 0,
  moonAngle: 2.3,
  sixty: 0,
  falls: 0,
  shells: 0,
  tiles: 0,
  kepler: 0,
  strobe: 0,
  turn: 0,
  curve: 0,
  clear: 0,
  voice: 0,
  speed: 6.5,
  elevation: 0,
  interactive: 0,
  lab: 0,
};

export function newtonRig(): NewtonRig {
  return chapterRig('newton', () => ({ ...NEWTON_DEFAULTS }));
}

/** World units per Earth radius: the planet's drawn radius. */
export const RADIUS = 2;
/** The Moon's distance and size, to the same scale. */
export const MOON_ORBIT = (MOON.distanceKm / EARTH_KM) * RADIUS;
export const MOON_RADIUS = (MOON.radiusKm / EARTH_KM) * RADIUS;

/** A point of the shots' plane (the maths' x, y in Earth radii) in station space: the plane faces +z. */
export const flat = (x: number, y: number, z = 0): [number, number, number] => [x * RADIUS, y * RADIUS, z];

/**
 * The handoff's strobe: an apple falling onto the top of the planet, lit by `flashes` flashes after the one that
 * catches it at rest, `drop` high (world units); turned on its side, the flashes stand `spacing` apart.
 */
export const STROBE = { flashes: 7, drop: 1.6, spacing: 0.36, apple: 0.06 };
/** Where the strobe's apple starts: above the top of the planet. */
export const STROBE_TOP = RADIUS + STROBE.apple + STROBE.drop;

/** The inverse square's shells: radii in world units, and the side of the square patch on the first. */
export const SHELLS = { r0: 5, patch: 1.5 };

export const SYM5 = {
  /** The pull: the chapter's crimson. */
  pull: '#e25c56',
  /** Velocity. */
  speed: '#8fd3ff',
  path: '#f4efe6',
  /** Kepler's ellipse, in chapter 4's amber. */
  kepler: '#f2b04a',
  moon: '#dfe4ec',
  planet: '#6fa8ff',
  air: '#9cc8ff',
};
