import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { clamp01 } from '../../../engine/ease';
import { epicycle } from '../math';
import { EPI, eulerRig, onPlane, SYM7 } from '../rig';
import { Arrow } from './Arrow';
import { aim } from './aim';

const N = 600;
const RING = 64;

/**
 * The handoff: a smaller arrow on the tip of the point's, turning three times as fast the other way. Its own circle
 * rides round on the first, and its tip draws a new shape, a rounded square: circles on circles, chapter 8's idea.
 */
export function Epicycle() {
  const rig = eulerRig();
  const arrow = useRef<THREE.Group | null>(null);
  const tip = useRef<THREE.Mesh>(null);
  const ring = useRef<ChalkLineHandle | null>(null);
  const trace = useRef<ChalkLineHandle | null>(null);
  const ringPts = useMemo<Pts>(() => Array.from({ length: RING + 1 }, () => [0, 0, 0]), []);
  const tracePts = useMemo<Pts>(() => Array.from({ length: N + 1 }, () => [0, 0, 0]), []);

  useFrame(() => {
    const on = clamp01(rig.epicycle);
    const th = rig.theta;
    const r = EPI.r * on;
    const p = onPlane(Math.cos(th), Math.sin(th));
    const [qx, qy] = epicycle(th, r, EPI.k, EPI.phase);
    const q = onPlane(qx, qy);
    p[2] += 0.03;
    q[2] += 0.03;
    aim(arrow.current, p, q, on, 0.014);
    if (tip.current) {
      tip.current.visible = on > 0.01;
      tip.current.position.set(...q);
    }
    for (let i = 0; i <= RING; i++) {
      const a = (i / RING) * Math.PI * 2;
      const w = onPlane(Math.cos(th) + r * Math.cos(a), Math.sin(th) + r * Math.sin(a));
      ringPts[i]![0] = w[0];
      ringPts[i]![1] = w[1];
      ringPts[i]![2] = w[2] + 0.02;
    }
    ring.current?.set(ringPts, 1, on * 0.45);

    // The tip's path, from where it started drawing to where it is.
    const span = th - rig.from;
    for (let i = 0; i <= N; i++) {
      const t = rig.from + (i / N) * span;
      const [x, y] = epicycle(t, EPI.r, EPI.k, EPI.phase);
      const w = onPlane(x, y);
      tracePts[i]![0] = w[0];
      tracePts[i]![1] = w[1];
      tracePts[i]![2] = w[2] + 0.025;
    }
    trace.current?.set(tracePts, 1, span > 1e-3 ? clamp01(rig.trace) : 0);
  });

  return (
    <group>
      <ChalkLine handle={ring} color={SYM7.small} width={1.4} renderOrder={9} />
      <ChalkLine handle={trace} color={SYM7.small} width={3} renderOrder={10} />
      <Arrow arrow={(el) => void (arrow.current = el)} color={SYM7.small} renderOrder={11} />
      <mesh ref={tip} visible={false} renderOrder={12}>
        <sphereGeometry args={[0.05, 14, 10]} />
        <meshBasicMaterial color={SYM7.small} toneMapped={false} />
      </mesh>
    </group>
  );
}
