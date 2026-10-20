import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { station } from '../../engine/world/stations';
import { clamp01 } from '../../engine/ease';
import { Fairground } from './parts/Fairground';
import { Handles } from './parts/Handles';
import { Sparks } from './parts/Sparks';
import { Tanks } from './parts/Tanks';
import { TestTrack } from './parts/TestTrack';
import { TrackModel } from './parts/TrackModel';
import { Train } from './parts/Train';
import { CAR_GAP, CARS, coasterTrack, energyRig, storyRide, trainNow } from './rig';
import { live, sandboxRelease, sandboxStep } from './sandbox';

const ORIGIN = station('energy');

/**
 * Chapter 10, at a fairground at night: a roller coaster with a lift hill, a drop, a loop and a camel-back, its train's
 * energy in glass tanks beside it, and a test track in front where a car can be let go to see how high it climbs.
 */
export default function EnergyStation() {
  const rig = energyRig();
  const track = coasterTrack();
  const train = useMemo(
    () => ({ front: () => trainNow(rig).s, shown: () => clamp01(rig.train) > 0.5 }),
    [rig],
  );
  const wasLive = useRef(false);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    // While the viewer has it, the test car runs live, let go afresh each time they take it over.
    const now = live(rig);
    if (now && !wasLive.current) sandboxRelease(rig);
    wasLive.current = now;
    if (now) {
      rig.sandT += dt;
      sandboxStep(rig, dt);
    }
    // The Lab's coaster rides round and round: up, down, round, into the brakes, and back to the start.
    if (rig.loop > 0.5 && rig.lab > 0.5) {
      const ride = storyRide();
      const end = ride[ride.length - 1]!.t;
      rig.rideT = (rig.rideT + dt) % Math.min(end, 24);
    }
  });
  return (
    <group position={[ORIGIN.x, ORIGIN.y, ORIGIN.z]}>
      <Fairground />
      <TrackModel track={track} bulbs lit={() => rig.fair} />
      <Train track={track} front={train.front} shown={train.shown} cars={CARS} gap={CAR_GAP} />
      <TestTrack />
      <Tanks />
      <Sparks />
      <Handles />
    </group>
  );
}
