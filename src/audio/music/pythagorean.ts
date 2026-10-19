import * as Tone from 'tone';
import { C3, pyth, triangleChord, type Note } from '../tuning';

export type Theme = 'pythagoras' | 'circle' | 'water' | 'spheres' | 'gravity' | 'rising';

/** How the score sounds during one beat. Values are targets the score glides to. */
export interface Layers {
  drone: number;
  pad: number;
  cutoff: number;
  plucks: number;
  arp: number;
  /** 'prog' cycles the theme's chords; 'resolve' holds the 3:4:5 triangle chord. */
  harmony: 'prog' | 'resolve';
  /** Chapter theme: its drone and chord progression. Defaults to chapter 1's. */
  theme?: Theme;
  /** Arpeggio in sixteenths instead of eighths. */
  arpFast?: boolean;
  /** Extra octaves on the arpeggio. */
  arpOctave?: number;
}

const QUIET: Layers = { drone: 0, pad: 0, cutoff: 500, plucks: 0, arp: 0, harmony: 'prog' };
const CIRCLE: Theme = 'circle';
const WATER: Theme = 'water';
const SPHERES: Theme = 'spheres';
const GRAVITY: Theme = 'gravity';
const RISING: Theme = 'rising';

/**
 * Per-beat arrangement. Chapter 1 is "Pythagorean Drone" (C–Am–F–G over a C–G drone); chapter 2 turns to
 * "Circles" (F–G–Em–Am over an A–E drone, the arpeggio going round its chord rather than up and down, and
 * climbing as the slices multiply); chapter 3, the bath, is "Water" (Dm–F–C–G over a D–A drone, the arpeggio
 * rippling); chapter 4, among the planets, is "Spheres" (Em–Am–C–G over an E–B drone, the arpeggio wheeling
 * slowly); chapter 5, Newton's, is "Falling" (G–Em–Am–C over a G–D drone, the arpeggio falling); chapter 6, in the
 * abstract realm, is "Rising" (F–Am–Dm–G over an F–C drone, the arpeggio climbing like a stair). The drone glides
 * into each new key during the flight.
 */
export const ARRANGEMENT: Record<string, Layers> = {
  teaser: { drone: 0.55, pad: 0.6, cutoff: 700, plucks: 0.14, arp: 0, harmony: 'prog' },
  'pythagoras:title': { drone: 0.8, pad: 0.75, cutoff: 650, plucks: 0.1, arp: 0, harmony: 'prog' },
  'pythagoras:draw': { drone: 0.8, pad: 0.7, cutoff: 800, plucks: 0.24, arp: 0, harmony: 'prog' },
  'pythagoras:squares': { drone: 0.85, pad: 0.8, cutoff: 1100, plucks: 0.2, arp: 0.55, harmony: 'prog' },
  'pythagoras:pour': { drone: 0.9, pad: 0.85, cutoff: 2300, plucks: 0.12, arp: 0.8, harmony: 'prog' },
  'pythagoras:brim': { drone: 0.9, pad: 0.9, cutoff: 2700, plucks: 0.3, arp: 0.6, harmony: 'prog' },
  'pythagoras:rearrangeA': { drone: 0.7, pad: 0.6, cutoff: 1400, plucks: 0.3, arp: 0, harmony: 'prog' },
  'pythagoras:rearrangeB': { drone: 0.75, pad: 0.65, cutoff: 1600, plucks: 0.32, arp: 0.3, harmony: 'prog' },
  'pythagoras:formula': { drone: 0.9, pad: 1, cutoff: 3000, plucks: 0, arp: 0, harmony: 'resolve' },
  'pythagoras:yourTurn': { drone: 0.5, pad: 0.45, cutoff: 700, plucks: 0.12, arp: 0, harmony: 'prog' },
  'pythagoras:handoff': { drone: 0.8, pad: 0.75, cutoff: 1800, plucks: 0.1, arp: 0.7, harmony: 'prog' },
  'pythagoras:slices': { drone: 0.8, pad: 0.75, cutoff: 1800, plucks: 0.1, arp: 0.85, harmony: 'prog' },
  'pythagoras:lab': { drone: 0.45, pad: 0.4, cutoff: 800, plucks: 0.1, arp: 0, harmony: 'prog' },
  'circle-area:flight': {
    drone: 0.9,
    pad: 0.9,
    cutoff: 2600,
    plucks: 0.2,
    arp: 0.5,
    harmony: 'prog',
    theme: CIRCLE,
  },
  'circle-area:title': {
    drone: 0.8,
    pad: 0.75,
    cutoff: 700,
    plucks: 0.12,
    arp: 0,
    harmony: 'prog',
    theme: CIRCLE,
  },
  'circle-area:slice': {
    drone: 0.8,
    pad: 0.7,
    cutoff: 900,
    plucks: 0.22,
    arp: 0,
    harmony: 'prog',
    theme: CIRCLE,
  },
  'circle-area:deal': {
    drone: 0.85,
    pad: 0.8,
    cutoff: 1300,
    plucks: 0.14,
    arp: 0.55,
    harmony: 'prog',
    theme: CIRCLE,
  },
  'circle-area:refine': {
    drone: 0.9,
    pad: 0.85,
    cutoff: 2400,
    plucks: 0.08,
    arp: 0.7,
    harmony: 'prog',
    theme: CIRCLE,
    arpFast: true,
    arpOctave: 1,
  },
  'circle-area:rectangle': {
    drone: 0.8,
    pad: 0.8,
    cutoff: 1600,
    plucks: 0.28,
    arp: 0.3,
    harmony: 'prog',
    theme: CIRCLE,
  },
  'circle-area:formula': {
    drone: 0.9,
    pad: 1,
    cutoff: 3000,
    plucks: 0,
    arp: 0,
    harmony: 'resolve',
    theme: CIRCLE,
  },
  'circle-area:onion': {
    drone: 0.85,
    pad: 0.8,
    cutoff: 2000,
    plucks: 0.1,
    arp: 0.6,
    harmony: 'prog',
    theme: CIRCLE,
    arpFast: true,
  },
  'circle-area:yourTurn': {
    drone: 0.5,
    pad: 0.45,
    cutoff: 700,
    plucks: 0.12,
    arp: 0,
    harmony: 'prog',
    theme: CIRCLE,
  },
  'circle-area:handoff': {
    drone: 0.8,
    pad: 0.75,
    cutoff: 1800,
    plucks: 0.1,
    arp: 0.6,
    harmony: 'prog',
    theme: CIRCLE,
  },
  'circle-area:lab': {
    drone: 0.45,
    pad: 0.4,
    cutoff: 800,
    plucks: 0.1,
    arp: 0,
    harmony: 'prog',
    theme: CIRCLE,
  },
  'archimedes:flight': {
    drone: 0.9,
    pad: 0.9,
    cutoff: 2600,
    plucks: 0.2,
    arp: 0.5,
    harmony: 'prog',
    theme: WATER,
  },
  'archimedes:title': {
    drone: 0.8,
    pad: 0.75,
    cutoff: 700,
    plucks: 0.14,
    arp: 0,
    harmony: 'prog',
    theme: WATER,
  },
  'archimedes:weigh': {
    drone: 0.8,
    pad: 0.7,
    cutoff: 900,
    plucks: 0.24,
    arp: 0,
    harmony: 'prog',
    theme: WATER,
  },
  'archimedes:lower': {
    drone: 0.85,
    pad: 0.8,
    cutoff: 1300,
    plucks: 0.12,
    arp: 0.5,
    harmony: 'prog',
    theme: WATER,
  },
  'archimedes:push': {
    drone: 0.85,
    pad: 0.85,
    cutoff: 1800,
    plucks: 0.2,
    arp: 0.4,
    harmony: 'prog',
    theme: WATER,
  },
  'archimedes:formula': {
    drone: 0.9,
    pad: 1,
    cutoff: 3000,
    plucks: 0,
    arp: 0,
    harmony: 'resolve',
    theme: WATER,
  },
  'archimedes:eureka': {
    drone: 0.9,
    pad: 0.9,
    cutoff: 2400,
    plucks: 0.16,
    arp: 0.7,
    harmony: 'prog',
    theme: WATER,
    arpFast: true,
  },
  'archimedes:float': {
    drone: 0.75,
    pad: 0.7,
    cutoff: 600,
    plucks: 0.1,
    arp: 0.3,
    harmony: 'prog',
    theme: WATER,
  },
  'archimedes:yourTurn': {
    drone: 0.5,
    pad: 0.45,
    cutoff: 700,
    plucks: 0.12,
    arp: 0,
    harmony: 'prog',
    theme: WATER,
  },
  'archimedes:handoff': {
    drone: 0.8,
    pad: 0.8,
    cutoff: 1900,
    plucks: 0.1,
    arp: 0.6,
    harmony: 'prog',
    theme: WATER,
    arpOctave: 1,
  },
  'archimedes:lab': {
    drone: 0.45,
    pad: 0.4,
    cutoff: 800,
    plucks: 0.1,
    arp: 0,
    harmony: 'prog',
    theme: WATER,
  },
  'kepler:flight': {
    drone: 0.9,
    pad: 0.9,
    cutoff: 2600,
    plucks: 0.2,
    arp: 0.5,
    harmony: 'prog',
    theme: SPHERES,
  },
  'kepler:title': {
    drone: 0.8,
    pad: 0.8,
    cutoff: 700,
    plucks: 0.12,
    arp: 0,
    harmony: 'prog',
    theme: SPHERES,
  },
  'kepler:circle': {
    drone: 0.8,
    pad: 0.7,
    cutoff: 900,
    plucks: 0.18,
    arp: 0,
    harmony: 'prog',
    theme: SPHERES,
  },
  'kepler:ellipse': {
    drone: 0.8,
    pad: 0.75,
    cutoff: 1200,
    plucks: 0.12,
    arp: 0.3,
    harmony: 'prog',
    theme: SPHERES,
  },
  // The planet sings through the next two beats, so the score steps back.
  'kepler:areas': {
    drone: 0.7,
    pad: 0.6,
    cutoff: 1100,
    plucks: 0,
    arp: 0.25,
    harmony: 'prog',
    theme: SPHERES,
  },
  'kepler:compare': {
    drone: 0.7,
    pad: 0.6,
    cutoff: 1000,
    plucks: 0.06,
    arp: 0.2,
    harmony: 'prog',
    theme: SPHERES,
  },
  'kepler:formula': {
    drone: 0.9,
    pad: 1,
    cutoff: 3000,
    plucks: 0,
    arp: 0,
    harmony: 'resolve',
    theme: SPHERES,
  },
  'kepler:yourTurn': {
    drone: 0.45,
    pad: 0.4,
    cutoff: 700,
    plucks: 0.06,
    arp: 0,
    harmony: 'prog',
    theme: SPHERES,
  },
  'kepler:harmony': {
    drone: 0.9,
    pad: 0.9,
    cutoff: 2600,
    plucks: 0.14,
    arp: 0.6,
    harmony: 'prog',
    theme: SPHERES,
    arpOctave: 1,
  },
  'kepler:handoff': {
    drone: 0.8,
    pad: 0.75,
    cutoff: 1800,
    plucks: 0.1,
    arp: 0.5,
    harmony: 'prog',
    theme: SPHERES,
  },
  'kepler:lab': { drone: 0.4, pad: 0.35, cutoff: 800, plucks: 0.06, arp: 0, harmony: 'prog', theme: SPHERES },
  'newton:flight': {
    drone: 0.75,
    pad: 0.9,
    cutoff: 2600,
    plucks: 0.2,
    arp: 0.5,
    harmony: 'prog',
    theme: GRAVITY,
  },
  'newton:title': {
    drone: 0.67,
    pad: 0.8,
    cutoff: 700,
    plucks: 0.12,
    arp: 0,
    harmony: 'prog',
    theme: GRAVITY,
  },
  // The cannon booms and the ball whistles through the next beats, so the score keeps out of their way.
  'newton:cannon': {
    drone: 0.62,
    pad: 0.65,
    cutoff: 900,
    plucks: 0.08,
    arp: 0,
    harmony: 'prog',
    theme: GRAVITY,
  },
  'newton:orbit': {
    drone: 0.67,
    pad: 0.7,
    cutoff: 1400,
    plucks: 0,
    arp: 0.35,
    harmony: 'prog',
    theme: GRAVITY,
  },
  'newton:laws': {
    drone: 0.62,
    pad: 0.7,
    cutoff: 1000,
    plucks: 0.1,
    arp: 0.2,
    harmony: 'prog',
    theme: GRAVITY,
  },
  'newton:moon': {
    drone: 0.7,
    pad: 0.85,
    cutoff: 1800,
    plucks: 0.1,
    arp: 0.3,
    harmony: 'prog',
    theme: GRAVITY,
    arpOctave: 1,
  },
  'newton:shells': {
    drone: 0.7,
    pad: 0.8,
    cutoff: 2200,
    plucks: 0.12,
    arp: 0.5,
    harmony: 'prog',
    theme: GRAVITY,
  },
  'newton:formula': {
    drone: 0.75,
    pad: 1,
    cutoff: 3000,
    plucks: 0,
    arp: 0,
    harmony: 'resolve',
    theme: GRAVITY,
  },
  'newton:ellipse': {
    drone: 0.67,
    pad: 0.7,
    cutoff: 1600,
    plucks: 0,
    arp: 0.3,
    harmony: 'prog',
    theme: GRAVITY,
  },
  'newton:yourTurn': {
    drone: 0.38,
    pad: 0.4,
    cutoff: 700,
    plucks: 0.06,
    arp: 0,
    harmony: 'prog',
    theme: GRAVITY,
  },
  'newton:handoff': {
    drone: 0.67,
    pad: 0.75,
    cutoff: 1800,
    plucks: 0.1,
    arp: 0.5,
    harmony: 'prog',
    theme: GRAVITY,
  },
  'newton:lab': {
    drone: 0.33,
    pad: 0.35,
    cutoff: 800,
    plucks: 0.06,
    arp: 0,
    harmony: 'prog',
    theme: GRAVITY,
  },
  'calculus:flight': {
    drone: 0.85,
    pad: 1.1,
    cutoff: 2600,
    plucks: 0.2,
    arp: 0.6,
    harmony: 'prog',
    theme: RISING,
    arpOctave: -1,
  },
  'calculus:title': {
    drone: 0.77,
    pad: 1.0,
    cutoff: 700,
    plucks: 0.12,
    arp: 0,
    harmony: 'prog',
    theme: RISING,
  },
  'calculus:speed': {
    drone: 0.72,
    pad: 0.9,
    cutoff: 1000,
    plucks: 0.1,
    arp: 0.3,
    harmony: 'prog',
    theme: RISING,
    arpOctave: -1,
  },
  // The columns sing as they split, so the arpeggio stays light.
  'calculus:columns': {
    drone: 0.72,
    pad: 0.9,
    cutoff: 1400,
    plucks: 0.06,
    arp: 0.3,
    harmony: 'prog',
    theme: RISING,
    arpOctave: -1,
  },
  'calculus:stack': {
    drone: 0.77,
    pad: 1.0,
    cutoff: 1800,
    plucks: 0.08,
    arp: 0.55,
    harmony: 'prog',
    theme: RISING,
    arpOctave: -1,
  },
  'calculus:slope': {
    drone: 0.72,
    pad: 0.9,
    cutoff: 1200,
    plucks: 0.1,
    arp: 0.3,
    harmony: 'prog',
    theme: RISING,
    arpOctave: -1,
  },
  // A voice sings the curve's height as the probe moves, alone over the pad.
  'calculus:match': {
    drone: 0.72,
    pad: 0.9,
    cutoff: 1000,
    plucks: 0,
    arp: 0,
    harmony: 'prog',
    theme: RISING,
  },
  'calculus:formula': {
    drone: 0.75,
    pad: 1,
    cutoff: 3000,
    plucks: 0,
    arp: 0,
    harmony: 'resolve',
    theme: RISING,
  },
  'calculus:yourTurn': {
    drone: 0.38,
    pad: 0.4,
    cutoff: 700,
    plucks: 0.06,
    arp: 0,
    harmony: 'prog',
    theme: RISING,
  },
  'calculus:handoff': {
    drone: 0.77,
    pad: 0.95,
    cutoff: 1800,
    plucks: 0.1,
    arp: 0.5,
    harmony: 'prog',
    theme: RISING,
    arpOctave: -1,
  },
  'calculus:lab': {
    drone: 0.33,
    pad: 0.35,
    cutoff: 800,
    plucks: 0.06,
    arp: 0,
    harmony: 'prog',
    theme: RISING,
  },
  'euler:flight': {
    drone: 0.85,
    pad: 1.1,
    cutoff: 2600,
    plucks: 0.2,
    arp: 0.6,
    harmony: 'prog',
    theme: RISING,
    arpOctave: -1,
  },
  'euler:soon': {
    drone: 0.42,
    pad: 0.5,
    cutoff: 900,
    plucks: 0.1,
    arp: 0,
    harmony: 'prog',
    theme: RISING,
  },
  lab: { drone: 0.45, pad: 0.4, cutoff: 800, plucks: 0.1, arp: 0, harmony: 'prog' },
};

type Chord = Array<[Note, number]>;

// Chords as Pythagorean pitches: C – Am – F – G.
const PYTHAGORAS_CHORDS: Chord[] = [
  [
    ['C', 3],
    ['G', 3],
    ['C', 4],
    ['E', 4],
  ],
  [
    ['A', 2],
    ['E', 3],
    ['A', 3],
    ['C', 4],
  ],
  [
    ['F', 2],
    ['C', 3],
    ['F', 3],
    ['A', 3],
  ],
  [
    ['G', 2],
    ['D', 3],
    ['G', 3],
    ['B', 3],
  ],
];

// F – G – Em – Am.
const CIRCLE_CHORDS: Chord[] = [
  [
    ['F', 2],
    ['C', 3],
    ['F', 3],
    ['A', 3],
  ],
  [
    ['G', 2],
    ['D', 3],
    ['G', 3],
    ['B', 3],
  ],
  [
    ['E', 2],
    ['B', 2],
    ['E', 3],
    ['G', 3],
  ],
  [
    ['A', 2],
    ['E', 3],
    ['A', 3],
    ['C', 4],
  ],
];

// Dm – F – C – G, over a D–A drone: chapter 3, the bath.
const WATER_CHORDS: Chord[] = [
  [
    ['D', 2],
    ['A', 2],
    ['D', 3],
    ['F', 3],
  ],
  [
    ['F', 2],
    ['C', 3],
    ['F', 3],
    ['A', 3],
  ],
  [
    ['C', 2],
    ['G', 2],
    ['C', 3],
    ['E', 3],
  ],
  [
    ['G', 2],
    ['D', 3],
    ['G', 3],
    ['B', 3],
  ],
];

// Em – Am – C – G, over an E–B drone: chapter 4, the planets.
const SPHERES_CHORDS: Chord[] = [
  [
    ['E', 2],
    ['B', 2],
    ['E', 3],
    ['G', 3],
  ],
  [
    ['A', 2],
    ['E', 3],
    ['A', 3],
    ['C', 4],
  ],
  [
    ['C', 3],
    ['G', 3],
    ['C', 4],
    ['E', 4],
  ],
  [
    ['G', 2],
    ['D', 3],
    ['G', 3],
    ['B', 3],
  ],
];

// G – Em – Am – C, over a G–D drone: chapter 5, Newton's falling things.
const GRAVITY_CHORDS: Chord[] = [
  [
    ['G', 2],
    ['D', 3],
    ['G', 3],
    ['B', 3],
  ],
  [
    ['E', 2],
    ['B', 2],
    ['E', 3],
    ['G', 3],
  ],
  [
    ['A', 2],
    ['E', 3],
    ['A', 3],
    ['C', 4],
  ],
  [
    ['C', 3],
    ['G', 3],
    ['C', 4],
    ['E', 4],
  ],
];

// F – Am – Dm – G, over an F–C drone: chapter 6, the abstract realm (G over F, a Lydian brightness).
const RISING_CHORDS: Chord[] = [
  [
    ['F', 2],
    ['C', 3],
    ['F', 3],
    ['A', 3],
  ],
  [
    ['A', 2],
    ['E', 3],
    ['A', 3],
    ['C', 4],
  ],
  [
    ['D', 2],
    ['A', 2],
    ['D', 3],
    ['F', 3],
  ],
  [
    ['G', 2],
    ['D', 3],
    ['G', 3],
    ['B', 3],
  ],
];

const THEMES: Record<Theme, { chords: Chord[]; drone: [number, number, number] }> = {
  pythagoras: { chords: PYTHAGORAS_CHORDS, drone: [pyth('C', 2), pyth('G', 2), pyth('C', 3)] },
  circle: { chords: CIRCLE_CHORDS, drone: [pyth('A', 1), pyth('E', 2), pyth('A', 2)] },
  water: { chords: WATER_CHORDS, drone: [pyth('D', 2), pyth('A', 2), pyth('D', 3)] },
  spheres: { chords: SPHERES_CHORDS, drone: [pyth('E', 2), pyth('B', 2), pyth('E', 3)] },
  gravity: { chords: GRAVITY_CHORDS, drone: [pyth('G', 2), pyth('D', 3), pyth('G', 3)] },
  rising: { chords: RISING_CHORDS, drone: [pyth('F', 2), pyth('C', 3), pyth('F', 3)] },
};

const PENTATONIC: Array<[Note, number]> = [
  ['C', 5],
  ['D', 5],
  ['E', 5],
  ['G', 5],
  ['A', 5],
  ['C', 6],
  ['D', 6],
  ['E', 6],
];

function fallback(key: string | null): Layers {
  if (key?.startsWith('pythagoras')) return ARRANGEMENT['pythagoras:draw']!;
  if (key?.startsWith('circle-area')) return ARRANGEMENT['circle-area:slice']!;
  if (key?.startsWith('archimedes')) return ARRANGEMENT['archimedes:weigh']!;
  if (key?.startsWith('kepler')) return ARRANGEMENT['kepler:circle']!;
  if (key?.startsWith('newton')) return ARRANGEMENT['newton:cannon']!;
  if (key?.startsWith('calculus')) return ARRANGEMENT['calculus:speed']!;
  return QUIET;
}

/**
 * The generative score, in Pythagorean tuning throughout. A drone of pure fifths, a slow pad, sparse
 * pentatonic plucks and an arpeggio, layered per beat by ARRANGEMENT; each formula resolves on the 3:4:5 chord.
 */
export class PythagoreanScore {
  private out: Tone.Gain;
  private droneGain: Tone.Gain;
  private padFilter: Tone.Filter;
  private padGain: Tone.Gain;
  private pad: Tone.PolySynth<Tone.Synth>;
  private pluck: Tone.Synth;
  private arpSynth: Tone.FMSynth;
  private arpGain: Tone.Gain;
  private layers: Layers = QUIET;
  private chord = 0;
  private bar = 0;
  private theme: Theme = 'pythagoras';
  private drones: Tone.Oscillator[] = [];
  private sources: Array<{ start: (t?: number) => unknown; dispose: () => unknown }> = [];
  private loops: Tone.Loop[] = [];
  private rng = 1;

  constructor(destination: Tone.InputNode, transport: ReturnType<typeof Tone.getTransport>) {
    this.out = new Tone.Gain(1).connect(destination);
    const verb = new Tone.Reverb({ decay: 7, wet: 0.5 }).connect(this.out);
    const delay = new Tone.FeedbackDelay({ delayTime: 0.62, feedback: 0.38, wet: 0.35 }).connect(verb);

    // Drone: C2 + G2, a pure fifth, breathing slowly.
    this.droneGain = new Tone.Gain(0).connect(verb);
    const droneFilter = new Tone.Filter({ type: 'lowpass', frequency: 420 }).connect(this.droneGain);
    const trem = new Tone.Gain(0.8).connect(droneFilter);
    const breath = new Tone.LFO({ frequency: 0.07, min: 0.55, max: 1 }).connect(trem.gain);
    const d1 = new Tone.Oscillator({ type: 'triangle', frequency: C3 / 2, volume: -15 }).connect(trem);
    const d2 = new Tone.Oscillator({ type: 'sine', frequency: (C3 / 2) * 1.5, volume: -15 }).connect(trem);
    // A quiet octave above keeps the drone audible on small speakers.
    const d3 = new Tone.Oscillator({ type: 'sine', frequency: C3, volume: -24 }).connect(trem);

    // Pad.
    this.padGain = new Tone.Gain(0).connect(verb);
    this.padFilter = new Tone.Filter({ type: 'lowpass', frequency: 600, Q: 0.6 }).connect(this.padGain);
    const chorus = new Tone.Chorus({ frequency: 0.3, delayTime: 4, depth: 0.5, wet: 0.5 }).connect(
      this.padFilter,
    );
    this.pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fattriangle', count: 3, spread: 22 },
      envelope: { attack: 2.6, decay: 1.5, sustain: 0.75, release: 5 },
      volume: -15,
    }).connect(chorus);

    // Plucks.
    this.pluck = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.004, decay: 0.7, sustain: 0, release: 0.9 },
      volume: -15,
    }).connect(delay);

    // Arpeggio.
    this.arpGain = new Tone.Gain(0).connect(delay);
    this.arpSynth = new Tone.FMSynth({
      harmonicity: 2,
      modulationIndex: 2.5,
      envelope: { attack: 0.01, decay: 0.35, sustain: 0, release: 0.4 },
      modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 },
      volume: -14,
    }).connect(this.arpGain);

    this.sources = [d1, d2, d3, breath];
    this.drones = [d1, d2, d3];

    // Harmony: one chord per bar (4 beats at 72 bpm ≈ 3.3 s), two bars per chord.
    transport.bpm.value = 72;
    this.loops.push(
      new Tone.Loop((time) => {
        const l = this.layers;
        if (l.pad <= 0.01) return;
        if (l.harmony === 'resolve') {
          if (this.bar % 2 === 0) this.pad.triggerAttackRelease(triangleChord(pyth('C', 4)), '1m', time, 0.7);
        } else if (this.bar % 2 === 0) {
          const chords = THEMES[this.theme].chords;
          const notes = chords[this.chord % chords.length]!.map(([n, o]) => pyth(n, o));
          this.pad.triggerAttackRelease(notes, '2m', time, 0.6);
          this.chord++;
        }
        this.bar++;
      }, '1m').start(0),
    );
    // Plucks on eighth notes, sparse and random.
    this.loops.push(
      new Tone.Loop((time) => {
        if (this.random() < this.layers.plucks) {
          const [n, o] = PENTATONIC[Math.floor(this.random() * PENTATONIC.length)]!;
          this.pluck.triggerAttackRelease(pyth(n, o), '8n', time, 0.35 + this.random() * 0.4);
        }
      }, '8n').start(0),
    );
    // Arpeggio of the current chord: up and down in eighths (chapter 1), or round and round (chapter 2).
    let step = 0;
    let tick = 0;
    this.loops.push(
      new Tone.Loop((time) => {
        const l = this.layers;
        const on = l.arpFast || tick % 2 === 0;
        tick++;
        if (l.arp <= 0.01 || !on) return;
        const chords = THEMES[this.theme].chords;
        const up = 2 + (l.arpOctave ?? 0);
        const chord =
          l.harmony === 'resolve'
            ? triangleChord(pyth('C', 5))
            : chords[Math.max(this.chord - 1, 0) % chords.length]!.map(([n, o]) => pyth(n, o + up));
        // Up and down (chapter 1), round and round (chapter 2), rippling (chapter 3), wheeling (chapter 4),
        // falling (chapter 5), climbing a stair of octaves (chapter 6).
        const order =
          this.theme === 'circle'
            ? [0, 1, 2, 3]
            : this.theme === 'water'
              ? [0, 2, 1, 3]
              : this.theme === 'spheres'
                ? [0, 3, 1, 2, 3, 1]
                : this.theme === 'gravity'
                  ? [3, 2, 1, 0]
                  : this.theme === 'rising'
                    ? [0, 1, 2, 3, 5, 6, 7]
                    : [0, 1, 2, 3, 2, 1];
        const k = order[step % order.length]!;
        // Past the top of the chord, the stair goes on an octave up.
        const f = chord[k % chord.length]! * (this.theme === 'rising' ? 2 ** Math.floor(k / 4) : 1);
        this.arpSynth.triggerAttackRelease(f, '16n', time, l.arpFast ? 0.38 : 0.5);
        step++;
      }, '16n').start(0),
    );
  }

  async ready() {
    const t = Tone.now();
    for (const s of this.sources) s.start(t);
  }

  /** Deterministic pseudo-random numbers so offline renders match. */
  private random() {
    this.rng = (this.rng * 16807) % 2147483647;
    return (this.rng - 1) / 2147483646;
  }

  apply(key: string | null, time = Tone.now()) {
    const l = (key && ARRANGEMENT[key]) || fallback(key);
    const prev = this.layers;
    this.layers = l;
    const glide = 1.6;
    const theme = l.theme ?? 'pythagoras';
    if (theme !== this.theme && l !== QUIET) {
      // Glide the drone into the new chapter's key and start its progression from the top.
      this.theme = theme;
      this.chord = 0;
      THEMES[theme].drone.forEach((f, i) => this.drones[i]!.frequency.setTargetAtTime(f, time, 1.2));
    }
    this.droneGain.gain.setTargetAtTime(l.drone * 0.32, time, glide / 3);
    this.padGain.gain.setTargetAtTime(l.pad, time, glide / 3);
    this.padFilter.frequency.setTargetAtTime(l.cutoff, time, key === 'pythagoras:pour' ? 3 : glide / 2);
    this.arpGain.gain.setTargetAtTime(l.arp, time, glide / 3);
    if (l.harmony === 'resolve' && prev.harmony !== 'resolve') {
      // Swell straight into the triangle chord instead of waiting for the next bar.
      this.pad.releaseAll(time);
      this.pad.triggerAttackRelease(triangleChord(pyth('C', 4)), 6, time + 0.3, 0.8);
      this.bar = 1;
    }
  }

  /** Fade everything out (pause) or back in (resume). */
  setActive(active: boolean, time = Tone.now()) {
    this.out.gain.setTargetAtTime(active ? 1 : 0, time, active ? 0.4 : 0.6);
  }

  dispose() {
    for (const l of this.loops) l.dispose();
    for (const s of this.sources) s.dispose();
    this.pad.dispose();
    this.out.dispose();
  }
}
