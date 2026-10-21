import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp01 } from '../../../engine/ease';
import type { Track, V3 } from '../math';
import { SYM10 } from '../rig';

/** Half the gap between the rails. */
const GAUGE = 0.55;

const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/** A curve through track points offset `side` metres to the side and `lift` metres up (or down) from the track. */
function offsetCurve(track: Track, side: number, lift: number, every: number): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < track.pts.length; i += every) {
    const p = track.pts[i]!;
    const u = track.up[i]!;
    const l = cross(track.tan[i]!, u);
    pts.push(
      new THREE.Vector3(
        p[0] + l[0] * side + u[0] * lift,
        p[1] + l[1] * side + u[1] * lift,
        p[2] + l[2] * side + u[2] * lift,
      ),
    );
  }
  const last = track.pts.length - 1;
  if (last % every !== 0) {
    const p = track.pts[last]!;
    const u = track.up[last]!;
    const l = cross(track.tan[last]!, u);
    pts.push(
      new THREE.Vector3(
        p[0] + l[0] * side + u[0] * lift,
        p[1] + l[1] * side + u[1] * lift,
        p[2] + l[2] * side + u[2] * lift,
      ),
    );
  }
  return new THREE.CatmullRomCurve3(pts);
}

/** The basis that turns a car or a tie to sit on the track at sample i: x along it, y up from it, z to its side. */
function frameAt(track: Track, i: number, m: THREE.Matrix4): THREE.Matrix4 {
  const t = track.tan[i]!;
  const u = track.up[i]!;
  const l = cross(t, u);
  return m.makeBasis(new THREE.Vector3(...t), new THREE.Vector3(...u), new THREE.Vector3(...l));
}

interface Props {
  track: Track;
  /** Steel's colour; whether it stands on columns and carries bulbs. */
  color?: string;
  supports?: boolean;
  bulbs?: boolean;
  /** How lit the bulbs are, 0..1 (read each frame). */
  lit?: () => number;
  /** Rails as thick as this (the test track's are lighter). */
  rail?: number;
}

/**
 * A coaster track: two rails on a spine, cross-ties every metre, columns down to the ground, and fairground bulbs
 * along both sides that chase each other along the track.
 */
export function TrackModel({
  track,
  color = '#c9ccd4',
  supports = true,
  bulbs = false,
  lit,
  rail = 0.09,
}: Props) {
  const geo = useMemo(() => {
    const every = Math.max(1, Math.round(1 / track.step));
    const segs = Math.round(track.length * 1.5);
    return {
      left: new THREE.TubeGeometry(offsetCurve(track, GAUGE, 0, every), segs, rail, 6, false),
      right: new THREE.TubeGeometry(offsetCurve(track, -GAUGE, 0, every), segs, rail, 6, false),
      spine: new THREE.TubeGeometry(offsetCurve(track, 0, -0.42, every), segs, rail * 2.4, 8, false),
    };
  }, [track, rail]);
  useLayoutEffect(
    () => () => {
      geo.left.dispose();
      geo.right.dispose();
      geo.spine.dispose();
    },
    [geo],
  );

  // Ties every metre; columns every few metres where the track is the right way up and off the ground; bulbs every
  // 1.6 m on both sides.
  const plan = useMemo(() => {
    const tieEvery = Math.max(1, Math.round(1.1 / track.step));
    const ties: number[] = [];
    for (let i = 0; i < track.pts.length; i += tieEvery) ties.push(i);
    const cols: number[] = [];
    if (supports) {
      const colEvery = Math.max(1, Math.round(4.5 / track.step));
      for (let i = 0; i < track.pts.length; i += colEvery)
        if (track.up[i]![1] > 0.75 && track.pts[i]![1] > 2.2) cols.push(i);
    }
    const lamps: number[] = [];
    if (bulbs) {
      const bulbEvery = Math.max(1, Math.round(1.6 / track.step));
      for (let i = 0; i < track.pts.length; i += bulbEvery) lamps.push(i);
    }
    return { ties, cols, lamps };
  }, [track, supports, bulbs]);

  const ties = useRef<THREE.InstancedMesh>(null);
  const cols = useRef<THREE.InstancedMesh>(null);
  const lamps = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const s = new THREE.Matrix4();
    plan.ties.forEach((i, k) => {
      const p = track.pts[i]!;
      const u = track.up[i]!;
      frameAt(track, i, m).setPosition(p[0] - u[0] * 0.2, p[1] - u[1] * 0.2, p[2] - u[2] * 0.2);
      ties.current?.setMatrixAt(k, m);
    });
    if (ties.current) ties.current.instanceMatrix.needsUpdate = true;
    plan.cols.forEach((i, k) => {
      const p = track.pts[i]!;
      const h = Math.max(p[1] - 0.6, 0.1);
      m.makeTranslation(p[0], h / 2, p[2]);
      s.makeScale(1, h, 1);
      cols.current?.setMatrixAt(k, m.multiply(s));
    });
    if (cols.current) cols.current.instanceMatrix.needsUpdate = true;
    plan.lamps.forEach((i, k) => {
      const p = track.pts[i]!;
      const u = track.up[i]!;
      const l = cross(track.tan[i]!, u);
      const side = k % 2 === 0 ? 1 : -1;
      const o = GAUGE + 0.18;
      m.makeTranslation(
        p[0] + l[0] * o * side + u[0] * 0.05,
        p[1] + l[1] * o * side + u[1] * 0.05,
        p[2] + l[2] * o * side + u[2] * 0.05,
      );
      lamps.current?.setMatrixAt(k, m);
      // Colours from the start, so the material is built to read them.
      lamps.current?.setColorAt(k, new THREE.Color(SYM10.bulb));
    });
    if (lamps.current) lamps.current.instanceMatrix.needsUpdate = true;
  }, [track, plan]);

  const colour = useMemo(() => new THREE.Color(), []);
  const bulb = useMemo(() => new THREE.Color(SYM10.bulb), []);
  useFrame((state) => {
    const mesh = lamps.current;
    if (!mesh || plan.lamps.length === 0) return;
    const on = clamp01(lit?.() ?? 1);
    mesh.visible = on > 0.01;
    // Lights chasing along the track, a bright run every eighth bulb.
    const t = state.clock.elapsedTime * 6;
    for (let k = 0; k < plan.lamps.length; k++) {
      const chase = (((k - t) % 8) + 8) % 8 < 1.2 ? 1 : 0.32;
      mesh.setColorAt(k, colour.copy(bulb).multiplyScalar((0.2 + 2.4 * chase) * on));
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* The steel catches the fairground's lights: drawn a little self-lit, so it reads against the night. */}
      <mesh geometry={geo.left}>
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={0.6}
          emissive={color}
          emissiveIntensity={0.32}
        />
      </mesh>
      <mesh geometry={geo.right}>
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={0.6}
          emissive={color}
          emissiveIntensity={0.32}
        />
      </mesh>
      <mesh geometry={geo.spine}>
        <meshStandardMaterial
          color="#5a6070"
          roughness={0.5}
          metalness={0.5}
          emissive="#5a6070"
          emissiveIntensity={0.22}
        />
      </mesh>
      <instancedMesh ref={ties} args={[undefined, undefined, plan.ties.length]} frustumCulled={false}>
        <boxGeometry args={[0.16, 0.12, GAUGE * 2.3]} />
        <meshStandardMaterial
          color="#6a707e"
          roughness={0.6}
          metalness={0.4}
          emissive="#6a707e"
          emissiveIntensity={0.18}
        />
      </instancedMesh>
      {plan.cols.length > 0 ? (
        <instancedMesh ref={cols} args={[undefined, undefined, plan.cols.length]} frustumCulled={false}>
          <cylinderGeometry args={[0.16, 0.22, 1, 8]} />
          <meshStandardMaterial
            color="#5a6070"
            roughness={0.6}
            metalness={0.4}
            emissive="#5a6070"
            emissiveIntensity={0.15}
          />
        </instancedMesh>
      ) : null}
      {plan.lamps.length > 0 ? (
        <instancedMesh ref={lamps} args={[undefined, undefined, plan.lamps.length]} frustumCulled={false}>
          <sphereGeometry args={[0.08, 8, 6]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </instancedMesh>
      ) : null}
    </group>
  );
}
