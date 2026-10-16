// Test hooks the app exposes on window (see src/journey/controller.ts and src/audio/index.ts).
interface JourneyHook {
  seek: (labelOrTime: string | number) => number;
  play: () => void;
  pause: () => void;
  time: () => number;
  duration: number;
  beats: Array<{ key: string; start: number; end: number; pauseAt?: number }>;
  rigs: Record<string, object>;
  renderAudio: (seconds?: number) => Promise<string>;
}

interface Window {
  __journey?: JourneyHook;
  __audio?: { readonly state: string; readonly loaded: boolean };
}
