import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { station } from '../../engine/world/stations';
import { clamp01 } from '../../engine/ease';
import { audio } from '../../audio';
import { Ambulance } from './parts/Ambulance';
import { Galaxy } from './parts/Galaxy';
import { Handles } from './parts/Handles';
import { Jet } from './parts/Jet';
import { Listeners } from './parts/Listeners';
import { Shells } from './parts/Shells';
import { Street } from './parts/Street';
import { dopplerRig, HALF_ROAD, LOOP, SLOW, SYM9 } from './rig';
import { hearing } from './sound';

const ORIGIN = station('doppler');
/** Real light from the three streetlights nearest the story (the rest only paint their pools on the road). */
const LIT: Array<[number, number, number]> = [
  [-8, 7, HALF_ROAD - 0.7],
  [8, 7, -HALF_ROAD + 0.7],
  [24, 7, HALF_ROAD - 0.7],
];

/**
 * Chapter 9, on a city street at night: an ambulance going by, its siren's waves as spheres bunched ahead and
 * stretched behind, a jet outrunning its own waves, and, far above, a galaxy whose light is stretched red.
 */
export default function DopplerStation() {
  const rig = dopplerRig();
  const lights = useRef<Array<THREE.PointLight | null>>([]);
  const heardBefore = useRef(true);
  useFrame((_, delta) => {
    const on = clamp01(rig.street);
    for (const l of lights.current) if (l) l.intensity = 60 * on;
    // While the viewer has the street, the source goes round and the listener walks; a jet's cone reaching the
    // listener is heard as a boom.
    if (rig.mode > 1.5 && (rig.interactive > 0.5 || rig.lab > 0.5)) {
      const dt = Math.min(delta, 0.1);
      rig.sandT += dt;
      if (rig.lm !== 0)
        rig.lx = ((((rig.lx + rig.lm * SLOW * dt + LOOP) % (2 * LOOP)) + 2 * LOOP) % (2 * LOOP)) - LOOP;
      const now = hearing(rig) !== null;
      if (now && !heardBefore.current && rig.kind > 0.5 && rig.you > 0.5) audio.cue('boom', { gain: 0.8 });
      heardBefore.current = now;
    }
  });
  return (
    <group position={[ORIGIN.x, ORIGIN.y, ORIGIN.z]}>
      <Street />
      {LIT.map((p, i) => (
        <pointLight
          key={i}
          ref={(el) => void (lights.current[i] = el)}
          position={p}
          color={SYM9.sodium}
          intensity={0}
          distance={34}
          decay={2}
        />
      ))}
      <Ambulance />
      <Jet />
      <Shells />
      <Listeners />
      <Galaxy />
      <Handles />
    </group>
  );
}
