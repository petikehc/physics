import { chapterRig } from '../../engine/runtime';
import { STORY } from './math';

/** Everything chapter 4 animates. Timelines tween these numbers; the station derives all geometry from them. */
export interface KeplerRig {
  /** The Sun, 0..1. */
  sun: number;
  /** The story planet (Mars), 0..1. */
  planet: number;
  /** Eccentricity of the story orbit: stretched for the story, Mars' own in the solar system. */
  e: number;
  /** Where the planet is: orbits since perihelion. */
  phase: number;
  /** A fading trail behind the planet, 0..1. */
  trail: number;
  /** Tycho's sightings appearing along the orbit, 0..1 (staggered). */
  sightings: number;
  /** The best circle drawn through them, 0..1 of its length. */
  circle: number;
  /** The crescents where the circle misses the sightings, glowing, 0..1. */
  miss: number;
  /** The two pins and the loop of string, 0..1. */
  pins: number;
  /** The pencil going round: 0..1 of the ellipse drawn. */
  draw: number;
  /** The drawn ellipse, 0..1 (fades with the trail and circle when the fans take over). */
  ellipse: number;
  /** The Sun takes the place of one pin, 0..1. */
  sunInFocus: number;
  /** Equal-time fans: how many have been swept (fractional while one is being swept). */
  swept: number;
  /** The fans' opacity, 0..1. */
  fans: number;
  /** Number of fans in an orbit. */
  fanCount: number;
  /** The nearest and farthest fans picked out (others dimmed), 0..1. */
  pick: number;
  /** The other five planets and their orbits, 0..1. */
  system: number;
  /** Years passed in the solar-system view (each planet turns at its own rate). */
  years: number;
  /** The third law's pillars rising, 0..1 (staggered). */
  pillars: number;
  /** Handoff: lines of force reach out from the Sun to every planet (0..1 of the way), and glow (0..1). */
  reach: number;
  pull: number;
  /** Handoff: everything but the Earth fades, 0..1. */
  dive: number;
  /** Handoff: the Earth swells into the small planet of the next chapter, 0..1. */
  grow: number;
  /** The planet's song (a tone that follows how fast it turns), 0..1. */
  voice: number;
  interactive: number;
  lab: number;
}

export const KEPLER_DEFAULTS: KeplerRig = {
  sun: 0,
  planet: 0,
  e: STORY.e,
  phase: 0,
  trail: 0,
  sightings: 0,
  circle: 0,
  miss: 0,
  pins: 0,
  draw: 0,
  ellipse: 0,
  sunInFocus: 1,
  swept: 0,
  fans: 0,
  fanCount: STORY.fans,
  pick: 0,
  system: 0,
  years: 0,
  pillars: 0,
  reach: 0,
  pull: 0,
  dive: 0,
  grow: 0,
  voice: 0,
  interactive: 0,
  lab: 0,
};

export function keplerRig(): KeplerRig {
  return chapterRig('kepler', () => ({ ...KEPLER_DEFAULTS }));
}

/**
 * Station layout. The orbit lies flat (local y = 0) with the Sun at the station's origin and perihelion towards
 * +x; orbit-plane y maps to world −z, so the planet runs anticlockwise seen from above.
 */
export function plane(x: number, y: number, h = 0): [number, number, number] {
  return [x, h, -y];
}

/** World units per astronomical unit, so that Mars' real orbit is the story orbit's size. */
export const AU = STORY.a / 1.5237;

/** The Earth's drawn radius once it has swelled for the handoff (it starts at its size in PLANETS). */
export const GROWN_EARTH = 0.3;

/** Most fans an orbit can be cut into (the Your-turn slider's top end). */
export const MAX_FANS = 24;

/** Which fans the "near and far" beat picks out: the first after perihelion and the first after aphelion. */
export const pickedFans = (n: number) => [0, Math.floor(n / 2)];

/** Times in the story's orbit when Tycho's sightings were taken (as fractions of the planet's year). */
export const SIGHTINGS = [0.02, 0.1, 0.19, 0.27, 0.36, 0.44, 0.53, 0.61, 0.69, 0.78, 0.86, 0.94];

/** The third law's pillars stand in a row in front of the system. */
export const PILLARS = { x0: -4.6, dx: 2.3, z: 10.5, height: 2.2, radius: 0.15 };

export const SYM4 = {
  /** Area swept: the chapter's amber. */
  area: '#f2b04a',
  /** Time. */
  time: '#8fd3ff',
  sun: '#ffd58a',
  /** Tycho's sightings, and where the circle misses them. */
  sighting: '#f4efe6',
  miss: '#e2704f',
  string: '#e7dcc5',
};
