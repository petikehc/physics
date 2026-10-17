import { runtime } from '../../engine/runtime';
import { shot } from '../../engine/camera/shots';
import { station } from '../../engine/world/stations';
import type { JourneyBuilder } from '../../journey/builder';
import { MARS, STORY } from './math';
import { KEPLER_DEFAULTS, keplerRig, SIGHTINGS } from './rig';
import { EARTH, planetAt } from './system';

const SLUG = 'kepler';
/** The story orbit's centre (the Sun is at the origin, perihelion towards +x). */
const MID = -STORY.a * STORY.e;
/** Years the solar system runs for during the third law, before the dive to Earth. */
const YEARS = 6;

/** Story-mode timeline for chapter 4: the flight up into space, then the chapter beat by beat. */
export function buildKepler(j: JourneyBuilder) {
  const rig = keplerRig();
  const dust = runtime.dust;
  const world = runtime.world;
  const o = station(SLUG);

  j.beat(SLUG, { id: 'flight', kind: 'flight', minDuration: 5.6 }, ({ tl, cue }) => {
    const d = 5.4;
    tl.set(rig, { ...KEPLER_DEFAULTS }, 0);
    // Up out of the dusk, into the night: the beach, its sun and its haze fall away.
    tl.to(world, { space: 1, duration: d * 0.75, ease: 'power1.inOut' }, d * 0.1);
    // The orbit of dust rises with the camera and comes to rest, lying flat, where the real one will be.
    tl.to(dust, { x: o.x + MID, z: o.z, duration: d, ease: 'power2.inOut' }, 0);
    tl.to(dust, { y: o.y + 0.6, duration: d, ease: 'power2.inOut' }, 0);
    tl.to(dust, { scale: 1.2, rotX: Math.PI / 2 - 0.45, spin: 0, size: 0.9, duration: d * 0.8 }, 0);
    tl.to(dust, { colorA: '#fff4d6', colorB: '#f2b04a', swirl: 0.35, duration: d }, 0);
    shot(
      tl,
      SLUG,
      { pos: [MID - 2.4, 5.2, 9.6], target: [MID, 0.6, 0], focus: [MID, 0, 0], fov: 40, dof: 0, shake: 0.4 },
      d,
      0,
      'power2.inOut',
    );
    tl.to(runtime.camera, { lift: 9, duration: d / 2, ease: 'sine.out' }, 0);
    tl.to(runtime.camera, { lift: 0, duration: d / 2, ease: 'sine.in' }, d / 2);
    tl.to(runtime.camera, { veil: 1, duration: d * 0.3, ease: 'power1.in' }, d * 0.15);
    tl.to(runtime.camera, { veil: 0, duration: d * 0.3, ease: 'power1.out' }, d * 0.55);
    cue(0.15, 'whoosh', { gain: 1 });
  });

  j.beat(
    SLUG,
    {
      id: 'title',
      kind: 'title',
      body: 'Prague, 1601. Johannes Kepler inherits the life’s work of the great observer Tycho Brahe: decades of careful sightings of the planets. Everyone since the Greeks had said planets move in circles.',
      minDuration: 9,
    },
    ({ tl, cue }) => {
      // The orbit of dust scatters into the stars around us, and the Sun lights at its focus…
      tl.set(dust, { from: 'orbit', to: 'stars', morph: 0 }, 0.4);
      tl.to(dust, { morph: 1, duration: 4.2, ease: 'power2.inOut' }, 0.4);
      tl.to(
        dust,
        {
          x: o.x,
          y: o.y,
          z: o.z,
          scale: 1,
          rotX: 0,
          size: 0.6,
          spin: 0.004,
          swirl: 0.4,
          drift: 0.2,
          colorA: '#f4efe6',
          colorB: '#bcd4ff',
          duration: 4.2,
          ease: 'power2.inOut',
        },
        0.4,
      );
      tl.to(rig, { sun: 1, duration: 2.2, ease: 'power2.out' }, 0.8);
      cue(0.8, 'glow', { which: 0 });
      // …and Mars comes round, leaving a trail.
      tl.to(rig, { planet: 1, trail: 1, duration: 1.4 }, 2.6);
      tl.fromTo(rig, { phase: 0.15 }, { phase: 0.7, duration: 6.4, ease: 'none' }, 2.6);
      // Framed low, under the title card.
      shot(
        tl,
        SLUG,
        {
          pos: [MID - 3.2, 5.6, 11.8],
          target: [MID, 2.6, 0],
          focus: [MID, 0, 0],
          fov: 38,
          dof: 0.2,
          shake: 0.4,
        },
        6,
        0.2,
        'power3.inOut',
      );
    },
  );

  j.beat(
    SLUG,
    {
      id: 'circle',
      heading: 'Eight minutes of arc',
      body: "Kepler's best circle for Mars still missed Tycho's sightings by 8 minutes of arc, a quarter of the Moon's width (exaggerated here). Tycho was never that far off, so the circle had to go.",
    },
    ({ tl, cue }) => {
      // Face-on, to read the shapes.
      shot(
        tl,
        SLUG,
        { pos: [MID, 12.6, 2.4], target: [MID - 0.6, 0, 0], fov: 40, dof: 0, shake: 0.3 },
        2.6,
        0,
        'power3.inOut',
      );
      tl.to(rig, { phase: 1.55, duration: 12, ease: 'none' }, 0);
      tl.to(rig, { trail: 0.35, duration: 1.5 }, 0.5);
      // Tycho's sightings, one after another…
      tl.to(rig, { sightings: 1, duration: 2.6, ease: 'none' }, 0.6);
      SIGHTINGS.forEach((_, i) => cue(0.6 + 2.6 * i * 0.05, 'sighting', { i }));
      // …the best circle through them…
      tl.to(rig, { circle: 1, duration: 2.4, ease: 'power1.inOut' }, 3.6);
      // …and where it misses.
      tl.to(rig, { miss: 1, duration: 1.2, ease: 'power2.out' }, 6.4);
      cue(6.4, 'miss');
    },
  );

  j.beat(
    SLUG,
    {
      id: 'ellipse',
      heading: 'Two pins and a loop of string',
      body: 'What fits is an ellipse. Loop a string round two pins and draw with it pulled tight: the two distances always add up to the same. Kepler named each pin a focus, and the Sun sits on one.',
    },
    ({ tl, cue }) => {
      shot(
        tl,
        SLUG,
        { pos: [MID, 11.8, 3.8], target: [MID - 0.6, 0, 0.1], fov: 40, shake: 0.3 },
        2.4,
        0,
        'power3.inOut',
      );
      tl.to(rig, { circle: 0, miss: 0, planet: 0, trail: 0, duration: 0.9 }, 0);
      // The Sun shrinks to a spark, two pins go in at the foci…
      tl.to(rig, { sunInFocus: 0, duration: 0.8, ease: 'power2.inOut' }, 0.3);
      tl.to(rig, { pins: 1, duration: 0.8, ease: 'back.out(1.6)' }, 0.9);
      cue(0.9, 'pin', { i: 0 });
      cue(1.15, 'pin', { i: 1 });
      // …the pencil goes round on the string, through every sighting…
      tl.set(rig, { ellipse: 1 }, 1.8);
      tl.to(rig, { draw: 1, duration: 6, ease: 'power1.inOut' }, 1.8);
      // …and the Sun takes its place at one focus.
      tl.to(rig, { pins: 0, duration: 0.8, ease: 'power2.in' }, 8.2);
      tl.to(rig, { sunInFocus: 1, duration: 1.2, ease: 'power2.out' }, 8.6);
      cue(8.6, 'glow', { which: 0 });
      tl.to(rig, { sightings: 0, duration: 1.2 }, 9.4);
    },
  );

  j.beat(
    SLUG,
    {
      id: 'areas',
      heading: 'Equal areas in equal times',
      body: 'Mars speeds up near the Sun and slows down far from it, and Kepler found the rule: the line from the Sun sweeps out [area:equal areas] in [t:equal times].',
    },
    ({ tl, cue }) => {
      // Mars back at its closest to the Sun, and its year cut into twelve equal times.
      tl.set(rig, { phase: 2, swept: 0, fans: 1 }, 0);
      tl.to(rig, { planet: 1, duration: 0.6 }, 0.1);
      tl.to(rig, { voice: 1, duration: 0.8 }, 0.4);
      const t0 = 0.8;
      const d = 9;
      tl.to(rig, { phase: 3, swept: STORY.fans, duration: d, ease: 'none' }, t0);
      for (let k = 0; k < STORY.fans; k++) cue(t0 + (d * k) / STORY.fans, 'tick');
      shot(
        tl,
        SLUG,
        {
          pos: [MID - 1.6, 7.2, 6.8],
          target: [MID, 0, 0.3],
          fov: 40,
          dof: 0.15,
          shake: 0.4,
          focus: [MID, 0, 0],
        },
        2.6,
        0,
        'power3.inOut',
      );
      shot(tl, SLUG, { pos: [MID + 1.4, 6.6, 7.2] }, d, 2.6, 'sine.inOut');
    },
  );

  j.beat(
    SLUG,
    {
      id: 'compare',
      heading: 'Short and wide, long and thin',
      body: 'Near the Sun a fan is short, so it must be wide: Mars races. Far away it is long and thin: Mars crawls. Each one takes the same time and covers [area:the same area].',
    },
    ({ tl }) => {
      shot(
        tl,
        SLUG,
        { pos: [MID, 12.4, 2.4], target: [MID - 0.6, 0, 0], fov: 40, dof: 0, shake: 0.3 },
        2.4,
        0,
        'power3.inOut',
      );
      tl.to(rig, { pick: 1, duration: 1.2, ease: 'power2.inOut' }, 0.8);
      tl.to(rig, { phase: 3.6, duration: 10, ease: 'none' }, 0);
    },
  );

  j.beat(
    SLUG,
    {
      id: 'formula',
      kind: 'formula',
      body: "Kepler's second law, published in 1609: the [area:area swept] divided by the [t:time it takes] is the same all the way round.",
      minDuration: 6.5,
    },
    ({ tl, cue }) => {
      cue(0.35, 'formula', { chapter: 4 });
      tl.to(rig, { pick: 0, voice: 0.45, duration: 1 }, 0);
      tl.to(rig, { phase: 4.2, duration: 7, ease: 'none' }, 0);
      shot(
        tl,
        SLUG,
        // Looking a little above the orbit, so it sits below the formula.
        { pos: [MID - 1.0, 8.6, 9.4], target: [MID, 1.6, 0.4], dof: 0, shake: 0.4 },
        5,
        0.2,
        'power2.inOut',
      );
    },
  );

  j.beat(
    SLUG,
    {
      id: 'yourTurn',
      kind: 'yourTurn',
      heading: 'Your turn',
      body: 'Stretch the orbit and cut its year into more or fewer equal times. However lopsided the fans get, their areas stay equal.',
    },
    ({ tl, pauseHere }) => {
      tl.set(rig, { e: STORY.e, fanCount: STORY.fans, swept: STORY.fans, fans: 1, pick: 0 }, 0);
      tl.to(rig, { voice: 0, duration: 0.6 }, 0);
      shot(
        tl,
        SLUG,
        { pos: [MID, 8.4, 6.2], target: [MID, 0, 0.4], fov: 42, shake: 0.25, dof: 0 },
        2.6,
        0,
        'power3.inOut',
      );
      tl.set(rig, { interactive: 1 }, 2.6);
      pauseHere(2.7);
      tl.set(rig, { interactive: 0 }, 2.8);
      // Room for the orbit to glide back to the story's shape before the camera pulls out.
      tl.to({}, { duration: 0.9 }, 2.8);
    },
  );

  j.beat(
    SLUG,
    {
      id: 'harmony',
      heading: 'The harmony of the worlds',
      body: "A decade later Kepler found a rule that ties all six known planets together: square a planet's year, divide by the cube of its distance from the Sun, and every planet gives the same number. He published it in 1619.",
    },
    ({ tl, cue }) => {
      tl.to(rig, { fans: 0, duration: 0.8 }, 0);
      // Drawn to scale, Mars' orbit is nearly a circle…
      tl.to(rig, { e: MARS.e, duration: 3, ease: 'power2.inOut' }, 0.6);
      // …and the other five planets join it, each turning at its own pace.
      tl.to(rig, { system: 1, duration: 2, ease: 'power2.out' }, 1);
      tl.to(rig, { years: YEARS, duration: 13.4, ease: 'none' }, 1);
      shot(
        tl,
        SLUG,
        { pos: [-0.5, 22, 31], target: [0.6, 0, 3.8], fov: 40, dof: 0, shake: 0.3 },
        4.4,
        0,
        'power2.inOut',
      );
      // One pillar per planet: its year squared over its distance cubed. They all come out the same height.
      tl.to(rig, { pillars: 1, duration: 3.6, ease: 'none' }, 6.4);
      cue(6.4, 'pillars');
    },
  );

  // The dive comes in on the Earth from the side, with the Sun behind the camera rather than in the way; the
  // apple forms just beside it.
  const earth = planetAt(EARTH, YEARS);
  const r = Math.hypot(earth[0], earth[2]);
  const out = [earth[0] / r, earth[2] / r] as const;
  const side = [-out[1], out[0]] as const;
  const near = (o: number, s: number, h: number): [number, number, number] => [
    earth[0] + out[0] * o + side[0] * s,
    earth[1] + h,
    earth[2] + out[1] * o + side[1] * s,
  ];
  const apple = near(-0.2, 0.5, 0.2);
  j.beat(
    SLUG,
    {
      id: 'handoff',
      heading: 'How, but not why',
      body: "Kepler's laws say how the planets move, but not why. He suspected a force reaching out from the Sun, but could not pin it down. Nearly seventy years later, Isaac Newton did.",
    },
    ({ tl, cue }) => {
      tl.set(rig, { years: YEARS }, 0);
      tl.to(rig, { dive: 1, pillars: 0, duration: 2.2, ease: 'power2.inOut' }, 0.4);
      // Down towards the third planet…
      shot(
        tl,
        SLUG,
        {
          pos: near(-0.6, 1.6, 0.7),
          target: earth,
          focus: earth,
          fov: 38,
          dof: 0.3,
          shake: 0.35,
        },
        6,
        0.6,
        'power2.inOut',
      );
      // …where the stars gather into an apple.
      tl.set(dust, { from: 'stars', to: 'apple', morph: 0 }, 4.6);
      tl.to(dust, { morph: 1, duration: 3.4, ease: 'power2.inOut' }, 4.6);
      tl.to(
        dust,
        {
          x: o.x + apple[0],
          y: o.y + apple[1],
          z: o.z + apple[2],
          scale: 0.055,
          size: 0.9,
          spin: 0.2,
          swirl: 0.8,
          colorA: '#ffe7d6',
          colorB: '#d9534f',
          duration: 3.4,
          ease: 'power2.inOut',
        },
        4.6,
      );
      cue(4.7, 'gather');
    },
  );
}
