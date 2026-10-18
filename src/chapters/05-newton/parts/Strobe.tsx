import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { clamp01, lerp } from '../../../engine/ease';
import { fallAt } from '../math';
import { newtonRig, RADIUS, STROBE, STROBE_TOP } from '../rig';

const N = STROBE.flashes;
const appleGeo = new THREE.SphereGeometry(STROBE.apple, 20, 14);
const stemGeo = new THREE.CylinderGeometry(0.005, 0.007, 0.045, 6).translate(0, 0.06, 0);
/** The next chapter's violet, for the curve that leads into it. */
const CURVE = '#9b7bf0';
const AXIS = '#f4efe6';

/** Where the apple is in flash k: straight down the column, or (turned) one step along per flash. */
const flashAt = (k: number, turn: number): [number, number, number] => [
  lerp(0, k * STROBE.spacing, turn),
  STROBE_TOP - STROBE.drop * (fallAt(k) / fallAt(N)),
  0.02,
];

const curve: Pts = Array.from({ length: 61 }, (_, i) => {
  const s = i / 60;
  return [s * N * STROBE.spacing, STROBE_TOP - STROBE.drop * s * s, 0.02];
});

/** The time axis along the top, with a tick at every flash, and the distance-fallen axis down the side. */
const AXIS_Y = STROBE_TOP + 0.13;
const timeAxis: Pts = (() => {
  const pts: Pts = [[-0.12, AXIS_Y, 0.02]];
  for (let k = 0; k <= N; k++) {
    const x = k * STROBE.spacing;
    pts.push([x, AXIS_Y, 0.02], [x, AXIS_Y - 0.05, 0.02], [x, AXIS_Y, 0.02]);
  }
  pts.push([N * STROBE.spacing + 0.3, AXIS_Y, 0.02]);
  return pts;
})();
const fallAxis: Pts = [
  [-0.12, AXIS_Y, 0.02],
  [-0.12, RADIUS + 0.02, 0.02],
];

/**
 * The handoff: an apple falling under a strobe leaves a copy of itself at every flash, farther apart each time
 * (1, 3, 5, 7… as Galileo found). Turned so that time runs sideways, one step per flash, the copies trace a curve:
 * the shape a cannonball flies in, and the kind of curve the next chapter's mathematics was made for.
 */
export function Strobe() {
  const rig = newtonRig();
  const ghosts = useRef<Array<THREE.Group | null>>([]);
  const light = useRef<THREE.PointLight>(null);
  const graph = useRef<ChalkLineHandle | null>(null);
  const axisT = useRef<ChalkLineHandle | null>(null);
  const axisD = useRef<ChalkLineHandle | null>(null);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const mats = useMemo(
    () =>
      Array.from(
        { length: N + 1 },
        () =>
          new THREE.MeshStandardMaterial({
            color: '#d9534f',
            emissive: '#5a1412',
            roughness: 0.45,
            transparent: true,
            depthWrite: false,
          }),
      ),
    [],
  );
  const stemMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5b3b22', roughness: 0.8 }), []);

  useFrame(() => {
    const s = rig.strobe;
    const turn = clamp01(rig.turn);
    const keep = 1 - clamp01(rig.clear);
    let flash = 0;
    for (let k = 0; k <= N; k++) {
      // Flash k comes when the apple has had k of the N equal times to fall.
      const since = s - k / N;
      const g = ghosts.current[k];
      const on = clamp01(since * 40);
      if (g) {
        g.visible = on > 0.001;
        g.position.set(...flashAt(k, turn));
      }
      mats[k]!.opacity = on * 0.62 * keep;
      if (g) g.visible = g.visible && keep > 0.001;
      // Only once the strobe has started: its light reaches every station in the sky.
      if (since >= 0 && s > 0.001 && s < 1.05) flash += Math.exp(-since * 70);
    }
    if (light.current) light.current.intensity = 5 * Math.min(flash, 1.2);

    graph.current?.set(curve, clamp01(rig.curve), 0.95 * keep);
    axisT.current?.set(timeAxis, 1, turn * 0.7 * keep);
    axisD.current?.set(fallAxis, 1, turn * 0.7 * keep);
    labels.current[0]?.position.set(N * STROBE.spacing + 0.55, AXIS_Y, 0.02);
    labels.current[1]?.position.set(-0.12, RADIUS - 0.12, 0.02);
    texts.current.forEach((el) => {
      if (el) el.style.opacity = String(turn * keep);
    });
  });

  return (
    <group>
      <pointLight
        ref={light}
        position={[0.6, STROBE_TOP - 0.4, 1.4]}
        color="#f2f6ff"
        intensity={0}
        decay={0}
      />
      {mats.map((m, k) => (
        <group key={k} ref={(el) => void (ghosts.current[k] = el)} visible={false} scale={[1, 0.9, 1]}>
          <mesh geometry={appleGeo} material={m} />
          <mesh geometry={stemGeo} material={stemMat} />
        </group>
      ))}
      <ChalkLine handle={graph} color={CURVE} width={2.6} />
      <ChalkLine handle={axisT} color={AXIS} width={1.4} />
      <ChalkLine handle={axisD} color={AXIS} width={1.4} />
      {['time →', 'fallen ↓'].map((t, i) => (
        <group key={t} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel
            ref={(el) => void (texts.current[i] = el)}
            className="math-label math-label--small"
            color={AXIS}
          >
            {t}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
