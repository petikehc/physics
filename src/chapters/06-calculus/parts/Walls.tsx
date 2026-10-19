import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01 } from '../../../engine/ease';
import { calculusRig, SYM6, WALL_A, WALL_F } from '../rig';

const W = WALL_F.width;
/** Past the end of each x axis, a little room for its arrow and its name. */
const OVER = 0.35;
const PANE = { left: -0.25, right: W + 0.45 };

/** Faint graph-paper lines over a wall: every half unit of x across, every `dy` up, from `y0` to `y0 + h`. */
function paper(y0: number, h: number, dy: number, z: number) {
  const pts: number[] = [];
  for (let x = 0.75; x <= W + 1e-6; x += 0.75) pts.push(x, y0, z, x, y0 + h, z);
  for (let y = dy; y <= h + 1e-6; y += dy) pts.push(0, y0 + y, z, W, y0 + y, z);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

interface Axis {
  line: React.RefObject<ChalkLineHandle | null>;
}

/**
 * The two walls the chapter draws on, glass panes standing in the realm. The curve's wall stands on the floor, its
 * x axis along the ground, so columns can rise from it. The area's wall stands behind it and higher, its x axis
 * level with the first's, so the area at each x sits straight above the curve there.
 */
export function Walls() {
  const rig = calculusRig();
  const axes = useMemo<Axis[]>(() => [0, 1, 2, 3].map(() => ({ line: { current: null } })), []);
  const panes = useRef<Array<THREE.Mesh | null>>([]);
  const grids = useRef<Array<THREE.LineSegments | null>>([]);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const glass = useMemo(
    () =>
      [0, 1].map(
        () =>
          new THREE.MeshBasicMaterial({
            color: SYM6.grid,
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
      [0, 1].map(
        () =>
          new THREE.LineBasicMaterial({ color: SYM6.grid, transparent: true, opacity: 0, toneMapped: false }),
      ),
    [],
  );
  const grid = useMemo(
    () => [paper(0, WALL_F.height, 0.5, 0.005), paper(WALL_A.y, WALL_A.height, 0.45, WALL_A.z + 0.005)],
    [],
  );
  /** The words on the axes now (they change once the apple's speed becomes any curve). */
  const shown = useRef(-1);

  useFrame(() => {
    const f = clamp01(rig.wallF);
    const a = clamp01(rig.wallA);
    [f, a].forEach((on, i) => {
      glass[i]!.opacity = on * 0.05;
      gridMats[i]!.opacity = on * 0.16;
      const p = panes.current[i];
      if (p) p.visible = on > 0.001;
      const g = grids.current[i];
      if (g) g.visible = on > 0.001;
    });
    // Each axis draws out from the origin.
    const yA = WALL_A.y;
    const zA = WALL_A.z + 0.01;
    axes[0]!.line.current?.set(
      [
        [0, 0, 0.01],
        [W + OVER, 0, 0.01],
      ],
      f,
      0.9 * f,
    );
    axes[1]!.line.current?.set(
      [
        [0, 0, 0.01],
        [0, WALL_F.height, 0.01],
      ],
      f,
      0.9 * f,
    );
    axes[2]!.line.current?.set(
      [
        [0, yA, zA],
        [W + OVER, yA, zA],
      ],
      a,
      0.9 * a,
    );
    axes[3]!.line.current?.set(
      [
        [0, yA, zA],
        [0, yA + WALL_A.height, zA],
      ],
      a,
      0.9 * a,
    );

    // The names: x along both, the curve's f(x) (or, for the falling apple, its speed against time) and A(x).
    const general = rig.words < 0.5 ? 0 : 1;
    if (general !== shown.current) {
      shown.current = general;
      const [t0, t1] = texts.current;
      if (t0) {
        t0.textContent = general ? 'x' : 'time';
        t0.className = general ? 'math-label' : 'math-label math-label--small';
      }
      if (t1) {
        t1.textContent = general ? 'f(x)' : 'speed';
        t1.className = general ? 'math-label' : 'math-label math-label--small';
      }
    }
    const at: Array<[number, number, number]> = [
      [W + OVER, 0, 0.01],
      [0, WALL_F.height, 0.01],
      [W + OVER, yA, zA],
      [0, yA + WALL_A.height, zA],
    ];
    const show = [f * rig.named, f * rig.named, a, a];
    at.forEach((p, i) => {
      labels.current[i]?.position.set(...p);
      const el = texts.current[i];
      if (!el) return;
      el.style.opacity = String(show[i]!);
      // Inside each wall's corners, so a screen the walls fill edge to edge still shows them: over the end of each
      // x axis, and beside the top of each upright one.
      beside(el, i % 2 === 0 ? -1 : 1, i % 2 === 0 ? 1 : 0, 6);
    });
  });

  const names: Array<[string, string]> = [
    ['time', SYM6.axis],
    ['speed', SYM6.f],
    ['x', SYM6.axis],
    ['A(x)', SYM6.area],
  ];

  return (
    <group>
      {[0, 1].map((i) => {
        const [y0, h, z] =
          i === 0
            ? [-0.02, WALL_F.height + 0.25, -0.02]
            : [WALL_A.y - 0.2, WALL_A.height + 0.45, WALL_A.z - 0.02];
        return (
          <mesh
            key={i}
            ref={(el) => void (panes.current[i] = el)}
            material={glass[i]}
            position={[(PANE.left + PANE.right) / 2, y0 + h / 2, z]}
            visible={false}
            renderOrder={-1}
          >
            <planeGeometry args={[PANE.right - PANE.left, h]} />
          </mesh>
        );
      })}
      {[0, 1].map((i) => (
        <lineSegments
          key={i}
          ref={(el) => void (grids.current[i] = el)}
          geometry={grid[i]}
          material={gridMats[i]}
          visible={false}
        />
      ))}
      {axes.map((ax, i) => (
        <ChalkLine key={i} handle={ax.line} color={SYM6.axis} width={1.6} />
      ))}
      {names.map(([text, color], i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel
            ref={(el) => void (texts.current[i] = el)}
            className={i < 2 ? 'math-label math-label--small' : 'math-label'}
            color={color}
          >
            {text}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
