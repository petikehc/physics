import * as Tone from 'tone';
import { pyth, sideToFrequency, triangleChord } from '../tuning';
import { HARMONICS } from '../index';
import type { Triangle } from '../../chapters/01-pythagoras/math';

/** C pentatonic upwards from C5: the pitches pieces and rings land on. */
const PENTA_UP = [
  pyth('C', 5),
  pyth('D', 5),
  pyth('E', 5),
  pyth('G', 5),
  pyth('A', 5),
  pyth('C', 6),
  pyth('D', 6),
  pyth('E', 6),
  pyth('G', 6),
  pyth('A', 6),
];
/** The four quarter points, 1, i, −1 and −i, as notes: going round climbs D, E, G, A, and back to D. */
const QUARTERS = [pyth('D', 5), pyth('E', 5), pyth('G', 5), pyth('A', 5)];
/** Up the pentatonic and back to where it started: a circle. */
const CIRCLE_RUN = [...PENTA_UP.slice(0, 6), ...PENTA_UP.slice(0, 5).reverse()];

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
  /** Bronze: a bright, inharmonic FM clink. */
  private metal: Tone.PolySynth<Tone.FMSynth>;
  /** Knife scrape: white noise through a sweeping band-pass. */
  private scrapeFilter: Tone.Filter;
  private scrapeGain: Tone.Gain;

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
  /**
   * Voices for the drops and bubbles that cues schedule ahead of time. Kept apart from the pour's bubble loop
   * (and from each other while busy): a mono synth can't take a note earlier than one already scheduled on it.
   * Built up front, since an offline render only accepts nodes made while it is being set up.
   */
  private drops: Array<{ synth: Tone.Synth; free: number }>;
  private sideOsc: Tone.Oscillator[];
  private sideGain: Tone.Gain;
  private sideIdle = 0;
  /** A planet's song: one soft voice whose pitch follows how fast the planet turns. */
  private voiceOsc: Tone.Oscillator;
  private voiceGain: Tone.Gain;
  /** Where the voice sits, left to right (chapter 7's point pans as it goes round). */
  private voicePan: Tone.Panner;
  /** Chapter 8's handoff: an ambulance's two-tone siren. */
  private siren: Tone.Synth;
  /** Chapter 8's additive voice: a sine for each harmonic over one fundamental, each with its own loudness. */
  private harmOsc: Tone.Oscillator[];
  private harmGain: Tone.Gain[];

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

    this.metal = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 5.07,
      modulationIndex: 12,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.9, sustain: 0, release: 0.9 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
      volume: -24,
    }).connect(this.verb);

    this.scrapeGain = new Tone.Gain(0).connect(this.verb);
    this.scrapeFilter = new Tone.Filter({ type: 'bandpass', frequency: 3000, Q: 2.5 }).connect(
      this.scrapeGain,
    );
    const scrapeNoise = new Tone.Noise('white').connect(this.scrapeFilter);

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
    this.drops = Array.from({ length: 6 }, () => ({
      synth: new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.002, decay: 0.07, sustain: 0, release: 0.03 },
        volume: -22,
      }).connect(this.verb),
      free: 0,
    }));
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

    // The planet's voice: a triangle, softened, with a slow shimmer.
    this.voicePan = new Tone.Panner(0).connect(this.verb);
    this.voiceGain = new Tone.Gain(0).connect(this.voicePan);
    const voiceFilter = new Tone.Filter({ type: 'lowpass', frequency: 2200, Q: 0.5 }).connect(this.voiceGain);
    const voiceTrem = new Tone.Tremolo({ frequency: 4.5, depth: 0.18 }).connect(voiceFilter).start();
    this.voiceOsc = new Tone.Oscillator({ type: 'triangle', frequency: 130, volume: -12 }).connect(voiceTrem);

    this.siren = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.9, release: 0.4 },
      volume: -24,
    }).connect(this.verb);

    // Additive synthesis: sixteen sines at whole-number multiples of one fundamental; their mix is the timbre.
    const harmOut = new Tone.Filter({ type: 'lowpass', frequency: 5200, Q: 0.4 }).connect(this.verb);
    this.harmGain = Array.from({ length: HARMONICS }, () => new Tone.Gain(0).connect(harmOut));
    this.harmOsc = this.harmGain.map((g, i) =>
      new Tone.Oscillator({ type: 'sine', frequency: 147 * (i + 1), volume: -8 }).connect(g),
    );

    this.sources = [
      this.voiceOsc,
      scrapeNoise,
      whooshNoise,
      rumbleNoise,
      chalkNoise,
      pourNoise,
      chalkLfo,
      chalkLfo2,
      pourLfo,
      ...this.sideOsc,
      ...this.harmOsc,
    ];
  }

  async ready() {
    await this.verb.ready;
    const t = Tone.now();
    for (const s of this.sources) s.start(t);
  }

  // ---------- Continuous ----------

  continuous(id: 'chalk' | 'pour' | 'voice', level: number, time = Tone.now(), hz = 0, pan = 0) {
    const l = Math.min(Math.max(level, 0), 1);
    if (id === 'chalk') this.chalkGain.gain.setTargetAtTime(l * 0.55, time, 0.03);
    else if (id === 'voice') {
      if (hz > 0) this.voiceOsc.frequency.setTargetAtTime(hz, time, 0.03);
      this.voicePan.pan.setTargetAtTime(Math.min(Math.max(pan, -1), 1), time, 0.05);
      // Fades in as the planet sets off, and out (a little slower) when it stops.
      this.voiceGain.gain.setTargetAtTime(l * 0.2, time, l > 0 ? 0.15 : 0.35);
    } else {
      this.pourGain.gain.setTargetAtTime(l * 0.9, time, 0.08);
      this.bubbleLevel = l;
    }
  }

  /** Chapter 8's additive voice: each harmonic's loudness (0..1, fundamental first) over a fundamental of `hz`. */
  harmonics(amps: readonly number[], time = Tone.now(), hz = 0) {
    this.harmGain.forEach((g, i) => {
      const a = Math.min(Math.max(amps[i] ?? 0, 0), 1);
      if (hz > 0) this.harmOsc[i]!.frequency.setTargetAtTime(hz * (i + 1), time, 0.03);
      g.gain.setTargetAtTime(a * 0.12, time, a > 0 ? 0.06 : 0.25);
    });
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
        this.mono(this.thump, t, (at) => this.thump.triggerAttackRelease(pyth('C', 2), 0.3, at, 0.5));
        this.bell.triggerAttackRelease(pyth('E', 6), 1.4, t + 0.02, 0.25);
        this.bell.triggerAttackRelease(pyth('G', 6), 1.4, t + 0.12, 0.18);
        return;
      case 'pop': {
        const notes = [pyth('C', 5), pyth('E', 5), pyth('G', 5)];
        return this.blip.triggerAttackRelease(notes[params.pitch ?? 0] ?? notes[0]!, 0.08, t, 0.7);
      }
      case 'tick':
        this.mono(this.click, t, (at) => this.click.triggerAttackRelease(0.02, at, 0.9));
        return this.blip.triggerAttackRelease(2200, 0.03, t, 0.35);
      case 'rise':
        this.rumble(t, 1.8, params.gain ?? 1, 180, 900);
        this.mono(this.thump, t + 1.6, (at) =>
          this.thump.triggerAttackRelease(pyth('G', 1), 0.4, at, 0.35 * (params.gain ?? 1)),
        );
        [pyth('G', 5), pyth('C', 6), pyth('E', 6)].forEach((f, i) =>
          this.bell.triggerAttackRelease(f, 1.6, t + 1.0 + i * 0.16, 0.12),
        );
        return;
      case 'sink':
        return this.rumble(t, 1.5, 0.8, 400, 120);
      case 'count':
        for (let i = 0; i < 12; i++) {
          const k = i / 11;
          this.mono(this.click, t + 1.7 * (1 - Math.pow(1 - k, 1.6)), (at) =>
            this.click.triggerAttackRelease(0.015, at, 0.4),
          );
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
        this.mono(this.clackBody, t, (at) => this.clackBody.triggerAttackRelease(f * 2, 0.08, at, 0.9));
        this.mono(this.clackNoise, t, (at) => this.clackNoise.triggerAttackRelease(0.05, at, 0.8));
        return;
      }
      case 'glow': {
        const chord = params.which === 1 ? triangleChord(pyth('C', 5)) : [pyth('E', 5), pyth('G', 5)];
        chord.forEach((f, i) => this.bell.triggerAttackRelease(f, 2, t + i * 0.07, 0.18));
        return;
      }
      case 'formula':
        if (params.chapter === 8) {
          // The harmonic series climbed (1, 2, 3, 4, 5, 6 times one note), then the first four together.
          const f = pyth('D', 3);
          [1, 2, 3, 4, 5, 6].forEach((n, i) =>
            this.bell.triggerAttackRelease(f * n, 1.4, t + i * 0.11, 0.24),
          );
          [1, 2, 3, 4].forEach((n, i) =>
            this.bell.triggerAttackRelease(f * n, 3.5, t + 0.85 + i * 0.06, 0.38),
          );
          return;
        }
        if (params.chapter === 7) {
          // Half way round the circle (θ = π), one step home (+ 1), then the open D–A fifths (= 0).
          [pyth('D', 5), pyth('E', 5), pyth('G', 5), pyth('A', 5), pyth('D', 6)].forEach((f, i) =>
            this.bell.triggerAttackRelease(f, 1.2, t + i * 0.09, 0.24),
          );
          this.bell.triggerAttackRelease(pyth('A', 4), 1.4, t + 0.62, 0.3);
          [pyth('D', 3), pyth('A', 3), pyth('D', 4), pyth('A', 4)].forEach((f, i) =>
            this.bell.triggerAttackRelease(f, 3.5, t + 0.95 + i * 0.1, 0.4),
          );
          return;
        }
        if (params.chapter === 6) {
          // Columns adding up: a quick stair of notes climbing, then an open F chord with its seventh.
          PENTA_UP.slice(0, 8).forEach((f, i) => this.bell.triggerAttackRelease(f, 1.2, t + i * 0.08, 0.22));
          [pyth('F', 3), pyth('C', 4), pyth('A', 4), pyth('E', 5)].forEach((f, i) =>
            this.bell.triggerAttackRelease(f, 3.5, t + 0.75 + i * 0.1, 0.4),
          );
          return;
        }
        if (params.chapter === 5) {
          // An apple's fall: four notes dropping, each a little sooner than the last, then the open chord.
          [pyth('G', 5), pyth('E', 5), pyth('C', 5), pyth('G', 4)].forEach((f, i) =>
            this.bell.triggerAttackRelease(f, 1.2, t + [0, 0.36, 0.6, 0.76][i]!, 0.3),
          );
          [pyth('G', 3), pyth('D', 4), pyth('B', 4)].forEach((f, i) =>
            this.bell.triggerAttackRelease(f, 3.5, t + 1.1 + i * 0.1, 0.42),
          );
          return;
        }
        if (params.chapter === 4) {
          // The Earth's song in Harmonices Mundi, mi–fa–mi, then the open chord.
          [pyth('E', 5), pyth('F', 5), pyth('E', 5)].forEach((f, i) =>
            this.bell.triggerAttackRelease(f, 1.2, t + i * 0.3, 0.3),
          );
          [pyth('C', 4), pyth('G', 4), pyth('E', 5)].forEach((f, i) =>
            this.bell.triggerAttackRelease(f, 3.5, t + 1.0 + i * 0.1, 0.42),
          );
          return;
        }
        if (params.chapter === 3) {
          // Three drops falling into still water, then the open chord.
          [pyth('G', 5), pyth('E', 5), pyth('C', 5)].forEach((f, i) => this.drop(t + i * 0.22, f));
          [pyth('C', 4), pyth('G', 4), pyth('E', 5)].forEach((f, i) =>
            this.bell.triggerAttackRelease(f, 3.5, t + 0.8 + i * 0.1, 0.42),
          );
          return;
        }
        if (params.chapter === 2) {
          // Once round the pentatonic circle, then a wide, open C chord.
          CIRCLE_RUN.forEach((f, i) => this.bell.triggerAttackRelease(f, 1.6, t + i * 0.09, 0.22));
          [pyth('C', 4), pyth('G', 4), pyth('E', 5)].forEach((f, i) =>
            this.bell.triggerAttackRelease(f, 3.5, t + 0.75 + i * 0.1, 0.42),
          );
          return;
        }
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
      case 'cut': {
        // A knife drawn across bronze: a rising hiss and a faint ring.
        const f = this.scrapeFilter.frequency;
        f.cancelScheduledValues(t);
        f.setValueAtTime(2200, t);
        f.exponentialRampToValueAtTime(6200, t + 0.55);
        const g = this.scrapeGain.gain;
        g.cancelScheduledValues(t);
        g.setValueAtTime(0, t);
        g.linearRampToValueAtTime(0.16, t + 0.08);
        g.linearRampToValueAtTime(0.1, t + 0.45);
        g.linearRampToValueAtTime(0, t + 0.7);
        const ring = [pyth('A', 6), pyth('E', 6), pyth('G', 6), pyth('D', 6)][(params.i ?? 0) % 4]!;
        this.metal.triggerAttackRelease(ring, 0.6, t + 0.62, 0.35);
        return;
      }
      case 'tink': {
        const f = PENTA_UP[Math.min(params.i ?? 0, PENTA_UP.length - 1)]!;
        this.metal.triggerAttackRelease(f, 0.5, t, 0.55);
        return;
      }
      case 'riffle': {
        // Pieces landing one after another, like a deck of cards being riffled.
        const n = Math.max(4, Math.min(params.n ?? 8, 24));
        const dur = params.dur ?? 1.2;
        const t0 = t + (params.delay ?? 0);
        for (let i = 0; i < n; i++) {
          const jitter = (((i * 7919) % 13) / 13 - 0.5) * (dur / n) * 0.5;
          const at = t0 + (dur * i) / n + jitter;
          this.mono(this.clackNoise, Math.max(t0, at), (at) =>
            this.clackNoise.triggerAttackRelease(0.03, at, 0.18 + ((i * 31) % 7) / 30),
          );
        }
        return;
      }
      case 'double': {
        // Each doubling of the slices climbs one step.
        const k = Math.max(0, Math.min(params.k ?? 0, PENTA_UP.length - 3));
        this.bell.triggerAttackRelease(PENTA_UP[k + 2]!, 1.2, t, 0.22);
        this.blip.triggerAttackRelease(PENTA_UP[k + 2]! * 2, 0.06, t, 0.35);
        return;
      }
      case 'uncoil':
        this.whoosh(t, 0.55, 3.2);
        this.rumble(t + 0.2, 2.4, 0.35, 300, 700);
        return;
      case 'plunk': {
        // Something heavy slipping under the surface: a soft low thump and a burst of bubbles.
        const k = params.small ? 0.6 : 1;
        this.mono(this.thump, t, (at) => this.thump.triggerAttackRelease(pyth('D', 2), 0.25, at, 0.45 * k));
        this.rumble(t, 0.6, 0.35 * k, 700, 250);
        for (let i = 0; i < 6; i++)
          this.drop(t + 0.06 + i * 0.07 + ((i * 37) % 5) * 0.01, 420 + ((i * 173) % 7) * 90, 0.5);
        return;
      }
      case 'bloop':
        // The bubble breaking the surface.
        this.drop(t, 260, 0.8, 0.22, 4.5);
        this.bell.triggerAttackRelease(pyth('A', 5), 1.4, t + 0.12, 0.16);
        return;
      case 'eureka': {
        const run = [pyth('C', 5), pyth('E', 5), pyth('G', 5), pyth('C', 6), pyth('E', 6)];
        run.forEach((f, i) => this.bell.triggerAttackRelease(f, 1.6, t + i * 0.07, 0.3));
        [pyth('C', 4), pyth('G', 4), pyth('E', 5)].forEach((f, i) =>
          this.bell.triggerAttackRelease(f, 3, t + 0.4 + i * 0.05, 0.36),
        );
        this.whoosh(t, 0.35, 1.4);
        return;
      }
      case 'sighting': {
        // One of Tycho's sightings marked: a small, high star of a note.
        const f = PENTA_UP[(params.i ?? 0) % PENTA_UP.length]! * 2;
        this.blip.triggerAttackRelease(f, 0.06, t, 0.4);
        return;
      }
      case 'miss':
        // Where the circle misses: two notes a semitone apart, rubbing.
        this.bell.triggerAttackRelease(pyth('B', 4), 2.2, t, 0.22);
        this.bell.triggerAttackRelease(pyth('C', 5), 2.2, t + 0.04, 0.2);
        this.rumble(t, 0.9, 0.25, 500, 180);
        return;
      case 'pin':
        this.metal.triggerAttackRelease([pyth('A', 6), pyth('E', 6)][(params.i ?? 0) % 2]!, 0.5, t, 0.5);
        this.mono(this.click, t, (at) => this.click.triggerAttackRelease(0.015, at, 0.35));
        return;
      case 'pillars': {
        // The six planets' pillars rise one by one (Mercury first, each a note lower), then sound together.
        const chord = [pyth('D', 6), pyth('B', 5), pyth('G', 5), pyth('D', 5), pyth('B', 4), pyth('G', 4)];
        chord.forEach((f, i) => this.bell.triggerAttackRelease(f, 2.4, t + 0.9 + i * 0.36, 0.26));
        chord.forEach((f, i) => this.bell.triggerAttackRelease(f, 4, t + 3.3 + i * 0.03, 0.18));
        return;
      }
      case 'cannon':
        // Newton's cannon: a deep boom, the crack of the charge, and the roll of it fading away.
        this.mono(this.thump, t, (at) => this.thump.triggerAttackRelease(pyth('G', 1), 0.6, at, 0.95));
        this.mono(this.clackNoise, t, (at) => this.clackNoise.triggerAttackRelease(0.08, at, 0.9));
        this.mono(this.click, t, (at) => this.click.triggerAttackRelease(0.03, at, 0.6));
        this.rumble(t, 1.1, 0.7, 520, 90);
        return;
      case 'thud':
        // The ball coming down far away: a dull, distant thump.
        this.mono(this.thump, t, (at) => this.thump.triggerAttackRelease(pyth('D', 2), 0.3, at, 0.35));
        this.mono(this.clackNoise, t, (at) => this.clackNoise.triggerAttackRelease(0.03, at, 0.25));
        return;
      case 'flash': {
        // A strobe flash: a bright tick, a step lower each flash, as the apple falls.
        const k = params.k ?? 0;
        this.mono(this.click, t, (at) => this.click.triggerAttackRelease(0.012, at, 0.5));
        this.blip.triggerAttackRelease(2400 * Math.pow(0.94, k), 0.03, t, 0.3);
        return;
      }
      case 'column': {
        // A column rising: a soft note as high as the column is tall.
        const hz = params.hz ?? 330;
        this.bell.triggerAttackRelease(hz, 1.4, t, 0.3);
        this.blip.triggerAttackRelease(hz * 2, 0.05, t, 0.25);
        return;
      }
      case 'step': {
        // A column landing on the stair: a soft knock, and a note a step higher each time.
        const i = Math.max(0, Math.min(params.i ?? 0, PENTA_UP.length - 1));
        this.mono(this.clackBody, t, (at) =>
          this.clackBody.triggerAttackRelease(pyth('G', 2), 0.06, at, 0.45),
        );
        this.bell.triggerAttackRelease(PENTA_UP[i]!, 1, t, 0.26);
        return;
      }
      case 'land':
        // Something small landing softly on a planet: a low thump and a tick.
        this.mono(this.thump, t, (at) => this.thump.triggerAttackRelease(pyth('G', 2), 0.25, at, 0.4));
        this.mono(this.click, t, (at) => this.click.triggerAttackRelease(0.015, at, 0.3));
        return;
      case 'quarter': {
        // A quarter turn landing (× i): the quarter point's note, and under −1 the octave below, as a floor.
        const k = (((params.k ?? 1) % 4) + 4) % 4;
        this.bell.triggerAttackRelease(QUARTERS[k]!, 1.6, t, 0.3);
        this.blip.triggerAttackRelease(QUARTERS[k]! * 2, 0.05, t, 0.3);
        if (k === 2) this.bell.triggerAttackRelease(pyth('G', 3), 2.2, t + 0.04, 0.3);
        return;
      }
      case 'arrive': {
        // The dragged point snapping onto 1, i, −1 or −i: lighter than the story's turn; at −1, a little chord.
        const k = (((params.k ?? 0) % 4) + 4) % 4;
        this.blip.triggerAttackRelease(QUARTERS[k]!, 0.08, t, 0.5);
        this.bell.triggerAttackRelease(QUARTERS[k]!, 1, t, 0.16);
        if (k === 2)
          [pyth('D', 4), pyth('A', 4), pyth('E', 5)].forEach((f, i) =>
            this.bell.triggerAttackRelease(f, 1.8, t + 0.05 + i * 0.07, 0.22),
          );
        return;
      }
      case 'term': {
        // One of the series' arrows laid down: each a step further round the turn's notes, and quieter, as they shrink.
        const k = Math.max(0, params.k ?? 0);
        const f = QUARTERS[k % 4]! * 2 ** Math.min(Math.floor(k / 4), 1);
        this.blip.triggerAttackRelease(f, 0.06, t, 0.12 + 0.4 * Math.pow(0.82, k));
        if (k < 4) this.bell.triggerAttackRelease(f, 1.2, t, 0.2);
        return;
      }
      case 'harmonic': {
        // A circle arriving: its own harmonic, rung softly, over the clockwork's note.
        const hz = (params.hz ?? pyth('D', 3)) * (params.n ?? 1);
        this.bell.triggerAttackRelease(hz, 1.2, t, 0.2);
        this.blip.triggerAttackRelease(hz * 2, 0.04, t, 0.18);
        return;
      }
      case 'spectrum': {
        // The bars standing up, one per speed: the square wave's harmonics, 1, 3, 5… played in turn.
        const hz = params.hz ?? pyth('D', 3);
        [1, 3, 5, 7, 9, 11, 13, 15].forEach((n, i) =>
          this.bell.triggerAttackRelease(hz * n, 1.2, t + 0.1 + i * 0.16, 0.22 / Math.sqrt(1 + i * 0.4)),
        );
        return;
      }
      case 'siren': {
        // Hi–lo, three times, then the pitch sinks as it goes by: the next chapter's question.
        const hi = 960;
        const lo = 770;
        const f = this.siren.frequency;
        f.cancelScheduledValues(t);
        this.siren.triggerAttack(hi, t, 0.55);
        for (let i = 0; i < 6; i++) f.setValueAtTime(i % 2 === 0 ? hi : lo, t + i * 0.45);
        const drop = t + 2.7;
        f.setValueAtTime(hi * 0.97, drop);
        for (let i = 0; i < 4; i++) f.setValueAtTime((i % 2 === 0 ? lo : hi) * 0.86, drop + 0.2 + i * 0.45);
        this.siren.triggerRelease(drop + 2.1);
        return;
      }
      case 'uiHover':
        return this.blip.triggerAttackRelease(1800, 0.02, t, 0.12);
      case 'uiClick':
        this.mono(this.click, t, (at) => this.click.triggerAttackRelease(0.015, at, 0.4));
        return this.blip.triggerAttackRelease(880, 0.04, t, 0.3);
      default:
        return;
    }
  }

  /** One water drop or bubble: a sine blip that slides up in pitch. */
  /** When each one-voice synth last started a note. */
  private lastStart = new Map<object, number>();

  /**
   * Plays a note on a one-voice synth. Such a synth can't start a note at or before one it has already started, but
   * two cues can land at the same instant: the second then starts just after the first, or, if that would be audibly
   * late, is dropped.
   */
  private mono(synth: object, t: number, play: (at: number) => unknown) {
    const last = this.lastStart.get(synth) ?? -Infinity;
    const at = t > last ? t : last + 0.003;
    if (at - t > 0.05) return;
    this.lastStart.set(synth, at);
    play(at);
  }

  private drop(t: number, f: number, velocity = 0.6, dur = 0.05, rise = 1.8) {
    const voice = this.drops.find((d) => d.free <= t);
    // Six at once is more than any cue asks for; if they are all busy, this drop is lost in the others.
    if (!voice) return;
    voice.free = t + dur + 0.1;
    voice.synth.frequency.setValueAtTime(f, t);
    voice.synth.frequency.exponentialRampToValueAtTime(f * rise, t + dur);
    voice.synth.triggerAttackRelease(f, dur * 0.8, t, velocity);
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
    g.linearRampToValueAtTime(0.38 * gain, t + dur * 0.4);
    g.linearRampToValueAtTime(0, t + dur);
  }

  dispose() {
    for (const d of this.drops) d.synth.dispose();
    for (const s of this.sources) s.dispose();
    this.siren.dispose();
    this.out.dispose();
  }
}
