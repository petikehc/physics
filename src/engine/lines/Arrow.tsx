import { useMemo } from 'react';
import * as THREE from 'three';
import { headGeo, shaftGeo } from './aim';

/** The meshes `aim` points: one material for both, so they fade together. */
export function Arrow({
  arrow,
  color,
  renderOrder = 9,
  depthTest = true,
}: {
  arrow: (el: THREE.Group | null) => void;
  color: string;
  renderOrder?: number;
  depthTest?: boolean;
}) {
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color, transparent: true, toneMapped: false, depthTest }),
    [color, depthTest],
  );
  return (
    <group ref={arrow} visible={false}>
      <mesh geometry={shaftGeo} material={mat} renderOrder={renderOrder} />
      <mesh geometry={headGeo} material={mat} renderOrder={renderOrder} />
    </group>
  );
}
