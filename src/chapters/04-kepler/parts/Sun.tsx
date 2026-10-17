import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp01, easeOutCubic, lerp } from '../../../engine/ease';
import { keplerRig, SYM4 } from '../rig';

const RADIUS = 0.36;
const coreGeo = new THREE.SphereGeometry(RADIUS, 48, 32);
const haloGeo = new THREE.PlaneGeometry(1, 1);

const halo = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float glow = exp(-d * d * 5.0) * 0.55 + exp(-d * 9.0) * 0.6;
    gl_FragColor = vec4(uColor * glow, glow * uOpacity * smoothstep(1.0, 0.7, d));
  }
`;

/**
 * The Sun at the focus: a bright core (it blooms) inside a soft, camera-facing halo, and the point light that
 * lights the planets. While the pins draw the ellipse it shrinks to a spark, so the pin at its place shows.
 */
export function Sun() {
  const rig = keplerRig();
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const core = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(SYM4.sun).multiplyScalar(2.2),
        toneMapped: false,
      }),
    [],
  );
  const haloMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: halo,
        uniforms: { uColor: { value: new THREE.Color('#ffb85c') }, uOpacity: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const on = easeOutCubic(rig.sun);
    const s =
      on * lerp(0.22, 1, clamp01(rig.sunInFocus)) * (1 + Math.sin(state.clock.elapsedTime * 1.3) * 0.015);
    g.visible = rig.sun > 0.001;
    g.scale.setScalar(Math.max(s, 0.001));
    glow.current?.quaternion.copy(state.camera.quaternion);
    haloMat.uniforms.uOpacity!.value = on;
    if (light.current) light.current.intensity = 2.6 * on;
  });

  return (
    <group>
      <group ref={group} visible={false}>
        <mesh geometry={coreGeo} material={core} />
        <mesh ref={glow} geometry={haloGeo} material={haloMat} scale={RADIUS * 7} renderOrder={2} />
      </group>
      {/* No falloff: Saturn, twenty units out, must still catch the light. */}
      <pointLight ref={light} color="#fff1d8" intensity={0} decay={0} />
    </group>
  );
}
