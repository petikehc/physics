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

/** A phone on its side: too short for text under the picture, so text and panels stand beside it instead. */
export function shortWide(width: number, height: number) {
  return height <= 500 && width / Math.max(height, 1) >= 1.5;
}

/**
 * On a short, wide screen the journey's captions and formula take a column down the left. The picture moves right
 * to stand beside them (a lens shift, as a share of the screen's width), and steps back a little to fit between the
 * top bar and the player.
 */
export const SIDE_ROOM = { shift: 0.16, dolly: 1.25 };

/** How far the picture moves right to make room for the journey's text column (0 where there is no column). */
export function sideRoom(mode: string, width: number, height: number) {
  return mode === 'journey' && shortWide(width, height) ? SIDE_ROOM.shift : 0;
}
