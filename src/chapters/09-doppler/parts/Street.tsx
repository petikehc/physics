import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp01 } from '../../../engine/ease';
import { dopplerRig, HALF_ROAD, KERB, PAVEMENT, STREET, SYM9 } from '../rig';

const LENGTH = STREET[1] - STREET[0];
const MID = (STREET[0] + STREET[1]) / 2;
/** A streetlight every so many metres along each side, the far side's halfway between the near side's. */
const LAMP_EVERY = 32;
const LAMP_H = 7.2;
/** How far each lamp's arm reaches out over the road. */
const ARM = 1.9;

/** Deterministic pseudo-random numbers, so the street is the same every time. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** A soft round pool of light, bright in the middle and gone at the edge (as an alpha map, read from green). */
function poolTexture(): THREE.DataTexture {
  const n = 64;
  const data = new Uint8Array(n * n * 4);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const r = Math.hypot(i - n / 2 + 0.5, j - n / 2 + 0.5) / (n / 2);
      const a = Math.max(0, 1 - r);
      const k = (j * n + i) * 4;
      data[k] = data[k + 1] = data[k + 2] = Math.round(255 * a * a * (3 - 2 * a));
      data[k + 3] = 255;
    }
  const t = new THREE.DataTexture(data, n, n);
  t.needsUpdate = true;
  return t;
}

interface Block {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

/** The buildings along both sides: a row on the far side, and on the near side only away from where the story is. */
function blocks(): Block[] {
  const rand = seeded(9);
  const out: Block[] = [];
  for (const side of [-1, 1]) {
    let x = STREET[0];
    while (x < STREET[1]) {
      const w = 9 + rand() * 14;
      const gap = rand() < 0.25 ? 3 + rand() * 4 : 0.4;
      const cx = x + w / 2;
      const near = side > 0;
      if (!near || Math.abs(cx) > 40) {
        const d = 10 + rand() * 8;
        const setback = near ? 9 : PAVEMENT + 1;
        out.push({ x: cx, z: side * (setback + d / 2), w, d, h: 8 + rand() * (near ? 14 : 24) });
      }
      x += w + gap;
    }
  }
  return out;
}

/** The buildings' windows: a grid on every wall, some lit warm, a few cool, the rest dark glass. */
function windowMaterial(): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: '#16171d', roughness: 0.92, metalness: 0 });
  const uniforms = { uLit: { value: 0 } };
  m.userData.uniforms = uniforms;
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorld;\nvarying vec3 vWorldN;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        mat4 placed = modelMatrix;
        #ifdef USE_INSTANCING
          placed = modelMatrix * instanceMatrix;
        #endif
        vWorld = (placed * vec4(transformed, 1.0)).xyz;
        vWorldN = normalize(mat3(placed) * objectNormal);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uLit;
        varying vec3 vWorld;
        varying vec3 vWorldN;
        float hash3(vec3 p) {
          p = fract(p * vec3(443.897, 441.423, 437.195));
          p += dot(p, p.yzx + 19.19);
          return fract((p.x + p.y) * p.z);
        }`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        if (abs(vWorldN.y) < 0.5 && vWorld.y > 3.2) {
          float u = abs(vWorldN.x) > 0.5 ? vWorld.z : vWorld.x;
          vec2 cell = vec2(u / 3.1, (vWorld.y - 3.2) / 3.3);
          vec2 f = fract(cell);
          float inside = step(0.22, f.x) * step(f.x, 0.78) * step(0.3, f.y) * step(f.y, 0.82);
          float h = hash3(vec3(floor(cell), floor(vWorldN.x * 2.0 + vWorldN.z * 3.0)));
          vec3 warm = vec3(1.0, 0.74, 0.42) * (0.7 + 0.5 * fract(h * 13.0));
          vec3 cool = vec3(0.55, 0.7, 1.0) * 0.6;
          vec3 glass = vec3(0.03, 0.035, 0.05);
          vec3 lit = h > 0.94 ? cool : h > 0.66 ? warm : glass;
          totalEmissiveRadiance += lit * inside * uLit;
        }`,
      );
  };
  return m;
}

/**
 * A city street at night: two lanes of dark asphalt with a dashed centre line, kerbs and pavements, sodium
 * streetlights casting pools of orange on the road, and blocks of buildings with some windows lit.
 */
export function Street() {
  const rig = dopplerRig();
  const pool = useMemo(() => poolTexture(), []);
  const lamps = useMemo(() => {
    const out: Array<{ x: number; side: number }> = [];
    for (let x = STREET[0] + 10; x < STREET[1] - 4; x += LAMP_EVERY) {
      out.push({ x, side: 1 });
      out.push({ x: x + LAMP_EVERY / 2, side: -1 });
    }
    return out;
  }, []);
  const dashes = useMemo(() => {
    const out: number[] = [];
    for (let x = STREET[0]; x < STREET[1]; x += 9) out.push(x + 1.5);
    return out;
  }, []);
  const city = useMemo(() => blocks(), []);
  const windows = useMemo(() => windowMaterial(), []);

  const poles = useRef<THREE.InstancedMesh>(null);
  const arms = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);
  const pools = useRef<THREE.InstancedMesh>(null);
  const lines = useRef<THREE.InstancedMesh>(null);
  const buildings = useRef<THREE.InstancedMesh>(null);
  const headMat = useRef<THREE.MeshBasicMaterial>(null);
  const poolMat = useRef<THREE.MeshBasicMaterial>(null);
  const lineMat = useRef<THREE.MeshStandardMaterial>(null);
  const root = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    lamps.forEach(({ x, side }, i) => {
      const z = side * (HALF_ROAD + 1.2);
      poles.current?.setMatrixAt(i, m.compose(p.set(x, LAMP_H / 2, z), q.identity(), s.set(1, 1, 1)));
      arms.current?.setMatrixAt(
        i,
        m.compose(p.set(x, LAMP_H - 0.05, z - (side * ARM) / 2), q.identity(), s.set(1, 1, ARM)),
      );
      heads.current?.setMatrixAt(
        i,
        m.compose(p.set(x, LAMP_H - 0.2, z - side * ARM), q.identity(), s.set(1, 1, 1)),
      );
      pools.current?.setMatrixAt(i, m.compose(p.set(x, KERB + 0.02, z - side * ARM), flat, s.set(13, 13, 1)));
    });
    for (const inst of [poles, arms, heads, pools])
      if (inst.current) inst.current.instanceMatrix.needsUpdate = true;
    dashes.forEach((x, i) =>
      lines.current?.setMatrixAt(i, m.compose(p.set(x, 0.012, 0), flat, s.set(3, 0.14, 1))),
    );
    if (lines.current) lines.current.instanceMatrix.needsUpdate = true;
    city.forEach((b, i) =>
      buildings.current?.setMatrixAt(
        i,
        m.compose(p.set(b.x, b.h / 2, b.z), q.identity(), s.set(b.w, b.h, b.d)),
      ),
    );
    if (buildings.current) buildings.current.instanceMatrix.needsUpdate = true;
  }, [lamps, dashes, city]);

  useFrame(() => {
    const on = clamp01(rig.street);
    if (root.current) root.current.visible = on > 0.001;
    if (headMat.current) headMat.current.color.set(SYM9.sodium).multiplyScalar(0.25 + 2.2 * on);
    if (poolMat.current) poolMat.current.opacity = 0.42 * on;
    if (lineMat.current) lineMat.current.emissiveIntensity = 0.08 + 0.1 * on;
    (windows.userData.uniforms as { uLit: { value: number } }).uLit.value = on;
  });

  return (
    <group ref={root} visible={false}>
      {/* Dark ground all round, so the beach's sand never shows through. */}
      <mesh rotation-x={-Math.PI / 2} position={[MID, 0.004, 0]} receiveShadow>
        <planeGeometry args={[LENGTH + 260, 420]} />
        <meshStandardMaterial color="#0d0e12" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[MID, 0.008, 0]}>
        <planeGeometry args={[LENGTH, HALF_ROAD * 2]} />
        <meshStandardMaterial color="#1b1c22" roughness={0.82} />
      </mesh>
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh position={[MID, KERB / 2, side * ((HALF_ROAD + PAVEMENT) / 2)]}>
            <boxGeometry args={[LENGTH, KERB, PAVEMENT - HALF_ROAD]} />
            <meshStandardMaterial color="#2a2b31" roughness={0.95} />
          </mesh>
          <mesh position={[MID, KERB / 2 + 0.005, side * (HALF_ROAD + 0.12)]}>
            <boxGeometry args={[LENGTH, KERB + 0.01, 0.24]} />
            <meshStandardMaterial color="#4a4b52" roughness={0.9} />
          </mesh>
          {/* The road's edge lines. */}
          <mesh rotation-x={-Math.PI / 2} position={[MID, 0.012, side * (HALF_ROAD - 0.35)]}>
            <planeGeometry args={[LENGTH, 0.12]} />
            <meshStandardMaterial
              color="#cfc8b4"
              roughness={0.7}
              emissive="#cfc8b4"
              emissiveIntensity={0.1}
            />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={lines} args={[undefined, undefined, dashes.length]} frustumCulled={false}>
        <planeGeometry />
        <meshStandardMaterial
          ref={lineMat}
          color="#d8d1bd"
          roughness={0.7}
          emissive="#d8d1bd"
          emissiveIntensity={0.1}
        />
      </instancedMesh>
      <instancedMesh ref={poles} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.09, 0.13, LAMP_H, 8]} />
        <meshStandardMaterial color="#3a3c44" roughness={0.6} metalness={0.4} />
      </instancedMesh>
      <instancedMesh ref={arms} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
        <boxGeometry args={[0.1, 0.1, 1]} />
        <meshStandardMaterial color="#3a3c44" roughness={0.6} metalness={0.4} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
        <boxGeometry args={[0.7, 0.16, 0.36]} />
        <meshBasicMaterial ref={headMat} color={SYM9.sodium} toneMapped={false} />
      </instancedMesh>
      <instancedMesh
        ref={pools}
        args={[undefined, undefined, lamps.length]}
        frustumCulled={false}
        renderOrder={2}
      >
        <planeGeometry />
        <meshBasicMaterial
          ref={poolMat}
          color={SYM9.sodium}
          alphaMap={pool}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
      <instancedMesh
        ref={buildings}
        args={[undefined, windows, city.length]}
        frustumCulled={false}
        castShadow={false}
      >
        <boxGeometry />
      </instancedMesh>
    </group>
  );
}
