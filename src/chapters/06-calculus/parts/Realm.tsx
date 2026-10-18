import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp01 } from '../../../engine/ease';
import { calculusRig, SYM6, WALL_F } from '../rig';

const floorVertex = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const floorFragment = /* glsl */ `
  varying vec3 vPos;
  uniform vec3 uColor;
  uniform float uOn;
  uniform vec2 uCentre;
  // Antialiased lines every s units.
  float lines(vec2 p, float s) {
    vec2 q = p / s;
    vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }
  void main() {
    // The plane lies in x and y; it is turned to lie flat (its y becomes −z).
    vec2 p = vPos.xy;
    float d = length(p - uCentre);
    float fade = exp(-d * d / 420.0);
    float g = max(lines(p, 0.75) * 0.28, lines(p, 1.5) * 0.7);
    float a = g * fade * uOn;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

/**
 * "The abstract realm": no ground, no sky, only a glowing grid underfoot, fading into the dark, laid out in steps of
 * the graphs' own units. The station brings its own soft light, on only while the chapter is.
 */
export function Realm() {
  const rig = calculusRig();
  const key = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const floor = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: floorVertex,
        fragmentShader: floorFragment,
        uniforms: {
          uColor: { value: new THREE.Color(SYM6.grid) },
          uOn: { value: 0 },
          // The middle of the walls, in the plane's own coordinates.
          uCentre: { value: new THREE.Vector2(WALL_F.width / 2, 1) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const mesh = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const on = clamp01(rig.realm);
    floor.uniforms.uOn!.value = on;
    if (mesh.current) mesh.current.visible = on > 0.001;
    if (key.current) key.current.intensity = 1.6 * on;
    if (fill.current) fill.current.intensity = 0.7 * on;
  });

  return (
    <group>
      <primitive object={target} position={[WALL_F.width / 2, 2, 0]} />
      <directionalLight ref={key} position={[-4, 9, 10]} color="#f4ecff" intensity={0} target={target} />
      <directionalLight ref={fill} position={[10, 3, 4]} color="#b9a6ff" intensity={0} target={target} />
      <mesh ref={mesh} material={floor} rotation-x={-Math.PI / 2} visible={false} renderOrder={-1}>
        <planeGeometry args={[90, 90]} />
      </mesh>
    </group>
  );
}
