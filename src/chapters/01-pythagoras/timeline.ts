import { runtime } from '../../engine/runtime';
import { shot } from '../../engine/camera/shots';
import type { JourneyBuilder } from '../../journey/builder';
import {
  INTERACTIVE_SCALE,
  pythagorasRig,
  PYTHAGORAS_DEFAULTS,
  SLIDE_STAGGER,
  SLIDING_TILES,
  TILE_STAGGER,
  uvToLocal,
} from './rig';

const SLUG = 'pythagoras';
const S = PYTHAGORAS_DEFAULTS.scale;

// Landmarks of the story triangle (station-local world coordinates).
const at = (u: number, v: number, y = 0) => uvToLocal(u, v, S, y);
const P1 = at(3, 0);
const CENTROID = at(1, 4 / 3);
const C_TANK = at(3.5, 3.5);
const FRAME_CENTRE = at(13, 2);

/** Story-mode timeline for chapter 1, beat by beat. */
export function buildPythagoras(j: JourneyBuilder) {
  const rig = pythagorasRig();
  const dust = runtime.dust;

  j.beat(
    SLUG,
    {
      id: 'title',
      kind: 'title',
      body: 'Samos, about 530 BC. Draw a triangle with one square corner. Its three sides hide a rule that has held for 2,500 years.',
      minDuration: 7.5,
    },
    ({ tl, cue }) => {
      tl.set(rig, { ...PYTHAGORAS_DEFAULTS }, 0);
      tl.set(dust, { from: 'pythagoras', to: 'grain', morph: 0, swirl: 1.2, drift: 1, spin: 0.08 }, 0);
      // The teaser's triangle of dust collapses into a single grain of sand…
      tl.to(dust, { morph: 1, duration: 1.4, ease: 'power2.inOut' }, 0);
      tl.to(dust, { size: 1.3, colorA: '#fff3dc', colorB: '#ffd08a', duration: 1.4 }, 0);
      // …which falls to the beach, the camera riding down with it.
      tl.to(dust, { x: 0, y: 0.05, z: 0, duration: 2.6, ease: 'power2.in' }, 1.1);
      tl.to(dust, { spin: 0, duration: 2 }, 1.1);
      shot(tl, SLUG, { target: [0, 0.4, 0.2], focus: [0, 0, 0.2] }, 3.4, 0.6, 'power3.inOut');
      shot(tl, SLUG, { pos: [4.8, 2.2, 7.6], fov: 38, shake: 0.6 }, 4.4, 0, 'power3.inOut');
      cue(1.2, 'whoosh', { gain: 0.5 });
      cue(3.65, 'grainLand');
      // On impact it bursts into the glinting sand of the whole beach.
      tl.set(dust, { from: 'grain', to: 'sand', morph: 0, x: 0, y: 0, z: 0 }, 3.7);
      tl.to(dust, { morph: 1, duration: 2.4, ease: 'expo.out' }, 3.7);
      tl.to(
        dust,
        { size: 0.55, swirl: 0.5, drift: 0.3, colorA: '#ffe7c4', colorB: '#ffb46a', duration: 2.4 },
        3.7,
      );
      shot(tl, SLUG, { pos: [4.2, 1.7, 6.6], target: [-0.3, 0.2, 0.2] }, 3.2, 4.4, 'sine.inOut');
    },
  );

  j.beat(
    SLUG,
    {
      id: 'draw',
      heading: 'Scratch it in the sand',
      body: 'Two short sides, [a:a] and [b:b], meet at a right angle. The long side across from it, [c:c], is the hypotenuse.',
    },
    ({ tl, cue }) => {
      const R = 4.1;
      const target: [number, number, number] = [CENTROID[0], 0.05, CENTROID[2]];
      // Orbit the drawing as it is scratched, staying outside the side being drawn.
      tl.set(runtime.camera, { orbitAngle: Math.PI / 2 + 0.35, orbitRadius: 5.2, orbitHeight: 1.9 }, 0);
      shot(
        tl,
        SLUG,
        { target, focus: target, orbit: { mix: 1, radius: R, height: 1.45 }, fov: 36, dof: 1, shake: 0.7 },
        1.6,
        0,
      );
      tl.to(rig, { stick: 1, labels: 1, duration: 0.6, ease: 'back.out(2)' }, 0.3);
      tl.to(rig, { draw: 1, duration: 2.3, ease: 'sine.inOut' }, 0.8);
      tl.to(rig, { draw: 2, duration: 3.0, ease: 'sine.inOut' }, 3.2);
      tl.to(rig, { draw: 3, duration: 2.5, ease: 'sine.inOut' }, 6.3);
      shot(tl, SLUG, { orbit: { angle: Math.PI / 2 - 0.25 } }, 2.4, 0.8, 'sine.inOut');
      shot(tl, SLUG, { orbit: { angle: -Math.PI / 4 } }, 3.0, 3.2, 'sine.inOut');
      shot(tl, SLUG, { orbit: { angle: -Math.PI + 0.25 } }, 2.6, 6.3, 'sine.inOut');
      cue(3.1, 'pop', { pitch: 0 });
      cue(6.3, 'pop', { pitch: 2 });
      cue(8.8, 'pop', { pitch: 1 });
      tl.to(rig, { stick: 0, duration: 0.5, ease: 'power2.in' }, 8.9);
      tl.to(rig, { rightMark: 1, duration: 0.7, ease: 'power2.out' }, 9.0);
      cue(9.6, 'tick');
    },
  );

  j.beat(
    SLUG,
    {
      id: 'squares',
      heading: 'Build a square on every side',
      body: 'Make each square a glass tank, all the same depth. Then each tank holds exactly its square’s area: [a:a² = 9], [b:b² = 16], [c:c² = 25].',
    },
    ({ tl, cue }) => {
      shot(
        tl,
        SLUG,
        { pos: [4.6, 5.2, 6.9], target: [0.1, 0.35, 0.1], orbit: { mix: 0 }, fov: 40, dof: 0, shake: 0.5 },
        3.2,
        0,
        'power3.inOut',
      );
      tl.to(rig, { tanks: 1, duration: 2.4, ease: 'power1.inOut' }, 0.5);
      tl.to(rig, { areaLabels: 1, duration: 1.8, ease: 'power1.out' }, 1.6);
      cue(0.5, 'rise');
      cue(1.6, 'count');
    },
  );

  j.beat(
    SLUG,
    {
      id: 'pour',
      heading: 'Pour the small tanks into the big one',
      body: 'First [a:a²], then [b:b²]. Keep an eye on the level in [c:c²].',
    },
    ({ tl, cue }) => {
      // Hand the camera to a slow orbit around the big tank without a jump.
      const target: [number, number, number] = [C_TANK[0], 0.7, C_TANK[2]];
      tl.set(runtime.camera, { orbitAngle: 1.15, orbitRadius: 8.1, orbitHeight: 4.3 }, 0);
      shot(tl, SLUG, { target, focus: target, orbit: { mix: 1 } }, 1.8, 0);
      shot(tl, SLUG, { orbit: { angle: 0.5, radius: 7.1, height: 3.6 } }, 9.5, 0, 'sine.inOut');
      tl.to(rig, { pourA: 1, duration: 4.4, ease: 'none' }, 0.4);
      tl.to(rig, { pourB: 1, duration: 4.4, ease: 'none' }, 4.9);
      cue(0.45, 'lift');
      cue(0.4 + 4.4 * 0.3, 'splash');
      cue(4.95, 'lift');
      cue(4.9 + 4.4 * 0.3, 'splash');
    },
  );

  j.beat(
    SLUG,
    {
      id: 'brim',
      heading: 'Exactly to the brim',
      body: 'Nothing spills and nothing is missing: [a:9] + [b:16] = [c:25].',
      minDuration: 4.5,
    },
    ({ tl, cue }) => {
      cue(0.05, 'brim');
      shot(tl, SLUG, { orbit: { angle: 0.25, radius: 6.5 } }, 4.5, 0, 'sine.inOut');
    },
  );

  j.beat(
    SLUG,
    {
      id: 'rearrangeA',
      heading: 'Why it always works',
      body: 'Take four copies of the triangle and a frame whose sides are [a:a] + [b:b]. Lay them in so that two square holes are left: [a:a²] and [b:b²].',
    },
    ({ tl, cue }) => {
      tl.to(rig, { tanks: 0, areaLabels: 0, duration: 1.6, ease: 'power2.in' }, 0);
      cue(0.1, 'sink');
      // Top-down for the reading moment.
      shot(
        tl,
        SLUG,
        {
          pos: [FRAME_CENTRE[0], 9.6, 1.6],
          target: [FRAME_CENTRE[0], 0, 0.1],
          orbit: { mix: 0 },
          fov: 40,
          dof: 0,
          shake: 0.22,
        },
        3.4,
        0.2,
        'power3.inOut',
      );
      tl.to(rig, { frame: 1, duration: 1.4, ease: 'power2.out' }, 1.6);
      cue(1.6, 'rise', { gain: 0.6 });
      const t0 = 2.7;
      const dur = 4.6;
      tl.to(rig, { tiles: 1, duration: dur, ease: 'none' }, t0);
      const span = 1 - TILE_STAGGER * 3;
      for (let i = 0; i < 4; i++) cue(t0 + dur * (i * TILE_STAGGER + span), 'clack', { i });
      tl.to(rig, { glowA: 1, duration: 1.0 }, t0 + dur + 0.1);
      cue(t0 + dur + 0.1, 'glow', { which: 0 });
    },
  );

  j.beat(
    SLUG,
    {
      id: 'rearrangeB',
      heading: 'Now slide three of them',
      body: 'Same four triangles, same frame, so the empty space is the same size. Before, it was [a:a²] + [b:b²]. Now it is one square: [c:c²].',
    },
    ({ tl, cue }) => {
      const t0 = 0.6;
      const dur = 3.8;
      tl.to(rig, { layout: 1, duration: dur, ease: 'none' }, t0);
      const span = 1 - SLIDE_STAGGER * (SLIDING_TILES.length - 1);
      for (let k = 0; k < SLIDING_TILES.length; k++)
        cue(t0 + dur * (k * SLIDE_STAGGER + span), 'clack', { i: k + 4 });
      tl.to(rig, { glowB: 1, duration: 1.0 }, t0 + dur);
      cue(t0 + dur, 'glow', { which: 1 });
      shot(tl, SLUG, { pos: [FRAME_CENTRE[0], 8.9, 1.5] }, 6, 0, 'sine.inOut');
    },
  );

  j.beat(
    SLUG,
    {
      id: 'formula',
      kind: 'formula',
      body: 'True for every right triangle, of any size, anywhere.',
      minDuration: 6.5,
    },
    ({ tl, cue }) => {
      cue(0.35, 'formula');
      shot(
        tl,
        SLUG,
        { pos: [FRAME_CENTRE[0], 6.2, 7.4], target: [FRAME_CENTRE[0], 0, 0.4], shake: 0.4 },
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
      body: 'Drag the two glowing corners. Can you find another right triangle whose sides are all whole numbers?',
    },
    ({ tl, pauseHere }) => {
      tl.to(rig, { proofSink: 1, glowB: 0, duration: 1.4, ease: 'power2.in' }, 0);
      tl.set(rig, { pourA: 0, pourB: 0, cFull: 1, frame: 0, tiles: 0, layout: 0, glowA: 0 }, 1.45);
      tl.to(rig, { scale: INTERACTIVE_SCALE, duration: 2.0, ease: 'power2.inOut' }, 0.4);
      tl.to(rig, { tanks: 1, areaLabels: 1, duration: 1.8, ease: 'power2.out' }, 1.0);
      shot(
        tl,
        SLUG,
        { pos: [3.2, 4.4, 5.4], target: [0, 0.3, 0], fov: 42, shake: 0.25, dof: 0 },
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
      heading: 'One more secret',
      body: 'Hold the long side by one end and swing it round. Its tip carves a circle, and at every point of that circle a right triangle is hiding. The circle is where the next idea begins.',
    },
    ({ tl, cue }) => {
      tl.to(rig, { a: 3, b: 4, gamma: 90, scale: S, duration: 1.0, ease: 'power2.inOut' }, 0);
      tl.to(rig, { tanks: 0, areaLabels: 0, labels: 0, rightMark: 0, duration: 1.4, ease: 'power2.in' }, 0);
      tl.set(rig, { cFull: 0, proofSink: 0 }, 1.5);
      cue(0.1, 'sink');
      shot(
        tl,
        SLUG,
        { pos: [P1[0] + 0.6, 7.0, P1[2] + 7.4], target: [P1[0], 0, P1[2] - 0.3], fov: 40, shake: 0.4 },
        2.6,
        0,
        'power3.inOut',
      );
      tl.to(rig, { radius: 1, duration: 0.6 }, 1.3);
      tl.to(rig, { circle: 1, duration: 4.4, ease: 'sine.inOut' }, 1.7);
      tl.to(rig, { groove: 0.35, duration: 3 }, 3);
      cue(6.0, 'tick');
      tl.to(rig, { radius: 0, duration: 0.6 }, 6.2);
      // The beach's dust gathers onto the carved circle, lying flat on it, then lifts it off the sand.
      // (It stands up to face the camera during the flight to chapter II.)
      const R = 5 * S; // radius of the carved circle: the hypotenuse
      tl.set(dust, { from: 'sand', to: 'circleFlat', morph: 0, rotX: 0, spin: 0 }, 6.1);
      tl.to(dust, { morph: 1, duration: 2.8, ease: 'power2.inOut' }, 6.1);
      tl.to(
        dust,
        {
          x: P1[0],
          y: 0.04,
          z: P1[2],
          // The icon's circle has radius 2, so this lands it exactly on the groove.
          scale: R / 2,
          size: 1.05,
          swirl: 1.1,
          drift: 0.8,
          colorA: '#f6e6cc',
          colorB: '#c98b4a',
          duration: 2.8,
          ease: 'power2.inOut',
        },
        6.1,
      );
      cue(6.1, 'gather');
      tl.to(dust, { y: 0.5, size: 1.2, duration: 1.8, ease: 'sine.inOut' }, 8.9);
      shot(
        tl,
        SLUG,
        { pos: [P1[0], 6.3, P1[2] + 7.6], target: [P1[0], 0.1, P1[2] + 0.5], focus: [P1[0], 0.3, P1[2]] },
        4.2,
        6.0,
        'power2.inOut',
      );
    },
  );
}
