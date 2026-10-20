import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { clamp01 } from '../../../engine/ease';
import type { Track } from '../math';
import { energyRig, storyTestTrack } from '../rig';
import { live, sandboxTrack, testNow } from '../sandbox';
import { TrackModel } from './TrackModel';
import { Train } from './Train';

/**
 * The test track in front of the coaster: a valley between a start and a far hill, with one car. In the story its hills
 * are fixed; in Your turn and the Lab the viewer reshapes them, and the track is rebuilt to match.
 */
export function TestTrack() {
  const rig = energyRig();
  const [track, setTrack] = useState<Track>(() => storyTestTrack());
  const shown = useRef(false);
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    const want = live(rig) ? sandboxTrack(rig) : storyTestTrack();
    if (want !== track) setTrack(want);
    shown.current = clamp01(rig.test) > 0.5;
    if (group.current) group.current.visible = clamp01(rig.test) > 0.01;
  });

  const car = useMemo(
    () => ({ front: () => testNow(rig).sample.s + 1.25, shown: () => shown.current }),
    [rig],
  );

  return (
    <group ref={group} visible={false}>
      <TrackModel track={track} supports rail={0.07} color="#aeb3bd" />
      <Train track={track} front={car.front} shown={car.shown} cars={1} />
    </group>
  );
}
