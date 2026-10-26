import { create } from 'zustand';

export type WorldMode = 'teaser' | 'journey' | 'lab' | 'page' | 'map';
export type QualityTier = 'low' | 'medium' | 'high';
export type CameraMode = 'directed' | 'interactive';

const PREFS_KEY = 'sand-to-stars:prefs';

interface Prefs {
  musicVolume: number;
  sfxVolume: number;
  autoContinue: boolean;
  captionsOn: boolean;
}

const defaultPrefs: Prefs = { musicVolume: 0.7, sfxVolume: 0.8, autoContinue: true, captionsOn: true };

function loadPrefs(): Prefs {
  try {
    const raw = globalThis.localStorage?.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return defaultPrefs;
  }
}

function savePrefs(p: Prefs) {
  try {
    globalThis.localStorage?.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    // Storage can be unavailable (private mode, blocked site data); preferences just won't persist.
  }
}

/** A quality set in the URL (?quality=low|medium|high), for tests and recordings: kept as given. */
function qualityParam(): QualityTier | null {
  if (typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('quality');
  return param === 'low' || param === 'medium' || param === 'high' ? param : null;
}

function detectQuality(): QualityTier {
  if (typeof window === 'undefined') return 'high';
  const param = qualityParam();
  if (param) return param;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  if (coarse && small) return 'low';
  if (coarse) return 'medium';
  return 'high';
}

function detectReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).get('motion') === 'reduced') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export interface AppState extends Prefs {
  mode: WorldMode;
  /** Chapter slug shown in the Lab, or the chapter the journey is in. */
  chapterSlug: string;
  quality: QualityTier;
  /** The quality was set in the URL: keep it, instead of stepping down when frames come slowly. */
  qualityFixed: boolean;
  reducedMotion: boolean;
  soundEnabled: boolean;
  cameraMode: CameraMode;
  dragging: boolean;
  /**
   * The world does not draw on its own: the landing page's film covers it, or a recording is stepping it frame by
   * frame (window.__film).
   */
  worldPaused: boolean;
  /** A film is being recorded (window.__film): the world draws no film grain of its own. */
  recording: boolean;

  // Journey (discrete state only; per-frame time is read from the timeline directly).
  /** Increments each time a journey timeline is built (0 = none). */
  journeyId: number;
  playing: boolean;
  beatKey: string | null;
  speed: number;
  yourTurn: boolean;
  ended: boolean;

  set: (partial: Partial<AppState>) => void;
  setPrefs: (partial: Partial<Prefs>) => void;
}

export const useApp = create<AppState>((set, get) => ({
  ...loadPrefs(),
  mode: 'teaser',
  chapterSlug: 'pythagoras',
  quality: detectQuality(),
  qualityFixed: qualityParam() !== null,
  reducedMotion: detectReducedMotion(),
  soundEnabled: false,
  cameraMode: 'directed',
  dragging: false,
  worldPaused: false,
  recording: false,
  journeyId: 0,
  playing: false,
  beatKey: null,
  speed: 1,
  yourTurn: false,
  ended: false,
  set: (partial) => set(partial),
  setPrefs: (partial) => {
    set(partial);
    const s = get();
    savePrefs({
      musicVolume: s.musicVolume,
      sfxVolume: s.sfxVolume,
      autoContinue: s.autoContinue,
      captionsOn: s.captionsOn,
    });
  },
}));
