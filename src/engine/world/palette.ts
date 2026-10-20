import * as THREE from 'three';

/** The dusk beach of the first chapters: a low sun on the horizon. */
export const DUSK = {
  zenith: '#0b0d16',
  mid: '#1b1d2e',
  horizon: '#c0623d',
  glow: '#ffb070',
  fog: '#2a1e22',
};

/** Deep space, where chapter 4 and the later sky chapters hang: no horizon, no sun, only stars. */
export const SPACE = {
  zenith: '#03040a',
  mid: '#05060f',
  horizon: '#080a17',
  glow: '#000000',
  fog: '#03040a',
};

/** A city street at night (chapter 9): a dark sky, and low haze lit orange by the streetlights. */
export const NIGHT = {
  zenith: '#04060d',
  mid: '#0a0d19',
  horizon: '#2a1f22',
  glow: '#000000',
  fog: '#151318',
};

export type Palette = Record<keyof typeof DUSK, THREE.Color>;
const dusk = Object.fromEntries(Object.entries(DUSK).map(([k, v]) => [k, new THREE.Color(v)])) as Palette;
const deep = Object.fromEntries(Object.entries(SPACE).map(([k, v]) => [k, new THREE.Color(v)])) as Palette;
const city = Object.fromEntries(Object.entries(NIGHT).map(([k, v]) => [k, new THREE.Color(v)])) as Palette;

/**
 * The sky's colours `space` (0..1) of the way from the dusk beach to deep space, and then `night` (0..1) of the way
 * from there to the street at night, written into `out`.
 */
export function skyPalette(space: number, out: Palette, night = 0): Palette {
  for (const k of Object.keys(dusk) as Array<keyof Palette>)
    out[k].lerpColors(dusk[k], deep[k], space).lerp(city[k], night);
  return out;
}

export function createPalette(): Palette {
  return skyPalette(0, {
    zenith: new THREE.Color(),
    mid: new THREE.Color(),
    horizon: new THREE.Color(),
    glow: new THREE.Color(),
    fog: new THREE.Color(),
  });
}
