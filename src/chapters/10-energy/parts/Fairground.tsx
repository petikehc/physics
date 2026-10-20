import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp01 } from '../../../engine/ease';
import { energyRig, SYM10 } from '../rig';

/** The Ferris wheel: where it stands (behind the brake run, clear of the loop), how big, how many cars, how fast it turns. */
const WHEEL = { x: 112, z: -40, r: 17, cars: 16, speed: 0.06 };
/** Lamp posts round the fairground (x, z), each throwing a pool of light. */
const LAMPS: Array<[number, number]> = [
  [-52, 10],
  [-30, 12],
  [-8, 12],
  [14, 12],
  [36, 12],
  [58, 12],
  [80, 12],
  [104, 12],
  [128, 12],
  [150, 4],
  [172, 12],
  [194, 12],
];
/** Strings of bulbs, each hung between two posts (x, z), sagging in the middle. */
const STRINGS: Array<[[number, number], [number, number]]> = [
  [
    [-52, 10],
    [-30, 12],
  ],
  [
    [-30, 12],
    [-8, 12],
  ],
  [
    [-8, 12],
    [14, 12],
  ],
  [
    [14, 12],
    [36, 12],
  ],
  [
    [36, 12],
    [58, 12],
  ],
  [
    [58, 12],
    [80, 12],
  ],
  [
    [80, 12],
    [104, 12],
  ],
  [
    [128, 12],
    [150, 4],
  ],
  [
    [150, 4],
    [172, 12],
  ],
  [
    [172, 12],
    [194, 12],
  ],
];
const POST_H = 6;
const PER_STRING = 14;
const SAG = 1.4;
const STRING_COLOURS = ['#ffd9a0', '#ff8a7a', '#9fd8ff', '#ffe08a', '#b6ffb0'];

function pool(): THREE.DataTexture {
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

/**
 * The fairground at night, at the end of chapter 9's street: dark ground, lamp posts with strings of coloured bulbs
 * between them, the coaster's station under a lit roof, and a Ferris wheel turning slowly behind it all.
 */
export function Fairground() {
  const rig = energyRig();
  const root = useRef<THREE.Group>(null);
  const wheel = useRef<THREE.Group>(null);
  const gondolas = useRef<Array<THREE.Group | null>>([]);
  const bulbs = useRef<THREE.InstancedMesh>(null);
  const rimBulbs = useRef<THREE.InstancedMesh>(null);
  const roofMat = useRef<THREE.MeshBasicMaterial>(null);
  const tex = useMemo(() => pool(), []);
  // Shared by every lamp post.
  const poolMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffcf8a',
        alphaMap: tex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [tex],
  );
  const headMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffe2b0', toneMapped: false }), []);
  const RIM = 64;

  const stringPts = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    for (const [[x0, z0], [x1, z1]] of STRINGS)
      for (let k = 1; k < PER_STRING; k++) {
        const u = k / PER_STRING;
        out.push([x0 + (x1 - x0) * u, POST_H - 0.3 - SAG * 4 * u * (1 - u), z0 + (z1 - z0) * u]);
      }
    return out;
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    stringPts.forEach((p, i) => {
      bulbs.current?.setMatrixAt(i, m.makeTranslation(...p));
      bulbs.current?.setColorAt(i, c.set(STRING_COLOURS[i % STRING_COLOURS.length]!));
    });
    if (bulbs.current) bulbs.current.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < RIM; i++) {
      const a = (i / RIM) * Math.PI * 2;
      rimBulbs.current?.setMatrixAt(i, m.makeTranslation(Math.cos(a) * WHEEL.r, Math.sin(a) * WHEEL.r, 0.6));
      rimBulbs.current?.setColorAt(i, c.set(SYM10.bulb));
    }
    if (rimBulbs.current) rimBulbs.current.instanceMatrix.needsUpdate = true;
  }, [stringPts]);

  const colour = useMemo(() => new THREE.Color(), []);
  useFrame((state) => {
    const on = clamp01(rig.fair);
    if (root.current) root.current.visible = on > 0.001;
    if (!root.current?.visible) return;
    const t = state.clock.elapsedTime;
    const a = t * WHEEL.speed;
    if (wheel.current) wheel.current.rotation.z = a;
    // The cars hang level as the wheel turns.
    gondolas.current.forEach((g, i) => {
      if (!g) return;
      const ga = a + (i / WHEEL.cars) * Math.PI * 2;
      g.position.set(Math.cos(ga) * WHEEL.r, Math.sin(ga) * WHEEL.r - 1.2, 0.9);
    });
    poolMat.opacity = 0.38 * on;
    headMat.color.set('#ffe2b0').multiplyScalar(0.3 + 2 * on);
    if (roofMat.current) roofMat.current.color.set(SYM10.bulb).multiplyScalar(0.3 + 1.6 * on);
    // The wheel's rim lights run round; the strings twinkle.
    const mesh = rimBulbs.current;
    if (mesh) {
      for (let i = 0; i < RIM; i++) {
        const k = (((i - t * 10) % 16) + 16) % 16 < 3 ? 2.4 : 0.6;
        mesh.setColorAt(i, colour.set(i % 2 ? SYM10.bulb : SYM10.pe).multiplyScalar(k * on));
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    const b = bulbs.current;
    if (b) {
      for (let i = 0; i < stringPts.length; i++) {
        const k = 0.8 + 0.6 * Math.sin(t * 2.3 + i * 1.7);
        b.setColorAt(
          i,
          colour.set(STRING_COLOURS[i % STRING_COLOURS.length]!).multiplyScalar((0.6 + k) * on),
        );
      }
      if (b.instanceColor) b.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group ref={root} visible={false}>
      {/* The fairground's own ground, from where the street's ends on (it starts 55 m back, under the street's end). */}
      <mesh rotation-x={-Math.PI / 2} position={[115, 0, 0]} receiveShadow>
        <planeGeometry args={[340, 420]} />
        <meshStandardMaterial color="#0f1014" roughness={1} />
      </mesh>
      {LAMPS.map(([x, z]) => (
        <group key={`${x}:${z}`} position={[x, 0, z]}>
          <mesh position={[0, POST_H / 2, 0]}>
            <cylinderGeometry args={[0.1, 0.14, POST_H, 8]} />
            <meshStandardMaterial color="#3a3c44" roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[0, POST_H + 0.2, 0]} material={headMat}>
            <sphereGeometry args={[0.32, 14, 10]} />
          </mesh>
          <mesh
            rotation-x={-Math.PI / 2}
            position={[0, 0.03, 0]}
            scale={[14, 14, 1]}
            renderOrder={2}
            material={poolMat}
          >
            <planeGeometry />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={bulbs} args={[undefined, undefined, stringPts.length]} frustumCulled={false}>
        <sphereGeometry args={[0.11, 8, 6]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
      {/* The coaster's station: a platform under a roof with a lit fascia. */}
      <group position={[-41, 0, 0]}>
        <mesh position={[0, 0.9, 2.4]}>
          <boxGeometry args={[11, 1.8, 2.6]} />
          <meshStandardMaterial color="#2a2c33" roughness={0.9} />
        </mesh>
        <mesh position={[0, 6.2, 0.6]}>
          <boxGeometry args={[12, 0.35, 6]} />
          <meshStandardMaterial color="#1c1e24" roughness={0.8} />
        </mesh>
        <mesh position={[0, 5.8, 3.62]}>
          <boxGeometry args={[12, 0.45, 0.06]} />
          <meshBasicMaterial ref={roofMat} color={SYM10.bulb} toneMapped={false} />
        </mesh>
        {[-5.6, 5.6].map((x) => (
          <mesh key={x} position={[x, 3, 3.4]}>
            <boxGeometry args={[0.25, 6, 0.25]} />
            <meshStandardMaterial color="#3a3c44" roughness={0.6} metalness={0.4} />
          </mesh>
        ))}
      </group>
      {/* The Ferris wheel: two rims, spokes, a hub on its trestle, and its cars. */}
      <group position={[WHEEL.x, WHEEL.r + 3, WHEEL.z]}>
        <group ref={wheel}>
          {[-0.6, 0.6].map((z) => (
            <mesh key={z} position={[0, 0, z]}>
              <torusGeometry args={[WHEEL.r, 0.12, 6, 96]} />
              <meshStandardMaterial color="#8a8f9c" roughness={0.4} metalness={0.6} />
            </mesh>
          ))}
          {Array.from({ length: WHEEL.cars }, (_, i) => (
            <mesh key={i} rotation-z={(i / WHEEL.cars) * Math.PI * 2}>
              <boxGeometry args={[WHEEL.r * 2, 0.08, 0.08]} />
              <meshStandardMaterial color="#6d7280" roughness={0.5} metalness={0.5} />
            </mesh>
          ))}
          <instancedMesh ref={rimBulbs} args={[undefined, undefined, RIM]} frustumCulled={false}>
            <sphereGeometry args={[0.16, 8, 6]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </instancedMesh>
        </group>
        <mesh rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.7, 0.7, 2, 16]} />
          <meshStandardMaterial color="#4a4f5c" roughness={0.5} metalness={0.5} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * ((WHEEL.r + 3) * 0.28), -(WHEEL.r + 3) / 2, -1.4]}
            rotation-z={side * -0.29}
          >
            <boxGeometry args={[0.4, WHEEL.r + 3.6, 0.4]} />
            <meshStandardMaterial color="#3a3c44" roughness={0.6} metalness={0.4} />
          </mesh>
        ))}
        {Array.from({ length: WHEEL.cars }, (_, i) => (
          <group key={i} ref={(el) => void (gondolas.current[i] = el)}>
            <mesh>
              <boxGeometry args={[1.6, 1.4, 1.3]} />
              <meshStandardMaterial
                color={i % 3 === 0 ? SYM10.pe : i % 3 === 1 ? '#3f7fbf' : '#c94a5a'}
                roughness={0.5}
                emissive={i % 3 === 0 ? SYM10.pe : i % 3 === 1 ? '#3f7fbf' : '#c94a5a'}
                emissiveIntensity={0.25}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
