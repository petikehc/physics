import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01 } from '../../../engine/ease';
import { chain, value } from '../math';
import { CHART, DZ, fourierRig, MAX_COUNT, P, rigHarmonics, SYM8, U } from '../rig';

const RING = 72;
/** How fast the clockwork turns by itself while the viewer has it (radians a second). */
const SPEED = 1.1;

type V3 = [number, number, number];
type LineRef = { current: ChalkLineHandle | null };

/**
 * The clockwork: a ring for each harmonic, each turning at its own whole-number speed with the next ring riding on its
 * tip, and a line from the last tip across to the start of the wave's chart. For the side view the rings slide onto
 * one axis and draw apart in depth, one layer per speed.
 */
export function Clockwork() {
  const rig = fourierRig();
  const rings = useMemo<LineRef[]>(() => Array.from({ length: MAX_COUNT }, () => ({ current: null })), []);
  const ringPts = useMemo<Pts[]>(
    () => Array.from({ length: MAX_COUNT }, () => Array.from({ length: RING + 1 }, (): V3 => [0, 0, 0])),
    [],
  );
  const arms = useRef<ChalkLineHandle | null>(null);
  const link = useRef<ChalkLineHandle | null>(null);
  const tip = useRef<THREE.Mesh>(null);
  const hub = useRef<THREE.Mesh>(null);
  const label = useRef<THREE.Group>(null);
  const text = useRef<HTMLDivElement>(null);
  const said = useRef('');
  const armPts = useMemo<Pts>(() => Array.from({ length: MAX_COUNT + 1 }, (): V3 => [0, 0, 0]), []);

  useFrame((_, delta) => {
    // While the viewer has it, the clockwork keeps turning by itself.
    if (rig.interactive > 0.5 || rig.lab > 0.5) rig.t += Math.min(delta, 0.1) * SPEED;

    const on = clamp01(rig.clockwork);
    const hs = rigHarmonics(rig);
    const joints = chain(hs, rig.t);
    const align = clamp01(rig.align);
    const layers = clamp01(rig.layers);
    // Where each ring's centre is: on the chain, or (aligned) all on the axis; and how far back its layer is.
    const centre = (i: number): V3 => {
      const [x, y] = joints[i]!;
      const n = hs[i]?.n ?? 0;
      return [P[0] + x * U * (1 - align), P[1] + y * U * (1 - align), P[2] - DZ * n * layers];
    };
    rings.forEach((h, i) => {
      const hm = hs[i];
      if (!hm) {
        h.current?.set(ringPts[i]!, 1, 0);
        return;
      }
      const c = centre(i);
      const r = hm.a * U;
      const pts = ringPts[i]!;
      for (let j = 0; j <= RING; j++) {
        const a = (j / RING) * Math.PI * 2;
        pts[j]![0] = c[0] + r * Math.cos(a);
        pts[j]![1] = c[1] + r * Math.sin(a);
        pts[j]![2] = c[2];
      }
      // The big rings carry the eye; the small ones stay quiet. Side on, the bars take over from them.
      const quiet = 1 - clamp01(rig.bars);
      h.current?.set(pts, 1, on * quiet * (0.35 + 0.4 * Math.min(1, hm.a * 1.6)));
    });
    // The arms, centre to centre, out to the tip.
    const n = hs.length;
    for (let i = 0; i <= MAX_COUNT; i++) {
      const k = Math.min(i, n);
      const c =
        k < n
          ? centre(k)
          : ([
              P[0] + joints[n]![0] * U * (1 - align),
              P[1] + joints[n]![1] * U * (1 - align),
              P[2] - DZ * (hs[n - 1]?.n ?? 0) * layers,
            ] as V3);
      armPts[i]![0] = c[0];
      armPts[i]![1] = c[1];
      armPts[i]![2] = c[2] + 0.01;
    }
    arms.current?.set(armPts, 1, on * 0.9 * (1 - align));
    const end = armPts[MAX_COUNT]!;
    if (tip.current) {
      tip.current.visible = on * (1 - align) > 0.01;
      tip.current.position.set(...end);
    }
    if (hub.current) {
      hub.current.visible = on > 0.01;
      hub.current.position.set(P[0], P[1], P[2]);
    }
    // Across to where the wave is being drawn.
    const y = P[1] + value(hs, rig.t) * U;
    link.current?.set(
      [
        [end[0], y, end[2]],
        [CHART.x0, y, 0],
      ],
      1,
      clamp01(rig.trace) * on * (1 - align) * 0.45,
    );

    // The newest ring's name: how much faster it turns, and how much smaller it is.
    const last = hs[n - 1];
    const first = hs[0];
    const el = text.current;
    if (last && first && el) {
      const ratio = Math.round(first.a / Math.max(last.a, 1e-6));
      const words = last.n === 1 ? 'speed 1, size 1' : `${last.n}× as fast, 1/${ratio} as big`;
      if (said.current !== words) {
        said.current = words;
        el.textContent = words;
      }
      const c = centre(n - 1);
      label.current?.position.set(c[0], c[1] + last.a * U, c[2]);
      el.style.opacity = String(clamp01(rig.newest) * on * (1 - align));
      // Up and to the right of the ring's top: the clockwork sits at the left of the picture.
      beside(el, 1, 1, 8);
    }
  });

  return (
    <group>
      {rings.map((h, i) => (
        <ChalkLine key={i} handle={h} color={SYM8.ring} width={i === 0 ? 2.4 : 1.8} renderOrder={6} />
      ))}
      <ChalkLine handle={arms} color={SYM8.axis} width={1.6} renderOrder={8} />
      <ChalkLine handle={link} color={SYM8.wave} width={1.2} renderOrder={7} />
      <mesh ref={hub} visible={false} renderOrder={9}>
        <sphereGeometry args={[0.05, 14, 10]} />
        <meshBasicMaterial color={SYM8.axis} toneMapped={false} />
      </mesh>
      <mesh ref={tip} visible={false} renderOrder={10}>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshBasicMaterial color={SYM8.wave} toneMapped={false} />
      </mesh>
      <group ref={label}>
        <MathLabel ref={text} className="math-label math-label--small" color={SYM8.ring} />
      </group>
    </group>
  );
}
