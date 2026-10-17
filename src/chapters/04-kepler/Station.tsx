import { station } from '../../engine/world/stations';
import { Fans } from './parts/Fans';
import { Orbit } from './parts/Orbit';
import { Sun } from './parts/Sun';
import { System } from './parts/System';
import { useKeplerClock } from './interaction';

const ORIGIN = station('kepler');

/** Chapter 4, out among the stars: the Sun, Mars and its orbit, the equal-time fans, and the other planets. */
export default function KeplerStation() {
  useKeplerClock();
  return (
    <group position={[ORIGIN.x, ORIGIN.y, ORIGIN.z]}>
      <Sun />
      <Fans />
      <Orbit />
      <System />
    </group>
  );
}
