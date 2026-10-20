import { chapterRig } from '../../engine/runtime';
import { runX, runM, SOUND, type Run, type V3 } from './math';
import { loopM, loopSync, loopX } from './loop';

/** Everything chapter 9 animates. Timelines tween these numbers; the station derives all geometry from them. */
export interface DopplerRig {
  /** The street: its lamps and windows lit, 0..1. */
  street: number;
  /**
   * What moves the source: 0, the real pass (`ax`, `av`, with sound at its true speed); 1, the slowed-down run (`st` and
   * the run's course); 2, the viewer's loop along the street (`sandT`, `sm`).
   */
  mode: number;
  /** Which source it is: 0 the ambulance, 1 the jet. */
  kind: number;
  /** The real pass: the ambulance's x (metres) and its speed (metres a second). */
  ax: number;
  av: number;
  /** The siren heard, 0..1, and the siren's own clock (seconds): it sounds high, low, high… */
  siren: number;
  clock: number;
  /** The slowed run: its clock, and which of the `COURSES` it follows. */
  st: number;
  course: number;
  /** When the slowed run's source started sending waves. */
  from: number;
  /** The viewer's loop: its clock, the source's and listener's speeds (Mach numbers), and the listener's place. */
  sandT: number;
  sm: number;
  lm: number;
  lx: number;
  lz: number;
  /** Shown, 0..1: the ambulance, the jet, the waves as spheres, as rings on the ground, the Mach cone. */
  ambulance: number;
  jet: number;
  spheres: number;
  rings: number;
  cone: number;
  /** The two listeners, ahead and behind, and the labels saying what each hears. */
  listeners: number;
  hears: number;
  /** The viewer's own listener (Your turn and the Lab), and its label. */
  you: number;
  /** The jet's roar heard, 0..1. */
  roar: number;
  /** Up among the galaxies: the galaxy, its spectrum beside a lab's, 0..1, and its red shift. */
  galaxy: number;
  spectra: number;
  z: number;
  interactive: number;
  lab: number;
}

export const DOPPLER_DEFAULTS: DopplerRig = {
  street: 0,
  mode: 0,
  kind: 0,
  ax: -400,
  av: 0,
  siren: 0,
  clock: 0,
  st: 0,
  course: 0,
  from: 0,
  sandT: 0,
  sm: 0.5,
  lm: 0,
  lx: 10,
  lz: 5,
  ambulance: 0,
  jet: 0,
  spheres: 0,
  rings: 0,
  cone: 0,
  listeners: 0,
  hears: 0,
  you: 0,
  roar: 0,
  galaxy: 0,
  spectra: 0,
  z: 0,
  interactive: 0,
  lab: 0,
};

export function dopplerRig(): DopplerRig {
  return chapterRig('doppler', () => ({ ...DOPPLER_DEFAULTS }));
}

// ---------- Layout (station space, metres) ----------

/** The road runs along x; its two lanes span z = ±HALF_ROAD. The ambulance drives in the near lane. */
export const HALF_ROAD = 3.5;
export const LANE = 1.75;
/** The pavements: their kerb height, and how far out they reach. */
export const KERB = 0.15;
export const PAVEMENT = 6.5;
/** The street's ends: it fades into the haze well before chapter 10's station, 200 m along. */
export const STREET: [number, number] = [-210, 140];
/** Where the siren is (on the ambulance's roof) and where the jet flies. */
export const SIREN_H = 2.45;
export const JET_H = 9;
/** Where you stand for the real pass, at the kerb. */
export const EAR: V3 = [0, 1.6, 5.6];
/** The two listeners on the pavement, ahead of the ambulance and behind it. */
export const AHEAD: V3 = [12, KERB, 5.2];
export const BEHIND: V3 = [-12, KERB, 5.2];
/** Who hears the jet go over. */
export const UNDER: V3 = [6, KERB, 5.2];

/** The slowed-down world: sound crawls at 3 m/s, so its waves can be watched. One wave drawn each period. */
export const SLOW = 3;
export const PERIOD = 0.4;
export const MAX_SHELLS = 40;
export const MAX_AGE = 5.6;

/** The viewer's loop: the source goes round from −LOOP to LOOP along its lane. */
export const LOOP = 26;

/** Up among the galaxies: the galaxy, and the two spectra in front of it. */
export const GALAXY: V3 = [0, 92, -150];
export const SPECTRA: V3 = [0, 84, -112];

export const SYM9 = {
  /** Bunched waves, a higher note, bluer light: the chapter's blue. */
  blue: '#5b8cff',
  /** Stretched waves, a lower note, redder light. */
  red: '#ff5d4a',
  /** The streetlights. */
  sodium: '#ffb054',
  chalk: '#f4efe6',
  /** The listeners. */
  ear: '#ffd9a0',
};

/**
 * The slowed runs: the ambulance at a steady third of the speed of sound; the jet speeding up to the speed of sound,
 * holding there a moment, then on to one and a half times it.
 */
export const COURSES: Run[] = [
  { x0: -7, c: SLOW, knots: [[0, 0.3]] },
  {
    x0: -30,
    c: SLOW,
    knots: [
      [0, 0.7],
      [2.5, 0.7],
      [4.5, 1],
      [6.5, 1],
      [9.5, 1.5],
    ],
  },
];

/** The slowed run as maths sees it. */
export const rigRun = (rig: DopplerRig): Run => COURSES[Math.round(rig.course)] ?? COURSES[0]!;

export interface Source {
  /** Where it is now, and its velocity (along x). */
  at: V3;
  v: number;
  /** The speed of sound it is heard by, and its Mach number. */
  c: number;
  m: number;
  /** Where it was at any earlier time (for drawing its waves), and its Mach number then; the time now on that clock. */
  path: (t: number) => number;
  machAt: (t: number) => number;
  now: number;
}

/** The source as it is now, whatever is moving it. */
export function source(rig: DopplerRig): Source {
  const y = rig.kind > 0.5 ? JET_H : SIREN_H;
  const z = rig.kind > 0.5 ? 0 : LANE;
  if (rig.mode < 0.5) {
    const v = rig.av;
    return {
      at: [rig.ax, y, z],
      v,
      c: SOUND,
      m: v / SOUND,
      path: (t) => rig.ax - v * (rig.clock - t),
      machAt: () => v / SOUND,
      now: rig.clock,
    };
  }
  if (rig.mode < 1.5) {
    const run = rigRun(rig);
    const m = runM(run, rig.st);
    return {
      at: [runX(run, rig.st), y, z],
      v: m * SLOW,
      c: SLOW,
      m,
      path: (t) => runX(run, t),
      machAt: (t) => runM(run, t),
      now: rig.st,
    };
  }
  const m = rig.sm;
  loopSync(m, rig.sandT);
  return {
    at: [loopX(rig.sandT), y, z],
    v: m * SLOW,
    c: SLOW,
    m,
    path: loopX,
    machAt: loopM,
    now: rig.sandT,
  };
}
