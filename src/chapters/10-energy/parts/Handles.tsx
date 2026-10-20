import { useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { station } from '../../../engine/world/stations';
import { useApp } from '../../../state/store';
import { setHill } from '../interaction';
import { energyRig, SYM10, TEST_Z } from '../rig';

const ORIGIN = station('energy');
/** The handles stand just in front of the test track, and are dragged up and down in its plane. */
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -(ORIGIN.z + TEST_Z + 0.8));
const hit = new THREE.Vector3();
/** Where along the track each handle sits: over the start's platform, and over the far hill's top. */
const AT: Record<'h0' | 'h4', number> = { h0: -21.5, h4: 21.5 };

function Handle({ which }: { which: 'h0' | 'h4' }) {
  const rig = energyRig();
  const set = useApp((s) => s.set);
  const group = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const active = useRef(false);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    g.visible = rig.interactive > 0.5 && rig.test > 0.5;
    g.position.set(AT[which], rig[which] + 1.2, TEST_Z + 0.8);
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.07;
    g.scale.setScalar((hover || active.current ? 1.3 : 1) * pulse);
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!active.current) return;
    e.stopPropagation();
    if (!e.ray.intersectPlane(plane, hit)) return;
    setHill(which, hit.y - ORIGIN.y - 1.2);
  };

  return (
    <group
      ref={group}
      visible={false}
      onPointerOver={(e) => {
        if (rig.interactive < 0.5) return;
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = 'ns-resize';
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
        document.body.style.cursor = hover ? 'ns-resize' : '';
        set({ dragging: false });
      }}
    >
      <mesh renderOrder={20}>
        <sphereGeometry args={[0.35, 20, 14]} />
        <meshBasicMaterial color={SYM10.pe} toneMapped={false} depthTest={false} />
      </mesh>
      {/* Up and down arrows: this handle moves the hill's top. */}
      {[1, -1].map((d) => (
        <mesh key={d} position={[0, d * 0.75, 0]} rotation-z={d > 0 ? 0 : Math.PI} renderOrder={20}>
          <coneGeometry args={[0.22, 0.4, 12]} />
          <meshBasicMaterial color={SYM10.chalk} toneMapped={false} depthTest={false} />
        </mesh>
      ))}
      {/* A generous invisible hit area, for touch. */}
      <mesh>
        <sphereGeometry args={[1.3, 12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** The test track's two hilltops, draggable up and down while the viewer has it. */
export function Handles() {
  return (
    <group>
      <Handle which="h0" />
      <Handle which="h4" />
    </group>
  );
}
