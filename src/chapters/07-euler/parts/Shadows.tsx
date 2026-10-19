import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01 } from '../../../engine/ease';
import { C, eulerRig, FLOOR_Y, K, onPlane, R, SYM7, WALL_X, WALL_Z } from '../rig';

const N = 480;
const TOP = C[1] + R + 0.7;
const RIGHT = C[0] + R + 0.7;
const [NEAR, FAR] = WALL_Z;

/** Faint graph paper over a pane: lines every `step` along time (z) and every `step` across. */
function paper(kind: 'floor' | 'wall', step: number) {
  const pts: number[] = [];
  for (let z = NEAR; z >= FAR - 1e-6; z -= step) {
    if (kind === 'floor') pts.push(WALL_X, FLOOR_Y + 0.004, z, RIGHT, FLOOR_Y + 0.004, z);
    else pts.push(WALL_X + 0.004, FLOOR_Y, z, WALL_X + 0.004, TOP, z);
  }
  if (kind === 'floor')
    for (let x = C[0] - R; x <= RIGHT; x += R / 2)
      pts.push(x, FLOOR_Y + 0.004, NEAR, x, FLOOR_Y + 0.004, FAR);
  else for (let y = C[1] - R; y <= TOP; y += R / 2) pts.push(WALL_X + 0.004, y, NEAR, WALL_X + 0.004, y, FAR);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/**
 * The helix's two shadows. A lamp overhead throws it onto the floor, where only its left-and-right survives: a wave,
 * cos θ. A lamp to its right throws it onto the wall, where only its up-and-down survives: another wave, sin θ. A
 * point runs along the helix as they draw, with a line down to each.
 */
export function Shadows() {
  const rig = eulerRig();
  const panes = useRef<Array<THREE.Mesh | null>>([]);
  const grids = useRef<Array<THREE.LineSegments | null>>([]);
  const lamps = useRef<Array<THREE.Mesh | null>>([]);
  const probe = useRef<THREE.Mesh>(null);
  const dots = useRef<Array<THREE.Mesh | null>>([]);
  const cosLine = useRef<ChalkLineHandle | null>(null);
  const sinLine = useRef<ChalkLineHandle | null>(null);
  const mids = useMemo(() => [0, 1].map(() => ({ current: null as ChalkLineHandle | null })), []);
  const rays = useMemo(() => [0, 1].map(() => ({ current: null as ChalkLineHandle | null })), []);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const cosPts = useMemo<Pts>(() => Array.from({ length: N + 1 }, () => [0, 0, 0]), []);
  const sinPts = useMemo<Pts>(() => Array.from({ length: N + 1 }, () => [0, 0, 0]), []);
  const glass = useMemo(
    () =>
      [SYM7.cos, SYM7.sin].map(
        (color) =>
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide,
            toneMapped: false,
          }),
      ),
    [],
  );
  const gridMats = useMemo(
    () =>
      [SYM7.cos, SYM7.sin].map(
        (color) => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, toneMapped: false }),
      ),
    [],
  );
  const grid = useMemo(() => [paper('floor', K * Math.PI), paper('wall', K * Math.PI)], []);

  useFrame(() => {
    const on = clamp01(rig.walls);
    [0, 1].forEach((i) => {
      glass[i]!.opacity = on * 0.06;
      gridMats[i]!.opacity = on * 0.14;
      for (const m of [panes.current[i], grids.current[i], lamps.current[i]]) if (m) m.visible = on > 0.001;
    });
    mids[0]!.current?.set(
      [
        [C[0], FLOOR_Y + 0.006, NEAR],
        [C[0], FLOOR_Y + 0.006, FAR],
      ],
      1,
      on * 0.5,
    );
    mids[1]!.current?.set(
      [
        [WALL_X + 0.006, C[1], NEAR],
        [WALL_X + 0.006, C[1], FAR],
      ],
      1,
      on * 0.5,
    );

    // The shadows draw as far round as the point on the helix that leads them.
    const along = clamp01(rig.along);
    const head = clamp01(rig.shadows) * rig.theta;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * head;
      const z = C[2] - K * along * t;
      cosPts[i]![0] = C[0] + R * Math.cos(t);
      cosPts[i]![1] = FLOOR_Y + 0.012;
      cosPts[i]![2] = z;
      sinPts[i]![0] = WALL_X + 0.012;
      sinPts[i]![1] = C[1] + R * Math.sin(t);
      sinPts[i]![2] = z;
    }
    const drawn = Math.abs(head) > 1e-3 ? on : 0;
    cosLine.current?.set(cosPts, 1, drawn);
    sinLine.current?.set(sinPts, 1, drawn);

    const h = onPlane(Math.cos(head), Math.sin(head), along * head);
    const floor: [number, number, number] = [h[0], FLOOR_Y + 0.012, h[2]];
    const wall: [number, number, number] = [WALL_X + 0.012, h[1], h[2]];
    const r = clamp01(rig.rays) * on;
    rays[0]!.current?.set([h, floor], 1, r * 0.6);
    rays[1]!.current?.set([h, wall], 1, r * 0.6);
    if (probe.current) {
      probe.current.visible = r > 0.01;
      probe.current.position.set(...h);
    }
    [floor, wall].forEach((p, i) => {
      const d = dots.current[i];
      if (!d) return;
      d.visible = drawn > 0.01;
      d.position.set(...p);
    });

    // Their names ride the heads of the waves.
    const place: Array<[[number, number, number], number, number]> = [
      [floor, 1, -1],
      [wall, 0, 1],
    ];
    place.forEach(([p, dx, dy], i) => {
      labels.current[i]?.position.set(...p);
      const el = texts.current[i];
      if (!el) return;
      el.style.opacity = String(drawn);
      beside(el, dx, dy, 10);
    });
  });

  const lampAt: Array<[number, number, number]> = [
    // Overhead, and off to the right, halfway along the helix.
    [C[0], TOP + 1.9, C[2] - K * 2 * Math.PI],
    [RIGHT + 2.1, C[1], C[2] - K * 2 * Math.PI],
  ];

  return (
    <group>
      <mesh
        ref={(el) => void (panes.current[0] = el)}
        material={glass[0]}
        position={[(WALL_X + RIGHT) / 2, FLOOR_Y, (NEAR + FAR) / 2]}
        rotation-x={-Math.PI / 2}
        visible={false}
        renderOrder={-1}
      >
        <planeGeometry args={[RIGHT - WALL_X, NEAR - FAR]} />
      </mesh>
      <mesh
        ref={(el) => void (panes.current[1] = el)}
        material={glass[1]}
        position={[WALL_X, (FLOOR_Y + TOP) / 2, (NEAR + FAR) / 2]}
        rotation-y={Math.PI / 2}
        visible={false}
        renderOrder={-1}
      >
        <planeGeometry args={[NEAR - FAR, TOP - FLOOR_Y]} />
      </mesh>
      {[0, 1].map((i) => (
        <lineSegments
          key={i}
          ref={(el) => void (grids.current[i] = el)}
          geometry={grid[i]}
          material={gridMats[i]}
          visible={false}
        />
      ))}
      {lampAt.map((p, i) => (
        <mesh key={i} ref={(el) => void (lamps.current[i] = el)} position={p} visible={false}>
          <sphereGeometry args={[0.13, 16, 12]} />
          <meshBasicMaterial color={i === 0 ? SYM7.cos : SYM7.sin} toneMapped={false} />
        </mesh>
      ))}
      {mids.map((h, i) => (
        <ChalkLine key={i} handle={h} color={i === 0 ? SYM7.cos : SYM7.sin} width={1.2} renderOrder={6} />
      ))}
      <ChalkLine handle={cosLine} color={SYM7.cos} width={3} renderOrder={7} />
      <ChalkLine handle={sinLine} color={SYM7.sin} width={3} renderOrder={7} />
      {rays.map((h, i) => (
        <ChalkLine key={i} handle={h} color={i === 0 ? SYM7.cos : SYM7.sin} width={1.4} renderOrder={8} />
      ))}
      <mesh ref={probe} visible={false} renderOrder={10}>
        <sphereGeometry args={[0.06, 16, 12]} />
        <meshBasicMaterial color={SYM7.point} toneMapped={false} />
      </mesh>
      {[SYM7.cos, SYM7.sin].map((color, i) => (
        <mesh key={i} ref={(el) => void (dots.current[i] = el)} visible={false} renderOrder={9}>
          <sphereGeometry args={[0.055, 14, 10]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
      {[
        ['cos θ', SYM7.cos],
        ['sin θ', SYM7.sin],
      ].map(([text, color], i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel ref={(el) => void (texts.current[i] = el)} className="math-label" color={color}>
            {text}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
