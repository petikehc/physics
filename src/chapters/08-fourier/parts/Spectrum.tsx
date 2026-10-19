import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01 } from '../../../engine/ease';
import { DZ, fourierRig, MAX_COUNT, P, rigHarmonics, SYM8, U } from '../rig';

/** Only the first few bars are big enough to name their size. */
const SIZED = 4;

/**
 * The side view's spectrum. Each ring, slid onto the axis and set back by its speed, is seen edge on: a bar as tall
 * as the ring is wide, standing at its speed. Front on the clockwork is the wave; side on, it is the wave's recipe.
 */
export function Spectrum() {
  const rig = fourierRig();
  const axis = useRef<ChalkLineHandle | null>(null);
  const bars = useMemo(
    () => Array.from({ length: MAX_COUNT }, () => ({ current: null as ChalkLineHandle | null })),
    [],
  );
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const said = useRef<string[]>([]);

  useFrame(() => {
    const on = clamp01(rig.bars);
    const hs = rigHarmonics(rig);
    // The axis runs a little past the fastest circle there is.
    const fastest = hs[hs.length - 1]?.n ?? 1;
    const zEnd = P[2] - DZ * (fastest + 1.5) * clamp01(rig.layers);
    axis.current?.set(
      [
        [P[0], P[1], P[2] + 0.3],
        [P[0], P[1], Math.min(zEnd, P[2] - 1)],
      ],
      on,
      on * 0.7,
    );
    const first = hs[0]?.a ?? 1;
    bars.forEach((b, i) => {
      const h = hs[i];
      if (!h) {
        b.current?.set(
          [
            [0, 0, 0],
            [0, 0, 0],
          ],
          1,
          0,
        );
        return;
      }
      const z = P[2] - DZ * h.n * clamp01(rig.layers);
      b.current?.set(
        [
          [P[0], P[1], z],
          [P[0], P[1] + h.a * U, z],
        ],
        on,
        on,
      );
    });

    // Each bar's speed under it; the first few bars' sizes over them; the axis's name at its end.
    const words: Array<[string, [number, number, number], number, number, number]> = [];
    hs.forEach((h, i) => {
      const z = P[2] - DZ * h.n * clamp01(rig.layers);
      words.push([String(h.n), [P[0], P[1], z], 0, -1, on]);
      const ratio = Math.round(first / Math.max(h.a, 1e-6));
      words.push([ratio === 1 ? '1' : `1/${ratio}`, [P[0], P[1] + h.a * U, z], 0, 1, i < SIZED ? on : 0]);
    });
    words.push(['speed', [P[0], P[1], Math.min(zEnd, P[2] - 1)], 1, 0, on]);
    for (let i = 0; i < MAX_COUNT * 2 + 1; i++) {
      const el = texts.current[i];
      const w = words[i];
      if (!el) continue;
      if (!w) {
        el.style.opacity = '0';
        continue;
      }
      const [text, at, dx, dy, show] = w;
      labels.current[i]?.position.set(...at);
      if (said.current[i] !== text) {
        said.current[i] = text;
        el.textContent = text;
      }
      el.style.opacity = String(show);
      beside(el, dx, dy, 6);
    }
  });

  return (
    <group>
      <ChalkLine handle={axis} color={SYM8.axis} width={1.4} renderOrder={6} />
      {bars.map((b, i) => (
        <ChalkLine key={i} handle={b} color={SYM8.ring} width={7} renderOrder={8} />
      ))}
      {Array.from({ length: MAX_COUNT * 2 + 1 }, (_, i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel
            ref={(el) => void (texts.current[i] = el)}
            className="math-label math-label--small"
            color={i % 2 === 1 ? SYM8.ring : SYM8.axis}
          />
        </group>
      ))}
    </group>
  );
}
