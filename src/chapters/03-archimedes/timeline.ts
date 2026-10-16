import { runtime } from '../../engine/runtime';
import { shot } from '../../engine/camera/shots';
import { station } from '../../engine/world/stations';
import type { JourneyBuilder } from '../../journey/builder';
import { immersionWindow } from './hang';
import { archimedesRig, ARCHIMEDES_DEFAULTS, BAR_SIZE, BRIM, CROWN_SIZE, LINEUP } from './rig';

const SLUG = 'archimedes';
/** Height of the dust crown's icon origin above its base, at the scale that matches the solid crown. */
const CROWN_DUST_SCALE = 0.22;
const CROWN_DUST_Y = 1.4 + 0.6 * CROWN_DUST_SCALE;
/** Stagger and landing point of the line-up blocks (see Blocks: they fall for the first 30 % of their run). */
const LINEUP_STAGGER = 0.22;
const LINEUP_LAND = 0.3;

/** Story-mode timeline for chapter 3: the flight in from chapter 2, then the chapter beat by beat. */
export function buildArchimedes(j: JourneyBuilder) {
  const rig = archimedesRig();
  const dust = runtime.dust;
  const o = station(SLUG);
  const crownIn = immersionWindow(CROWN_SIZE.h);
  const barIn = immersionWindow(BAR_SIZE.h);

  j.beat(SLUG, { id: 'flight', kind: 'flight', minDuration: 5.6 }, ({ tl, cue }) => {
    const d = 5.4;
    tl.set(rig, { ...ARCHIMEDES_DEFAULTS }, 0);
    // Hiero's crown of dust flies down the beach and slows to hang where the scale's hook will be.
    tl.to(dust, { x: o.x, z: o.z, duration: d, ease: 'power2.inOut' }, 0);
    tl.to(dust, { y: o.y + 3.2, duration: d / 2, ease: 'sine.out' }, 0);
    tl.to(dust, { y: o.y + CROWN_DUST_Y, duration: d / 2, ease: 'sine.in' }, d / 2);
    tl.to(dust, { scale: CROWN_DUST_SCALE, size: 0.9, duration: d * 0.7, ease: 'power2.inOut' }, 0);
    tl.to(dust, { spin: 0, swirl: 0.35, duration: d }, 0);
    shot(
      tl,
      SLUG,
      { pos: [-1.7, 2.1, 3.3], target: [0, 1.5, 0], focus: [0, 1.5, 0], dof: 0.3, shake: 0.5 },
      d,
      0,
      'power2.inOut',
    );
    tl.to(runtime.camera, { lift: 6, duration: d / 2, ease: 'sine.out' }, 0);
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
      body: 'Syracuse, about 250 BC. King Hiero thinks his goldsmith mixed cheap silver into his new crown. Archimedes must find out without harming it.',
      minDuration: 8,
    },
    ({ tl, cue }) => {
      // A stone tank rises out of the sand and a post grows beside it…
      tl.to(rig, { tank: 1, duration: 2.0, ease: 'power2.out' }, 0.4);
      cue(0.4, 'rise', { gain: 0.8 });
      tl.to(rig, { gantry: 1, duration: 1.4, ease: 'power2.out' }, 1.4);
      // …and the crown of dust condenses into gold on its hook, scattering the rest back into the sand.
      tl.to(rig, { crown: 1, duration: 1.2, ease: 'power2.inOut' }, 2.9);
      cue(3.0, 'glow', { which: 0 });
      tl.set(dust, { from: 'crown', to: 'sand', morph: 0 }, 3.2);
      tl.to(dust, { morph: 1, duration: 2.6, ease: 'expo.out' }, 3.2);
      tl.to(
        dust,
        {
          y: o.y,
          scale: 1,
          size: 0.55,
          swirl: 0.5,
          drift: 0.3,
          colorA: '#ffe7c4',
          colorB: '#ffb46a',
          duration: 2.6,
        },
        3.2,
      );
      // Framed low, under the title card, from the side away from the low sun.
      shot(
        tl,
        SLUG,
        { pos: [-3.0, 2.9, 6.4], target: [0, 2.0, -1.0], focus: [0, 1.0, 0], fov: 38, dof: 0.4, shake: 0.5 },
        6,
        0.2,
        'power3.inOut',
      );
    },
  );

  j.beat(
    SLUG,
    {
      id: 'weigh',
      heading: 'Weigh it',
      body: 'Hung from a spring scale, the crown weighs [w:9.80 N]. Under it, a stone tank is filled with water right up to the brim.',
    },
    ({ tl, cue }) => {
      shot(
        tl,
        SLUG,
        { pos: [-1.5, 2.25, 2.5], target: [0.1, 1.95, 0], focus: [0, 2.0, 0], fov: 38, dof: 0.5, shake: 0.4 },
        2.6,
        0,
        'power3.inOut',
      );
      tl.to(rig, { readout: 1, duration: 0.8 }, 1.4);
      cue(1.4, 'tick');
      shot(
        tl,
        SLUG,
        { pos: [-1.9, 2.0, 3.4], target: [0.1, 1.5, 0], focus: [0, 1.4, 0] },
        5,
        3,
        'sine.inOut',
      );
    },
  );

  j.beat(
    SLUG,
    {
      id: 'lower',
      heading: 'Lower it into the water',
      body: 'As the crown goes under it pushes water aside, and the overflow runs from the spout into a beaker. Watch the scale: [w:9.80 N] falls to [w:9.16 N].',
    },
    ({ tl, cue }) => {
      shot(
        tl,
        SLUG,
        {
          pos: [-2.4, 2.3, 4.6],
          target: [-0.3, 0.9, 0.1],
          focus: [-0.4, 0.9, 0],
          fov: 40,
          dof: 0.2,
          shake: 0.4,
        },
        2.4,
        0,
        'power3.inOut',
      );
      tl.to(rig, { beakers: 1, duration: 1.0, ease: 'power2.out' }, 0.2);
      const t0 = 1.4;
      const d = 5;
      tl.to(rig, { lower: 1, duration: d, ease: 'none' }, t0);
      tl.to(
        rig,
        { spillA: 1, duration: d * (crownIn.under - crownIn.touch), ease: 'none' },
        t0 + d * crownIn.touch,
      );
      cue(t0 + d * crownIn.touch, 'plunk');
    },
  );

  j.beat(
    SLUG,
    {
      id: 'push',
      heading: 'The water pushes up',
      body: 'The crown lost [p:0.64 N] of weight: the water is pushing it up. And the water it spilled weighs exactly [p:0.64 N]. The push always equals the weight of the water pushed aside.',
    },
    ({ tl, cue }) => {
      shot(
        tl,
        SLUG,
        { pos: [-2.6, 1.9, 3.6], target: [-0.5, 0.75, 0.05], focus: [-0.5, 0.75, 0], fov: 40, dof: 0.2 },
        2.6,
        0,
        'power3.inOut',
      );
      tl.to(rig, { arrows: 1, duration: 1.0, ease: 'back.out(1.6)' }, 0.8);
      cue(0.8, 'glow', { which: 1 });
    },
  );

  j.beat(
    SLUG,
    {
      id: 'formula',
      kind: 'formula',
      body: "Archimedes' principle: the push is the fluid's density, times the volume pushed aside, times g.",
      minDuration: 6.5,
    },
    ({ tl, cue }) => {
      cue(0.35, 'formula', { chapter: 3 });
      tl.to(rig, { readout: 0.35, duration: 0.6 }, 0);
      shot(
        tl,
        SLUG,
        { pos: [-2.6, 2.1, 5.8], target: [-0.2, 0.7, 0], dof: 0, shake: 0.4 },
        5,
        0.2,
        'power2.inOut',
      );
    },
  );

  j.beat(
    SLUG,
    {
      id: 'eureka',
      heading: 'Eureka!',
      body: 'Now a bar of pure gold that weighs the same. It spills only [p:52 mL] where the crown spilled [p:65 mL]. Same weight, more room: the crown is not pure gold. The goldsmith cheated.',
    },
    ({ tl, cue }) => {
      tl.to(rig, { arrows: 0, duration: 0.5 }, 0);
      tl.to(rig, { readout: 1, duration: 0.5 }, 0);
      shot(
        tl,
        SLUG,
        { pos: [-2.3, 2.2, 4.4], target: [-0.4, 0.9, 0.1], focus: [-0.4, 0.9, 0], fov: 40, dof: 0.2 },
        2.4,
        0,
        'power3.inOut',
      );
      // Lift the crown out (the level falls below the brim)…
      const up = 1.8;
      tl.to(rig, { lower: 0, duration: up, ease: 'power1.inOut' }, 0.2);
      tl.to(rig, { level: 0.97, duration: up * 0.4, ease: 'none' }, 0.2 + up * 0.3);
      cue(0.3, 'lift');
      // …swap it for the gold bar, slide a clean beaker under the spout and top the tank up again.
      tl.to(rig, { crown: 0, duration: 0.35 }, 2.1);
      tl.set(rig, { bar: 1 }, 2.46);
      tl.to(rig, { crown: 1, duration: 0.35 }, 2.5);
      tl.to(rig, { swap: 1, duration: 1.2, ease: 'power2.inOut' }, 2.2);
      tl.to(rig, { level: 1, duration: 0.9, ease: 'power1.out' }, 2.6);
      cue(2.6, 'tink', { i: 2 });
      const t0 = 3.6;
      const d = 4.4;
      tl.to(rig, { lower: 1, duration: d, ease: 'none' }, t0);
      tl.to(
        rig,
        { spillB: 1, duration: d * (barIn.under - barIn.touch), ease: 'none' },
        t0 + d * barIn.touch,
      );
      cue(t0 + d * barIn.touch, 'plunk', { small: 1 });
      shot(
        tl,
        SLUG,
        { pos: [-2.3, 1.75, 2.3], target: [-1.55, 0.3, 0.0], focus: [-1.55, 0.3, 0.0] },
        3,
        t0 + 1.4,
      );
      cue(t0 + d + 0.3, 'eureka');
    },
  );

  j.beat(
    SLUG,
    {
      id: 'float',
      heading: 'Why some things float',
      body: 'A block sinks until it has pushed aside its own weight of water. Pine stops half under, ice nine-tenths under. Gold never can, so it sinks.',
    },
    ({ tl, cue }) => {
      tl.to(rig, { hookOut: 1, readout: 0, duration: 1.4, ease: 'power2.in' }, 0);
      tl.to(rig, { beakers: 0, duration: 1.2, ease: 'power2.in' }, 0.2);
      // The post folds back into the sand, out of the side view.
      tl.to(rig, { gantry: 0, duration: 1.2, ease: 'power2.in' }, 1.2);
      cue(0.1, 'lift');
      // Eye level with the waterline, through the glass: the parts under the surface glow.
      shot(
        tl,
        SLUG,
        {
          pos: [0, BRIM - 0.12, 3.0],
          target: [0, BRIM - 0.18, 0],
          focus: [0, BRIM, 0],
          fov: 40,
          dof: 0,
          shake: 0.3,
        },
        2.8,
        0,
        'power3.inOut',
      );
      const t0 = 1.2;
      const d = 6;
      tl.to(rig, { lineup: 1, duration: d, ease: 'none' }, t0);
      LINEUP.forEach((_, i) =>
        cue(
          t0 + d * (LINEUP_STAGGER * i + (1 - LINEUP_STAGGER * (LINEUP.length - 1)) * LINEUP_LAND),
          'splash',
        ),
      );
      shot(tl, SLUG, { pos: [0, BRIM + 0.25, 3.3], target: [0, BRIM - 0.2, 0] }, 4, t0 + d - 1, 'sine.inOut');
    },
  );

  j.beat(
    SLUG,
    {
      id: 'yourTurn',
      kind: 'yourTurn',
      heading: 'Your turn',
      body: 'Drop something in. Choose a material and a fluid: does it float, and how much of it sits under the surface?',
    },
    ({ tl, pauseHere }) => {
      tl.set(rig, { material: 2, fluid: 1 }, 0);
      tl.to(rig, { play: 1, duration: 0.8 }, 0.6);
      tl.set(rig, { lineup: 0 }, 1.5);
      shot(
        tl,
        SLUG,
        { pos: [1.3, 1.65, 3.7], target: [1.3, 0.75, 0], fov: 42, shake: 0.25, dof: 0 },
        2.6,
        0,
        'power3.inOut',
      );
      tl.set(rig, { interactive: 1 }, 2.6);
      pauseHere(2.7);
      tl.set(rig, { interactive: 0 }, 2.8);
      tl.to({}, { duration: 0.3 }, 2.8);
    },
  );

  j.beat(
    SLUG,
    {
      id: 'handoff',
      heading: 'Up and away',
      body: 'A bubble of air is far lighter than the water around it, so the water pushes it up, all the way to the surface and beyond, towards the stars.',
    },
    ({ tl, cue }) => {
      tl.to(rig, { play: 0, duration: 0.8 }, 0);
      tl.set(rig, { fluid: 1 }, 0);
      shot(
        tl,
        SLUG,
        { pos: [0, 0.95, 3.0], target: [0, 0.75, 0], focus: [0, 0.6, 0], fov: 40, shake: 0.3 },
        1.8,
        0,
      );
      tl.to(rig, { bubble: 0.5, duration: 2.4, ease: 'power1.in' }, 0.8);
      // The beach's sand gathers to the point where the bubble breaks the surface…
      tl.set(dust, { from: 'sand', to: 'grain', morph: 0 }, 0.8);
      tl.to(dust, { morph: 1, duration: 2.4, ease: 'power2.in' }, 0.8);
      tl.to(dust, { y: o.y + BRIM, size: 1.1, colorA: '#e8fbff', colorB: '#5fd3e8', duration: 2.4 }, 0.8);
      cue(0.9, 'gather');
      cue(3.2, 'bloop');
      // …and blooms into an orbit as it rises into the sky.
      tl.set(rig, { bubble: 1 }, 3.25);
      tl.set(dust, { from: 'grain', to: 'orbit', morph: 0 }, 3.2);
      tl.to(dust, { morph: 1, duration: 3.2, ease: 'power2.out' }, 3.2);
      tl.to(dust, { y: o.y + 4.4, scale: 0.6, spin: 0.25, swirl: 1, duration: 3.6, ease: 'power2.out' }, 3.2);
      tl.to(dust, { colorA: '#fff4d6', colorB: '#f2b04a', duration: 3.2 }, 3.2);
      shot(tl, SLUG, { pos: [0, 1.7, 5.4], target: [0, 3.4, 0], focus: [0, 4, 0] }, 3.6, 3.0, 'power2.inOut');
    },
  );
}
