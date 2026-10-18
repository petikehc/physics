import { station } from '../../engine/world/stations';
import { Moon } from './parts/Moon';
import { Planet } from './parts/Planet';
import { Shells } from './parts/Shells';
import { Shots } from './parts/Shots';
import { Strobe } from './parts/Strobe';
import { useNewtonClock } from './interaction';

const ORIGIN = station('newton');

/** Chapter 5, on the small planet: Newton's mountain and cannon, its shots, the Moon, and the spreading pull. */
export default function NewtonStation() {
  useNewtonClock();
  return (
    <group position={[ORIGIN.x, ORIGIN.y, ORIGIN.z]}>
      <Planet />
      <Shots />
      <Moon />
      <Shells />
      <Strobe />
    </group>
  );
}
