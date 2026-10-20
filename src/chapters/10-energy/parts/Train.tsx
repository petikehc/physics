import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { trackAt, type Track } from '../math';
import { SYM10 } from '../rig';

const m = new THREE.Matrix4();
const q = new THREE.Quaternion();
const X = new THREE.Vector3();
const Y = new THREE.Vector3();
const Z = new THREE.Vector3();

/** Sets `obj` on the track `s` metres along it: its x along the track, its y out of it. */
function placeOn(obj: THREE.Object3D, track: Track, s: number) {
  const at = trackAt(track, s);
  X.set(...at.tan);
  Y.set(...at.up);
  Z.crossVectors(X, Y);
  m.makeBasis(X, Y, Z);
  q.setFromRotationMatrix(m);
  obj.quaternion.copy(q);
  obj.position.set(...at.p);
}

interface Props {
  track: Track;
  /** Where the front car is (metres along) and whether the train shows, read each frame. */
  front: () => number;
  shown: () => boolean;
  /** Whether the front car is hidden (the camera is riding in it). */
  riding?: () => boolean;
  cars?: number;
  gap?: number;
}

/**
 * A coaster train: open cars in the chapter's orange, each with two benches, riding the track one behind the other;
 * the front car carries a headlight.
 */
export function Train({ track, front, shown, riding, cars = 1, gap = 2.9 }: Props) {
  const groups = useRef<Array<THREE.Group | null>>([]);
  const body = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: SYM10.pe,
        roughness: 0.4,
        metalness: 0.25,
        emissive: SYM10.pe,
        emissiveIntensity: 0.3,
      }),
    [],
  );
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1d2028', roughness: 0.8 }), []);

  useFrame(() => {
    const on = shown();
    const s = front();
    const inside = riding?.() ?? false;
    groups.current.forEach((g, k) => {
      if (!g) return;
      g.visible = on && !(inside && k === 0);
      if (on) placeOn(g, track, s - k * gap);
    });
  });

  return (
    <group>
      {Array.from({ length: cars }, (_, k) => (
        <group key={k} ref={(el) => void (groups.current[k] = el)} visible={false}>
          {/* The car sits a little above the rails, its floor just over the spine. */}
          <group position={[0, 0.55, 0]}>
            <RoundedBox args={[2.5, 0.55, 1.5]} radius={0.12} material={body} />
            <RoundedBox args={[0.18, 0.7, 1.5]} radius={0.06} position={[1.16, 0.3, 0]} material={body} />
            {[-0.45, 0.45].map((x) => (
              <mesh key={x} position={[x, 0.42, 0]} material={dark}>
                <boxGeometry args={[0.5, 0.35, 1.3]} />
              </mesh>
            ))}
            {k === 0 ? (
              <mesh position={[1.27, 0.15, 0]} rotation-z={-Math.PI / 2}>
                <circleGeometry args={[0.16, 14]} />
                <meshBasicMaterial color="#fff3d6" toneMapped={false} />
              </mesh>
            ) : null}
          </group>
          {[-0.85, 0.85].map((x) =>
            [-0.55, 0.55].map((z) => (
              <mesh key={`${x}${z}`} position={[x, 0.12, z]} rotation-x={Math.PI / 2} material={dark}>
                <cylinderGeometry args={[0.13, 0.13, 0.12, 12]} />
              </mesh>
            )),
          )}
        </group>
      ))}
    </group>
  );
}
