import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { runtime } from '../runtime';
import { getShape, mulberry32 } from './shapes';
import { useApp } from '../../state/store';

const vertex = /* glsl */ `
  attribute vec3 aPosA;
  attribute vec3 aPosB;
  attribute vec4 aRand;

  uniform float uMorph;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uSwirl;
  uniform float uDrift;
  uniform float uScale;

  varying float vAlpha;
  varying float vMix;

  vec3 swirl(vec3 p, float t) {
    return vec3(
      sin(p.y * 1.7 + t * 1.1) + sin(p.z * 2.3 - t * 0.7),
      sin(p.z * 1.3 + t * 0.9) + sin(p.x * 2.1 + t * 0.5),
      sin(p.x * 1.9 - t * 1.3) + sin(p.y * 2.7 + t * 0.6)
    ) * 0.5;
  }

  void main() {
    float stagger = 0.35;
    float m = clamp(uMorph * (1.0 + stagger) - aRand.x * stagger, 0.0, 1.0);
    m = m * m * (3.0 - 2.0 * m);
    vec3 p = mix(aPosA, aPosB, m);
    float mid = sin(3.14159 * m);
    p += swirl(p * 0.8 + aRand.yzw * 3.0, uTime) * mid * uSwirl * 0.9;
    p += swirl(p * 2.2 + aRand.zwx * 5.0, uTime * 0.6) * 0.012 * uDrift;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.55 + aRand.y * 0.9) * uPixelRatio;
    gl_PointSize = clamp(size * (18.0 * uScale) / -mv.z, 0.0, 28.0);

    float twinkle = 0.65 + 0.35 * sin(uTime * (1.5 + aRand.z * 4.0) + aRand.w * 6.2831);
    vAlpha = twinkle * (0.55 + 0.45 * aRand.w);
    vMix = aRand.y;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vMix;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    core = pow(core, 1.6);
    vec3 col = mix(uColorA, uColorB, smoothstep(0.35, 0.85, vMix));
    gl_FragColor = vec4(col * (0.7 + core), core * vAlpha * uOpacity);
  }
`;

const COUNTS = { low: 16000, medium: 34000, high: 56000 } as const;

/**
 * The Dust: one persistent particle system that carries every transition of the journey.
 * It reads `runtime.dust` each frame; shape keys select cached point clouds to morph between.
 */
export function Dust() {
  const quality = useApp((s) => s.quality);
  const count = COUNTS[quality];
  const pointsRef = useRef<THREE.Points>(null);
  const keys = useRef({ from: '', to: '' });
  const { gl } = useThree();

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const rng = mulberry32(99);
    const rand = new Float32Array(count * 4);
    for (let i = 0; i < rand.length; i++) rand[i] = rng();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aPosA', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aPosB', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
    // The cloud moves far from its rest positions; skip frustum culling rather than track bounds.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    keys.current = { from: '', to: '' };
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uMorph: { value: 1 },
          uTime: { value: 0 },
          uSize: { value: 1 },
          uPixelRatio: { value: 1 },
          uSwirl: { value: 1 },
          uDrift: { value: 1 },
          uScale: { value: 1 },
          uOpacity: { value: 1 },
          uColorA: { value: new THREE.Color('#f4efe6') },
          uColorB: { value: new THREE.Color('#f2b04a') },
        },
      }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  const spin = useRef(0);

  useFrame((state, dt) => {
    const rig = runtime.dust;
    const pts = pointsRef.current;
    if (!pts) return;

    if (rig.from !== keys.current.from) {
      (geometry.getAttribute('aPosA') as THREE.BufferAttribute).copyArray(
        getShape(rig.from, count),
      ).needsUpdate = true;
      keys.current.from = rig.from;
    }
    if (rig.to !== keys.current.to) {
      (geometry.getAttribute('aPosB') as THREE.BufferAttribute).copyArray(
        getShape(rig.to, count),
      ).needsUpdate = true;
      keys.current.to = rig.to;
    }

    const u = material.uniforms;
    u.uMorph!.value = rig.morph;
    u.uTime!.value = state.clock.elapsedTime;
    u.uSize!.value = rig.size;
    u.uPixelRatio!.value = gl.getPixelRatio();
    u.uSwirl!.value = rig.swirl;
    u.uDrift!.value = rig.drift;
    u.uScale!.value = rig.scale;
    u.uOpacity!.value = rig.opacity;
    (u.uColorA!.value as THREE.Color).set(rig.colorA);
    (u.uColorB!.value as THREE.Color).set(rig.colorB);

    spin.current += rig.spin * Math.min(dt, 0.1);
    pts.position.set(rig.x, rig.y, rig.z);
    pts.scale.setScalar(rig.scale);
    pts.rotation.y = rig.rotY + spin.current;
    pts.visible = rig.opacity > 0.001;
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} renderOrder={10} />
  );
}
