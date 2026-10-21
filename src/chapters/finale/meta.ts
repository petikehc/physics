import { chapterBySlug } from '../registry';

/** How a stretch of the journey names itself: a chapter, or the finale that follows them. */
export interface SegmentMeta {
  slug: string;
  /** Over the title: "Chapter IV", or "Finale". */
  eyebrow: string;
  title: string;
  /** For the top bar and the player's scrubber. */
  short: string;
  /** The line under the title. */
  chip: string;
  accent: string;
}

export const FINALE: SegmentMeta = {
  slug: 'finale',
  eyebrow: 'Finale',
  title: 'Something Stays the Same',
  short: 'Finale',
  chip: 'From sand to stars · c. 530 BC to 1918',
  accent: '#f4e6cc',
};

/** The chapter or the finale a journey slug names. */
export function segmentBySlug(slug: string | undefined): SegmentMeta | undefined {
  if (slug === FINALE.slug) return FINALE;
  const c = chapterBySlug(slug);
  if (!c) return undefined;
  return {
    slug: c.slug,
    eyebrow: `Chapter ${c.numeral}`,
    title: c.title,
    short: `${c.numeral} · ${c.short}`,
    chip: `${c.figure} · ${c.place} · ${c.year}`,
    accent: c.accent,
  };
}
