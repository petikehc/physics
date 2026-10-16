import { station } from '../../engine/world/stations';
import { Disc } from './parts/Disc';
import { Dims } from './parts/Dims';
import { Onion } from './parts/Onion';
import { Pieces } from './parts/Pieces';

const ORIGIN = station('circle-area');

/** Chapter 2, further along the beach: the bronze disc, its slices and its rings. */
export default function CircleAreaStation() {
  return (
    <group position={[ORIGIN.x, ORIGIN.y, ORIGIN.z]}>
      <Disc />
      <Pieces />
      <Dims />
      <Onion />
    </group>
  );
}
