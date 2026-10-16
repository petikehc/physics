import { runtime } from '../engine/runtime';
import { createCameraRig, createDustRig, resetRig } from '../engine/rigs';
import { shot } from '../engine/camera/shots';
import { station } from '../engine/world/stations';
import { buildPythagoras } from '../chapters/01-pythagoras/timeline';
import { pythagorasRig, PYTHAGORAS_DEFAULTS } from '../chapters/01-pythagoras/rig';
import { JourneyBuilder, type Journey } from './builder';

/** Flight from the end of chapter 1 to the (stub) station of chapter 2, then its "coming soon" beat. */
function buildCircleAreaStub(j: JourneyBuilder) {
  const slug = 'circle-area';
  const dust = runtime.dust;
  const to = station(slug);

  j.beat(slug, { id: 'flight', kind: 'flight', minDuration: 5.6 }, ({ tl, cue }) => {
    const d = 5.4;
    tl.to(dust, { x: to.x, y: to.y + 1.8, z: to.z, duration: d, ease: 'power2.inOut' }, 0);
    tl.to(dust, { spin: 0.35, scale: 0.62, duration: d }, 0);
    shot(
      tl,
      slug,
      { pos: [0, 2.4, 9.2], target: [0, 2.0, 0], focus: [0, 1.8, 0], shake: 0.5 },
      d,
      0,
      'power2.inOut',
    );
    tl.to(runtime.camera, { lift: 7, duration: d / 2, ease: 'sine.out' }, 0);
    tl.to(runtime.camera, { lift: 0, duration: d / 2, ease: 'sine.in' }, d / 2);
    tl.to(runtime.camera, { veil: 1, duration: d * 0.3, ease: 'power1.in' }, d * 0.15);
    tl.to(runtime.camera, { veil: 0, duration: d * 0.3, ease: 'power1.out' }, d * 0.55);
    cue(0.15, 'whoosh', { gain: 1 });
  });

  j.beat(
    slug,
    {
      id: 'soon',
      kind: 'end',
      heading: 'II · The Area of a Circle',
      body: 'Archimedes is still drawing his circles in the sand. This chapter is in production.',
      minDuration: 3,
    },
    ({ tl }) => {
      shot(tl, slug, { pos: [1.4, 2.2, 8.4] }, 6, 0, 'sine.inOut');
    },
  );
}

/** Resets every rig and assembles the whole journey into one master timeline. */
export function buildJourney(): Journey {
  resetRig(runtime.camera, createCameraRig());
  resetRig(runtime.dust, createDustRig());
  resetRig(pythagorasRig(), { ...PYTHAGORAS_DEFAULTS });

  const j = new JourneyBuilder();
  buildPythagoras(j);
  buildCircleAreaStub(j);
  const journey = j.finish();
  journey.master.progress(0);
  return journey;
}
