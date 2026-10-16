/**
 * Tuning helpers. Chapter 1 is scored in Pythagorean tuning: every interval is built from pure 3:2
 * fifths, the ratios Pythagoras heard on a vibrating string.
 */

export const C3 = 130.8128;

/** Stack `n` pure fifths (3:2) and fold back into one octave [1, 2). */
export function pythagoreanRatio(fifths: number): number {
  let r = Math.pow(1.5, fifths);
  while (r >= 2) r /= 2;
  while (r < 1) r *= 2;
  return r;
}

/** The Pythagorean major scale: C D E F G A B as stacked fifths (F = −1, C = 0, G = 1, D = 2, …). */
export const PYTHAGOREAN_SCALE = {
  C: pythagoreanRatio(0), // 1
  D: pythagoreanRatio(2), // 9/8
  E: pythagoreanRatio(4), // 81/64
  F: pythagoreanRatio(-1), // 4/3
  G: pythagoreanRatio(1), // 3/2
  A: pythagoreanRatio(3), // 27/16
  B: pythagoreanRatio(5), // 243/128
} as const;

export type Note = keyof typeof PYTHAGOREAN_SCALE;

/** Frequency of a note in Pythagorean tuning, `octave` 3 being the octave of C3. */
export function pyth(note: Note, octave = 3, base = C3): number {
  return base * PYTHAGOREAN_SCALE[note] * Math.pow(2, octave - 3);
}

/**
 * The 3-4-5 triangle as a chord: frequencies in ratio 3:4:5 form a just major triad
 * (G–C–E, second inversion). `fundamental` is the frequency of the "4".
 */
export function triangleChord(fundamental = C3 * 2): [number, number, number] {
  const k = fundamental / 4;
  return [3 * k, 4 * k, 5 * k];
}

/** Maps a side length to a pitch so that the 3-4-5 triangle plays the 3:4:5 chord. */
export function sideToFrequency(length: number, fundamental = C3 * 2): number {
  return (fundamental / 4) * length;
}
