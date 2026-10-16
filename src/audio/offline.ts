import * as Tone from 'tone';
import { AudioEngine } from './engine';
import type { Cue } from '../journey/builder';

export interface AudioPlan {
  duration: number;
  beats: Array<{ key: string; start: number }>;
  cues: Cue[];
  /** Sampled continuous levels: [time, chalk, pour]. */
  continuous: Array<[number, number, number]>;
}

/** Renders the journey's soundtrack (score + cues + continuous layers) to a buffer, faster than real time. */
export async function renderPlan(plan: AudioPlan, sampleRate = 44100): Promise<AudioBuffer> {
  const buffer = await Tone.Offline(
    async ({ transport }) => {
      const e = new AudioEngine(false);
      await e.init();
      e.setScene('journey');
      e.setBeat(plan.beats[0]?.key ?? null);
      for (const b of plan.beats) transport.schedule((time) => e.score.apply(b.key, time), b.start);
      for (const c of plan.cues) transport.schedule((time) => e.sfx.cue(c.id, c.params ?? {}, time), c.time);
      for (const [t, chalk, pour] of plan.continuous) {
        transport.schedule((time) => {
          e.sfx.continuous('chalk', chalk, time);
          e.sfx.continuous('pour', pour, time);
        }, t);
      }
      // Starts the transport at 0, after everything is scheduled.
      e.setPlaying(true);
      void transport;
    },
    plan.duration,
    2,
    sampleRate,
  );
  return buffer.get() as AudioBuffer;
}

/** 16-bit PCM WAV. */
export function encodeWav(buffer: AudioBuffer): Uint8Array {
  const channels = buffer.numberOfChannels;
  const frames = buffer.length;
  const bytes = 44 + frames * channels * 2;
  const view = new DataView(new ArrayBuffer(bytes));
  const str = (o: number, s: string) => [...s].forEach((ch, i) => view.setUint8(o + i, ch.charCodeAt(0)));
  str(0, 'RIFF');
  view.setUint32(4, bytes - 8, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  str(36, 'data');
  view.setUint32(40, frames * channels * 2, true);
  const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
  let o = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, data[c]![i]!));
      view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return new Uint8Array(view.buffer);
}

export function toBase64(bytes: Uint8Array): string {
  let s = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(s);
}
