import { runtime } from '../../engine/runtime';
import { shot } from '../../engine/camera/shots';
import { station } from '../../engine/world/stations';
import type { JourneyBuilder } from '../../journey/builder';
import { newtonRig } from '../05-newton/rig';
import { heightAt, STORY_YS, X_MAX } from './math';
import { CALCULUS_DEFAULTS, calculusRig, GROWTH, heights, STORY } from './rig';
import { heightHz } from './sound';

const SLUG = 'calculus';
type V3 = [number, number, number];

/**
 * Both walls, face on: the curve's below, the area's above and behind, held high and a little right so the caption
 * (low on the left) leaves them clear. The pair is about as tall as it is wide, so a phone steps back only a little.
 */
const BOTH: { pos: V3; target: V3; portrait: number } = {
  pos: [2.2, 2.65, 17.7],
  target: [2.2, 2.35, -1.3],
  portrait: 0.35,
};

/** Story-mode timeline for chapter 6: the flight into the abstract realm, then the chapter beat by beat. */
export function buildCalculus(j: JourneyBuilder) {
  const rig = calculusRig();
  const dust = runtime.dust;
  const o = station(SLUG);

  j.beat(SLUG, { id: 'flight', kind: 'flight', minDuration: 5.6 }, ({ tl, cue }) => {
    const d = 5.4;
    tl.set(rig, { ...CALCULUS_DEFAULTS }, 0);
    // Chapter 5's planet, and the sun it brought, go out behind us.
    tl.to(newtonRig(), { planet: 0, air: 0, duration: 1.5 }, d * 0.3);
    // The icon flies ahead, over the floor of the realm, which glows into being.
    tl.to(dust, { x: o.x + 3.1, y: o.y + 2.1, z: o.z + 0.4, duration: d, ease: 'power2.inOut' }, 0);
    tl.to(dust, { scale: 0.5, spin: 0.25, size: 0.9, duration: d }, 0);
    tl.to(rig, { realm: 1, duration: 2.4, ease: 'power1.inOut' }, d * 0.45);
    shot(
      tl,
      SLUG,
      { pos: [3.1, 2.8, 10.5], target: [3.1, 2.0, 0], focus: [3.1, 2, 0], fov: 40, dof: 0, shake: 0.4 },
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
      body: 'Newton and Leibniz, each on his own, invent a mathematics of change: how fast, and how much. The two questions turn out to be one.',
      minDuration: 10,
    },
    ({ tl, cue }) => {
      // Two glass walls stand up in the realm, one above and behind the other…
      tl.to(rig, { wallF: 1, duration: 1.4, ease: 'power2.out' }, 0.8);
      tl.to(rig, { wallA: 1, duration: 1.4, ease: 'power2.out' }, 1.8);
      cue(0.8, 'rise', { gain: 0.45 });
      shot(
        tl,
        SLUG,
        {
          pos: [3.1, 3.95, 15.5],
          target: [3.1, 3.35, -1.3],
          focus: [3.1, 3, -1],
          dof: 0,
          shake: 0.35,
          portrait: 0.35,
        },
        6,
        0.4,
        'power2.inOut',
      );
      // …and the icon scatters into the stars of the realm.
      tl.set(dust, { from: 'calculus', to: 'stars', morph: 0 }, 5);
      tl.to(dust, { morph: 1, duration: 4, ease: 'power2.inOut' }, 5);
      tl.to(
        dust,
        {
          x: o.x + 3,
          y: o.y + 2,
          z: o.z - 1,
          scale: 4.2,
          size: 0.6,
          spin: 0.002,
          swirl: 0.4,
          drift: 0.2,
          colorA: '#f4efe6',
          colorB: '#cbbcff',
          duration: 4,
          ease: 'power2.inOut',
        },
        5,
      );
    },
  );

  j.beat(
    SLUG,
    {
      id: 'speed',
      heading: 'Speed into distance',
      body: 'The apple gains 9.8 m/s every second. The distance it falls is the [area:area under its speed]: a triangle, 4.9 m after one second. Its quarter-second strips go 1, 3, 5, 7.',
    },
    ({ tl, cue }) => {
      shot(
        tl,
        SLUG,
        // Held high enough that the caption, low on the left, leaves the triangle clear.
        { pos: [3.1, 1.05, 9.4], target: [3.1, 0.8, 0], focus: [3, 1.5, 0], dof: 0, shake: 0.3, portrait: 1 },
        2.4,
        0,
        'power2.inOut',
      );
      tl.to(rig, { curve: 1, duration: 1.8, ease: 'power1.inOut' }, 0.8);
      tl.to(rig, { area: 1, duration: 1.4 }, 3);
      cue(3, 'glow', { which: 0 });
      // Cut at each flash of chapter 5's strobe.
      tl.to(rig, { strips: 1, duration: 1.2 }, 6.2);
      for (let k = 0; k < 4; k++) cue(6.2 + k * 0.3, 'flash', { k: k * 2 });
    },
  );

  // The columns rise one by one, then split in two, faster and faster.
  const splits: Array<[number, number]> = [
    [5.6, 1.2],
    [7, 1],
    [8.2, 0.8],
    [9.1, 0.7],
    [9.9, 0.6],
    [10.6, 0.6],
    [11.3, 0.6],
  ];
  j.beat(
    SLUG,
    {
      id: 'columns',
      heading: 'Adding up a curve',
      body: 'When the speed changes unevenly, fill the area with 4 columns, then 8, then 16. The thinner they are, the closer their sum comes to the area. Leibniz wrote it with a long S: ∫ f dx.',
    },
    ({ tl, cue }) => {
      tl.to(rig, { strips: 0, area: 0, duration: 0.8 }, 0);
      tl.to(rig, { words: 1, duration: 0.4 }, 0.6);
      // The apple's straight line bends into any curve.
      tl.to(rig, { ...heights(STORY_YS), duration: 2, ease: 'power2.inOut' }, 1);
      shot(
        tl,
        SLUG,
        { pos: [3.1, 1.35, 10], target: [3.1, 1, 0], focus: [3, 1.5, 0], dof: 0, shake: 0.3, portrait: 1 },
        2.6,
        0.4,
        'power2.inOut',
      );
      const rise = 3.2;
      const dur = 1.4;
      tl.to(rig, { columns: 1, duration: dur, ease: 'none' }, rise);
      for (let p = 0; p < 4; p++) {
        cue(rise + dur * p * 0.125, 'column', { hz: heightHz(heightAt(STORY, (p + 0.5) * (X_MAX / 4))) });
      }
      tl.to(rig, { total: 1, duration: 0.6 }, 4.4);
      splits.forEach(([at, d], k) => {
        tl.to(rig, { split: k + 1, duration: d, ease: 'none' }, at);
        cue(at, 'double', { k });
        // From 32 columns on, a voice sings the curve as each split sweeps along it.
        if (k >= 2) {
          tl.set(rig, { singX: 0 }, at);
          tl.to(rig, { singX: X_MAX, duration: d, ease: 'none' }, at);
        }
      });
      tl.to(rig, { sing: 0.9, duration: 0.3 }, splits[2]![0]);
      tl.to(rig, { sing: 0, duration: 0.5 }, 11.9);
    },
  );

  // The eight columns swing up, one after another, and stack on the area's wall.
  const stackAt = 2.8;
  const stackDur = 6.4;
  j.beat(
    SLUG,
    {
      id: 'stack',
      heading: 'Stacking the area',
      body: "Now swing each column up onto the wall and stack it on the ones before. The stair climbs by each column's [area:area]; its top is the area so far, A(x).",
    },
    ({ tl, cue }) => {
      tl.to(rig, { total: 0, duration: 0.5 }, 0);
      tl.to(rig, { split: 1, duration: 1.6, ease: 'power2.inOut' }, 0.2);
      shot(
        tl,
        SLUG,
        {
          pos: [9.6, 6.1, 9.8],
          target: [2.9, 3.55, -1.3],
          focus: [3, 3, -1],
          dof: 0,
          shake: 0.35,
          portrait: 1,
        },
        3.2,
        0.2,
        'power2.inOut',
      );
      tl.to(rig, { stack: 1, duration: stackDur, ease: 'none' }, stackAt);
      // Each lands when its own share of the stagger is through (as the station staggers them).
      const st = 0.5 / 8;
      for (let p = 0; p < 8; p++) cue(stackAt + stackDur * (p * st + 1 - st * 7), 'step', { i: p });
    },
  );

  j.beat(
    SLUG,
    {
      id: 'slope',
      heading: 'How steep is each step?',
      body: "Each step climbs [f:f] × Δx over its width Δx, so its slope is [f:f], the column's height. Thinner columns smooth the stair into a curve, [area:A(x)], whose slope is f(x).",
    },
    ({ tl, cue }) => {
      shot(
        tl,
        SLUG,
        {
          pos: [3.1, 5.95, 6.9],
          target: [3.1, 5.8, -2.6],
          focus: [3, 5.8, -2.6],
          dof: 0,
          shake: 0.3,
          portrait: 1,
        },
        2.6,
        0,
        'power2.inOut',
      );
      tl.set(rig, { step: 3 }, 0);
      // The curve's wall is below the picture now, behind the caption: its axis names go.
      tl.to(rig, { named: 0, duration: 0.6 }, 0.6);
      tl.to(rig, { rise: 1, duration: 1.4 }, 2.2);
      cue(2.2, 'glow', { which: 0 });
      tl.to(rig, { rise: 0, duration: 0.6 }, 7.4);
      tl.to(rig, { split: 7, duration: 3.4, ease: 'power1.inOut' }, 7.6);
      for (let k = 1; k < 7; k++) cue(7.6 + (k - 1) * 0.55, 'double', { k });
      tl.to(rig, { areaCurve: 1, duration: 1.6, ease: 'power1.inOut' }, 9.8);
      tl.to(rig, { blocks: 0.35, duration: 1 }, 11.2);
    },
  );

  j.beat(
    SLUG,
    {
      id: 'match',
      heading: 'Slope and area undo each other',
      body: 'At every x, the slope of [area:the area curve] is the height of [f:the curve below]. Slopes and areas are one problem, run forwards and backwards: the fundamental theorem of calculus.',
    },
    ({ tl }) => {
      tl.to(rig, { blocks: 0, duration: 1 }, 0);
      tl.to(rig, { named: 1, duration: 0.6 }, 2.2);
      shot(tl, SLUG, { ...BOTH, focus: [3, 3, -1], dof: 0, shake: 0.3 }, 2.8, 0, 'power2.inOut');
      tl.set(rig, { probeX: 0.25, singX: 0.25 }, 0);
      tl.to(rig, { probe: 1, duration: 0.6 }, 1.6);
      tl.to(rig, { sing: 0.9, duration: 0.4 }, 1.8);
      tl.to(rig, { probeX: 3.8, singX: 3.8, duration: 9, ease: 'sine.inOut' }, 1.8);
      tl.to(rig, { sing: 0, duration: 0.6 }, 10.8);
    },
  );

  j.beat(
    SLUG,
    {
      id: 'formula',
      kind: 'formula',
      body: 'To find the area under f from a to b, take any F whose slope is f, and subtract. Newton had it by 1666; Leibniz, on his own, in the 1670s.',
      minDuration: 7,
    },
    ({ tl, cue }) => {
      cue(0.35, 'formula', { chapter: 6 });
      tl.to(rig, { probe: 0, duration: 0.6 }, 0);
      tl.set(rig, { a: 1, b: 3 }, 0);
      tl.to(rig, { bounds: 1, duration: 1.2 }, 0.6);
      shot(
        tl,
        SLUG,
        // Between the formula over the top of the picture and the player at the foot of it.
        {
          pos: [3.4, 5.1, 17.7],
          target: [3.4, 4.9, -1.3],
          focus: [3, 3, -1],
          dof: 0,
          shake: 0.3,
          portrait: 0.35,
        },
        4,
        0,
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
      body: 'Drag the points to reshape the curve, and move a and b. The area between them always equals how far the area curve climbs.',
    },
    ({ tl, pauseHere }) => {
      tl.set(rig, { ...heights(STORY_YS), a: 1, b: 3, bounds: 1, areaCurve: 1, curve: 1 }, 0);
      shot(
        tl,
        SLUG,
        {
          // A little left of centre, clear of the panel on a wide screen, still all there on a phone. (No caption
          // shows while the panel does, so the walls can stand in the middle.)
          pos: [3.6, 4, 17.7],
          target: [3.6, 3.7, -1.3],
          focus: [3, 3, -1],
          fov: 40,
          dof: 0,
          shake: 0.25,
          // On a phone the panel fills the lower half: both walls step back to fit above it.
          portrait: 0.8,
        },
        2.6,
        0,
        'power3.inOut',
      );
      tl.set(rig, { interactive: 1 }, 2.6);
      pauseHere(2.7);
      tl.set(rig, { interactive: 0 }, 2.8);
      tl.to({}, { duration: 0.7 }, 2.8);
    },
  );

  // The handoff, on the curve's wall: growth in step with itself, then turned to the side.
  const [ox, oy, oz] = GROWTH.origin;
  j.beat(
    SLUG,
    {
      id: 'handoff',
      heading: 'Growing by itself',
      body: "One curve's slope always equals its height: eˣ, a thing growing in step with itself. Turn that growth sideways, always at right angles, and it stops growing. It goes round instead.",
    },
    ({ tl, cue }) => {
      tl.to(rig, { bounds: 0, duration: 0.5 }, 0);
      tl.to(rig, { areaCurve: 0, curve: 0, wallA: 0, duration: 1.2 }, 0);
      shot(
        tl,
        SLUG,
        {
          pos: [ox, oy + 0.15, 7.4],
          target: [ox, oy, 0],
          focus: [ox, oy, oz],
          dof: 0,
          shake: 0.3,
          portrait: 1,
        },
        2.4,
        0,
        'power2.inOut',
      );
      tl.to(rig, { vector: 1, duration: 0.6 }, 1.4);
      tl.to(rig, { grow: 1, duration: 3.2, ease: 'none' }, 2);
      tl.to(rig, { turn: 1, duration: 1, ease: 'power2.inOut' }, 5.6);
      cue(5.6, 'pin', { i: 0 });
      tl.to(rig, { round: Math.PI * 2 * 1.15, duration: 4.2, ease: 'none' }, 6.8);
      // The stars gather into the next chapter's icon round the circle: a helix, the circle drawn out along time.
      tl.set(dust, { from: 'stars', to: 'helix', morph: 0 }, 7.6);
      tl.to(dust, { morph: 1, duration: 2.8, ease: 'power2.inOut' }, 7.6);
      tl.to(
        dust,
        {
          x: o.x + ox,
          y: o.y + oy,
          z: o.z + oz,
          scale: GROWTH.to,
          rotY: Math.PI / 2,
          size: 0.9,
          spin: 0,
          swirl: 0.6,
          drift: 0,
          colorA: '#e8fbff',
          colorB: '#3fd0e8',
          duration: 2.8,
          ease: 'power2.inOut',
        },
        7.6,
      );
      cue(7.6, 'gather');
      shot(
        tl,
        SLUG,
        { pos: [ox + 4.4, oy + 2.1, 6.4], target: [ox, oy, 0.2], focus: [ox, oy, 0], dof: 0, shake: 0.3 },
        3.6,
        8.2,
        'power2.inOut',
      );
      tl.to(rig, { vector: 0, wallF: 0, duration: 1.2 }, 11.2);
    },
  );
}
