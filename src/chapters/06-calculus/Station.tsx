import { station } from '../../engine/world/stations';
import { AreaCurve } from './parts/AreaCurve';
import { Columns } from './parts/Columns';
import { Curve } from './parts/Curve';
import { Growth } from './parts/Growth';
import { Handles } from './parts/Handles';
import { Realm } from './parts/Realm';
import { Walls } from './parts/Walls';

const ORIGIN = station('calculus');

/**
 * Chapter 6, in the abstract realm: a curve on one wall, the columns that fill the area under it, and the stair
 * they stack into on the wall above, whose top is the area so far.
 */
export default function CalculusStation() {
  return (
    <group position={[ORIGIN.x, ORIGIN.y, ORIGIN.z]}>
      <Realm />
      <Walls />
      <Curve />
      <Columns />
      <AreaCurve />
      <Growth />
      <Handles />
    </group>
  );
}
