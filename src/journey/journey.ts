import { runtime } from '../engine/runtime';
import { createCameraRig, createDustRig, createWorldRig, resetRig } from '../engine/rigs';
import { shot } from '../engine/camera/shots';
import { station } from '../engine/world/stations';
import { chapterBySlug } from '../chapters/registry';
import { resetChapterRigs } from '../chapters/hooks';
import { buildPythagoras } from '../chapters/01-pythagoras/timeline';
import { buildCircleArea } from '../chapters/02-circle-area/timeline';
import { buildArchimedes } from '../chapters/03-archimedes/timeline';
import { buildKepler } from '../chapters/04-kepler/timeline';
import { buildNewton } from '../chapters/05-newton/timeline';
import { buildCalculus } from '../chapters/06-calculus/timeline';
import { buildEuler } from '../chapters/07-euler/timeline';
import { buildFourier } from '../chapters/08-fourier/timeline';
import { JourneyBuilder, type Journey } from './builder';

/**
 * The flight to a chapter that is not built yet, then its "coming soon" beat. The Dust (already shaped as
 * that chapter's icon by the previous handoff) flies ahead of the camera to the new station.
 */
function buildComingSoon(j: JourneyBuilder, slug: string, body: string) {
  const dust = runtime.dust;
  const to = station(slug);
  const meta = chapterBySlug(slug);

  j.beat(slug, { id: 'flight', kind: 'flight', minDuration: 5.6 }, ({ tl, cue }) => {
    const d = 5.4;
    tl.to(dust, { x: to.x, y: to.y + 1.8, z: to.z, duration: d, ease: 'power2.inOut' }, 0);
    tl.to(dust, { spin: 0.35, scale: 0.8, size: 1.05, duration: d }, 0);
    shot(
      tl,
      slug,
      { pos: [0, 2.4, 9.2], target: [0, 2.0, 0], focus: [0, 1.8, 0], dof: 0, shake: 0.5 },
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
      heading: meta ? `${meta.numeral} · ${meta.title}` : undefined,
      body,
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
  resetRig(runtime.world, createWorldRig());
  resetChapterRigs();

  const j = new JourneyBuilder();
  buildPythagoras(j);
  buildCircleArea(j);
  buildArchimedes(j);
  buildKepler(j);
  buildNewton(j);
  buildCalculus(j);
  buildEuler(j);
  buildFourier(j);
  buildComingSoon(
    j,
    'doppler',
    'Doppler: a siren sounds higher coming towards you and lower going away, because its waves bunch up ahead of it and stretch out behind. This chapter is in production.',
  );
  const journey = j.finish();
  journey.master.progress(0);
  return journey;
}
