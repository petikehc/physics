import { useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { station } from '../../../engine/world/stations';
import { useApp } from '../../../state/store';
import { CONTROL_X, CONTROLS } from '../math';
import { setBound, setControl } from '../interaction';
import { calculusRig, onF, SX, SY, SYM6, type CalculusRig } from '../rig';

const ORIGIN = station('calculus');
/** Handles stand just in front of the curve's wall, and are dragged in that plane. */
const Z = 0.12;
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -(ORIGIN.z + Z));
const hit = new THREE.Vector3();

type Which = { kind: 'point'; i: number } | { kind: 'bound'; which: 'a' | 'b' };

function where(rig: CalculusRig, w: Which): [number, number, number] {
  if (w.kind === 'point') return onF(CONTROL_X[w.i]!, rig[`k${w.i}` as keyof CalculusRig] as number, Z);
  return onF(rig[w.which], 0, Z);
}

/**
 * One draggable handle: a point of the curve (dragged up and down) or a bound, a or b (dragged along the x axis).
 * Only there while the viewer has the controls.
 */
function Handle({ w }: { w: Which }) {
  const rig = calculusRig();
  const set = useApp((s) => s.set);
  const group = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const active = useRef(false);
  const color = w.kind === 'point' ? SYM6.f : SYM6.axis;

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    g.visible = rig.interactive > 0.5 && (w.kind === 'point' || rig.bounds > 0.5);
    g.position.set(...where(rig, w));
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3 + (w.kind === 'point' ? w.i : 9)) * 0.07;
    g.scale.setScalar((hover || active.current ? 1.35 : 1) * pulse);
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!active.current) return;
    e.stopPropagation();
    if (!e.ray.intersectPlane(plane, hit)) return;
    if (w.kind === 'point') setControl(w.i, (hit.y - ORIGIN.y) / SY);
    else setBound(w.which, (hit.x - ORIGIN.x) / SX);
  };

  return (
    <group
      ref={group}
      visible={false}
      onPointerOver={(e) => {
        if (rig.interactive < 0.5) return;
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = w.kind === 'point' ? 'ns-resize' : 'ew-resize';
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
        if (w.kind === 'point') {
          // The voice sings the point's height while it is dragged.
          rig.singX = CONTROL_X[w.i]!;
          rig.sing = 1;
        }
        set({ dragging: true });
      }}
      onPointerMove={onMove}
      onPointerUp={(e) => {
        (e.target as unknown as Element).releasePointerCapture?.(e.pointerId);
        active.current = false;
        rig.sing = 0;
        document.body.style.cursor = hover ? (w.kind === 'point' ? 'ns-resize' : 'ew-resize') : '';
        set({ dragging: false });
      }}
    >
      {w.kind === 'point' ? (
        <mesh renderOrder={20}>
          <sphereGeometry args={[0.085, 20, 14]} />
          <meshBasicMaterial color={color} toneMapped={false} depthTest={false} />
        </mesh>
      ) : (
        <mesh renderOrder={20} rotation-z={Math.PI / 4}>
          <boxGeometry args={[0.13, 0.13, 0.02]} />
          <meshBasicMaterial color={color} toneMapped={false} depthTest={false} />
        </mesh>
      )}
      <mesh renderOrder={19}>
        <ringGeometry args={[0.13, 0.16, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.55}
          toneMapped={false}
          depthTest={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* A generous invisible hit area, for touch. */}
      <mesh>
        <sphereGeometry args={[0.32, 12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

const ALL: Which[] = [
  ...Array.from({ length: CONTROLS }, (_, i): Which => ({ kind: 'point', i })),
  { kind: 'bound', which: 'a' },
  { kind: 'bound', which: 'b' },
];

export function Handles() {
  return (
    <>
      {ALL.map((w) => (
        <Handle key={w.kind === 'point' ? `p${w.i}` : w.which} w={w} />
      ))}
    </>
  );
}
