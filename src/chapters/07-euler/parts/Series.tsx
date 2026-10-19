import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01 } from '../../../engine/ease';
import { series } from '../math';
import { eulerRig, onPlane, R, SYM7, TERMS } from '../rig';
import { Arrow } from '../../../engine/lines/Arrow';
import { aim } from '../../../engine/lines/aim';

type V3 = [number, number, number];

/** The first few terms are named; the rest are too small to label. */
const NAMES = ['1', 'iθ', '(iθ)²/2!', '(iθ)³/3!'];

/**
 * Euler's series for e^{iθ}, as arrows laid head to tail: 1, then iθ (a quarter turn on), then (iθ)²/2! (another
 * quarter turn, and back towards the left), and so on. The real terms are amber and the imaginary ones cyan; the
 * factorials shrink them, and the arrows spiral in onto the point.
 */
export function Series() {
  const rig = eulerRig();
  const arrows = useRef<Array<THREE.Group | null>>([]);
  const end = useRef<THREE.Mesh>(null);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);

  useFrame(() => {
    const on = clamp01(rig.series);
    const n = Math.min(Math.max(rig.terms, 0), TERMS);
    const { terms } = series(rig.theta, TERMS);
    let at: [number, number] = [0, 0];
    let tip: V3 = onPlane(0, 0);
    for (let k = 0; k < TERMS; k++) {
      const part = clamp01(n - k);
      const t = terms[k]!;
      const from = onPlane(at[0], at[1]);
      const to = onPlane(at[0] + t[0] * part, at[1] + t[1] * part);
      // Each a hair in front of the last, so where they cross the later one shows.
      from[2] += 0.02 + k * 0.002;
      to[2] += 0.02 + k * 0.002;
      const len = Math.hypot(t[0], t[1]) * R * part;
      aim(
        arrows.current[k] ?? null,
        from,
        to,
        part > 0.001 ? on : 0,
        Math.max(0.006, Math.min(0.02, len * 0.08)),
      );
      if (part > 0) tip = to;
      if (k < NAMES.length) {
        // Named on the outside of the spiral: to the right of the way the arrow points. An arrow too short to
        // hold its name (a small θ) goes without.
        const g = labels.current[k];
        g?.position.set((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2);
        const el = texts.current[k];
        if (el) {
          const room = clamp01((Math.hypot(t[0], t[1]) * R - 0.5) / 0.3);
          el.style.opacity = String(on * room * clamp01((part - 0.5) * 3));
          beside(el, t[1], -t[0], 6);
        }
      }
      at = [at[0] + t[0] * part, at[1] + t[1] * part];
    }
    if (end.current) {
      end.current.visible = on > 0.01 && n > 0.01;
      end.current.position.set(...tip);
    }
  });

  return (
    <group>
      {Array.from({ length: TERMS }, (_, k) => (
        <Arrow
          key={k}
          arrow={(el) => void (arrows.current[k] = el)}
          color={k % 2 === 0 ? SYM7.cos : SYM7.sin}
          renderOrder={11}
          depthTest={false}
        />
      ))}
      <mesh ref={end} visible={false} renderOrder={12}>
        <sphereGeometry args={[0.05, 14, 10]} />
        <meshBasicMaterial color={SYM7.point} toneMapped={false} depthTest={false} />
      </mesh>
      {NAMES.map((name, k) => (
        <group key={k} ref={(el) => void (labels.current[k] = el)}>
          <MathLabel
            ref={(el) => void (texts.current[k] = el)}
            className="math-label math-label--small"
            color={k % 2 === 0 ? SYM7.cos : SYM7.sin}
          >
            {name}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
