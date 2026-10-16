import { station } from '../../engine/world/stations';
import { Drawing } from './parts/Drawing';
import { Handles } from './parts/Handles';
import { Rearrangement } from './parts/Rearrangement';
import { Tanks } from './parts/Tanks';

const ORIGIN = station('pythagoras');

/** Chapter 1 on the dusk beach. Every part reads the chapter rig each frame. */
export default function PythagorasStation() {
  return (
    <group position={[ORIGIN.x, ORIGIN.y, ORIGIN.z]}>
      <Drawing />
      <Tanks />
      <Rearrangement />
      <Handles />
    </group>
  );
}
