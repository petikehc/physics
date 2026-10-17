import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp01, easeOutCubic } from '../../../engine/ease';
import { mulberry32 } from '../../../engine/dust/shapes';
import { LAUNCH_R } from '../math';
import { newtonRig, RADIUS, SYM5 } from '../rig';

/** The mountain's peak, just under the cannon. */
const PEAK = RADIUS * LAUNCH_R - 0.016;
/** How far its base sinks into the ground, so it meets the curved surface all round. */
const SUNK = 0.14;

/** A smooth 3D value noise (for the planet's land and seas), from a seeded lattice. */
function valueNoise(seed: number) {
  const rng = mulberry32(seed);
  const table = Float32Array.from({ length: 4096 }, () => rng());
  const at = (x: number, y: number, z: number) =>
    table[((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & 4095]!;
  const s = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number, z: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const u = s(x - xi);
    const v = s(y - yi);
    const w = s(z - zi);
    const l = (a: number, b: number, t: number) => a + (b - a) * t;
    return l(
      l(l(at(xi, yi, zi), at(xi + 1, yi, zi), u), l(at(xi, yi + 1, zi), at(xi + 1, yi + 1, zi), u), v),
      l(
        l(at(xi, yi, zi + 1), at(xi + 1, yi, zi + 1), u),
        l(at(xi, yi + 1, zi + 1), at(xi + 1, yi + 1, zi + 1), u),
        v,
      ),
      w,
    );
  };
}

/** Seas and soft continents, wrapped round the sphere (sampled in 3D, so there is no seam). */
function planetTexture() {
  const W = 512;
  const H = 256;
  const noise = valueNoise(7);
  const fbm = (x: number, y: number, z: number) =>
    noise(x, y, z) * 0.55 + noise(x * 2.1, y * 2.1, z * 2.1) * 0.28 + noise(x * 4.3, y * 4.3, z * 4.3) * 0.17;
  const deep = new THREE.Color('#2f6cc0');
  const sea = new THREE.Color(SYM5.planet);
  const land = new THREE.Color('#6c9467');
  const high = new THREE.Color('#a39472');
  const c = new THREE.Color();
  const data = new Uint8Array(W * H * 4);
  for (let j = 0; j < H; j++) {
    const lat = (0.5 - (j + 0.5) / H) * Math.PI;
    for (let i = 0; i < W; i++) {
      const lon = ((i + 0.5) / W) * Math.PI * 2;
      const x = Math.cos(lat) * Math.cos(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lon);
      const h = fbm(x * 1.6 + 5, y * 1.6 + 5, z * 1.6 + 5);
      if (h > 0.53) c.lerpColors(land, high, clamp01((h - 0.6) / 0.15));
      else c.lerpColors(deep, sea, clamp01((h - 0.3) / 0.23));
      c.convertLinearToSRGB();
      const k = (j * W + i) * 4;
      data[k] = Math.round(c.r * 255);
      data[k + 1] = Math.round(c.g * 255);
      data[k + 2] = Math.round(c.b * 255);
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, W, H);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

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
  const snow = new THREE.Color('#c9d0d9');
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
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
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
        map: planetTexture(),
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
    if (key.current) key.current.intensity = 1.9 * on;
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
      <mesh ref={planet} material={planetMat} visible={false} rotation={[0.35, -1.1, 0]}>
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
