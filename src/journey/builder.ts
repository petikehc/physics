import gsap from 'gsap';

export type BeatKind = 'title' | 'normal' | 'formula' | 'yourTurn' | 'flight' | 'end';

export interface BeatDef {
  id: string;
  heading?: string;
  /** Caption text. `[a:text]` colours text with a symbol's colour (a, b, c, r or pi). */
  body?: string;
  kind?: BeatKind;
  /** Minimum duration in seconds (the beat is padded with a hold if its animation is shorter). */
  minDuration?: number;
}

export interface BeatMarker extends BeatDef {
  key: string;
  chapter: string;
  start: number;
  end: number;
  /** Absolute time where the journey pauses for the viewer (Your turn). */
  pauseAt?: number;
}

export interface Cue {
  time: number;
  id: string;
  params?: Record<string, number>;
}

export interface BeatApi {
  tl: gsap.core.Timeline;
  /** Schedules a one-shot sound at a beat-local time. */
  cue: (time: number, id: string, params?: Record<string, number>) => void;
  /** Pauses the journey at this beat-local time and hands control to the viewer. */
  pauseHere: (time: number) => void;
}

export interface Journey {
  master: gsap.core.Timeline;
  beats: BeatMarker[];
  cues: Cue[];
  duration: number;
  chapters: Array<{ slug: string; start: number; end: number }>;
}

const WORDS_PER_SECOND = 3.1;

/** Seconds a viewer needs to read a caption, plus a breath. */
export function readingTime(def: Pick<BeatDef, 'heading' | 'body'>): number {
  const text =
    `${def.heading ?? ''} ${(def.body ?? '').replace(/\[(?:a|b|c|r|pi):([^\]]+)\]/g, '$1')}`.trim();
  if (!text) return 0;
  return text.split(/\s+/).length / WORDS_PER_SECOND + 1.4;
}

/**
 * Assembles chapter beats into one master timeline. Each beat is its own sub-timeline, padded so its
 * caption can be read, labelled `chapter:beat`, with its sound cues shifted to absolute time.
 */
export class JourneyBuilder {
  readonly master = gsap.timeline({ paused: true });
  readonly beats: BeatMarker[] = [];
  readonly cues: Cue[] = [];
  private cursor = 0;

  beat(chapter: string, def: BeatDef, build: (b: BeatApi) => void) {
    const tl = gsap.timeline();
    const local: Cue[] = [];
    let pause: number | undefined;
    build({
      tl,
      cue: (time, id, params) => local.push({ time, id, params }),
      pauseHere: (time) => {
        pause = time;
      },
    });
    const kind = def.kind ?? 'normal';
    const readHold = kind === 'yourTurn' || kind === 'flight' ? 0 : readingTime(def);
    const hold = Math.max(def.minDuration ?? 0, readHold);
    const anim = tl.duration();
    if (anim < hold) tl.to({}, { duration: hold - anim });

    const start = this.cursor;
    const key = `${chapter}:${def.id}`;
    this.master.add(tl, start);
    this.master.addLabel(key, start);
    for (const c of local) this.cues.push({ ...c, time: c.time + start });
    const marker: BeatMarker = { ...def, kind, key, chapter, start, end: start + tl.duration() };
    if (pause !== undefined) {
      marker.pauseAt = start + pause;
      this.master.addPause(marker.pauseAt);
    }
    this.beats.push(marker);
    this.cursor = marker.end;
  }

  finish(): Journey {
    this.cues.sort((a, b) => a.time - b.time);
    const chapters: Journey['chapters'] = [];
    for (const b of this.beats) {
      const last = chapters[chapters.length - 1];
      if (last && last.slug === b.chapter) last.end = b.end;
      else chapters.push({ slug: b.chapter, start: b.start, end: b.end });
    }
    return {
      master: this.master,
      beats: this.beats,
      cues: this.cues,
      duration: this.master.duration(),
      chapters,
    };
  }
}

/** The beat containing `time` (the last beat whose start is ≤ time). */
export function beatAt(beats: BeatMarker[], time: number): BeatMarker | undefined {
  let lo = 0;
  let hi = beats.length - 1;
  let found: BeatMarker | undefined;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const b = beats[mid]!;
    if (b.start <= time + 1e-6) {
      found = b;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}

/** Cues with prev < time ≤ next. */
export function cuesBetween(cues: Cue[], prev: number, next: number): Cue[] {
  if (next <= prev) return [];
  const out: Cue[] = [];
  for (const c of cues) {
    if (c.time > next) break;
    if (c.time > prev) out.push(c);
  }
  return out;
}
