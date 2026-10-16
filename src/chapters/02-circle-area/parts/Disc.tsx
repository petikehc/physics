import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { clamp01, easeOutCubic } from '../../../engine/ease';
import { circleRig, DISC_THICKNESS, SYM2, uv } from '../rig';

// Half-metallic: fully metallic bronze mirrors the cool evening sky and reads blue-black from above.
export const bronze = new THREE.MeshStandardMaterial({
  color: '#c99050',
  metalness: 0.35,
  roughness: 0.38,
  envMapIntensity: 1,
});

const discGeo = new THREE.CylinderGeometry(1, 1, DISC_THICKNESS, 128, 1);
const CUTS = 4;

/** The solid bronze disc, the knife strokes that cut it, and its radius. */
export function Disc() {
  const rig = circleRig();
  const mesh = useRef<THREE.Mesh>(null);
  const cuts = useMemo(
    () => Array.from({ length: CUTS }, () => ({ current: null as ChalkLineHandle | null })),
    [],
  );
  const radiusLine = useRef<ChalkLineHandle | null>(null);
  const radiusLabel = useRef<THREE.Group>(null);
  const radiusText = useRef<HTMLDivElement>(null);

  useFrame(() => {
    const r = rig.r;
    const T = DISC_THICKNESS;
    // Rise out of the sand, settling a hair above it (no z-fighting with the beach).
    const y = -T * 1.3 * (1 - easeOutCubic(rig.disc)) + 0.008;
    const m = mesh.current;
    if (m) {
      m.visible = rig.disc > 0.001 && rig.whole > 0.5;
      m.position.set(0, y + T / 2, 0);
      m.scale.set(r, 1, r);
    }
    const top = y + T + 0.006;
    // Four knife strokes: diameters at multiples of 45°, drawn one after another.
    for (let i = 0; i < CUTS; i++) {
      const p = clamp01(rig.cut * CUTS - i);
      const a = (i * Math.PI) / CUTS;
      const pts: Array<[number, number, number]> = [
        uv(-Math.cos(a) * r, -Math.sin(a) * r, top),
        uv(Math.cos(a) * r, Math.sin(a) * r, top),
      ];
      cuts[i]!.current?.set(pts, p, rig.whole > 0.5 && rig.disc > 0.5 ? 1 : 0);
    }
    // Radius line from the centre to the edge, with its label.
    const ra = -0.35;
    const end = uv(Math.cos(ra) * r, Math.sin(ra) * r, top + 0.004);
    radiusLine.current?.set([uv(0, 0, top + 0.004), end], 1, rig.radius * (rig.disc > 0.5 ? 1 : 0));
    radiusLabel.current?.position.set(
      ...uv(Math.cos(ra) * r * 0.55, Math.sin(ra) * r * 0.55 - 0.22, top + 0.05),
    );
    if (radiusText.current) radiusText.current.style.opacity = String(rig.radius);
  });

  return (
    <group>
      <mesh ref={mesh} geometry={discGeo} material={bronze} castShadow receiveShadow visible={false} />
      {cuts.map((handle, i) => (
        <ChalkLine key={i} handle={handle} color="#f4efe6" width={2.4} />
      ))}
      <ChalkLine handle={radiusLine} color={SYM2.r} width={3.2} />
      <group ref={radiusLabel}>
        <MathLabel ref={radiusText} color={SYM2.r}>
          <i>r</i>
        </MathLabel>
      </group>
    </group>
  );
}
