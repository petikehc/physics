import * as THREE from 'three';

/** Thin clear glass for tanks and beakers. */
export const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#cfe6ee',
  transparent: true,
  opacity: 0.13,
  // Not too glossy: a mirror-sharp sun highlight overflows the HDR buffer and blooms into rainbow rings.
  roughness: 0.16,
  metalness: 0.1,
  envMapIntensity: 1.6,
  specularIntensity: 0.6,
  side: THREE.DoubleSide,
  depthWrite: false,
});

/** Still water (or any liquid) seen through glass. */
export function waterMaterial(color: string) {
  // Physical only for specularIntensity: the low virtual sun would otherwise glare off every water surface.
  return new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity: 0.86,
    roughness: 0.34,
    metalness: 0.05,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.22,
    envMapIntensity: 1.0,
    specularIntensity: 0.3,
  });
}

/** A falling stream: an open cylinder whose surface flows downward. */
export function streamMaterial(color: string) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float flow = sin(vUv.y * 40.0 + uTime * 26.0 + sin(vUv.x * 12.0) * 2.0) * 0.5 + 0.5;
        float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
        vec3 col = uColor * (1.0 + flow * 0.6);
        gl_FragColor = vec4(col, uOpacity * (0.55 + 0.35 * flow) * (0.6 + 0.4 * edge));
      }
    `,
  });
}
