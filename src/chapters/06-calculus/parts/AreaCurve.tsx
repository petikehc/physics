import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01 } from '../../../engine/ease';
import { areaTo, heightAt, X_MAX } from '../math';
import { areaScale, calculusRig, onA, onF, rigCurve, SX, SYM6 } from '../rig';

const N = 160;
/** How far each way the probe's tangent reaches (world units across). */
const REACH = 0.75;
const fmt = (v: number) => v.toFixed(2);

type LineRef = { current: ChalkLineHandle | null };

/**
 * The area so far, A(x), drawn smoothly on its wall; the probe that sets the curve's height at x beside the slope of
 * A there (always the same number); and the bounds a and b, with the area between them under the curve and how far A
 * climbs between them (the same again).
 */
export function AreaCurve() {
  const rig = calculusRig();
  const curveLine = useRef<ChalkLineHandle | null>(null);
  const lines = useMemo<LineRef[]>(() => Array.from({ length: 7 }, () => ({ current: null })), []);
  const dots = useRef<Array<THREE.Mesh | null>>([]);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const said = useRef<string[]>([]);
  const pts = useMemo<Pts>(() => Array.from({ length: N + 1 }, () => [0, 0, 0]), []);

  useFrame(() => {
    const c = rigCurve(rig);
    const sa = areaScale(c);
    const drawn = clamp01(rig.areaCurve);
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * X_MAX;
      const p = onA(x, areaTo(c, x), sa, 0.04);
      pts[i]![0] = p[0];
      pts[i]![1] = p[1];
      pts[i]![2] = p[2];
    }
    curveLine.current?.set(pts, drawn, drawn > 0 ? 1 : 0);

    // The probe: the curve's height at x, and the slope of A at x (the same number).
    const pr = clamp01(rig.probe);
    const x = Math.min(Math.max(rig.probeX, 0), X_MAX);
    const h = heightAt(c, x);
    const fPt = onF(x, h, 0.05);
    const aPt = onA(x, areaTo(c, x), sa, 0.05);
    const slope = (h * sa) / SX;
    const [bar, tangent, link, guideA, guideB, level, climb] = lines;
    bar!.current?.set([onF(x, 0, 0.05), fPt], 1, pr);
    tangent!.current?.set(
      [
        [aPt[0] - REACH, aPt[1] - REACH * slope, aPt[2]],
        [aPt[0] + REACH, aPt[1] + REACH * slope, aPt[2]],
      ],
      1,
      pr,
    );
    link!.current?.set([fPt, aPt], 1, pr * 0.35);

    // The bounds: guides up from a and b to the curve, and on A's wall the climb from A(a) to A(b).
    const bd = clamp01(rig.bounds);
    const [a, b] = [Math.min(rig.a, rig.b), Math.max(rig.a, rig.b)];
    const Aa = areaTo(c, a);
    const Ab = areaTo(c, b);
    guideA!.current?.set([onF(a, 0, 0.05), onF(a, heightAt(c, a), 0.05)], 1, bd * 0.8);
    guideB!.current?.set([onF(b, 0, 0.05), onF(b, heightAt(c, b), 0.05)], 1, bd * 0.8);
    level!.current?.set([onA(a, Aa, sa, 0.05), onA(b, Aa, sa, 0.05)], 1, bd * 0.5);
    climb!.current?.set([onA(b, Aa, sa, 0.06), onA(b, Ab, sa, 0.06)], 1, bd);

    const dotAt: Array<[[number, number, number], number]> = [
      [fPt, pr],
      [aPt, pr],
      [onA(a, Aa, sa, 0.06), bd],
      [onA(b, Ab, sa, 0.06), bd],
    ];
    dotAt.forEach(([p, on], i) => {
      const d = dots.current[i];
      if (!d) return;
      d.visible = on > 0.01;
      d.position.set(...p);
    });

    // Words: the height and the slope; a and b; the area between them, and the climb.
    const area = Ab - Aa;
    const words = [
      `height: ${fmt(h)}`,
      `slope: ${fmt(h)}`,
      'a',
      'b',
      `area: ${fmt(area)}`,
      `climb: ${fmt(area)}`,
    ];
    const mid = (a + b) / 2;
    // The probe's words go on whichever side has more room.
    const side = x > X_MAX / 2 ? -1 : 1;
    const end: [number, number, number] = [aPt[0] + side * REACH, aPt[1] + side * REACH * slope, aPt[2]];
    const place: Array<[[number, number, number], number, number, number]> = [
      [fPt, side, 0.4, pr],
      [end, side, 0, pr],
      [onF(a, 0, 0.05), 0, -1, bd],
      [onF(b, 0, 0.05), 0, -1, bd],
      [onF(mid, heightAt(c, mid) * 0.45, 0.06), 0, 0, bd],
      [onA(b, (Aa + Ab) / 2, sa, 0.06), 1, 0, bd],
    ];
    place.forEach(([p, dx, dy, show], i) => {
      labels.current[i]?.position.set(...p);
      const el = texts.current[i];
      if (!el) return;
      if (said.current[i] !== words[i]) {
        said.current[i] = words[i]!;
        el.textContent = words[i]!;
      }
      el.style.opacity = String(show);
      if (dx || dy) beside(el, dx, dy, 10);
    });
  });

  const colors = [SYM6.f, SYM6.f, SYM6.axis, SYM6.axis, SYM6.area, SYM6.area];
  const classes = [
    'math-label math-label--small',
    'math-label math-label--small',
    'math-label',
    'math-label',
    'math-label math-label--chip',
    'math-label math-label--small',
  ];

  return (
    <group>
      <ChalkLine handle={curveLine} color={SYM6.area} width={3} renderOrder={7} />
      {lines.map((h, i) => (
        <ChalkLine
          key={i}
          handle={h}
          color={[SYM6.f, SYM6.f, SYM6.axis, SYM6.axis, SYM6.axis, SYM6.axis, SYM6.area][i]}
          width={[2.6, 2.6, 1.4, 1.4, 1.4, 1.4, 3.4][i]}
          renderOrder={9}
          depthTest={false}
        />
      ))}
      {[SYM6.f, SYM6.area, SYM6.area, SYM6.area].map((color, i) => (
        <mesh key={i} ref={(el) => void (dots.current[i] = el)} visible={false} renderOrder={10}>
          <sphereGeometry args={[0.055, 16, 12]} />
          <meshBasicMaterial color={color} toneMapped={false} depthTest={false} />
        </mesh>
      ))}
      {colors.map((color, i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel ref={(el) => void (texts.current[i] = el)} className={classes[i]} color={color} />
        </group>
      ))}
    </group>
  );
}
