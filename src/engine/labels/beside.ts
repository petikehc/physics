/**
 * Sets a label beside the point it is pinned to, rather than centred on it: off towards (dx, dy) on the screen
 * (y up), its nearest edge or corner `gap` px from the point. The offset is in pixels, not world units, so labels
 * set on different sides of nearby points stay apart however small the scene is drawn (on a phone, say).
 */
export function beside(el: HTMLElement, dx: number, dy: number, gap = 6) {
  const m = Math.max(Math.abs(dx), Math.abs(dy)) || 1;
  const x = dx / m;
  const y = -dy / m;
  const t = `translate(calc(${(x * 50).toFixed(1)}% + ${(x * gap).toFixed(1)}px), calc(${(y * 50).toFixed(1)}% + ${(y * gap).toFixed(1)}px))`;
  // Only when it changes: setting a style restyles the label.
  if (el.dataset.beside !== t) {
    el.dataset.beside = t;
    el.style.transform = t;
  }
}

/**
 * How much farther (px) label `b`, set beside its point towards (dx, dy) with `extra` px added to its gap, has to go
 * on that way to clear label `a`, both as drawn. Measured back to where `b` would be without the extra, so the
 * answer does not depend on the last one.
 */
export function clearOf(a: DOMRect, b: DOMRect, dx: number, dy: number, extra: number): number {
  const m = Math.max(Math.abs(dx), Math.abs(dy)) || 1;
  const x = dx / m;
  const y = -dy / m;
  const left = b.left - x * extra;
  const right = b.right - x * extra;
  const top = b.top - y * extra;
  const bottom = b.bottom - y * extra;
  if (
    Math.min(a.right, right) <= Math.max(a.left, left) ||
    Math.min(a.bottom, bottom) <= Math.max(a.top, top)
  ) {
    return 0;
  }
  // Clear across or clear down, whichever is the shorter way on.
  const across = x > 0 ? (a.right - left) / x : x < 0 ? (right - a.left) / -x : Infinity;
  const down = y > 0 ? (a.bottom - top) / y : y < 0 ? (bottom - a.top) / -y : Infinity;
  return Math.min(across, down) + 2;
}
