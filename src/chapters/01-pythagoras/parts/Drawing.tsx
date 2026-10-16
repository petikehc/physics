import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { beachSand } from '../../../engine/world/Beach';
import { station } from '../../../engine/world/stations';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { clamp01, smooth } from '../../../engine/ease';
import { perimeterPoint, triangle } from '../math';
import { pythagorasRig, SYM, uvToLocal } from '../rig';

const ORIGIN = station('pythagoras');

/** Angle of P2 seen from P1 in the story triangle: where the swing starts. */
function swingStart(a: number, b: number, gammaDeg: number) {
  const t = triangle(a, b, gammaDeg);
  return Math.atan2(t.P2[1] - t.P1[1], t.P2[0] - t.P1[0]);
}

/**
 * The scratched triangle: sand grooves, the stick, the right-angle mark, side labels, and the
 * handoff where the hypotenuse swings round P1 and carves a circle.
 */
export function Drawing() {
  const rig = pythagorasRig();
  const stick = useRef<THREE.Group>(null);
  const mark = useRef<ChalkLineHandle | null>(null);
  const radiusLine = useRef<ChalkLineHandle | null>(null);
  const legA = useRef<ChalkLineHandle | null>(null);
  const legB = useRef<ChalkLineHandle | null>(null);
  const labelGroups = useRef<Array<THREE.Group | null>>([]);
  const labelEls = useRef<Array<HTMLDivElement | null>>([]);

  useFrame((state) => {
    const S = rig.scale;
    const t = triangle(rig.a, rig.b, rig.gamma);
    const w = (u: number, v: number, y = 0) => uvToLocal(u, v, S, y);
    const verts = [t.P0, t.P1, t.P2].map(([u, v]) => w(u, v));

    // Sand grooves (world xz).
    beachSand.uTri.value.forEach((vec, i) => vec.set(ORIGIN.x + verts[i]![0], ORIGIN.z + verts[i]![2]));
    beachSand.uDraw.value = rig.draw;
    beachSand.uGroove.value = rig.groove;
    beachSand.uGrooveW.value = 0.035 * Math.max(0.6, S / 0.55);

    // Circle carved by the swinging hypotenuse, centred on P1.
    const P1 = verts[1]!;
    const theta0 = swingStart(rig.a, rig.b, rig.gamma);
    beachSand.uCircleC.value.set(ORIGIN.x + P1[0], ORIGIN.z + P1[2]);
    beachSand.uCircleR.value = t.c * S;
    // World angle is measured in xz where z = -v, so the uv angle flips sign.
    beachSand.uCircleA0.value = -theta0;
    beachSand.uCircleP.value = rig.circle;

    // Stick follows the drawing point, tilted like a hand holding it.
    const g = stick.current;
    if (g) {
      const [pu, pv] = perimeterPoint(t, rig.draw);
      const [x, , z] = w(pu, pv);
      const wobble = Math.sin(state.clock.elapsedTime * 13) * 0.004;
      g.position.set(x + wobble, 0, z);
      g.visible = rig.stick > 0.01;
      g.scale.setScalar(Math.max(rig.stick, 0.001));
    }

    // Right-angle mark at P0.
    const m = 0.45;
    const markPts: Pts = [w(m, 0, 0.012), w(m, m, 0.012), w(0, m, 0.012)];
    // Like the side labels, the mark steps aside while the tanks stand over the corner.
    mark.current?.set(
      markPts,
      rig.rightMark,
      rig.rightMark * rig.groove * (rig.gamma === 90 ? 1 : 0.25) * (1 - rig.tanks),
    );

    // Side labels appear as each side is finished.
    const centroid: [number, number] = [(t.P0[0] + t.P1[0] + t.P2[0]) / 3, (t.P0[1] + t.P1[1] + t.P2[1]) / 3];
    const sides: Array<[[number, number], [number, number], number]> = [
      [t.P0, t.P1, 1],
      [t.P0, t.P2, 3],
      [t.P1, t.P2, 2],
    ];
    sides.forEach(([A, B, doneAt], i) => {
      const mid: [number, number] = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
      const lu = mid[0] + (centroid[0] - mid[0]) * 0.38;
      const lv = mid[1] + (centroid[1] - mid[1]) * 0.38;
      const grp = labelGroups.current[i];
      if (grp) grp.position.set(...w(lu, lv, 0.08));
      const el = labelEls.current[i];
      // Side labels step aside while the tanks stand on the sides.
      if (el)
        el.style.opacity = String(
          rig.labels * smooth((rig.draw - doneAt + 0.25) / 0.25) * rig.groove * (1 - rig.tanks),
        );
    });

    // Handoff: the hypotenuse swings around P1 and the legs of the hidden right triangle follow it.
    const sweep = theta0 - rig.circle * Math.PI * 2;
    const R = t.c;
    const Q: [number, number] = [t.P1[0] + Math.cos(sweep) * R, t.P1[1] + Math.sin(sweep) * R];
    const corner: [number, number] = [Q[0], t.P1[1]];
    const ro = clamp01(rig.radius);
    radiusLine.current?.set([w(t.P1[0], t.P1[1], 0.02), w(Q[0], Q[1], 0.02)], 1, ro);
    legA.current?.set([w(t.P1[0], t.P1[1], 0.015), w(corner[0], corner[1], 0.015)], 1, ro * 0.8);
    legB.current?.set([w(corner[0], corner[1], 0.015), w(Q[0], Q[1], 0.015)], 1, ro * 0.8);
  });

  const labels: Array<[string, string]> = [
    ['a', SYM.a],
    ['b', SYM.b],
    ['c', SYM.c],
  ];

  return (
    <group>
      <group ref={stick} visible={false}>
        {/* A driftwood stick leaning toward the camera, tip at the origin. */}
        <mesh position={[0.311, 0.521, 0.233]} rotation={[0.42, 0, -0.5]} castShadow>
          <cylinderGeometry args={[0.013, 0.008, 1.3, 8]} />
          <meshStandardMaterial color="#9a7454" roughness={0.85} />
        </mesh>
      </group>
      <ChalkLine handle={mark} color="#f4efe6" width={2} />
      <ChalkLine handle={radiusLine} color={SYM.c} width={3.5} />
      <ChalkLine handle={legA} color={SYM.a} width={2.2} />
      <ChalkLine handle={legB} color={SYM.b} width={2.2} />
      {labels.map(([name, color], i) => (
        <group key={name} ref={(el) => void (labelGroups.current[i] = el)}>
          <MathLabel ref={(el) => void (labelEls.current[i] = el)} color={color}>
            <i>{name}</i>
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
