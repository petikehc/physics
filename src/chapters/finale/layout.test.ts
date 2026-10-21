import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../registry';
import { getShape } from '../../engine/dust/shapes';
import { iconAt, INVARIANTS, STAR_CHAPTERS, STARS, starsAlongThread, threadLength } from './layout';
import { DUST_SCALE } from './rig';

describe('the constellation', () => {
  it('has one star for each chapter, and says what each kept the same, in the order they were told', () => {
    expect(STARS).toHaveLength(CHAPTERS.length);
    expect(INVARIANTS.map((v) => v.slug)).toEqual(CHAPTERS.map((c) => c.slug));
    expect(STAR_CHAPTERS).toEqual(CHAPTERS.map((c) => c.slug));
    // A tag for each star, a word or two to read in passing.
    for (const v of INVARIANTS) expect(v.tag.split(' ').length).toBeLessThanOrEqual(4);
  });

  it('keeps its stars far enough apart to be told apart, and rises from first to last', () => {
    for (let i = 0; i < STARS.length; i++)
      for (let j = i + 1; j < STARS.length; j++) {
        const [a, b] = [STARS[i]!, STARS[j]!];
        expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeGreaterThan(7);
      }
    expect(STARS[STARS.length - 1]![1]).toBeGreaterThan(STARS[0]![1]);
  });

  it('measures the thread through the stars, reaching each in turn', () => {
    const along = starsAlongThread();
    expect(along[0]).toBe(0);
    expect(along[along.length - 1]).toBeCloseTo(1, 12);
    for (let i = 1; i < along.length; i++) expect(along[i]!).toBeGreaterThan(along[i - 1]!);
    expect(
      threadLength([
        [0, 0, 0],
        [3, 4, 0],
        [3, 4, 12],
      ]),
    ).toBe(17);
  });

  it('gathers the Dust onto the stars and the thread between them', () => {
    const pts = getShape('constellation', 4000);
    let near = 0;
    for (let k = 0; k < pts.length; k += 3) {
      const p = [pts[k]! * DUST_SCALE, pts[k + 1]! * DUST_SCALE, pts[k + 2]! * DUST_SCALE];
      const d = Math.min(...STARS.map((s) => Math.hypot(p[0]! - s[0], p[1]! - s[1], p[2]! - s[2])));
      if (d < 2.5) near++;
    }
    // Most of it in knots at the stars, the rest strung along the thread.
    expect(near / 4000).toBeGreaterThan(0.6);
    expect(near / 4000).toBeLessThan(0.9);
  });

  it("forms each chapter's icon beside its star, clear of every other star", () => {
    STARS.forEach((s, i) => {
      const c = iconAt(i);
      expect(Math.hypot(c[0] - s[0], c[1] - s[1])).toBeCloseTo(8, 9);
      STARS.forEach((o, j) => {
        if (j !== i) expect(Math.hypot(c[0] - o[0], c[1] - o[1])).toBeGreaterThan(8);
      });
    });
  });
});
