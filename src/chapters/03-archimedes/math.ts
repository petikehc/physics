/**
 * Pure physics for chapter 3 (Archimedes' principle). Masses in grams, volumes in cm³ (= mL), densities in
 * g/cm³, forces in newtons.
 */

export const G = 9.8;

export interface Substance {
  id: string;
  name: string;
  /** g/cm³ */
  density: number;
  color: string;
}

/** Things to drop in the tank, lightest first. */
export const MATERIALS: Substance[] = [
  { id: 'cork', name: 'Cork', density: 0.24, color: '#c9a273' },
  { id: 'wood', name: 'Pine wood', density: 0.5, color: '#d8b07a' },
  { id: 'ice', name: 'Ice', density: 0.92, color: '#dff4ff' },
  { id: 'aluminium', name: 'Aluminium', density: 2.7, color: '#c9ced6' },
  { id: 'iron', name: 'Iron', density: 7.87, color: '#7d7f86' },
  { id: 'gold', name: 'Gold', density: 19.3, color: '#e8b649' },
];

/** Fluids to fill it with. */
export const FLUIDS: Substance[] = [
  { id: 'oil', name: 'Olive oil', density: 0.92, color: '#c9b04a' },
  { id: 'water', name: 'Fresh water', density: 1.0, color: '#3fa9c9' },
  { id: 'deadsea', name: 'Dead Sea water', density: 1.24, color: '#5fc7b0' },
  { id: 'mercury', name: 'Mercury', density: 13.53, color: '#b9bcc4' },
];

export const GOLD = 19.3;
export const SILVER = 10.5;
export const WATER = 1.0;

/** Weight in newtons of `grams`. */
export function weight(grams: number): number {
  return (grams / 1000) * G;
}

/** Volume of `grams` of gold–silver alloy that is `goldShare` gold by mass (densities add as volumes). */
export function alloyVolume(grams: number, goldShare: number): number {
  return (grams * goldShare) / GOLD + (grams * (1 - goldShare)) / SILVER;
}

/** Upward push on `volume` cm³ submerged in a fluid: the weight of the fluid it displaces. */
export function buoyancy(volume: number, fluidDensity = WATER): number {
  return weight(volume * fluidDensity);
}

/** What a spring scale reads for an object hanging with `submerged` (0..1) of its volume under water. */
export function scaleReading(grams: number, volume: number, submerged: number, fluidDensity = WATER): number {
  return weight(grams) - buoyancy(volume * submerged, fluidDensity);
}

/**
 * How a solid block settles in a fluid: if lighter than the fluid it floats with `fraction` of its volume
 * under the surface; otherwise it sinks (fraction 1).
 */
export function settle(objectDensity: number, fluidDensity: number) {
  const floats = objectDensity < fluidDensity;
  return { floats, fraction: floats ? objectDensity / fluidDensity : 1 };
}

/** The story's crown: 1 kg, 70 % gold and 30 % silver by mass, as the goldsmith's cheat. */
export const CROWN = { grams: 1000, goldShare: 0.7 };
/** A bar of pure gold weighing the same. */
export const BAR = { grams: 1000, goldShare: 1 };

/** The numbers the story shows, rounded the way the captions and labels print them. */
export function storyNumbers() {
  const crownVolume = alloyVolume(CROWN.grams, CROWN.goldShare);
  const barVolume = alloyVolume(BAR.grams, BAR.goldShare);
  return {
    weight: weight(CROWN.grams),
    crownVolume,
    barVolume,
    crownPush: buoyancy(crownVolume),
    barPush: buoyancy(barVolume),
    crownInWater: scaleReading(CROWN.grams, crownVolume, 1),
    barInWater: scaleReading(BAR.grams, barVolume, 1),
  };
}
