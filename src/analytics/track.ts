import { CHAPTERS } from '../chapters/registry';
import { useApp } from '../state/store';
import { EngagedClock } from './engaged';

/**
 * Privacy-friendly analytics with GoatCounter (no cookies, so no consent banner). This is the only file that talks to
 * it: everything else calls `track(…)` or `pageview(…)`, and those are no-ops unless the live site is open in a real
 * browser and the script loaded.
 */

/** The site's count endpoint. Replace REPLACE-ME with the GoatCounter site code; until then nothing is sent. */
export const GOATCOUNTER_URL = 'https://REPLACE-ME.goatcounter.com/count';
const SCRIPT_SRC = 'https://gc.zgo.at/count.js';

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type ChapterNo = `0${Exclude<Digit, '0'>}` | '10';
type MinuteNo = `0${Exclude<Digit, '0'>}` | `1${Digit}` | `2${Digit}` | '30';

/** Every event, by name: GoatCounter events carry no properties, so the detail is in the name. */
export type AnalyticsEvent =
  | 'start'
  | `chapter-${ChapterNo}`
  | 'finale'
  | 'finished'
  | 'finished-one-go'
  | `time-${MinuteNo}`
  | `your-turn-${ChapterNo}`
  | `lab-${ChapterNo}`
  | 'chapters-menu'
  | 'muted'
  | 'low-quality';

const TITLES: Record<string, string> = {
  start: 'Started the journey',
  finale: 'Reached the finale',
  finished: 'Watched to the end',
  'finished-one-go': 'Watched it all in one go',
  'chapters-menu': 'Opened the chapters menu',
  muted: 'Turned the sound off',
  'low-quality': 'Low quality tier',
};

function titleOf(event: AnalyticsEvent): string {
  const [, kind, n] = /^(chapter|time|your-turn|lab)-(\d+)$/.exec(event) ?? [];
  if (!kind) return TITLES[event] ?? event;
  if (kind === 'chapter') return `Reached chapter ${Number(n)}`;
  if (kind === 'time') return `${Number(n)} min engaged`;
  if (kind === 'your-turn') return `Used Your turn in chapter ${Number(n)}`;
  return `Opened the Lab of chapter ${Number(n)}`;
}

/** `chapter-03`, `lab-03`, `your-turn-03` for a chapter's slug; undefined for anything that isn't a chapter. */
export function chapterEvent(
  prefix: 'chapter' | 'your-turn' | 'lab',
  slug: string | undefined,
): AnalyticsEvent | undefined {
  const c = CHAPTERS.find((ch) => ch.slug === slug);
  if (!c) return undefined;
  return `${prefix}-${String(c.index + 1).padStart(2, '0') as ChapterNo}`;
}

/** The chapter's number, 1–10, or 0 for anything else. */
export function chapterNumber(slug: string | undefined): number {
  return (CHAPTERS.find((c) => c.slug === slug)?.index ?? -1) + 1;
}

/** `time-01` … `time-30`. */
export function minuteEvent(n: number): AnalyticsEvent {
  return `time-${String(n).padStart(2, '0') as MinuteNo}`;
}

/** The one gate: only the live site, in a browser a person is driving, with a real site code. */
export function shouldSend(where: {
  base: string;
  hostname: string;
  webdriver: boolean;
  url: string;
}): boolean {
  return (
    where.base === '/' &&
    where.hostname === 'sand-to-stars.idoescode.com' &&
    !where.webdriver &&
    !where.url.includes('REPLACE-ME')
  );
}

export interface Hit {
  path: string;
  title: string;
  event: boolean;
}

/** Sends events once each per page load, and every pageview. `send` is whatever delivers a hit. */
export function createTracker(send: (hit: Hit) => void) {
  const sent = new Set<AnalyticsEvent>();
  const safe = (hit: Hit) => {
    try {
      send(hit);
    } catch {
      // Analytics must never break the app.
    }
  };
  return {
    track(event: AnalyticsEvent | undefined) {
      if (!event || sent.has(event)) return;
      sent.add(event);
      safe({ path: event, title: titleOf(event), event: true });
    },
    pageview(path: string) {
      safe({ path, title: typeof document === 'undefined' ? path : document.title, event: false });
    },
  };
}

interface GoatCounter {
  count?: (vars: { path: string; title?: string; event?: boolean }) => void;
}

declare global {
  interface Window {
    goatcounter?: GoatCounter;
    /** With ?analytics=debug: every hit, in order, for checking by hand or in e2e. */
    __analytics?: Hit[];
  }
}

/** Hits made before the script has loaded; null once it failed (or analytics are off), when hits are dropped. */
let queue: Hit[] | null = [];
let deliver: (hit: Hit) => void = (hit) => queue?.push(hit);

const tracker = createTracker((hit) => deliver(hit));

/** Counts an event, once per page load. A no-op unless analytics are on. */
export const track = tracker.track;
/** Counts a pageview (every route change). A no-op unless analytics are on. */
export const pageview = tracker.pageview;

function viaGoatCounter(hit: Hit) {
  window.goatcounter?.count?.({ path: hit.path, title: hit.title, event: hit.event });
}

function loadScript() {
  const s = document.createElement('script');
  s.async = true;
  s.src = SCRIPT_SRC;
  s.dataset.goatcounter = GOATCOUNTER_URL;
  // The app counts every pageview itself (after the 404 redirect is undone, and on every route change).
  s.dataset.goatcounterSettings = JSON.stringify({ no_onload: true });
  s.onload = () => {
    const waiting = queue ?? [];
    queue = null;
    if (typeof window.goatcounter?.count !== 'function') {
      deliver = () => {};
      return;
    }
    deliver = viaGoatCounter;
    for (const hit of waiting) safeDeliver(hit);
  };
  s.onerror = () => {
    // Blocked or offline: drop everything, quietly.
    queue = null;
    deliver = () => {};
  };
  document.head.appendChild(s);
}

function safeDeliver(hit: Hit) {
  try {
    deliver(hit);
  } catch {
    // Never let analytics throw into the app.
  }
}

/** The journey or a Lab is on screen and moving: playing, or waiting on the viewer in Your turn or a Lab. */
function engagedNow(): boolean {
  if (document.visibilityState !== 'visible') return false;
  const s = useApp.getState();
  return s.mode === 'lab' || (s.mode === 'journey' && (s.playing || s.yourTurn));
}

function startClock() {
  const clock = new EngagedClock();
  let last = performance.now();
  window.setInterval(() => {
    const now = performance.now();
    const minutes = clock.advance((now - last) / 1000, engagedNow());
    last = now;
    for (const n of minutes) track(minuteEvent(n));
  }, 1000);
}

/** Starts analytics once, from main.tsx. Off (every call a no-op) anywhere but the live site, unless debugging. */
export function initAnalytics() {
  try {
    const debug = new URLSearchParams(window.location.search).get('analytics') === 'debug';
    const live = shouldSend({
      base: import.meta.env.BASE_URL,
      hostname: window.location.hostname,
      webdriver: navigator.webdriver,
      url: GOATCOUNTER_URL,
    });
    if (debug) {
      // Log instead of sending, on any host: how events are checked on a preview and in e2e.
      const log: Hit[] = (window.__analytics = []);
      queue = null;
      deliver = (hit) => {
        log.push(hit);
        console.info(`[analytics] ${hit.event ? hit.path : `pageview ${hit.path}`}`);
      };
    } else if (live) {
      loadScript();
    } else {
      queue = null;
      deliver = () => {};
      return;
    }
    if (useApp.getState().quality === 'low') track('low-quality');
    useApp.subscribe((s) => {
      if (s.quality === 'low') track('low-quality');
    });
    startClock();
  } catch {
    queue = null;
    deliver = () => {};
  }
}
