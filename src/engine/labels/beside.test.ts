import { describe, expect, it } from 'vitest';
import { clearOf } from './beside';

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, right: left + width, bottom: top + height, width, height }) as DOMRect;

describe('clearOf', () => {
  const a = rect(0, 0, 100, 20);

  it('is 0 when the labels are already apart', () => {
    expect(clearOf(a, rect(0, 30, 50, 20), 0, -1, 0)).toBe(0);
  });

  it('is how far on the second label must go to clear the first', () => {
    // Overlapping by 10 px down, set off downwards (y up, so dy = −1): 10 px more, and a little to spare.
    const k = clearOf(a, rect(20, 10, 50, 20), 0, -1, 0);
    expect(k).toBeGreaterThanOrEqual(10);
    expect(k).toBeLessThan(13);
  });

  it('takes the shorter way on, across or down', () => {
    // Set off down and to the left: 30 px more across clears it, 10 px more down does too.
    const k = clearOf(a, rect(-20, 10, 50, 20), -1, -1, 0);
    expect(k).toBeLessThan(13);
  });

  it('measures from where the label would be without its extra, so the answer holds steady', () => {
    const first = clearOf(a, rect(20, 10, 50, 20), 0, -1, 0);
    // Drawn with that extra it no longer overlaps, but it still needs it.
    expect(clearOf(a, rect(20, 10 + first, 50, 20), 0, -1, first)).toBeCloseTo(first, 9);
  });
});
