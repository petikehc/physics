import { useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { station } from '../../../engine/world/stations';
import { useApp } from '../../../state/store';
import { placeListener } from '../interaction';
import { dopplerRig, KERB, SYM9 } from '../rig';

const ORIGIN = station('doppler');
/** The listener is dragged about on the level of the pavements. */
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(ORIGIN.y + KERB));
const hit = new THREE.Vector3();

/** The listener's handle: a ring at their feet, draggable anywhere along the street while the viewer has it. */
export function Handles() {
  const rig = dopplerRig();
  const set = useApp((s) => s.set);
  const group = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const active = useRef(false);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    g.visible = rig.interactive > 0.5 && rig.you > 0.5;
    g.position.set(rig.lx, KERB + 0.04, rig.lz);
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.06;
    g.scale.setScalar((hover || active.current ? 1.25 : 1) * pulse);
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!active.current) return;
    e.stopPropagation();
    if (!e.ray.intersectPlane(plane, hit)) return;
    placeListener(hit.x - ORIGIN.x, hit.z - ORIGIN.z);
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
      <mesh rotation-x={-Math.PI / 2} renderOrder={20}>
        <ringGeometry args={[0.62, 0.74, 40]} />
        <meshBasicMaterial color={SYM9.ear} transparent opacity={0.9} toneMapped={false} depthTest={false} />
      </mesh>
      {/* A generous invisible hit area round the listener, for touch. */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 1.9, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
