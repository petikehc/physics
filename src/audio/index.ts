import type { AudioEngine } from './engine';
import type { Triangle } from '../chapters/01-pythagoras/math';

export type Scene = 'teaser' | 'journey' | 'lab' | null;
/**
 * Continuous sound layers: a scratch of chalk, pouring water, a singing planet (with `hz`), and chapter 9's siren and
 * jet as heard (with `hz` and `pan`).
 */
export type ContinuousId = 'chalk' | 'pour' | 'voice' | 'siren' | 'roar';
/** How many harmonics chapter 8's additive voice has (the fundamental and the fifteen above it). */
export const HARMONICS = 16;
const SILENT: readonly number[] = new Array<number>(HARMONICS).fill(0);

let engine: AudioEngine | null = null;
let loading: Promise<AudioEngine | null> | null = null;
let context: AudioContext | null = null;
const state = {
  music: 0.7,
  sfx: 0.8,
  scene: null as Scene,
  beat: null as string | null,
  playing: false,
  muted: false,
};

declare global {
  interface Window {
    __audio?: { readonly state: string; readonly loaded: boolean };
  }
}

if (typeof window !== 'undefined') {
  // Read-only probe used by the end-to-end tests.
  window.__audio = {
    get state() {
      return context?.state ?? 'none';
    },
    get loaded() {
      return engine !== null;
    },
  };
}

/**
 * The only audio API the rest of the app uses. Every call is a no-op until the viewer opts in to sound;
 * the Tone.js engine is a separate chunk loaded on that first opt-in.
 */
export const audio = {
  /** Must be called from a user gesture (click/tap): it creates and resumes the AudioContext synchronously. */
  enable(): Promise<AudioEngine | null> {
    state.muted = false;
    if (!context) {
      try {
        context = new AudioContext({ latencyHint: 'playback' });
      } catch {
        return Promise.resolve(null);
      }
    }
    void context.resume();
    if (!loading) {
      loading = import('./engine')
        .then((m) => m.createEngine(context!))
        .then((e) => {
          engine = e;
          e.setVolumes(state.music, state.sfx);
          e.setScene(state.scene);
          e.setBeat(state.beat);
          e.setPlaying(state.playing);
          return e;
        })
        .catch((err: unknown) => {
          console.warn('Audio unavailable', err);
          return null;
        });
    } else if (engine) {
      engine.setMuted(false);
    }
    return loading;
  },

  disable() {
    state.muted = true;
    engine?.setMuted(true);
  },

  get loaded() {
    return engine !== null;
  },

  cue(id: string, params?: Record<string, number>) {
    if (!state.muted) engine?.cue(id, params);
  },

  continuous(id: ContinuousId, level: number, params?: Record<string, number>) {
    engine?.continuous(id, state.muted ? 0 : level, params);
  },

  sides(t: Triangle | null, moved: boolean) {
    engine?.sides(state.muted ? null : t, moved);
  },

  /** Chapter 8's additive voice: how loud each harmonic is (0..1, the fundamental first) over a fundamental of `hz`. */
  harmonics(amps: readonly number[], hz: number) {
    engine?.harmonics(state.muted ? SILENT : amps, hz);
  },

  setScene(scene: Scene) {
    state.scene = scene;
    engine?.setScene(scene);
  },

  setBeat(key: string | null) {
    if (state.beat === key) return;
    state.beat = key;
    engine?.setBeat(key);
  },

  setPlaying(playing: boolean) {
    if (state.playing === playing) return;
    state.playing = playing;
    engine?.setPlaying(playing);
  },

  setVolumes(music: number, sfx: number) {
    state.music = music;
    state.sfx = sfx;
    engine?.setVolumes(music, sfx);
  },

  ui(kind: 'hover' | 'click') {
    if (!state.muted) engine?.cue(kind === 'hover' ? 'uiHover' : 'uiClick');
  },
};
