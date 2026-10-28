import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp01 } from '../../../engine/ease';
import { shells } from '../math';
import { dopplerRig, KERB, MAX_AGE, MAX_SHELLS, PERIOD, source, SYM9 } from '../rig';

/**
 * Blue where the waves are bunched (a higher note), red where they are stretched (a lower one): the wave's spacing in
 * that direction over its spacing standing still, 1 − M cos θ, as a colour.
 */
const STRETCH_GLSL = /* glsl */ `
  uniform vec3 uBlue;
  uniform vec3 uRed;
  vec3 stretchColor(float m, float cosTheta) {
    float t = clamp((1.0 - m * cosTheta - 1.0) / 0.45, -1.0, 1.0);
    vec3 white = vec3(0.92, 0.94, 1.0);
    return t < 0.0 ? mix(white, uBlue, -t) : mix(white, uRed, t);
  }
`;

const colours = () => ({
  uBlue: { value: new THREE.Color(SYM9.blue).multiplyScalar(1.3) },
  uRed: { value: new THREE.Color(SYM9.red).multiplyScalar(1.2) },
});

function sphereMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    // Front faces only: from inside a wave, it is not drawn at all, rather than fogging the whole picture.
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    uniforms: { ...colours(), uOpacity: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute vec2 aInfo;
      varying vec3 vLocal;
      varying vec3 vN;
      varying vec3 vView;
      varying vec2 vInfo;
      void main() {
        vLocal = position;
        vInfo = aInfo;
        vec4 mv = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        vN = normalize(mat3(viewMatrix) * mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3 vLocal;
      varying vec3 vN;
      varying vec3 vView;
      varying vec2 vInfo;
      ${STRETCH_GLSL}
      void main() {
        float rim = max(1.0 - abs(dot(normalize(vN), normalize(vView))), 0.0);
        float a = (0.03 + 0.97 * pow(rim, 4.0)) * vInfo.x * uOpacity;
        gl_FragColor = vec4(stretchColor(vInfo.y, normalize(vLocal).x) * a * 0.2, 1.0);
      }
    `,
  });
}

function ringMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      ...colours(),
      uShells: { value: Array.from({ length: MAX_SHELLS }, () => new THREE.Vector4()) },
      uCount: { value: 0 },
      uSource: { value: new THREE.Vector2() },
      uOpacity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vXZ;
      void main() {
        vXZ = position.xz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      #define MAX ${MAX_SHELLS}
      uniform vec4 uShells[MAX];
      uniform int uCount;
      uniform vec2 uSource;
      uniform float uOpacity;
      varying vec2 vXZ;
      ${STRETCH_GLSL}
      void main() {
        vec3 col = vec3(0.0);
        for (int i = 0; i < MAX; i++) {
          if (i >= uCount) break;
          vec4 s = uShells[i];
          // Where the sphere sent from height uSource.x meets the ground: a ring.
          float h = uSource.x;
          if (s.y <= h) continue;
          float g = sqrt(s.y * s.y - h * h);
          float d = length(vXZ - vec2(s.x, uSource.y));
          float w = max(fwidth(d) * 1.4, 0.035);
          float line = 1.0 - smoothstep(0.0, w, abs(d - g));
          float cosTheta = (vXZ.x - s.x) / s.y;
          col += stretchColor(s.w, cosTheta) * line * s.z;
        }
        gl_FragColor = vec4(col * uOpacity * 0.75, 1.0);
      }
    `,
  });
}

/**
 * The waves the source has sent, as spheres growing from where it was when it sent each one, and as the rings they
 * draw where they meet the ground. Each is coloured by how bunched or stretched it is in each direction.
 */
export function Shells() {
  const rig = dopplerRig();
  const spheres = useRef<THREE.InstancedMesh>(null);
  const sphereMat = useMemo(() => sphereMaterial(), []);
  const ringMat = useMemo(() => ringMaterial(), []);
  const info = useMemo(() => new THREE.InstancedBufferAttribute(new Float32Array(MAX_SHELLS * 2), 2), []);
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 40, 24);
    g.setAttribute('aInfo', info);
    return g;
  }, [info]);
  const ground = useMemo(() => {
    const g = new THREE.PlaneGeometry(240, 90, 1, 1);
    g.rotateX(-Math.PI / 2);
    g.translate(0, KERB + 0.035, 0);
    return g;
  }, []);
  const m = useMemo(() => new THREE.Matrix4(), []);

  useFrame(() => {
    const showSpheres = clamp01(rig.spheres);
    const showRings = clamp01(rig.rings);
    const mesh = spheres.current;
    if (!mesh) return;
    if (showSpheres + showRings < 0.001) {
      mesh.count = 0;
      ringMat.uniforms.uCount!.value = 0;
      return;
    }
    const s = source(rig);
    const ws = shells(s.path, s.c, s.now, PERIOD, rig.from, MAX_AGE).slice(0, MAX_SHELLS);
    const ring = ringMat.uniforms.uShells!.value as THREE.Vector4[];
    ws.forEach((w, i) => {
      const age = s.now - w.sent;
      // New waves swell in from nothing; old ones fade out before they vanish.
      const fade = clamp01(w.r / 0.6) * clamp01((MAX_AGE - age) / 1.2);
      // How fast the source was going when it sent this wave decides how bunched it is.
      const mw = s.machAt(w.sent);
      m.makeScale(Math.max(w.r, 1e-3), Math.max(w.r, 1e-3), Math.max(w.r, 1e-3)).setPosition(
        w.x,
        s.at[1],
        s.at[2],
      );
      mesh.setMatrixAt(i, m);
      info.setXY(i, fade, mw);
      ring[i]!.set(w.x, w.r, fade, mw);
    });
    mesh.count = ws.length;
    mesh.instanceMatrix.needsUpdate = true;
    info.needsUpdate = true;
    sphereMat.uniforms.uOpacity!.value = showSpheres;
    ringMat.uniforms.uCount!.value = ws.length;
    (ringMat.uniforms.uSource!.value as THREE.Vector2).set(s.at[1] - KERB, s.at[2]);
    ringMat.uniforms.uOpacity!.value = showRings;
  });

  return (
    <group>
      <instancedMesh
        ref={spheres}
        args={[geometry, sphereMat, MAX_SHELLS]}
        frustumCulled={false}
        renderOrder={11}
      />
      <mesh geometry={ground} material={ringMat} frustumCulled={false} renderOrder={10} />
    </group>
  );
}
