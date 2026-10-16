import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { angleDelta } from '../../01-pythagoras/math';
import { easeInOutCubic, staggered } from '../../../engine/ease';
import { childPoses, discPoses, rowPoses, sectorAngle, type Pose } from '../math';
import { circleRig, DISC_THICKNESS, SLICE_COUNTS, SYM2, uv } from '../rig';
import { bronze } from './Disc';

/** A wedge of unit radius with its apex at the origin and its axis along +v, extruded upward. */
function wedgeGeometry(n: number) {
  const th = sectorAngle(n);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.absarc(0, 0, 1, Math.PI / 2 - th / 2, Math.PI / 2 + th / 2, false);
  shape.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: DISC_THICKNESS,
    bevelEnabled: false,
    curveSegments: Math.max(2, Math.ceil(96 / n)),
  });
  g.rotateX(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

// White base so the per-piece instance colours (two bronze tones) come through unchanged.
const piecesMaterial = bronze.clone();
piecesMaterial.color.set('#ffffff');
const colorA = new THREE.Color(SYM2.bronzeA);
const colorB = new THREE.Color(SYM2.bronzeB);
const dummy = new THREE.Object3D();

/** Start and end poses for the current deal, cached by (n, fromN, r). */
function usePoseCache() {
  const cache = useRef<{ key: string; from: Pose[]; to: Pose[] } | null>(null);
  return (n: number, fromN: number, r: number, explode: number) => {
    const key = `${n}:${fromN}:${r.toFixed(4)}:${explode.toFixed(4)}`;
    if (cache.current?.key !== key) {
      let from: Pose[];
      if (fromN > 0 && n % fromN === 0) from = childPoses(fromN, n, rowPoses(fromN, r));
      else {
        // Out of the disc, pushed apart along each wedge's axis by `explode`.
        from = discPoses(n).map((p) => {
          const a = p.rot + Math.PI / 2;
          return { u: p.u + Math.cos(a) * explode * r, v: p.v + Math.sin(a) * explode * r, rot: p.rot };
        });
      }
      cache.current = { key, from, to: rowPoses(n, r) };
    }
    return cache.current;
  };
}

/**
 * The slices. One instanced mesh per slice count; only the current count is shown. Each deal moves every
 * piece from its start pose (in the disc, or inside its parent in the previous row) to its place in the row.
 */
export function Pieces() {
  const rig = circleRig();
  const poses = usePoseCache();

  const meshes = useMemo(() => {
    const map = new Map<number, THREE.InstancedMesh>();
    for (const n of SLICE_COUNTS) {
      const mesh = new THREE.InstancedMesh(wedgeGeometry(n), piecesMaterial, n);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      mesh.visible = false;
      for (let j = 0; j < n; j++) mesh.setColorAt(j, j % 2 === 0 ? colorA : colorB);
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      map.set(n, mesh);
    }
    return map;
  }, []);

  useEffect(
    () => () => {
      for (const m of meshes.values()) {
        m.geometry.dispose();
        m.dispose();
      }
    },
    [meshes],
  );

  useFrame(() => {
    const n = rig.n;
    const show = rig.disc > 0.001 && rig.whole < 0.5;
    for (const [count, mesh] of meshes) mesh.visible = show && count === n;
    const mesh = meshes.get(n);
    if (!mesh || !show) return;

    const r = rig.r;
    const { from, to } = poses(n, rig.fromN, r, rig.explode);
    // Spread the start times across about half the deal, so the pieces travel in a wave.
    const stagger = n > 1 ? Math.min(0.5 / (n - 1), 0.08) : 0;
    const sink = -rig.piecesSink * DISC_THICKNESS * 1.6;
    for (let j = 0; j < n; j++) {
      const a = from[j]!;
      const b = to[j]!;
      const q = staggered(rig.deal, j, n, stagger);
      const e = easeInOutCubic(q);
      const u = a.u + (b.u - a.u) * e;
      const v = a.v + (b.v - a.v) * e;
      const rot = a.rot + angleDelta(a.rot, b.rot) * e;
      const y = 0.008 + Math.sin(Math.PI * q) * rig.lift + sink;
      dummy.position.set(...uv(u, v, y));
      dummy.rotation.set(0, rot, 0);
      dummy.scale.set(r, 1, r);
      dummy.updateMatrix();
      mesh.setMatrixAt(j, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {[...meshes.values()].map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
    </>
  );
}
