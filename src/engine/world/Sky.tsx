import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { runtime } from '../runtime';
import { SKY_FN_GLSL, SKY_UNIFORMS_GLSL } from './skyChunk';
import { createPalette, DUSK, skyPalette } from './palette';

/** Direction the low dusk sun shines *from* (normalised). Shared by the sky, sun light and sand. */
export const SUN_DIR = new THREE.Vector3(-0.78, 0.075, -0.62).normalize();

const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
    gl_Position.z = gl_Position.w; // keep the sky at the far plane
  }
`;

const fragment = /* glsl */ `
  ${SKY_UNIFORMS_GLSL}
  uniform float uTime;
  uniform float uStars;
  uniform float uSpace;
  varying vec3 vDir;

  float hash2(vec2 p) {
    p = fract(p * vec2(443.897, 441.423));
    p += dot(p, p.yx + 19.19);
    return fract((p.x + p.y) * p.x);
  }

  ${SKY_FN_GLSL}

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    float sunAmt = max(dot(d, uSunDir), 0.0);
    // Below the horizon the sand's haze takes over, so just hold the horizon colour.
    vec3 col = skyColor(vec3(d.x, max(h, 0.0), d.z));

    // Sun disc and a soft halo (gone in space, where each station brings its own sun).
    col += uGlow * smoothstep(0.99986, 0.99992, sunAmt) * 1.4 * (1.0 - uSpace);
    col += uGlow * pow(sunAmt, 90.0) * 0.22 * (1.0 - uSpace);

    // In space, a faint band of the Milky Way across the whole sphere.
    float across = dot(d, normalize(vec3(0.35, 0.82, -0.45)));
    float clouds = 0.6 + 0.4 * sin(d.x * 9.0 + sin(d.z * 7.0) * 2.0) * sin(d.y * 11.0 - d.z * 5.0);
    col += vec3(0.075, 0.07, 0.11) * exp(-across * across * 26.0) * clouds * uSpace;

    // Procedural stars: one candidate per cell of a lat-long grid, drawn as a soft dot.
    vec2 g = vec2(atan(d.z, d.x), asin(clamp(h, -1.0, 1.0))) * 150.0;
    vec2 cell = floor(g);
    vec2 f = fract(g) - 0.5;
    float s = hash2(cell);
    vec2 off = vec2(hash2(cell + 7.1), hash2(cell + 3.3)) - 0.5;
    float dist = length(f - off * 0.6);
    float bright = 0.4 + 0.6 * fract(s * 91.0);
    float sky = mix(smoothstep(0.06, 0.45, h), 1.0, uSpace);
    float star = step(0.982 - 0.008 * uSpace, s) * smoothstep(0.2 * bright, 0.0, dist) * sky;
    float tw = 0.65 + 0.35 * sin(uTime * (1.0 + s * 3.0) + s * 40.0);
    col += vec3(0.95, 0.92, 1.0) * star * tw * uStars * bright * (1.6 + 0.8 * uSpace);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function Sky({ stars = 1 }: { stars?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uZenith: { value: new THREE.Color(DUSK.zenith) },
          uMid: { value: new THREE.Color(DUSK.mid) },
          uHorizon: { value: new THREE.Color(DUSK.horizon) },
          uGlow: { value: new THREE.Color(DUSK.glow) },
          uSunDir: { value: SUN_DIR.clone() },
          uTime: { value: 0 },
          uStars: { value: stars },
          uSpace: { value: 0 },
        },
      }),
    [stars],
  );

  const ref = useRef<THREE.Mesh>(null);
  const palette = useMemo(() => createPalette(), []);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime!.value = state.clock.elapsedTime;
    const space = runtime.world.space;
    if (u.uSpace!.value !== space) {
      u.uSpace!.value = space;
      skyPalette(space, palette);
      u.uZenith!.value.copy(palette.zenith);
      u.uMid!.value.copy(palette.mid);
      u.uHorizon!.value.copy(palette.horizon);
      u.uGlow!.value.copy(palette.glow);
    }
    // The sky sphere follows the camera so it never clips during long flights.
    ref.current?.position.copy(state.camera.position);
  });

  return (
    <mesh ref={ref} material={material} frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[900, 48, 24]} />
    </mesh>
  );
}
