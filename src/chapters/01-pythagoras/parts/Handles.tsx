import { useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { station } from '../../../engine/world/stations';
import { useApp } from '../../../state/store';
import { clamp } from '../../../engine/ease';
import { DEG, triangle } from '../math';
import { LEG_MAX, LEG_MIN, pythagorasRig, SYM, TANK_DEPTH, UV_OFFSET, uvToLocal } from '../rig';

const ORIGIN = station('pythagoras');
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -ORIGIN.y);
const hit = new THREE.Vector3();

/** Shared interaction settings for the Your-turn panel and the Lab. */
export const pyInteraction = {
  snap: true,
};

function snapValue(x: number) {
  return pyInteraction.snap ? Math.round(x) : Math.round(x * 100) / 100;
}

function Handle({ which, color }: { which: 'P1' | 'P2'; color: string }) {
  const rig = pythagorasRig();
  const set = useApp((s) => s.set);
  const mesh = useRef<THREE.Group>(null);
  const pin = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const active = useRef(false);

  useFrame((state) => {
    const g = mesh.current;
    if (!g) return;
    const t = triangle(rig.a, rig.b, rig.gamma);
    const P = which === 'P1' ? t.P1 : t.P2;
    // Float above the tanks so the handle is never buried; a pin marks the vertex below.
    const lift = 0.06 + rig.tanks * (TANK_DEPTH + 0.3);
    g.position.set(...uvToLocal(P[0], P[1], rig.scale, lift));
    g.visible = rig.interactive > 0.5;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.08;
    g.scale.setScalar((hover || active.current ? 1.35 : 1) * pulse);
    const p = pin.current;
    if (p) {
      p.visible = lift > 0.1;
      p.scale.set(1, lift / g.scale.y, 1);
      p.position.set(0, -lift / g.scale.y / 2, 0);
    }
  });

  const toUv = (e: ThreeEvent<PointerEvent>) => {
    // Drag in the horizontal plane at the handle's height, so it stays under the pointer.
    plane.constant = -(ORIGIN.y + 0.06 + rig.tanks * (TANK_DEPTH + 0.3));
    if (!e.ray.intersectPlane(plane, hit)) return null;
    const S = rig.scale;
    const u = (hit.x - ORIGIN.x) / S - UV_OFFSET[0];
    const v = -(hit.z - ORIGIN.z) / S - UV_OFFSET[1];
    return [u, v] as const;
  };

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!active.current) return;
    e.stopPropagation();
    const uv = toUv(e);
    if (!uv) return;
    const [u, v] = uv;
    if (which === 'P1') {
      rig.a = snapValue(clamp(u, LEG_MIN, LEG_MAX));
    } else if (rig.lab > 0.5) {
      // In the Lab the second vertex moves freely: its distance is b, its direction sets the angle.
      rig.b = snapValue(clamp(Math.hypot(u, v), LEG_MIN, LEG_MAX));
      const g = Math.atan2(v, u) / DEG;
      rig.gamma = pyInteraction.snap ? Math.round(clamp(g, 20, 160) / 5) * 5 : clamp(g, 20, 160);
    } else {
      rig.b = snapValue(clamp(v, LEG_MIN, LEG_MAX));
    }
  };

  return (
    <group
      ref={mesh}
      visible={false}
      onPointerOver={(e) => {
        if (rig.interactive < 0.5) return;
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = 'grab';
      }}
      onPointerOut={() => {
        setHover(false);
        if (!active.current) document.body.style.cursor = '';
      }}
      onPointerDown={(e) => {
        if (rig.interactive < 0.5) return;
        e.stopPropagation();
        (e.target as unknown as Element).setPointerCapture?.(e.pointerId);
        active.current = true;
        document.body.style.cursor = 'grabbing';
        set({ dragging: true });
      }}
      onPointerMove={onMove}
      onPointerUp={(e) => {
        (e.target as unknown as Element).releasePointerCapture?.(e.pointerId);
        active.current = false;
        document.body.style.cursor = hover ? 'grab' : '';
        set({ dragging: false });
      }}
    >
      <mesh renderOrder={20}>
        <sphereGeometry args={[0.1, 24, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} depthTest={false} />
      </mesh>
      <mesh ref={pin} renderOrder={19}>
        <cylinderGeometry args={[0.012, 0.012, 1, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} toneMapped={false} depthTest={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} renderOrder={20}>
        <ringGeometry args={[0.16, 0.2, 40]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          toneMapped={false}
          depthTest={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Generous invisible hit area for touch. */}
      <mesh>
        <sphereGeometry args={[0.38, 12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function Handles() {
  return (
    <>
      <Handle which="P1" color={SYM.a} />
      <Handle which="P2" color={SYM.b} />
    </>
  );
}
