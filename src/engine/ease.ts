export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const clamp = (x: number, lo: number, hi: number) => (x < lo ? lo : x > hi ? hi : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Smoothstep on [0,1]. */
export const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInCubic = (t: number) => Math.pow(clamp01(t), 3);
export const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** Progress of item i in a staggered sequence of n items driven by one 0..1 value. */
export const staggered = (p: number, i: number, n: number, stagger: number) => {
  const span = 1 - stagger * (n - 1);
  return clamp01((p - i * stagger) / span);
};
