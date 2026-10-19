import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { clamp01 } from '../../../engine/ease';
import { epicycles, traceAt } from '../math';
import { drawnTerms, penDown } from '../drawn';
import { D, DRAW_TERMS, fourierRig, Q, SYM8 } from '../rig';

const RING = 48;
/** Only the biggest circles are drawn as rings (the rest are too small to see); every arm is drawn. */
const RINGS = 14;
const PATH = 720;
/** How fast the Lab's drawing goes round by itself (radians a second). */
const SPEED = 0.35;

type V3 = [number, number, number];
const at = (x: number, y: number, z = 0): V3 => [Q[0] + x * D, Q[1] + y * D, Q[2] + z];

/**
 * Any closed shape from circles: a hundred arms turning at every whole-number speed, both ways, biggest first, laid
 * head to tail; the tip draws the shape. In the story it is an ambulance, the next chapter's; in the Lab, whatever
 * the viewer draws.
 */
export function Drawing() {
  const rig = fourierRig();
  const arms = useRef<ChalkLineHandle | null>(null);
  const path = useRef<ChalkLineHandle | null>(null);
  const rings = useMemo(
    () => Array.from({ length: RINGS }, () => ({ current: null as ChalkLineHandle | null })),
    [],
  );
  const ringPts = useMemo<Pts[]>(
    () => Array.from({ length: RINGS }, () => Array.from({ length: RING + 1 }, (): V3 => [0, 0, 0])),
    [],
  );
  const armPts = useMemo<Pts>(() => Array.from({ length: DRAW_TERMS }, (): V3 => [0, 0, 0]), []);
  const pathPts = useMemo<Pts>(() => Array.from({ length: PATH + 1 }, (): V3 => [0, 0, 0]), []);
  const tip = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (rig.lab > 0.5 && rig.drawing > 0.5) rig.dt += Math.min(delta, 0.1) * SPEED;
    // While a new shape is being drawn, the old clockwork steps aside.
    const on = penDown() ? 0 : clamp01(rig.drawing);
    const terms = drawnTerms();
    const count = Math.min(Math.max(rig.dcount, 1), terms.length);
    const joints = epicycles(terms, rig.dt, count);
    for (let i = 0; i < DRAW_TERMS; i++) {
      const [x, y] = joints[Math.min(i, joints.length - 1)]!;
      const p = at(x, y, 0.02);
      armPts[i]![0] = p[0];
      armPts[i]![1] = p[1];
      armPts[i]![2] = p[2];
    }
    arms.current?.set(armPts, 1, on * 0.7);
    rings.forEach((h, i) => {
      // Ring i is centred on joint i and spans the next arm.
      const term = terms[i + 1];
      if (!term || i + 1 >= count) {
        h.current?.set(ringPts[i]!, 1, 0);
        return;
      }
      const [cx, cy] = joints[i]!;
      const r = Math.hypot(...term.c) * D;
      const pts = ringPts[i]!;
      for (let j = 0; j <= RING; j++) {
        const a = (j / RING) * Math.PI * 2;
        const c = at(cx, cy, 0.01);
        pts[j]![0] = c[0] + r * Math.cos(a);
        pts[j]![1] = c[1] + r * Math.sin(a);
        pts[j]![2] = c[2];
      }
      h.current?.set(pts, 1, on * (0.5 - i * 0.025));
    });
    const end = joints[joints.length - 1]!;
    if (tip.current) {
      tip.current.visible = on > 0.01;
      tip.current.position.set(...at(end[0], end[1], 0.03));
    }

    // The path so far: the last whole turn the tip has drawn, the newest end brightest.
    const span = Math.min(rig.dt, Math.PI * 2);
    for (let i = 0; i <= PATH; i++) {
      const t = rig.dt - span + (i / PATH) * span;
      const [x, y] = traceAt(terms, t, count);
      const p = at(x, y, 0.03);
      pathPts[i]![0] = p[0];
      pathPts[i]![1] = p[1];
      pathPts[i]![2] = p[2];
    }
    path.current?.set(pathPts, 1, span > 1e-3 ? clamp01(rig.dtrace) * on : 0);
  });

  return (
    <group>
      {rings.map((h, i) => (
        <ChalkLine key={i} handle={h} color={SYM8.ring} width={1.4} renderOrder={6} />
      ))}
      <ChalkLine handle={arms} color={SYM8.axis} width={1.2} renderOrder={7} />
      <ChalkLine handle={path} color={SYM8.siren} width={3} renderOrder={8} />
      <mesh ref={tip} visible={false} renderOrder={9}>
        <sphereGeometry args={[0.06, 14, 10]} />
        <meshBasicMaterial color={SYM8.siren} toneMapped={false} />
      </mesh>
    </group>
  );
}
