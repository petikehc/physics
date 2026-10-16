import * as Tone from 'tone';
import { pyth, sideToFrequency, triangleChord } from '../tuning';
import type { Triangle } from '../../chapters/01-pythagoras/math';

/**
 * Procedural sound effects. Everything is synthesised (no samples), built once and re-triggered.
 * Every trigger takes an optional AudioContext time so the same kit can be scheduled offline.
 */
export class SfxKit {
  private out: Tone.Gain;
  private verb: Tone.Reverb;

  // Shared voices.
  private bell: Tone.PolySynth<Tone.FMSynth>;
  private blip: Tone.PolySynth<Tone.Synth>;
  private thump: Tone.MembraneSynth;
  private clackBody: Tone.MembraneSynth;
  private clackNoise: Tone.NoiseSynth;
  private click: Tone.NoiseSynth;

  // Whoosh: a running noise whose gain and filter are automated per trigger.
  private whooshFilter: Tone.Filter;
  private whooshGain: Tone.Gain;
  private whooshPan: Tone.Panner;
  // Rumble for sinking / rising.
  private rumbleFilter: Tone.Filter;
  private rumbleGain: Tone.Gain;

  // Continuous layers.
  private chalkGain: Tone.Gain;
  private pourGain: Tone.Gain;
  private pourFilter: Tone.Filter;
  private bubble: Tone.Synth;
  private bubbleLevel = 0;
  private sideOsc: Tone.Oscillator[];
  private sideGain: Tone.Gain;
  private sideIdle = 0;

  private sources: Array<{ start: (t?: number) => unknown; dispose: () => unknown }> = [];

  constructor(destination: Tone.InputNode) {
    this.out = new Tone.Gain(1).connect(destination);
    this.verb = new Tone.Reverb({ decay: 3.2, wet: 0.32 }).connect(this.out);

    this.bell = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01,
      modulationIndex: 9,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.004, decay: 2.4, sustain: 0, release: 2.4 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.002, decay: 0.6, sustain: 0, release: 0.4 },
      volume: -20,
    }).connect(this.verb);

    this.blip = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.002, decay: 0.14, sustain: 0, release: 0.08 },
      volume: -19,
    }).connect(this.verb);

    this.thump = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      envelope: { attack: 0.002, decay: 0.5, sustain: 0, release: 0.3 },
      volume: -12,
    }).connect(this.out);

    const clackFilter = new Tone.Filter({ type: 'bandpass', frequency: 1700, Q: 0.9 }).connect(this.verb);
    this.clackBody = new Tone.MembraneSynth({
      pitchDecay: 0.012,
      octaves: 2.5,
      envelope: { attack: 0.001, decay: 0.16, sustain: 0, release: 0.05 },
      volume: -9,
    }).connect(this.out);
    this.clackNoise = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.02 },
      volume: -12,
    }).connect(clackFilter);

    const clickFilter = new Tone.Filter({ type: 'highpass', frequency: 3500 }).connect(this.out);
    this.click = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.01 },
      volume: -18,
    }).connect(clickFilter);

    // Whoosh chain.
    this.whooshPan = new Tone.Panner(0).connect(this.out);
    this.whooshGain = new Tone.Gain(0).connect(this.whooshPan);
    this.whooshFilter = new Tone.Filter({ type: 'bandpass', frequency: 400, Q: 1.4 }).connect(
      this.whooshGain,
    );
    const whooshNoise = new Tone.Noise('pink').connect(this.whooshFilter);

    // Rumble chain.
    this.rumbleGain = new Tone.Gain(0).connect(this.out);
    this.rumbleFilter = new Tone.Filter({ type: 'lowpass', frequency: 260, Q: 0.7 }).connect(this.rumbleGain);
    const rumbleNoise = new Tone.Noise('brown').connect(this.rumbleFilter);

    // Chalk: band-limited pink noise with a fast, irregular tremolo for the scratchy grain.
    this.chalkGain = new Tone.Gain(0).connect(this.out);
    const chalkTrem = new Tone.Gain(0.6).connect(this.chalkGain);
    const chalkLfo = new Tone.LFO({ frequency: 23, min: 0.25, max: 1, type: 'square' }).connect(
      chalkTrem.gain,
    );
    const chalkLfo2 = new Tone.LFO({ frequency: 7.3, min: 17, max: 31 }).connect(chalkLfo.frequency);
    const chalkLp = new Tone.Filter({ type: 'lowpass', frequency: 6500 }).connect(chalkTrem);
    const chalkHp = new Tone.Filter({ type: 'highpass', frequency: 1100 }).connect(chalkLp);
    const chalkBp = new Tone.Filter({ type: 'bandpass', frequency: 3200, Q: 0.8 }).connect(chalkHp);
    const chalkNoise = new Tone.Noise('pink').connect(chalkBp);

    // Pour: brown noise through a wobbling band-pass, plus random bubble blips.
    this.pourGain = new Tone.Gain(0).connect(this.verb);
    this.pourFilter = new Tone.Filter({ type: 'bandpass', frequency: 750, Q: 0.9 }).connect(this.pourGain);
    const pourLfo = new Tone.LFO({ frequency: 5.5, min: 480, max: 1150 }).connect(this.pourFilter.frequency);
    const pourNoise = new Tone.Noise('brown').connect(this.pourFilter);
    this.bubble = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.002, decay: 0.07, sustain: 0, release: 0.03 },
      volume: -22,
    }).connect(this.verb);
    new Tone.Loop((time) => {
      if (this.bubbleLevel > 0.05 && Math.random() < this.bubbleLevel * 0.85) {
        const f = 380 + Math.random() * 900;
        this.bubble.frequency.setValueAtTime(f, time);
        this.bubble.frequency.exponentialRampToValueAtTime(f * 1.9, time + 0.06);
        this.bubble.triggerAttackRelease(f, 0.05, time, 0.4 + Math.random() * 0.5);
      }
    }, 0.075).start(0);

    // Your-turn side tones.
    this.sideGain = new Tone.Gain(0).connect(this.verb);
    this.sideOsc = [0, 1, 2].map(() =>
      new Tone.Oscillator({ type: 'sine', frequency: 200, volume: -14 }).connect(this.sideGain),
    );

    this.sources = [
      whooshNoise,
      rumbleNoise,
      chalkNoise,
      pourNoise,
      chalkLfo,
      chalkLfo2,
      pourLfo,
      ...this.sideOsc,
    ];
  }

  async ready() {
    await this.verb.ready;
    const t = Tone.now();
    for (const s of this.sources) s.start(t);
  }

  // ---------- Continuous ----------

  continuous(id: 'chalk' | 'pour', level: number, time = Tone.now()) {
    const l = Math.min(Math.max(level, 0), 1);
    if (id === 'chalk') this.chalkGain.gain.setTargetAtTime(l * 0.55, time, 0.03);
    else {
      this.pourGain.gain.setTargetAtTime(l * 0.9, time, 0.08);
      this.bubbleLevel = l;
    }
  }

  /** Three soft tones whose pitches follow the side lengths while the viewer drags. */
  sides(t: Triangle | null, moved: boolean, time = Tone.now()) {
    if (t && moved) this.sideIdle = 0;
    else this.sideIdle += 1;
    const on = t !== null && this.sideIdle < 50;
    if (t) {
      [t.a, t.b, t.c].forEach((len, i) =>
        this.sideOsc[i]!.frequency.setTargetAtTime(sideToFrequency(len), time, 0.04),
      );
    }
    this.sideGain.gain.setTargetAtTime(on ? 0.22 : 0, time, on ? 0.06 : 0.35);
  }

  // ---------- One-shots ----------

  cue(id: string, params: Record<string, number> = {}, time = Tone.now()) {
    const t = time + 0.005;
    switch (id) {
      case 'whoosh':
        return this.whoosh(t, params.gain ?? 1, 1.7);
      case 'lift':
        return this.whoosh(t, 0.45, 1.0);
      case 'grainLand':
        this.thump.triggerAttackRelease(pyth('C', 2), 0.3, t, 0.5);
        this.bell.triggerAttackRelease(pyth('E', 6), 1.4, t + 0.02, 0.25);
        this.bell.triggerAttackRelease(pyth('G', 6), 1.4, t + 0.12, 0.18);
        return;
      case 'pop': {
        const notes = [pyth('C', 5), pyth('E', 5), pyth('G', 5)];
        return this.blip.triggerAttackRelease(notes[params.pitch ?? 0] ?? notes[0]!, 0.08, t, 0.7);
      }
      case 'tick':
        this.click.triggerAttackRelease(0.02, t, 0.9);
        return this.blip.triggerAttackRelease(2200, 0.03, t, 0.35);
      case 'rise':
        this.rumble(t, 1.8, params.gain ?? 1, 180, 900);
        this.thump.triggerAttackRelease(pyth('G', 1), 0.4, t + 1.6, 0.35 * (params.gain ?? 1));
        [pyth('G', 5), pyth('C', 6), pyth('E', 6)].forEach((f, i) =>
          this.bell.triggerAttackRelease(f, 1.6, t + 1.0 + i * 0.16, 0.12),
        );
        return;
      case 'sink':
        return this.rumble(t, 1.5, 0.8, 400, 120);
      case 'count':
        for (let i = 0; i < 12; i++) {
          const k = i / 11;
          this.click.triggerAttackRelease(0.015, t + 1.7 * (1 - Math.pow(1 - k, 1.6)), 0.4);
        }
        return;
      case 'splash':
        this.rumble(t, 0.7, 0.5, 900, 300);
        return;
      case 'brim':
        this.bell.triggerAttackRelease(pyth('E', 5), 2.5, t, 0.5);
        this.bell.triggerAttackRelease(pyth('B', 5), 2.5, t + 0.11, 0.35);
        return;
      case 'clack': {
        const i = params.i ?? 0;
        const f = [55, 61.7, 49, 58.3, 65.4, 52, 69.3][i % 7]!;
        this.clackBody.triggerAttackRelease(f * 2, 0.08, t, 0.9);
        this.clackNoise.triggerAttackRelease(0.05, t, 0.8);
        return;
      }
      case 'glow': {
        const chord = params.which === 1 ? triangleChord(pyth('C', 5)) : [pyth('E', 5), pyth('G', 5)];
        chord.forEach((f, i) => this.bell.triggerAttackRelease(f, 2, t + i * 0.07, 0.18));
        return;
      }
      case 'formula':
        // The triangle's own chord: frequencies in the ratio 3 : 4 : 5.
        triangleChord(pyth('C', 4)).forEach((f, i) =>
          this.bell.triggerAttackRelease(f, 3.5, t + i * 0.12, 0.45),
        );
        triangleChord(pyth('C', 5)).forEach((f, i) =>
          this.bell.triggerAttackRelease(f, 3, t + 0.5 + i * 0.1, 0.2),
        );
        return;
      case 'gather': {
        this.whoosh(t, 0.7, 2.6);
        const scale = [
          pyth('C', 5),
          pyth('D', 5),
          pyth('E', 5),
          pyth('G', 5),
          pyth('A', 5),
          pyth('C', 6),
          pyth('D', 6),
          pyth('E', 6),
        ];
        scale.forEach((f, i) => this.blip.triggerAttackRelease(f, 0.1, t + 0.3 + i * 0.16, 0.45));
        return;
      }
      case 'triple':
        triangleChord(pyth('C', 5)).forEach((f, i) =>
          this.bell.triggerAttackRelease(f, 1.8, t + i * 0.09, 0.4),
        );
        return;
      case 'uiHover':
        return this.blip.triggerAttackRelease(1800, 0.02, t, 0.12);
      case 'uiClick':
        this.click.triggerAttackRelease(0.015, t, 0.4);
        return this.blip.triggerAttackRelease(880, 0.04, t, 0.3);
      default:
        return;
    }
  }

  private whoosh(t: number, gain: number, dur: number) {
    const f = this.whooshFilter.frequency;
    f.cancelScheduledValues(t);
    f.setValueAtTime(220, t);
    f.exponentialRampToValueAtTime(2600, t + dur * 0.5);
    f.exponentialRampToValueAtTime(380, t + dur);
    const g = this.whooshGain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(0, t);
    g.linearRampToValueAtTime(0.5 * gain, t + dur * 0.45);
    g.linearRampToValueAtTime(0, t + dur);
    const p = this.whooshPan.pan;
    p.cancelScheduledValues(t);
    p.setValueAtTime(-0.6, t);
    p.linearRampToValueAtTime(0.6, t + dur);
  }

  private rumble(t: number, dur: number, gain: number, f0: number, f1: number) {
    const f = this.rumbleFilter.frequency;
    f.cancelScheduledValues(t);
    f.setValueAtTime(f0, t);
    f.exponentialRampToValueAtTime(f1, t + dur);
    const g = this.rumbleGain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(0, t);
    g.linearRampToValueAtTime(0.7 * gain, t + dur * 0.4);
    g.linearRampToValueAtTime(0, t + dur);
  }

  dispose() {
    for (const s of this.sources) s.dispose();
    this.out.dispose();
  }
}
