import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { clamp01, easeOutCubic } from '../../../engine/ease';
import { hangState } from '../hang';
import { archimedesRig, BAR_SIZE, CROWN_SIZE, GANTRY, HOOK_Y, SYM3, uv } from '../rig';

// Not too metallic: fully metallic gold mirrors the dark evening sky and reads as bronze.
export const goldMaterial = new THREE.MeshStandardMaterial({
  color: '#f7c955',
  metalness: 0.38,
  roughness: 0.28,
  envMapIntensity: 1.3,
  emissive: new THREE.Color('#3a2600'),
  transparent: true,
});
const wood = new THREE.MeshStandardMaterial({ color: '#6b4a2f', roughness: 0.8 });
const brass = new THREE.MeshStandardMaterial({ color: '#b98b45', metalness: 0.6, roughness: 0.35 });
const rope = new THREE.MeshStandardMaterial({ color: '#e7dcc5', roughness: 0.9 });

/** A crown about 0.6 wide and 0.34 tall, its base at y = 0: a band with seven jewelled points. */
function crownGeometry() {
  const { r, h } = CROWN_SIZE;
  const band = new THREE.LatheGeometry(
    [
      new THREE.Vector2(r - 0.03, 0),
      new THREE.Vector2(r, 0),
      new THREE.Vector2(r, 0.16),
      new THREE.Vector2(r - 0.03, 0.16),
      new THREE.Vector2(r - 0.03, 0),
    ],
    72,
  );
  const parts: THREE.BufferGeometry[] = [band.toNonIndexed()];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    const spike = new THREE.ConeGeometry(0.05, h - 0.16 - 0.02, 4).toNonIndexed();
    spike.translate(Math.cos(a) * (r - 0.015), 0.16 + (h - 0.18) / 2, Math.sin(a) * (r - 0.015));
    const jewel = new THREE.IcosahedronGeometry(0.028, 1).toNonIndexed();
    jewel.translate(Math.cos(a) * (r - 0.015), h - 0.02, Math.sin(a) * (r - 0.015));
    parts.push(spike, jewel);
  }
  // Merge by hand (positions and normals only) to keep this module free of three/examples imports.
  const count = parts.reduce((n, g) => n + g.getAttribute('position').count, 0);
  const pos = new Float32Array(count * 3);
  let o = 0;
  for (const g of parts) {
    const p = g.getAttribute('position').array as Float32Array;
    pos.set(p, o);
    o += p.length;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  merged.computeVertexNormals();
  return merged;
}

const crownGeo = crownGeometry();
const barGeo = new THREE.BoxGeometry(BAR_SIZE.u, BAR_SIZE.h, BAR_SIZE.v).translate(0, BAR_SIZE.h / 2, 0);
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 16);

/** Where the scale's hook hangs: it rises a little as the reading drops (exaggerated so it shows). */
function hookY(reading: number, weight: number) {
  return HOOK_Y - 0.04 - 0.9 * Math.max(0, reading / weight - 0.88);
}

/** The post and arm, the spring scale with its reading, the rope, and the crown or the gold bar on it. */
export function Hanging() {
  const rig = archimedesRig();
  const gantry = useRef<THREE.Group>(null);
  const plunger = useRef<THREE.Mesh>(null);
  const cord = useRef<THREE.Mesh>(null);
  const crown = useRef<THREE.Mesh>(null);
  const bar = useRef<THREE.Mesh>(null);
  const label = useRef<THREE.Group>(null);
  const text = useRef<HTMLDivElement>(null);
  const last = useRef('');
  const arm = useMemo(() => {
    const len = GANTRY.postV;
    return { len, mid: len / 2 };
  }, []);

  useFrame(() => {
    const g = gantry.current;
    if (!g) return;
    const grow = easeOutCubic(rig.gantry);
    g.visible = rig.gantry > 0.001;
    g.scale.set(1, Math.max(grow, 0.001), 1);

    const s = hangState(rig);
    const hook = hookY(s.reading, s.weight);
    const p = plunger.current;
    if (p) {
      // The scale's inner rod: from the housing down to the hook.
      const top = GANTRY.top - 0.6;
      p.position.set(...uv(0, 0, (top + hook) / 2));
      p.scale.set(0.018, Math.max(top - hook, 0.001), 0.018);
    }

    const show = rig.crown > 0.001 && rig.gantry > 0.5;
    const objTop = s.top;
    const fade = clamp01(rig.crown) * (1 - clamp01(rig.hookOut * 1.6));
    const c = cord.current;
    if (c) {
      c.visible = show && rig.hookOut < 0.6;
      c.position.set(...uv(0, 0, (hook + objTop) / 2));
      c.scale.set(0.008, Math.max(hook - objTop, 0.001), 0.008);
    }
    goldMaterial.opacity = fade;
    goldMaterial.transparent = fade < 0.999;
    goldMaterial.depthWrite = fade > 0.5;
    if (crown.current) {
      crown.current.visible = show && !s.isBar && fade > 0.001;
      crown.current.position.set(...uv(0, 0, s.bottom));
    }
    if (bar.current) {
      bar.current.visible = show && s.isBar && fade > 0.001;
      bar.current.position.set(...uv(0, 0, s.bottom));
    }

    label.current?.position.set(...uv(0.32, 0, GANTRY.top - 0.36));
    const el = text.current;
    if (el) {
      el.style.opacity = String(clamp01(rig.readout) * grow);
      const t = `${s.reading.toFixed(2)} N`;
      if (t !== last.current) {
        el.textContent = t;
        last.current = t;
      }
    }
  });

  return (
    <group>
      <group ref={gantry} visible={false}>
        {/* Post behind the tank and the arm reaching over its centre. */}
        <mesh
          geometry={unitBox}
          material={wood}
          position={uv(0, GANTRY.postV, GANTRY.top / 2)}
          scale={[0.14, GANTRY.top, 0.14]}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={unitBox}
          material={wood}
          position={uv(0, arm.mid, GANTRY.top + 0.05)}
          scale={[0.12, 0.12, arm.len + 0.14]}
          castShadow
        />
        {/* Spring scale: a brass housing hanging from the arm, with the rod that carries the hook. */}
        <mesh
          geometry={unitCyl}
          material={brass}
          position={uv(0, 0, GANTRY.top - 0.3)}
          scale={[0.07, 0.58, 0.07]}
          castShadow
        />
        <mesh ref={plunger} geometry={unitCyl} material={brass} />
      </group>
      <mesh ref={cord} geometry={unitCyl} material={rope} visible={false} />
      <mesh ref={crown} geometry={crownGeo} material={goldMaterial} castShadow visible={false} />
      <mesh ref={bar} geometry={barGeo} material={goldMaterial} castShadow visible={false} />
      <group ref={label}>
        <MathLabel ref={text} className="math-label math-label--chip" color={SYM3.weight}>
          9.80 N
        </MathLabel>
      </group>
    </group>
  );
}
