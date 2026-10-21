import type { BeatDef, BeatKind, JourneyBuilder } from './builder';
import { CHAPTER_BUILDERS } from './journey';

/** One beat's words, as the journey shows them. */
export interface ScriptBeat {
  chapter: string;
  kind: BeatKind;
  heading?: string;
  body?: string;
}

/**
 * Every beat's words, in the order the journey tells them, read straight from the chapters' own timelines so they
 * never drift from what plays. Nothing is animated: each beat is noted and its animation never built.
 */
export function journeyScript(): ScriptBeat[] {
  const beats: ScriptBeat[] = [];
  const reader = {
    beat: (chapter: string, def: BeatDef) =>
      beats.push({ chapter, kind: def.kind ?? 'normal', heading: def.heading, body: def.body }),
  } as unknown as JourneyBuilder;
  for (const build of CHAPTER_BUILDERS) build(reader);
  return beats;
}
