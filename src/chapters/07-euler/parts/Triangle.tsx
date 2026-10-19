import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01 } from '../../../engine/ease';
import { eulerRig, K, onPlane, SYM7 } from '../rig';

const TICK = 0.13;
const fmt = (v: number) => v.toFixed(2);

type V3 = [number, number, number];

/**
 * The right triangle the point carries: across by cos θ, up by sin θ, and its long side the arrow of length 1. So
 * cos² θ + sin² θ = 1: Pythagoras, from chapter 1, on every point of the circle.
 */
export function Triangle() {
  const rig = eulerRig();
  const lines = useMemo(() => [0, 1, 2, 3].map(() => ({ current: null as ChalkLineHandle | null })), []);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const said = useRef('');

  useFrame(() => {
    const on = clamp01(rig.triangle);
    const th = rig.theta;
    const [c, s] = [Math.cos(th), Math.sin(th)];
    const z = -K * clamp01(rig.along) * th;
    const lift = (p: V3): V3 => [p[0], p[1], p[2] + z + 0.015];
    const o = lift(onPlane(0, 0));
    const f = lift(onPlane(c, 0));
    const p = lift(onPlane(c, s));
    const [across, up, long, tick] = lines;
    across!.current?.set([o, f], on, on);
    up!.current?.set([f, p], on, on);
    long!.current?.set([o, p], on, on * 0.9);
    // The right angle at the foot, while both legs are long enough to show it.
    // Which way the legs run (a leg too short to see counts as running right, or up).
    const sx = c < -0.05 ? 1 : -1;
    const sy = s < -0.05 ? -1 : 1;
    const room = Math.min(Math.abs(c), Math.abs(s)) > 0.15 ? 1 : 0;
    tick!.current?.set(
      [
        [f[0] + sx * TICK, f[1], f[2]],
        [f[0] + sx * TICK, f[1] + sy * TICK, f[2]],
        [f[0], f[1] + sy * TICK, f[2]],
      ],
      1,
      on * room * 0.8,
    );

    // The sides' names: on the far side of each leg from the triangle, and off the long side away from the foot.
    const n: [number, number] = s * c > 0 ? [-s, c] : [s, -c];
    const mid = (a: V3, b: V3): V3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const sq = clamp01(rig.squares);
    const sum = `<span style="color:${SYM7.cos}">cos² θ</span> + <span style="color:${SYM7.sin}">sin² θ</span> = 1<br><span class="math-label__sub">${fmt(c * c)} + ${fmt(s * s)} = ${fmt(c * c + s * s)}</span>`;
    const el = texts.current[3];
    if (el && said.current !== sum) {
      said.current = sum;
      el.innerHTML = sum;
    }
    const place: Array<[V3, number, number, number]> = [
      [mid(o, f), 0, -sy, Math.abs(c) > 0.2 ? on : 0],
      [mid(f, p), -sx, 0, Math.abs(s) > 0.2 ? on : 0],
      [mid(o, p), n[0], n[1], Math.min(Math.abs(c), Math.abs(s)) > 0.15 ? on : 0],
      [lift(onPlane(-1.2, 1.3)), 0, 0, on * sq],
    ];
    place.forEach(([at, dx, dy, show], i) => {
      labels.current[i]?.position.set(...at);
      const t = texts.current[i];
      if (!t) return;
      t.style.opacity = String(show);
      if (dx || dy) beside(t, dx, dy, 6);
    });
  });

  return (
    <group>
      {[SYM7.cos, SYM7.sin, SYM7.point, SYM7.point].map((color, i) => (
        <ChalkLine
          key={i}
          handle={lines[i]!}
          color={color}
          width={[3.2, 3.2, 2.2, 1.4][i]}
          renderOrder={9}
          depthTest={false}
        />
      ))}
      {(
        [
          ['cos θ', SYM7.cos, 'math-label math-label--small'],
          ['sin θ', SYM7.sin, 'math-label math-label--small'],
          ['1', SYM7.point, 'math-label'],
          ['', SYM7.point, 'math-label math-label--chip math-label--stack'],
        ] as const
      ).map(([text, color, className], i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel ref={(el) => void (texts.current[i] = el)} className={className} color={color}>
            {text}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
