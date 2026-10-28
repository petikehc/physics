import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp01, easeOutCubic } from '../../../engine/ease';
import { mulberry32 } from '../../../engine/dust/shapes';
import { placeOnTop, WOOLSTHORPE } from '../earth';
import { LAUNCH_R } from '../math';
import { newtonRig, RADIUS, SYM5 } from '../rig';
import { earthTexture } from './earthTexture';

/** The mountain's peak, just under the cannon. */
const PEAK = RADIUS * LAUNCH_R - 0.016;
/** How far its base sinks into the ground, so it meets the curved surface all round. */
const SUNK = 0.14;

/** The globe turned so Woolsthorpe, where the apple fell, is on top, and the cannon fires east. */
const EARTH_TURN = (() => {
  const m = placeOnTop(WOOLSTHORPE.lat, WOOLSTHORPE.lon);
  const r = new THREE.Matrix4().set(
    m[0]!,
    m[1]!,
    m[2]!,
    0,
    m[3]!,
    m[4]!,
    m[5]!,
    0,
    m[6]!,
    m[7]!,
    m[8]!,
    0,
    0,
    0,
    0,
    1,
  );
  return new THREE.Quaternion().setFromRotationMatrix(r);
})();

/** A rocky peak, snow-capped, rising from the top of the planet (base at y = 0, a small flat top at its height). */
function mountainGeometry() {
  const height = PEAK - (RADIUS - SUNK);
  const BASE = 0.66;
  // Broad at the foot, steepening towards the top, with a ledge the cannon stands on.
  const profile: THREE.Vector2[] = [];
  for (let i = 0; i <= 8; i++) {
    const s = i / 8;
    profile.push(new THREE.Vector2(0.035 + (BASE - 0.035) * Math.pow(1 - s, 1.7), s * height));
  }
  profile.push(new THREE.Vector2(0, height));
  const g = new THREE.LatheGeometry(profile, 15);
  const rng = mulberry32(31);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const colors: number[] = [];
  const rock = new THREE.Color('#7d7268');
  const snow = new THREE.Color('#dde3ea');
  const c = new THREE.Color();
  // The same jitter for vertices that share a place (the lathe's seam), so the faces stay joined.
  const jitter = new Map<string, [number, number]>();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;
    let j = jitter.get(key);
    if (!j) {
      j = [1 + (rng() - 0.5) * 0.3, (rng() - 0.5) * 0.04];
      jitter.set(key, j);
    }
    const s = y / height;
    // The very top stays level, for the cannon.
    const k = s > 0.97 ? 0 : 1;
    pos.setXYZ(i, x * (1 + (j[0] - 1) * k), y + j[1] * k * s, z * (1 + (j[0] - 1) * k));
    c.lerpColors(rock, snow, clamp01((s - 0.58) / 0.14));
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

const airVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const airFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    // Rounding can push the dot a hair past 1; pow() of the negative rim is NaN on Apple GPUs, and bloom spreads one
    // NaN pixel over the whole frame, blanking it.
    float rim = max(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 0.0);
    float glow = pow(rim, 4.0) * 1.4 + pow(rim, 1.5) * 0.08;
    gl_FragColor = vec4(uColor * glow, glow * uOpacity);
  }
`;

/**
 * The small planet of Newton's thought experiment (the Earth, swollen at the end of chapter 4), with its thin
 * shell of air, the mountain so tall its top is far above it, and the cannon on top. It brings its own sunlight.
 */
export function Planet() {
  const rig = newtonRig();
  const planet = useRef<THREE.Mesh>(null);
  const air = useRef<THREE.Mesh>(null);
  const mountain = useRef<THREE.Mesh>(null);
  const cannon = useRef<THREE.Group>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const planetMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: earthTexture(),
        roughness: 0.75,
        emissive: new THREE.Color(SYM5.planet).multiplyScalar(0.12),
        // Always transparent, so it can fade in: three compiles an opaque material with its alpha fixed at 1.
        transparent: true,
        // Seen from far out in the Moon test, it must not fade into the fog.
        fog: false,
      }),
    [],
  );
  const airMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: airVertex,
        fragmentShader: airFragment,
        uniforms: { uColor: { value: new THREE.Color(SYM5.air) }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
      }),
    [],
  );
  const mountainGeo = useMemo(() => mountainGeometry(), []);
  const rockMat = useMemo(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }),
    [],
  );
  const bronze = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#b98a4e', metalness: 0.65, roughness: 0.38 }),
    [],
  );
  const timber = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6b4a2e', roughness: 0.8 }), []);

  useFrame(() => {
    const on = clamp01(rig.planet);
    if (planet.current) planet.current.visible = on > 0.001;
    planetMat.opacity = on;
    // While it fades in it writes no depth, so the stars behind it never cut holes in it.
    planetMat.depthWrite = on > 0.99;
    airMat.uniforms.uOpacity!.value = clamp01(rig.air) * on;
    if (air.current) air.current.visible = rig.air > 0.001 && on > 0.001;
    // The station's own sun: off while the chapter is not on screen, so it never lights its neighbours.
    if (key.current) key.current.intensity = 2.3 * on;
    if (rim.current) rim.current.intensity = 0.8 * on;

    const m = mountain.current;
    if (m) {
      const k = easeOutCubic(rig.mountain);
      m.visible = k > 0.001;
      m.scale.set(1, Math.max(k, 0.001), 1);
    }
    const g = cannon.current;
    if (g) {
      const k = easeOutCubic(rig.cannon);
      g.visible = k > 0.001;
      g.scale.setScalar(Math.max(k, 0.001));
    }
  });

  return (
    <group>
      <primitive object={target} />
      <directionalLight ref={key} position={[-7, 6, 9]} color="#fff3e2" intensity={0} target={target} />
      <directionalLight ref={rim} position={[3, 2, -9]} color="#9fc0ff" intensity={0} target={target} />
      <mesh ref={planet} material={planetMat} visible={false} quaternion={EARTH_TURN}>
        <sphereGeometry args={[RADIUS, 96, 64]} />
      </mesh>
      <mesh ref={air} material={airMat} visible={false} renderOrder={3}>
        <sphereGeometry args={[RADIUS * 1.035, 96, 64]} />
      </mesh>
      <mesh
        ref={mountain}
        geometry={mountainGeo}
        material={rockMat}
        position={[0, RADIUS - SUNK, 0]}
        visible={false}
      />
      {/* The cannon, its muzzle exactly where the shots start, pointing along the ground (+x). */}
      <group ref={cannon} position={[0, RADIUS * LAUNCH_R, 0]} visible={false}>
        <mesh material={bronze} position={[-0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.0075, 0.0105, 0.06, 16]} />
        </mesh>
        <mesh material={bronze} position={[-0.061, 0, 0]}>
          <sphereGeometry args={[0.0095, 12, 8]} />
        </mesh>
        <mesh material={timber} position={[-0.034, -0.011, 0]}>
          <boxGeometry args={[0.046, 0.009, 0.022]} />
        </mesh>
        {[-0.013, 0.013].map((z) => (
          <mesh key={z} material={timber} position={[-0.03, -0.012, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.0085, 0.0085, 0.004, 14]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
