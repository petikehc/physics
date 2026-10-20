import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { clamp01 } from '../../../engine/ease';
import { ChalkLine, type ChalkLineHandle } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import type { Track } from '../math';
import { energyRig, STORY_TEST, storyTestTrack, SYM10, TEST_CX, TEST_Z } from '../rig';
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
  const line = useRef<ChalkLineHandle | null>(null);
  const label = useRef<THREE.Group>(null);
  const text = useRef<HTMLDivElement>(null);
  const said = useRef('');

  useFrame(() => {
    const want = live(rig) ? sandboxTrack(rig) : storyTestTrack();
    if (want !== track) setTrack(want);
    shown.current = clamp01(rig.test) > 0.5;
    if (group.current) group.current.visible = clamp01(rig.test) > 0.01;
    // The height it was let go from, across the whole valley: it never climbs above this line.
    const h = live(rig) ? rig.h0 : STORY_TEST.h0;
    const on = clamp01(rig.level) * clamp01(rig.test);
    line.current?.set(
      [
        [TEST_CX - 24, h, TEST_Z + 0.7],
        [TEST_CX + 24, h, TEST_Z + 0.7],
      ],
      1,
      0.75 * on,
    );
    label.current?.position.set(TEST_CX + 24, h, TEST_Z + 0.7);
    const words = `${h.toFixed(h % 1 ? 1 : 0)} m, where it started`;
    if (text.current) {
      if (said.current !== words) {
        said.current = words;
        text.current.textContent = words;
      }
      text.current.style.opacity = String(on);
      beside(text.current, 1, 0, 6);
    }
  });

  const car = useMemo(
    () => ({ front: () => testNow(rig).sample.s + 1.25, shown: () => shown.current }),
    [rig],
  );

  return (
    <group ref={group} visible={false}>
      <TrackModel track={track} supports rail={0.07} color="#aeb3bd" />
      <Train track={track} front={car.front} shown={car.shown} cars={1} />
      <ChalkLine handle={line} color={SYM10.pe} width={1.6} renderOrder={8} />
      <group ref={label}>
        <MathLabel ref={text} className="math-label math-label--small" color={SYM10.pe} />
      </group>
    </group>
  );
}
