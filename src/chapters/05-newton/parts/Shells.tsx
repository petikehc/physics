import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle } from '../../../engine/lines/ChalkLine';
import { beside } from '../../../engine/labels/beside';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { clamp01, easeOutCubic, lerp, staggered } from '../../../engine/ease';
import { newtonRig, RADIUS, SHELLS, SYM5 } from '../rig';

const KS = [1, 2, 3];
/** The direction the patches lie in, from the planet's centre (towards the viewer's right and front). */
const DIR = new THREE.Vector3(0.55, 0.22, 1).normalize();
const SIDE = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), DIR).normalize();
const UPV = new THREE.Vector3().crossVectors(DIR, SIDE).normalize();

const shellVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const shellFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    float rim = max(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 0.0);
    float a = (pow(rim, 3.0) * 0.45 + 0.025) * uOpacity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

/** A point `along` out from the centre in DIR, shifted `s` sideways and `u` up (world units). */
const patchPoint = (along: number, s: number, u: number): [number, number, number] => [
  DIR.x * along + SIDE.x * s + UPV.x * u,
  DIR.y * along + SIDE.y * s + UPV.y * u,
  DIR.z * along + SIDE.z * s + UPV.z * u,
];

/** The grid of k × k tiles on the patch at k times the first distance (it is k times as wide). */
function tilesGeometry(k: number) {
  const along = SHELLS.r0 * k;
  const half = (SHELLS.patch * k) / 2;
  const pts: number[] = [];
  for (let i = 0; i <= k; i++) {
    const c = -half + (2 * half * i) / k;
    pts.push(...patchPoint(along, c, -half), ...patchPoint(along, c, half));
    pts.push(...patchPoint(along, -half, c), ...patchPoint(along, half, c));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

function fillGeometry(k: number) {
  const along = SHELLS.r0 * k;
  const half = (SHELLS.patch * k) / 2;
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [
        ...patchPoint(along, -half, -half),
        ...patchPoint(along, half, -half),
        ...patchPoint(along, half, half),
        ...patchPoint(along, -half, half),
      ],
      3,
    ),
  );
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}

/**
 * Why the pull falls with the square of the distance: it spreads out over spheres, like light from a lamp. The
 * same cone of pull crosses a patch at distance r, four times the area at 2r, nine times at 3r, so each tile
 * gets a quarter, a ninth.
 */
export function Shells() {
  const rig = newtonRig();
  const shells = useRef<Array<THREE.Mesh | null>>([]);
  const grids = useRef<Array<THREE.LineSegments | null>>([]);
  const fills = useRef<Array<THREE.Mesh | null>>([]);
  const rays = useMemo(() => [0, 1, 2, 3].map(() => ({ current: null as ChalkLineHandle | null })), []);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const shellMats = useMemo(
    () =>
      KS.map(
        () =>
          new THREE.ShaderMaterial({
            vertexShader: shellVertex,
            fragmentShader: shellFragment,
            uniforms: { uColor: { value: new THREE.Color(SYM5.pull) }, uOpacity: { value: 0 } },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
      ),
    [],
  );
  const gridGeos = useMemo(() => KS.map(tilesGeometry), []);
  const fillGeos = useMemo(() => KS.map(fillGeometry), []);
  const gridMats = useMemo(
    () =>
      KS.map(() => new THREE.LineBasicMaterial({ color: SYM5.pull, transparent: true, toneMapped: false })),
    [],
  );
  const fillMats = useMemo(
    () =>
      KS.map(
        () =>
          new THREE.MeshBasicMaterial({
            color: SYM5.pull,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false,
          }),
      ),
    [],
  );

  useFrame(() => {
    const tiles = clamp01(rig.tiles);
    KS.forEach((k, i) => {
      const p = easeOutCubic(staggered(clamp01(rig.shells), i, KS.length, 0.25));
      const m = shells.current[i];
      if (m) {
        m.visible = p > 0.001;
        m.scale.setScalar(lerp(RADIUS, SHELLS.r0 * k, p));
      }
      shellMats[i]!.uniforms.uOpacity!.value = p * (1 - 0.3 * tiles);
      const t = staggered(tiles, i, KS.length, 0.2);
      const g = grids.current[i];
      if (g) g.visible = t > 0.001;
      gridMats[i]!.opacity = t * 0.9;
      const f = fills.current[i];
      if (f) f.visible = t > 0.001;
      // The same pull through every patch: spread over k² tiles, each one gets 1/k² of it.
      fillMats[i]!.opacity = (t * 0.42) / (k * k);
      // Under the first and last patches (the last one's a little to the right), over the middle one: seen from far
      // off (on a phone), the patches stand closer together on the screen than their labels are wide.
      const over = k === 2 ? 1 : -1;
      labels.current[i]?.position.set(...patchPoint(SHELLS.r0 * k, 0, (over * SHELLS.patch * k) / 2));
      const el = texts.current[i];
      if (el) {
        el.style.opacity = String(t);
        beside(el, k === 3 ? 0.5 : 0, over, 8);
      }
    });
    // The cone of pull: four lines from the centre through the patches' corners.
    const reach = clamp01(rig.tiles * 1.6);
    const h = SHELLS.patch / 2;
    [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].forEach(([s, u], i) => {
      rays[i]!.current?.set(
        [[0, 0, 0], patchPoint(SHELLS.r0 * 3.15, s! * h * 3.15, u! * h * 3.15)],
        reach,
        0.5 * clamp01(rig.tiles * 3),
      );
    });
  });

  return (
    <group>
      {KS.map((k, i) => (
        <mesh
          key={`s${k}`}
          ref={(el) => void (shells.current[i] = el)}
          material={shellMats[i]}
          visible={false}
        >
          <sphereGeometry args={[1, 64, 40]} />
        </mesh>
      ))}
      {KS.map((k, i) => (
        <lineSegments
          key={`g${k}`}
          ref={(el) => void (grids.current[i] = el)}
          geometry={gridGeos[i]}
          material={gridMats[i]}
          visible={false}
        />
      ))}
      {KS.map((k, i) => (
        <mesh
          key={`f${k}`}
          ref={(el) => void (fills.current[i] = el)}
          geometry={fillGeos[i]}
          material={fillMats[i]}
          visible={false}
        />
      ))}
      {rays.map((handle, i) => (
        <ChalkLine key={i} handle={handle} color={SYM5.pull} width={1.2} />
      ))}
      {KS.map((k, i) => (
        <group key={`l${k}`} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel
            ref={(el) => void (texts.current[i] = el)}
            className="math-label math-label--chip"
            color={SYM5.pull}
          >
            {k === 1 ? 'r: 1 tile' : `${k}r: ${k * k} tiles, ${k === 2 ? '¼' : '⅑'} each`}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
