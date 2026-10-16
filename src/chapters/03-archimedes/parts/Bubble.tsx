import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp01 } from '../../../engine/ease';
import { glassMaterial } from '../../../engine/materials/water';
import { waterY } from '../hang';
import { archimedesRig, TANK, uv } from '../rig';

const bubbleGeo = new THREE.SphereGeometry(0.07, 24, 16);

/** The handoff bubble: rises from the tank floor, wobbling, and pops at the surface (bubble = 0.5). */
export function Bubble() {
  const rig = archimedesRig();
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const q = clamp01(rig.bubble / 0.5);
    m.visible = rig.bubble > 0.001 && rig.bubble < 0.5;
    if (!m.visible) return;
    const top = waterY(rig.level) - 0.05;
    const y = TANK.floor + 0.08 + (top - TANK.floor - 0.08) * q * q;
    const t = state.clock.elapsedTime;
    m.position.set(...uv(Math.sin(t * 5) * 0.03 * q, Math.cos(t * 4) * 0.02, y));
    const s = 0.7 + 0.5 * q;
    m.scale.set(s * (1 + Math.sin(t * 11) * 0.06), s * (1 - Math.sin(t * 11) * 0.06), s);
  });
  return <mesh ref={mesh} geometry={bubbleGeo} material={glassMaterial} visible={false} renderOrder={4} />;
}
