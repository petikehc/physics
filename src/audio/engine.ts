import * as Tone from 'tone';
import { SfxKit } from './sfx/kit';
import { PythagoreanScore } from './music/pythagorean';
import type { Triangle } from '../chapters/01-pythagoras/math';
import type { ContinuousId, Scene } from './index';

const toGain = (v: number) => Math.pow(Math.min(Math.max(v, 0), 1), 2);
/** Make-up gain into the limiter (the synths are voiced quietly to leave headroom). */
const MASTER = 3.6;

/**
 * The audio graph: master limiter → music bus (chapter score) and SFX bus (procedural kit).
 * Created inside a user gesture (live) or inside Tone.Offline (preview renders).
 */
export class AudioEngine {
  readonly transport = Tone.getTransport();
  private master: Tone.Gain;
  private music: Tone.Gain;
  private sfxBus: Tone.Gain;
  readonly sfx: SfxKit;
  readonly score: PythagoreanScore;
  private scene: Scene = null;
  private beat: string | null = null;
  private playing = false;
  private muted = false;
  private hidden = false;
  private onVisibility = () => {
    this.hidden = document.visibilityState === 'hidden';
    this.applyMaster();
  };

  constructor(live = true) {
    const limiter = new Tone.Limiter(-1.5).toDestination();
    this.master = new Tone.Gain(MASTER).connect(limiter);
    this.music = new Tone.Gain(toGain(0.7)).connect(this.master);
    this.sfxBus = new Tone.Gain(toGain(0.8)).connect(this.master);
    this.sfx = new SfxKit(this.sfxBus);
    this.score = new PythagoreanScore(this.music, this.transport);
    if (live && typeof document !== 'undefined')
      document.addEventListener('visibilitychange', this.onVisibility);
  }

  async init() {
    await this.sfx.ready();
    await this.score.ready();
    this.score.setActive(false);
  }

  setVolumes(music: number, sfx: number) {
    const t = Tone.now();
    this.music.gain.setTargetAtTime(toGain(music), t, 0.05);
    this.sfxBus.gain.setTargetAtTime(toGain(sfx), t, 0.05);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyMaster();
  }

  private applyMaster() {
    this.master.gain.setTargetAtTime(this.muted || this.hidden ? 0 : MASTER, Tone.now(), 0.15);
  }

  setScene(scene: Scene) {
    this.scene = scene;
    this.update();
  }

  setBeat(key: string | null) {
    this.beat = key;
    this.update();
  }

  setPlaying(playing: boolean) {
    this.playing = playing;
    this.update();
  }

  private update(time = Tone.now()) {
    const key =
      this.scene === 'teaser'
        ? 'teaser'
        : this.scene === 'lab'
          ? (this.beat ?? 'lab')
          : this.scene === 'journey'
            ? this.beat
            : null;
    const running =
      this.scene === 'teaser' || this.scene === 'lab' || (this.scene === 'journey' && this.playing);
    this.score.apply(key, time);
    this.score.setActive(running, time);
    if (running && this.transport.state !== 'started') this.transport.start(time);
    if (!running && this.transport.state === 'started') this.transport.pause(time + 0.8);
    if (!running) {
      this.sfx.continuous('chalk', 0, time);
      this.sfx.continuous('voice', 0, time);
      this.sfx.continuous('siren', 0, time);
      this.sfx.continuous('roar', 0, time);
      this.sfx.harmonics([], time);
    }
  }

  cue(id: string, params?: Record<string, number>) {
    this.sfx.cue(id, params);
  }

  continuous(id: ContinuousId, level: number, params?: Record<string, number>) {
    this.sfx.continuous(id, level, Tone.now(), params?.hz, params?.pan);
  }

  sides(t: Triangle | null, moved: boolean) {
    this.sfx.sides(t, moved);
  }

  harmonics(amps: readonly number[], hz: number) {
    this.sfx.harmonics(amps, Tone.now(), hz);
  }

  dispose() {
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.sfx.dispose();
    this.score.dispose();
  }
}

export async function createEngine(context: AudioContext): Promise<AudioEngine> {
  Tone.setContext(context);
  await Tone.start();
  const engine = new AudioEngine(true);
  await engine.init();
  return engine;
}
