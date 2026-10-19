import { useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { station } from '../../../engine/world/stations';
import { useApp } from '../../../state/store';
import { setTheta } from '../interaction';
import { C, eulerRig, onPlane, SYM7 } from '../rig';

const ORIGIN = station('euler');
/** The handle stands just in front of the plane, and is dragged in it. */
const Z = 0.06;
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -(ORIGIN.z + C[2] + Z));
const hit = new THREE.Vector3();

/** The point, draggable round the circle while the viewer has the controls. */
export function Handles() {
  const rig = eulerRig();
  const set = useApp((s) => s.set);
  const group = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const active = useRef(false);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    g.visible = rig.interactive > 0.5;
    const p = onPlane(Math.cos(rig.theta), Math.sin(rig.theta));
    g.position.set(p[0], p[1], p[2] + Z);
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.07;
    g.scale.setScalar((hover || active.current ? 1.35 : 1) * pulse);
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!active.current) return;
    e.stopPropagation();
    if (!e.ray.intersectPlane(plane, hit)) return;
    setTheta(Math.atan2(hit.y - ORIGIN.y - C[1], hit.x - ORIGIN.x - C[0]));
  };

  return (
    <group
      ref={group}
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
        // The point sings where it is while it is dragged.
        rig.voice = 1;
        document.body.style.cursor = 'grabbing';
        set({ dragging: true });
      }}
      onPointerMove={onMove}
      onPointerUp={(e) => {
        (e.target as unknown as Element).releasePointerCapture?.(e.pointerId);
        active.current = false;
        rig.voice = 0;
        document.body.style.cursor = hover ? 'grab' : '';
        set({ dragging: false });
      }}
    >
      <mesh renderOrder={20}>
        <sphereGeometry args={[0.1, 20, 14]} />
        <meshBasicMaterial color={SYM7.point} toneMapped={false} depthTest={false} />
      </mesh>
      <mesh renderOrder={19}>
        <ringGeometry args={[0.15, 0.18, 32]} />
        <meshBasicMaterial
          color={SYM7.sin}
          transparent
          opacity={0.6}
          toneMapped={false}
          depthTest={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* A generous invisible hit area, for touch. */}
      <mesh>
        <sphereGeometry args={[0.36, 12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
