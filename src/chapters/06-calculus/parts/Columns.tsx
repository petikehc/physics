import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01, easeInOutCubic, easeOutCubic, lerp, smooth, staggered } from '../../../engine/ease';
import { areaTo, heightAt, X_MAX } from '../math';
import {
  areaScale,
  calculusRig,
  columnCount,
  COLUMN_DEPTH,
  onA,
  rigCurve,
  SX,
  SY,
  SYM6,
  WALL_A,
} from '../rig';

/** The most columns ever drawn: 256 of them, each split in two. */
const MAX = 512;
const unit = new THREE.BoxGeometry(1, 1, 1);
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const AMBER = new THREE.Color(SYM6.area);
const PICKED = new THREE.Color('#ffe2a6');
const fmt = (v: number) => v.toFixed(2);

/** The gap left between neighbouring columns `slot` wide (world units). */
const gapFor = (slot: number) => Math.min(0.05, slot * 0.14);

/**
 * The area under the curve, filled with columns (each as tall as the curve at its middle) that rise from the floor
 * and split in two, again and again, closing in on the area. Then each swings up onto the area's wall and lands on
 * top of the ones before it, as a step: a stair climbing by each column's area, whose top is the area so far.
 */
export function Columns() {
  const rig = calculusRig();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const runLine = useRef<ChalkLineHandle | null>(null);
  const riseLine = useRef<ChalkLineHandle | null>(null);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const said = useRef('');
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: new THREE.Color(SYM6.area).multiplyScalar(0.28),
        roughness: 0.55,
        metalness: 0.05,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    [],
  );
  const heights = useMemo(() => new Float32Array(MAX), []);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const c = rigCurve(rig);
    const sa = areaScale(c);
    const { n, frac } = columnCount(rig.split);
    const kids = 2 * n;
    const w = X_MAX / kids;
    const rising = clamp01(rig.columns);
    const shown = rising > 0.001 && rig.blocks > 0.001;
    m.visible = shown;
    mat.opacity = 0.85 * clamp01(rig.blocks);

    // Each column of n splits into two, in a wave from left to right: its halves grow (or shrink) to the curve's
    // height at their own middles.
    let total = 0;
    for (let j = 0; j < kids; j++) {
      const parent = heightAt(c, ((j >> 1) + 0.5) * 2 * w);
      const own = heightAt(c, (j + 0.5) * w);
      const s = smooth((frac - (j / kids) * 0.6) / 0.4);
      heights[j] = lerp(parent, own, s);
      total += heights[j]! * w;
    }
    const gapParent = gapFor(2 * w * SX);
    const gapKid = gapFor(w * SX);
    const stagger = 0.5 / n;
    let before = 0;
    const picked = Math.round(rig.step);
    for (let j = 0; j < kids; j++) {
      const h = heights[j]!;
      const p = j >> 1;
      const s = smooth((frac - (j / kids) * 0.6) / 0.4);
      // Halves of one column touch until it splits; every column keeps a gap to its neighbours.
      const outer = lerp(gapParent / 2, gapKid / 2, s);
      const inner = lerp(0, gapKid / 2, s);
      const [gl, gr] = j % 2 === 0 ? [outer, inner] : [inner, outer];
      const x0 = j * w * SX + gl;
      const x1 = (j + 1) * w * SX - gr;
      const up = easeOutCubic(staggered(rising, p, n, stagger));
      // On the curve's wall: from the floor up to its height. On the area's wall: a step, as tall as its area,
      // standing on all the steps before it.
      const fall = { bottom: 0, height: h * SY * up, z: 0 };
      const step = { bottom: WALL_A.y + before * sa, height: h * w * sa, z: WALL_A.z };
      const k = easeInOutCubic(staggered(clamp01(rig.stack), p, n, stagger));
      const height = Math.max(lerp(fall.height, step.height, k), 1e-4);
      const bottom = lerp(fall.bottom, step.bottom, k) + Math.sin(Math.PI * k) * 0.9;
      _p.set((x0 + x1) / 2, bottom + height / 2, lerp(fall.z, step.z, k));
      // Leaning back as it flies up.
      _q.setFromEuler(_e.set(-Math.sin(Math.PI * k) * 0.45, 0, 0));
      _s.set(Math.max(x1 - x0, 1e-4), height, COLUMN_DEPTH);
      m.setMatrixAt(j, _m.compose(_p, _q, _s));
      m.setColorAt(j, rig.rise > 0.01 && p === picked && k > 0.99 ? PICKED : AMBER);
      before += h * w;
    }
    for (let j = kids; j < MAX; j++) m.setMatrixAt(j, _m.makeScale(0, 0, 0));
    m.count = kids;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;

    // One step picked out (on the stair of n steps): its run, Δx, and its rise, a column's area.
    const r = clamp01(rig.rise);
    const run = X_MAX / n;
    const sx0 = picked * run;
    let below = 0;
    for (let j = 0; j < 2 * picked; j++) below += heights[j]! * w;
    const climb = (heights[2 * picked]! + heights[2 * picked + 1]!) * w;
    const z = 0.14;
    runLine.current?.set([onA(sx0, below, sa, z), onA(sx0 + run, below, sa, z)], r, r);
    riseLine.current?.set(
      [onA(sx0 + run, below, sa, z), onA(sx0 + run, below + climb, sa, z)],
      clamp01(r * 2 - 0.4),
      r,
    );

    // The columns' total beside the exact area; and the step's run and rise.
    const count = frac > 0.5 ? kids : n;
    const text = `${count} columns: ${fmt(total)}<br>area: ${fmt(areaTo(c, X_MAX))}`;
    const [tTotal, tRun, tRise] = texts.current;
    if (tTotal && text !== said.current) {
      said.current = text;
      tTotal.innerHTML = text;
    }
    const place: Array<[[number, number, number], number, number, number]> = [
      [[(X_MAX * SX) / 2, 0, COLUMN_DEPTH], 0, -1, clamp01(rig.total) * (shown ? 1 : 0)],
      [onA(sx0 + run / 2, below, sa, z), 0, -1, r],
      [onA(sx0 + run, below + climb / 2, sa, z), 1, 0, clamp01(r * 2 - 0.6)],
    ];
    place.forEach(([pos, dx, dy, show], i) => {
      labels.current[i]?.position.set(...pos);
      const el = [tTotal, tRun, tRise][i];
      if (!el) return;
      el.style.opacity = String(show);
      beside(el, dx, dy, 10);
    });
  });

  return (
    <group>
      <instancedMesh
        ref={mesh}
        args={[unit, mat, MAX]}
        frustumCulled={false}
        visible={false}
        renderOrder={1}
      />
      <ChalkLine handle={runLine} color={SYM6.axis} width={2.2} renderOrder={8} depthTest={false} />
      <ChalkLine handle={riseLine} color={SYM6.area} width={2.8} renderOrder={8} depthTest={false} />
      {[
        ['', SYM6.area, 'math-label math-label--small math-label--stack'],
        ['run: Δx', SYM6.axis, 'math-label math-label--small'],
        ['rise: f × Δx', SYM6.area, 'math-label math-label--small'],
      ].map(([text, color, cls], i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel ref={(el) => void (texts.current[i] = el)} className={cls} color={color}>
            {text}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
