import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { clamp01 } from '../../../engine/ease';
import { dopplerRig, LANE, source, SYM9 } from '../rig';

/** How often the beacons flash (each side lights in turn), per second of the source's own clock. */
const FLASH = 2.6;

/**
 * The ambulance: a white box van facing along +x, with a red stripe, a blue light bar flashing side to side, and its
 * headlights and blue flashes thrown on the road around it.
 */
export function Ambulance() {
  const rig = dopplerRig();
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const spill = useRef<THREE.MeshBasicMaterial>(null);
  const beam = useRef<THREE.MeshBasicMaterial>(null);
  const pool = useMemo(() => {
    const n = 64;
    const data = new Uint8Array(n * n * 4);
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const r = Math.hypot(i - n / 2 + 0.5, j - n / 2 + 0.5) / (n / 2);
        const a = Math.max(0, 1 - r);
        const k = (j * n + i) * 4;
        data[k] = data[k + 1] = data[k + 2] = Math.round(255 * a * a);
        data[k + 3] = 255;
      }
    const t = new THREE.DataTexture(data, n, n);
    t.needsUpdate = true;
    return t;
  }, []);
  const beacons = useMemo(
    () => [0, 1].map(() => new THREE.MeshBasicMaterial({ color: SYM9.blue, toneMapped: false })),
    [],
  );
  const white = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e7e8ec', roughness: 0.45 }), []);
  const glass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0b0f18', roughness: 0.15, metalness: 0.6 }),
    [],
  );
  const tyre = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111216', roughness: 0.9 }), []);

  useFrame(() => {
    const on = clamp01(rig.ambulance);
    const g = group.current;
    if (!g) return;
    g.visible = on > 0.01 && rig.kind < 0.5;
    if (!g.visible) {
      if (light.current) light.current.intensity = 0;
      return;
    }
    const s = source(rig);
    g.position.set(s.at[0], 0, LANE);
    // Side to side: one beacon, then the other, each a short double flash.
    const phase = (s.now * FLASH) % 1;
    const a = phase < 0.5 ? (phase % 0.25 < 0.14 ? 1 : 0.15) : 0.15;
    const b = phase >= 0.5 ? (phase % 0.25 < 0.14 ? 1 : 0.15) : 0.15;
    beacons[0]!.color.set(SYM9.blue).multiplyScalar(0.4 + 3.2 * a);
    beacons[1]!.color.set(SYM9.blue).multiplyScalar(0.4 + 3.2 * b);
    const flash = Math.max(a, b);
    if (light.current) light.current.intensity = 26 * flash * on;
    if (spill.current) spill.current.opacity = 0.32 * flash * on;
    if (beam.current) beam.current.opacity = 0.5 * on;
  });

  return (
    <group ref={group} visible={false}>
      {/* The box, the cab, and the stripes along both sides. */}
      <RoundedBox args={[3.7, 2.35, 2.2]} radius={0.12} position={[-0.85, 1.73, 0]} material={white} />
      <RoundedBox args={[1.9, 1.65, 2.1]} radius={0.14} position={[1.95, 1.38, 0]} material={white} />
      <mesh position={[0.1, 1.25, 0]}>
        <boxGeometry args={[5.62, 0.26, 2.24]} />
        <meshStandardMaterial color="#d23a31" roughness={0.5} />
      </mesh>
      <mesh position={[0.1, 1.54, 0]}>
        <boxGeometry args={[5.62, 0.08, 2.24]} />
        <meshStandardMaterial color="#2c5bd8" roughness={0.5} />
      </mesh>
      {/* Windscreen and side windows. */}
      <mesh position={[2.91, 1.72, 0]} material={glass}>
        <boxGeometry args={[0.04, 0.62, 1.86]} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[2.05, 1.76, side * 1.06]} material={glass}>
          <boxGeometry args={[1.1, 0.5, 0.02]} />
        </mesh>
      ))}
      {/* The light bar on the cab, and beacons at the back corners. */}
      {[1, -1].map((side, i) => (
        <mesh key={side} position={[1.9, 2.29, side * 0.45]} material={beacons[i]}>
          <boxGeometry args={[0.42, 0.16, 0.78]} />
        </mesh>
      ))}
      {[1, -1].map((side, i) => (
        <mesh key={side} position={[-2.55, 2.96, side * 0.92]} material={beacons[i]}>
          <boxGeometry args={[0.18, 0.12, 0.18]} />
        </mesh>
      ))}
      {/* Headlights and tail lights. */}
      {[1, -1].map((side) => (
        <mesh key={side} position={[2.92, 0.92, side * 0.76]}>
          <boxGeometry args={[0.04, 0.2, 0.34]} />
          <meshBasicMaterial color="#fff6e0" toneMapped={false} />
        </mesh>
      ))}
      {[1, -1].map((side) => (
        <mesh key={side} position={[-2.72, 1.0, side * 0.9]}>
          <boxGeometry args={[0.04, 0.3, 0.2]} />
          <meshBasicMaterial color="#ff3020" toneMapped={false} />
        </mesh>
      ))}
      {[
        [1.95, 1],
        [1.95, -1],
        [-1.75, 1],
        [-1.75, -1],
      ].map(([x, side]) => (
        <mesh
          key={`${x}${side}`}
          position={[x!, 0.42, side! * 0.98]}
          rotation-x={Math.PI / 2}
          material={tyre}
        >
          <cylinderGeometry args={[0.42, 0.42, 0.3, 18]} />
        </mesh>
      ))}
      {/* Its headlights on the road ahead, and the blue flashes all round it. */}
      <mesh rotation-x={-Math.PI / 2} position={[8.5, 0.03, 0]} scale={[12, 3.4, 1]} renderOrder={3}>
        <planeGeometry />
        <meshBasicMaterial
          ref={beam}
          color="#fff1d0"
          alphaMap={pool}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.2, 0]} scale={[16, 16, 1]} renderOrder={3}>
        <planeGeometry />
        <meshBasicMaterial
          ref={spill}
          color={SYM9.blue}
          alphaMap={pool}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight
        ref={light}
        position={[1.9, 3.1, 0]}
        color={SYM9.blue}
        intensity={0}
        distance={22}
        decay={2}
      />
    </group>
  );
}
