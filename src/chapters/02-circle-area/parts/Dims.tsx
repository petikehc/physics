import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { rowSize } from '../math';
import { circleRig, DISC_THICKNESS, SYM2, uv } from '../rig';

const Y = DISC_THICKNESS + 0.02;
const TICK = 0.12;

/** A dimension bracket from a to b (in u, v), with end ticks offset along `tick`. */
function bracket(a: [number, number], b: [number, number], tick: [number, number]): Pts {
  return [
    uv(a[0] + tick[0], a[1] + tick[1], Y),
    uv(a[0], a[1], Y),
    uv(b[0], b[1], Y),
    uv(b[0] + tick[0], b[1] + tick[1], Y),
  ];
}

/**
 * Measurements: on the row, "half the circle's edge = πr" along the top and "r" up the side, plus the
 * πr × r rectangle it approaches; on the onion triangle, "2πr" along the base and "r" up the side.
 */
export function Dims() {
  const rig = circleRig();
  const top = useRef<ChalkLineHandle | null>(null);
  const side = useRef<ChalkLineHandle | null>(null);
  const ghost = useRef<ChalkLineHandle | null>(null);
  const triBase = useRef<ChalkLineHandle | null>(null);
  const triSide = useRef<ChalkLineHandle | null>(null);
  const groups = useRef<Array<THREE.Group | null>>([]);
  const els = useRef<Array<HTMLDivElement | null>>([]);

  useFrame(() => {
    const r = rig.r;
    const { height: h, bump } = rowSize(rig.n, r);
    const half = (Math.PI * r) / 2;
    const gap = 0.28;

    const d = rig.dims * (1 - rig.piecesSink);
    const vt = h / 2 + bump + gap;
    top.current?.set(bracket([-half, vt], [half, vt], [0, -TICK]), 1, d);
    const us = half + 0.45;
    side.current?.set(bracket([us, -h / 2], [us, h / 2], [-TICK, 0]), 1, d);
    ghost.current?.set(
      [
        uv(-half, -r / 2, Y),
        uv(half, -r / 2, Y),
        uv(half, r / 2, Y),
        uv(-half, r / 2, Y),
        uv(-half, -r / 2, Y),
      ],
      1,
      rig.ghost * 0.85 * (1 - rig.piecesSink),
    );

    // The triangle of unrolled rings: base 2πr, height r (bars stacked from v = -r/2 to r/2).
    const t = rig.triDims * (1 - rig.ringsSink);
    const vb = -r / 2 - gap;
    triBase.current?.set(bracket([-Math.PI * r, vb], [Math.PI * r, vb], [0, TICK]), 1, t);
    const ut = Math.PI * r + 0.4;
    triSide.current?.set(bracket([ut, -r / 2], [ut, r / 2], [-TICK, 0]), 1, t);

    const spots: Array<[[number, number, number], number]> = [
      [uv(0, vt + 0.28, Y), d],
      [uv(us + 0.32, 0, Y), d],
      [uv(0, vb - 0.3, Y), t],
      [uv(ut + 0.32, 0, Y), t],
    ];
    spots.forEach(([p, o], i) => {
      groups.current[i]?.position.set(...p);
      const el = els.current[i];
      if (el) el.style.opacity = String(o);
    });
  });

  const labels: Array<[React.ReactNode, string]> = [
    [
      <>
        half the edge = π<i>r</i>
      </>,
      SYM2.pi,
    ],
    [<i key="r">r</i>, SYM2.r],
    [
      <>
        2π<i>r</i>
      </>,
      SYM2.pi,
    ],
    [<i key="r2">r</i>, SYM2.r],
  ];

  return (
    <group>
      <ChalkLine handle={top} color={SYM2.pi} width={2.4} />
      <ChalkLine handle={side} color={SYM2.r} width={2.4} />
      <ChalkLine handle={ghost} color="#f4efe6" width={1.6} />
      <ChalkLine handle={triBase} color={SYM2.pi} width={2.4} />
      <ChalkLine handle={triSide} color={SYM2.r} width={2.4} />
      {labels.map(([content, color], i) => (
        <group key={i} ref={(el) => void (groups.current[i] = el)}>
          <MathLabel
            ref={(el) => void (els.current[i] = el)}
            className="math-label math-label--chip"
            color={color}
          >
            {content}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
