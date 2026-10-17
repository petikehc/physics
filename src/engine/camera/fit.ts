/** Shots are composed for a landscape screen of about this aspect ratio. */
const DESIGN_ASPECT = 1.6;

/**
 * On a narrower screen (a phone held upright), step back from the target and widen the lens a little, so a shot
 * keeps most of its composed width instead of cropping the sides of wide scenes.
 */
export function portraitFit(aspect: number) {
  const r = DESIGN_ASPECT / Math.max(aspect, 0.3);
  if (r <= 1) return { dolly: 1, fov: 1 };
  return { dolly: Math.min(Math.pow(r, 0.8), 2.4), fov: Math.min(Math.pow(r, 0.2), 1.25) };
}
