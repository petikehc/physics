import { runtime } from '../engine/runtime';
import { createCameraRig, createDustRig, createWorldRig, resetRig } from '../engine/rigs';
import { resetChapterRigs } from '../chapters/hooks';
import { buildPythagoras } from '../chapters/01-pythagoras/timeline';
import { buildCircleArea } from '../chapters/02-circle-area/timeline';
import { buildArchimedes } from '../chapters/03-archimedes/timeline';
import { buildKepler } from '../chapters/04-kepler/timeline';
import { buildNewton } from '../chapters/05-newton/timeline';
import { buildCalculus } from '../chapters/06-calculus/timeline';
import { buildEuler } from '../chapters/07-euler/timeline';
import { buildFourier } from '../chapters/08-fourier/timeline';
import { buildDoppler } from '../chapters/09-doppler/timeline';
import { buildEnergy } from '../chapters/10-energy/timeline';
import { buildFinale } from '../chapters/finale/timeline';
import { JourneyBuilder, type Journey } from './builder';

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
  buildDoppler(j);
  buildEnergy(j);
  buildFinale(j);
  const journey = j.finish();
  journey.master.progress(0);
  return journey;
}
