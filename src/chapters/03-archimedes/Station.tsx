import { station } from '../../engine/world/stations';
import { Beakers } from './parts/Beakers';
import { Blocks } from './parts/Blocks';
import { Hanging } from './parts/Hanging';
import { Tank } from './parts/Tank';
import { Bubble } from './parts/Bubble';

const ORIGIN = station('archimedes');

/** Chapter 3, further along the beach: a stone tank, a spring scale, the crown, and the things that float. */
export default function ArchimedesStation() {
  return (
    <group position={[ORIGIN.x, ORIGIN.y, ORIGIN.z]}>
      <Tank />
      <Hanging />
      <Beakers />
      <Blocks />
      <Bubble />
    </group>
  );
}
