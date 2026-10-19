import { station } from '../../engine/world/stations';
import { Epicycle } from './parts/Epicycle';
import { Handles } from './parts/Handles';
import { Identity } from './parts/Identity';
import { Plane } from './parts/Plane';
import { Point } from './parts/Point';
import { Series } from './parts/Series';
import { Shadows } from './parts/Shadows';
import { Triangle } from './parts/Triangle';

const ORIGIN = station('euler');

/**
 * Chapter 7, among the stars: the complex plane standing upright, the point e^{iθ} going round its circle, drawn out
 * along time into a helix whose shadows are cos θ and sin θ, and the series that says why.
 */
export default function EulerStation() {
  return (
    <group position={[ORIGIN.x, ORIGIN.y, ORIGIN.z]}>
      <Plane />
      <Shadows />
      <Point />
      <Triangle />
      <Series />
      <Identity />
      <Epicycle />
      <Handles />
    </group>
  );
}
