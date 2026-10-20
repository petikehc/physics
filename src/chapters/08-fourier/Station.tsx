import { station } from '../../engine/world/stations';
import { Chart } from './parts/Chart';
import { Clockwork } from './parts/Clockwork';
import { Drawing } from './parts/Drawing';
import { Pad } from './parts/Pad';
import { Spectrum } from './parts/Spectrum';

const ORIGIN = station('fourier');

/**
 * Chapter 8, among the stars: a clockwork of circles turning at whole-number speeds, the wave its tip draws on a
 * chart beside it, the same clockwork seen side on as a spectrum, and a hundred circles drawing a shape.
 */
export default function FourierStation() {
  return (
    <group position={[ORIGIN.x, ORIGIN.y, ORIGIN.z]}>
      <Chart />
      <Clockwork />
      <Spectrum />
      <Drawing />
      <Pad />
    </group>
  );
}
