import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01 } from '../../../engine/ease';
import { C, eulerRig, onPlane, R, SYM7 } from '../rig';
import { Arrow } from './Arrow';
import { aim } from './aim';

type V3 = [number, number, number];

/** Just below the real axis, so it doesn't hide the point's own arrow, which runs the same way back. */
const BELOW = -0.07;

/**
 * The five constants, each flying in from where the journey met it (e from chapter 6's growth, π from chapter 2's
 * circle, i from this chapter's quarter turn, and 1 and 0), to line up over the circle in the identity's order.
 */
const CONSTANTS: Array<{ text: string; color: string; from: V3 }> = [
  { text: 'e', color: SYM7.e, from: [-9, 3.5, -6] },
  { text: 'i', color: SYM7.sin, from: [8, 6.5, -6] },
  { text: 'π', color: SYM7.pi, from: [-7, 8, -9] },
  { text: '1', color: SYM7.cos, from: [9, 3, -5] },
  { text: '0', color: SYM7.point, from: [1, 10, -6] },
];
const ROW_Y = C[1] + R + 1.15;
const GAP = 0.8;

/**
 * Euler's identity in the picture: the point at θ = π is at −1; one more step of 1, along the real axis, walks it
 * home to the centre, 0. And the five numbers it joins.
 */
export function Identity() {
  const rig = eulerRig();
  const plus = useRef<THREE.Group | null>(null);
  const zero = useRef<THREE.Mesh>(null);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);

  useFrame(() => {
    const p = clamp01(rig.plus);
    const from = onPlane(-1, BELOW);
    const to = onPlane(-1 + p, BELOW);
    aim(plus.current, from, to, p > 0.001 ? 1 : 0, 0.022);
    const home = clamp01((p - 0.92) / 0.08);
    if (zero.current) {
      zero.current.visible = home > 0.01;
      zero.current.scale.setScalar(0.5 + home * 0.5);
    }

    const words: Array<[V3, number, number, number]> = [
      [onPlane(-0.5, BELOW), 0, -1, clamp01((p - 0.4) * 3)],
      [onPlane(0, 0), 1, 1, home],
    ];
    words.forEach(([at, dx, dy, show], i) => {
      labels.current[i]?.position.set(...at);
      const el = texts.current[i];
      if (!el) return;
      el.style.opacity = String(show);
      beside(el, dx, dy, 8);
    });

    // The constants: each on its way in, growing as it comes, then gone together.
    const gone = 1 - clamp01(rig.gone);
    CONSTANTS.forEach((k, i) => {
      const t = clamp01((rig.constants - i * 0.12) / 0.52);
      const e = 1 - Math.pow(1 - t, 3);
      const slot: V3 = [C[0] + (i - 2) * GAP, ROW_Y, C[2]];
      const g = labels.current[2 + i];
      g?.position.set(
        k.from[0] + (slot[0] - k.from[0]) * e,
        k.from[1] + (slot[1] - k.from[1]) * e,
        k.from[2] + (slot[2] - k.from[2]) * e,
      );
      const el = texts.current[2 + i];
      if (!el) return;
      el.style.opacity = String(clamp01(t * 3) * gone);
      el.style.transform = `scale(${(0.35 + 0.65 * e).toFixed(3)})`;
    });
  });

  return (
    <group>
      <Arrow arrow={(el) => void (plus.current = el)} color={SYM7.cos} renderOrder={12} depthTest={false} />
      <mesh ref={zero} visible={false} position={onPlane(0, 0, 0)} renderOrder={12}>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshBasicMaterial color={SYM7.point} toneMapped={false} depthTest={false} />
      </mesh>
      {(
        [
          ['+ 1', SYM7.cos, 'math-label'],
          ['0', SYM7.point, 'math-label'],
          ...CONSTANTS.map((k) => [k.text, k.color, 'math-label math-label--const']),
        ] as Array<[string, string, string]>
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
