import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01, lerp } from '../../../engine/ease';
import { G, heightAt, X_MAX } from '../math';
import { calculusRig, onF, rigCurve, SX, SY, SYM6 } from '../rig';

/** Points along the curve. */
const N = 160;
/** The ribbon's depth: the curve drawn as a band standing out of its wall. */
const RIBBON = 0.3;
/** The apple's first second, cut at every quarter. */
const CUTS = [1, 2, 3];

/** A strip of quads, `cols` + 1 pairs of vertices, positions written every frame. */
function strip(cols: number) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((cols + 1) * 6), 3));
  const index: number[] = [];
  for (let i = 0; i < cols; i++) {
    const a = 2 * i;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  g.setIndex(index);
  return g;
}

/**
 * The curve f on its wall, drawn as a glowing band; the area under it, filled in amber (between a and b once those
 * are set); and, for the falling apple, its speed's triangle cut at every quarter second into strips 1, 3, 5, 7.
 */
export function Curve() {
  const rig = calculusRig();
  const line = useRef<ChalkLineHandle | null>(null);
  const cuts = useMemo(() => CUTS.map(() => ({ current: null as ChalkLineHandle | null })), []);
  const ribbonGeo = useMemo(() => strip(N), []);
  const fillGeo = useMemo(() => strip(N), []);
  const ribbon = useRef<THREE.Mesh>(null);
  const fill = useRef<THREE.Mesh>(null);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const ribbonMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: SYM6.f,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [],
  );
  const fillMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: SYM6.area,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [],
  );
  const pts = useMemo<Pts>(() => Array.from({ length: N + 1 }, () => [0, 0, 0]), []);

  useFrame(() => {
    const c = rigCurve(rig);
    const drawn = clamp01(rig.curve);

    // The curve, and a band along it standing out of the wall.
    const rib = ribbonGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * X_MAX;
      const y = heightAt(c, x);
      pts[i]![0] = x * SX;
      pts[i]![1] = y * SY;
      pts[i]![2] = 0.02;
      // The band only reaches as far as the line is drawn.
      const xb = Math.min(x, X_MAX * drawn);
      const yb = heightAt(c, xb);
      rib.setXYZ(2 * i, xb * SX, yb * SY, -RIBBON / 2);
      rib.setXYZ(2 * i + 1, xb * SX, yb * SY, RIBBON / 2);
    }
    rib.needsUpdate = true;
    line.current?.set(pts, drawn, drawn > 0 ? 1 : 0);
    ribbonMat.opacity = 0.22 * Math.min(1, drawn * 4);
    if (ribbon.current) ribbon.current.visible = drawn > 0.001;

    // The area under it: all of it, or from a to b.
    const bounds = clamp01(rig.bounds);
    const lo = lerp(0, Math.min(rig.a, rig.b), bounds);
    const hi = lerp(X_MAX, Math.max(rig.a, rig.b), bounds);
    const area = Math.max(clamp01(rig.area), bounds);
    const fp = fillGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i <= N; i++) {
      const x = lerp(lo, hi, i / N);
      const y = heightAt(c, x);
      fp.setXYZ(2 * i, x * SX, 0, 0.01);
      fp.setXYZ(2 * i + 1, x * SX, y * SY, 0.01);
    }
    fp.needsUpdate = true;
    fillMat.opacity = 0.32 * area;
    if (fill.current) fill.current.visible = area > 0.001;

    // The apple's triangle, cut at each quarter second: strips of 1, 3, 5, 7.
    const cut = clamp01(rig.strips);
    CUTS.forEach((x, i) =>
      cuts[i]!.current?.set(
        [
          [x * SX, 0, 0.03],
          [x * SX, heightAt(c, x) * SY, 0.03],
        ],
        cut,
        0.8 * cut,
      ),
    );
    const apple = (1 - clamp01(rig.words)) * drawn;
    const at: Array<[number, number, number, number, number, number]> = [
      // The strips' numbers, inside each.
      ...[0, 1, 2, 3].map((k): [number, number, number, number, number, number] => {
        const x = k + 0.5;
        return [...onF(x, heightAt(c, x) * 0.42, 0.04), 0, 0, clamp01((cut - 0.35) * 1.6)];
      }),
      // Its distance fallen (until it is cut up), its speed at the end, and the end of its first second.
      [...onF(3.05, 1.25, 0.04), 0, 0, clamp01(area * 2 - 1) * (1 - clamp01(cut * 3)) * apple],
      [...onF(X_MAX, heightAt(c, X_MAX), 0.04), -0.6, 1, apple],
      [...onF(X_MAX, 0, 0.04), 0, -1, apple],
    ];
    at.forEach(([x, y, z, dx, dy, show], i) => {
      labels.current[i]?.position.set(x, y, z);
      const el = texts.current[i];
      if (!el) return;
      el.style.opacity = String(show);
      if (dx || dy) beside(el, dx, dy, 8);
    });
  });

  const words: Array<[string, string, string]> = [
    ['1', SYM6.area, 'math-label math-label--small'],
    ['3', SYM6.area, 'math-label math-label--small'],
    ['5', SYM6.area, 'math-label math-label--small'],
    ['7', SYM6.area, 'math-label math-label--small'],
    [`${(G / 2).toFixed(1)} m fallen`, SYM6.area, 'math-label math-label--chip'],
    [`${G.toFixed(1)} m/s`, SYM6.f, 'math-label math-label--small'],
    ['1 s', SYM6.axis, 'math-label math-label--small'],
  ];

  return (
    <group>
      <mesh ref={fill} geometry={fillGeo} material={fillMat} visible={false} renderOrder={2} />
      <mesh ref={ribbon} geometry={ribbonGeo} material={ribbonMat} visible={false} renderOrder={3} />
      <ChalkLine handle={line} color={SYM6.f} width={3} renderOrder={6} />
      {cuts.map((h, i) => (
        <ChalkLine key={i} handle={h} color={SYM6.axis} width={1.4} renderOrder={6} />
      ))}
      {words.map(([text, color, cls], i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel ref={(el) => void (texts.current[i] = el)} className={cls} color={color}>
            {text}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
