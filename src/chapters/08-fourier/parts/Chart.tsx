import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01 } from '../../../engine/ease';
import { RECIPE_ORDER, RECIPES, value } from '../math';
import { CHART, fourierRig, P, rigHarmonics, SYM8, U } from '../rig';

const N = 360;
const SPAN = CHART.width / CHART.perRadian;

/** The exact wave for a recipe part way to the next (`shape` 0 square, 1 sawtooth, 2 triangle). */
function target(shape: number, t: number) {
  const s = Math.min(Math.max(shape, 0), RECIPE_ORDER.length - 1);
  const i = Math.min(Math.floor(s), RECIPE_ORDER.length - 2);
  const f = s - i;
  return RECIPES[RECIPE_ORDER[i]!].wave(t) * (1 - f) + RECIPES[RECIPE_ORDER[i + 1]!].wave(t) * f;
}

/**
 * The wave's chart, to the right of the clockwork: the newest moment nearest the clockwork, the past drifting away to
 * the right; the wave the tip draws, and, faint behind it, the exact wave the circles are aiming at.
 */
export function Chart() {
  const rig = fourierRig();
  const axis = useRef<ChalkLineHandle | null>(null);
  const guides = useMemo(() => [0, 1].map(() => ({ current: null as ChalkLineHandle | null })), []);
  const wave = useRef<ChalkLineHandle | null>(null);
  const ghost = useRef<ChalkLineHandle | null>(null);
  const label = useRef<THREE.Group>(null);
  const text = useRef<HTMLDivElement>(null);
  const wavePts = useMemo<Pts>(() => Array.from({ length: N + 1 }, () => [0, 0, 0]), []);
  const ghostPts = useMemo<Pts>(() => Array.from({ length: N + 1 }, () => [0, 0, 0]), []);
  const x1 = CHART.x0 + CHART.width;

  useFrame(() => {
    const on = clamp01(rig.stage);
    axis.current?.set(
      [
        [CHART.x0, P[1], 0],
        [x1 + 0.3, P[1], 0],
      ],
      on,
      on * 0.7,
    );
    // Faint guides at the square's two levels, so the overshoot shows.
    guides.forEach((g, i) => {
      const y = P[1] + (i === 0 ? U : -U);
      g.current?.set(
        [
          [CHART.x0, y, -0.01],
          [x1, y, -0.01],
        ],
        on,
        on * 0.18,
      );
    });

    const hs = rigHarmonics(rig);
    // The wave comes out of the clockwork from the moment it started being traced, and drifts away to the right.
    const span = Math.min(SPAN, Math.max(rig.t - rig.since, 0));
    for (let i = 0; i <= N; i++) {
      const back = (i / N) * span;
      const t = rig.t - back;
      const x = CHART.x0 + back * CHART.perRadian;
      wavePts[i]![0] = x;
      wavePts[i]![1] = P[1] + value(hs, t) * U;
      wavePts[i]![2] = 0.01;
      ghostPts[i]![0] = x;
      ghostPts[i]![1] = P[1] + target(rig.shape, t) * U;
      ghostPts[i]![2] = -0.005;
    }
    wave.current?.set(wavePts, 1, span > 1e-3 ? clamp01(rig.trace) * on : 0);
    ghost.current?.set(ghostPts, 1, clamp01(rig.ghost) * on * 0.35);

    labelPlace(label.current, text.current, [x1 + 0.3, P[1], 0], on);
  });

  return (
    <group>
      <ChalkLine handle={axis} color={SYM8.axis} width={1.4} renderOrder={5} />
      {guides.map((g, i) => (
        <ChalkLine key={i} handle={g} color={SYM8.axis} width={1} renderOrder={5} />
      ))}
      <ChalkLine handle={ghost} color={SYM8.ghost} width={1.6} renderOrder={6} />
      <ChalkLine handle={wave} color={SYM8.wave} width={3} renderOrder={7} />
      <group ref={label}>
        <MathLabel ref={text} className="math-label math-label--small" color={SYM8.axis}>
          earlier
        </MathLabel>
      </group>
    </group>
  );
}

function labelPlace(
  g: THREE.Group | null,
  el: HTMLDivElement | null,
  at: [number, number, number],
  on: number,
) {
  g?.position.set(...at);
  if (!el) return;
  el.style.opacity = String(on * 0.85);
  // Above the end of the time axis, inside it.
  beside(el, -1, 1, 6);
}
