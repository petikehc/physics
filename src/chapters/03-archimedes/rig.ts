import { chapterRig } from '../../engine/runtime';

/** Everything chapter 3 animates. Timelines tween these numbers; the station derives all geometry from them. */
export interface ArchimedesRig {
  /** The stone tank rising out of the sand, 0..1. */
  tank: number;
  /** Water level in the tank: 1 is to the brim. */
  level: number;
  /** The post and arm the scale hangs from, 0..1. */
  gantry: number;
  /** The solid gold crown on the hook, 0..1 (it condenses out of the dust). */
  crown: number;
  /** 0 = the crown hangs on the hook, 1 = the pure gold bar does (they swap at 0.5). */
  bar: number;
  /** 0 = hanging above the water, 1 = fully under. */
  lower: number;
  /** The hung object lifted away (for the line-up), 0..1. */
  hookOut: number;
  /** The scale's reading label, 0..1. */
  readout: number;
  /** Beakers by the spout, 0..1. */
  beakers: number;
  /** Fraction of the crown's volume that has spilled into the first beaker. */
  spillA: number;
  /** Fraction of the bar's volume that has spilled into the second beaker. */
  spillB: number;
  /** 0 = the first beaker sits under the spout; 1 = it has moved aside for the second. */
  swap: number;
  /** Arrows: the push on the crown, and the weight of the spilled water, 0..1. */
  arrows: number;
  /** The three blocks of the density line-up dropping in (staggered), 0..1. */
  lineup: number;
  /** The Your-turn block, 0..1. */
  play: number;
  /** Your turn: index into MATERIALS and FLUIDS. */
  material: number;
  fluid: number;
  /** A bubble rising from the tank floor for the handoff, 0..1. */
  bubble: number;
  interactive: number;
  lab: number;
}

export const ARCHIMEDES_DEFAULTS: ArchimedesRig = {
  tank: 0,
  level: 1,
  gantry: 0,
  crown: 0,
  bar: 0,
  lower: 0,
  hookOut: 0,
  readout: 0,
  beakers: 0,
  spillA: 0,
  spillB: 0,
  swap: 0,
  arrows: 0,
  lineup: 0,
  play: 0,
  material: 2,
  fluid: 1,
  bubble: 0,
  interactive: 0,
  lab: 0,
};

export function archimedesRig(): ArchimedesRig {
  return chapterRig('archimedes', () => ({ ...ARCHIMEDES_DEFAULTS }));
}

/** Station layout (world units). The tank is centred on the station, u to the right, v away from the camera. */
export const TANK = {
  /** Outer width (u), depth (v) and height. */
  w: 2.4,
  d: 1.4,
  h: 1.1,
  wall: 0.12,
  floor: 0.1,
};
/** Height of the water surface when the tank is full to the brim. */
export const BRIM = TANK.h - 0.03;
/** Where the overflow spout is: on the left wall, the side the camera mostly looks from. */
export const SPOUT = { u: -(TANK.w / 2 + 0.16), v: -0.3, y: TANK.h - 0.06 };
/** Which way is "out" of the tank at the spout (-1: towards -u). */
export const OUT = Math.sign(SPOUT.u);
/** Beaker size and capacity: 100 mL fills BEAKER.fill of its height. */
export const BEAKER = { r: 0.15, h: 0.5, capacity: 100, fill: 0.44 };
/** Beaker positions: under the spout, and moved aside. */
export const BEAKER_UNDER: [number, number] = [SPOUT.u + OUT * 0.04, SPOUT.v];
export const BEAKER_ASIDE: [number, number] = [SPOUT.u + OUT * 0.44, SPOUT.v + 0.12];
/** The second beaker waits in front before sliding under the spout. */
export const BEAKER_WAITING: [number, number] = [SPOUT.u + OUT * 0.04, SPOUT.v - 0.75];
/** The scale hangs from an arm over the tank's centre; its hook is at HOOK_Y. */
export const GANTRY = { postV: TANK.d / 2 + 0.25, top: 3.0 };
export const HOOK_Y = 2.3;
/** The crown and the bar, and how high their bottoms hang above (lower = 0) and in (lower = 1) the water. */
export const CROWN_SIZE = { r: 0.3, h: 0.34 };
export const BAR_SIZE = { u: 0.46, h: 0.14, v: 0.2 };
export const HANG_BOTTOM = { above: TANK.h + 0.3, under: TANK.floor + 0.16 };
/** Density line-up: block size and positions along u. */
export const BLOCK = 0.32;
export const LINEUP: Array<{ material: string; u: number }> = [
  { material: 'wood', u: -0.68 },
  { material: 'ice', u: 0 },
  { material: 'gold', u: 0.68 },
];

/** Station-local world position of a (u, v) point: u to the right, v away from the camera. */
export function uv(u: number, v: number, y = 0): [number, number, number] {
  return [u, y, -v];
}

export const SYM3 = {
  /** Buoyancy and everything about the water. */
  push: '#5fd3e8',
  /** The object's weight. */
  weight: '#f2b04a',
  gold: '#e8b649',
  stone: '#d8cab2',
};
