import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { clamp01 } from '../../../engine/ease';
import { calculusRig, GROWTH, radiusAt, SYM6 } from '../rig';

const UP = new THREE.Vector3(0, 1, 0);
const _d = new THREE.Vector3();
const shaftGeo = new THREE.CylinderGeometry(0.014, 0.014, 1, 10).translate(0, 0.5, 0);
const headGeo = new THREE.ConeGeometry(0.045, 0.12, 14).translate(0, 0.06, 0);
const RING = 96;
const VIOLET = new THREE.Color(SYM6.f);
const CYAN = new THREE.Color(SYM6.turn);

/**
 * The handoff, on the curve's wall: a point pushed outwards by an arrow as long as its own distance, so it grows in
 * step with itself (as eᵗ grows). Then the push turns to the side, at right angles, and the point stops growing:
 * it goes round, in a circle.
 */
export function Growth() {
  const rig = calculusRig();
  const point = useRef<THREE.Mesh>(null);
  const arrow = useRef<THREE.Group>(null);
  const reach = useRef<ChalkLineHandle | null>(null);
  const trail = useRef<ChalkLineHandle | null>(null);
  const ring = useRef<ChalkLineHandle | null>(null);
  const arrowMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: SYM6.f, transparent: true, toneMapped: false }),
    [],
  );
  const ringPts = useMemo<Pts>(() => Array.from({ length: RING + 1 }, () => [0, 0, 0]), []);
  const [ox, oy, oz] = GROWTH.origin;

  useFrame(() => {
    const on = clamp01(rig.vector);
    const turn = clamp01(rig.turn);
    const r = radiusAt(rig.grow);
    const a = GROWTH.angle + rig.round;
    const px = ox + r * Math.cos(a);
    const py = oy + r * Math.sin(a);
    if (point.current) {
      point.current.visible = on > 0.01;
      point.current.position.set(px, py, oz);
    }
    // From the centre out to the point; and the way it has come, out along a line, then round.
    reach.current?.set(
      [
        [ox, oy, oz],
        [px, py, oz],
      ],
      1,
      on * 0.55,
    );
    const r0 = GROWTH.from;
    trail.current?.set(
      [
        [ox + r0 * Math.cos(GROWTH.angle), oy + r0 * Math.sin(GROWTH.angle), oz],
        [ox + r * Math.cos(GROWTH.angle), oy + r * Math.sin(GROWTH.angle), oz],
      ],
      1,
      on * 0.7 * (1 - clamp01(rig.round)),
    );
    for (let i = 0; i <= RING; i++) {
      const t = GROWTH.angle + (i / RING) * Math.PI * 2;
      ringPts[i]![0] = ox + GROWTH.to * Math.cos(t);
      ringPts[i]![1] = oy + GROWTH.to * Math.sin(t);
      ringPts[i]![2] = oz;
    }
    ring.current?.set(ringPts, Math.min(rig.round / (Math.PI * 2), 1), on);

    // The push: as long as the point is far out, along the line out from the centre, turning to the side.
    const g = arrow.current;
    if (g) {
      g.visible = on > 0.01;
      g.position.set(px, py, oz);
      const dir = a + (turn * Math.PI) / 2;
      g.quaternion.setFromUnitVectors(UP, _d.set(Math.cos(dir), Math.sin(dir), 0));
      const len = r * 0.7;
      g.children[0]!.scale.set(1, Math.max(len - 0.12, 0.001), 1);
      g.children[1]!.position.set(0, Math.max(len - 0.12, 0), 0);
      arrowMat.color.lerpColors(VIOLET, CYAN, turn);
      arrowMat.opacity = on;
    }
  });

  return (
    <group>
      <ChalkLine handle={reach} color={SYM6.axis} width={1.4} renderOrder={8} />
      <ChalkLine handle={trail} color={SYM6.f} width={2.4} renderOrder={8} />
      <ChalkLine handle={ring} color={SYM6.turn} width={2.6} renderOrder={8} />
      <mesh ref={point} visible={false} renderOrder={10}>
        <sphereGeometry args={[0.06, 16, 12]} />
        <meshBasicMaterial color="#f4efe6" toneMapped={false} />
      </mesh>
      <group ref={arrow} visible={false}>
        <mesh geometry={shaftGeo} material={arrowMat} renderOrder={9} />
        <mesh geometry={headGeo} material={arrowMat} renderOrder={9} />
      </group>
    </group>
  );
}
