import * as THREE from 'three';
import { SKY_FN_GLSL, SKY_UNIFORMS_GLSL } from '../world/skyChunk';

export interface SandUniforms {
  uTime: { value: number };
  /** Triangle vertices in world xz. */
  uTri: { value: THREE.Vector2[] };
  /** 0..3 progress along the perimeter (a, then c, then b). */
  uDraw: { value: number };
  uGroove: { value: number };
  uGrooveW: { value: number };
  uCircleC: { value: THREE.Vector2 };
  uCircleR: { value: number };
  uCircleA0: { value: number };
  /** 0..1 fraction of the circle carved so far. */
  uCircleP: { value: number };
  uZenith: { value: THREE.Color };
  uMid: { value: THREE.Color };
  uHorizon: { value: THREE.Color };
  uGlow: { value: THREE.Color };
  uSunDir: { value: THREE.Vector3 };
  /** Distance haze range (world units). */
  uHaze: { value: THREE.Vector2 };
}

const common = /* glsl */ `
  uniform float uTime;
  uniform vec2 uTri[3];
  uniform float uDraw;
  uniform float uGroove;
  uniform float uGrooveW;
  uniform vec2 uCircleC;
  uniform float uCircleR;
  uniform float uCircleA0;
  uniform float uCircleP;
  varying vec3 vSandWorld;
  float gSandH;
  uniform vec2 uHaze;
  ${SKY_UNIFORMS_GLSL}
  ${SKY_FN_GLSL}

  float sandHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float sandNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(sandHash(i), sandHash(i + vec2(1.0, 0.0)), u.x),
               mix(sandHash(i + vec2(0.0, 1.0)), sandHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  float segDist(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return length(pa - ba * h);
  }

  float grooveDist(vec2 p) {
    float d = 1e3;
    for (int i = 0; i < 3; i++) {
      float prog = clamp(uDraw - float(i), 0.0, 1.0);
      if (prog > 0.0) {
        vec2 a = uTri[i];
        vec2 b = uTri[(i + 1) % 3];
        d = min(d, segDist(p, a, mix(a, b, prog)));
      }
    }
    return d;
  }

  float circleDist(vec2 p) {
    if (uCircleP <= 0.0) return 1e3;
    vec2 q = p - uCircleC;
    float ang = mod(atan(q.y, q.x) - uCircleA0, 6.2831853);
    float sweep = uCircleP * 6.2831853;
    if (ang <= sweep) return abs(length(q) - uCircleR);
    vec2 e0 = uCircleC + uCircleR * vec2(cos(uCircleA0), sin(uCircleA0));
    vec2 e1 = uCircleC + uCircleR * vec2(cos(uCircleA0 + sweep), sin(uCircleA0 + sweep));
    return min(length(p - e0), length(p - e1));
  }
`;

const perturb = /* glsl */ `
  vec3 sandPerturbNormal(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDir) {
    vec3 vSigmaX = dFdx(surf_pos.xyz);
    vec3 vSigmaY = dFdy(surf_pos.xyz);
    vec3 vN = surf_norm;
    vec3 R1 = cross(vSigmaY, vN);
    vec3 R2 = cross(vN, vSigmaX);
    float fDet = dot(vSigmaX, R1) * faceDir;
    vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
    return normalize(abs(fDet) * surf_norm - vGrad);
  }
`;

/**
 * Beach sand: MeshStandardMaterial (so it gets the sun, shadows and fog) with wind ripples, grain and
 * grooves scratched along the triangle and the circle, all computed per pixel.
 */
export function createSandMaterial(): { material: THREE.MeshStandardMaterial; uniforms: SandUniforms } {
  const uniforms: SandUniforms = {
    uTime: { value: 0 },
    uTri: { value: [new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()] },
    uDraw: { value: 0 },
    uGroove: { value: 1 },
    uGrooveW: { value: 0.035 },
    uCircleC: { value: new THREE.Vector2() },
    uCircleR: { value: 1 },
    uCircleA0: { value: 0 },
    uCircleP: { value: 0 },
    uZenith: { value: new THREE.Color() },
    uMid: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uGlow: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uHaze: { value: new THREE.Vector2(30, 260) },
  };

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#c4946a'),
    roughness: 0.96,
    metalness: 0,
    // The sand fades into the sky itself (below), not into a flat fog colour.
    fog: false,
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSandWorld;')
      .replace(
        '#include <fog_vertex>',
        '#include <fog_vertex>\n  vSandWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      );

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${common}\n${perturb}`)
      .replace(
        '#include <map_fragment>',
        /* glsl */ `#include <map_fragment>
        {
          vec2 p = vSandWorld.xz;
          // Wind ripples and soft dunes.
          float warp = sandNoise(p * 0.35) * 2.0;
          float ripple = sin(dot(p, vec2(0.82, 0.57)) * 9.0 + warp * 4.0 + sandNoise(p * 1.3) * 1.5) * 0.5 + 0.5;
          float dune = sandNoise(p * 0.08) * 0.35 + sandNoise(p * 0.22) * 0.12;
          // Fine grain fades out with distance to avoid shimmering.
          float fw = fwidth(p.x * 60.0);
          // Fade grain out well before it reaches pixel size, where it would shimmer as the camera moves.
          float grainFade = 1.0 - smoothstep(0.12, 0.4, fw);
          float grainN = sandHash(floor(p * 60.0)) * grainFade;
          // Ripples also fade with distance, before they alias.
          float rippleFade = 1.0 - smoothstep(0.25, 0.8, fwidth(p.x * 1.5));

          float w = uGrooveW;
          float d = min(grooveDist(p), circleDist(p));
          float groove = uGroove * (1.0 - smoothstep(w * 0.35, w, d));
          float rim = uGroove * smoothstep(w * 2.6, w * 1.2, d) * smoothstep(w * 0.75, w * 1.15, d);

          gSandH = dune * 0.9 + ripple * 0.011 * rippleFade + grainN * 0.0015 - groove * 0.05 + rim * 0.012;

          vec3 base = diffuseColor.rgb;
          base *= 0.9 + 0.18 * dune + 0.05 * ripple * rippleFade;
          base *= 0.95 + 0.1 * grainN;
          base = mix(base, base * 0.42, groove);
          base = mix(base, base * 1.18, rim * 0.6);
          diffuseColor.rgb = base;
        }`,
      )
      .replace(
        '#include <dithering_fragment>',
        /* glsl */ `#include <dithering_fragment>
        {
          // Distance haze into the sky colour along the view ray.
          vec3 ray = vSandWorld - cameraPosition;
          float dist = length(ray);
          vec3 dir = ray / dist;
          float haze = smoothstep(uHaze.x, uHaze.y, dist);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, skyColor(vec3(dir.x, 0.0, dir.z)), haze);
        }`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        /* glsl */ `#include <normal_fragment_maps>
        normal = sandPerturbNormal(-vViewPosition, normal, vec2(dFdx(gSandH), dFdy(gSandH)) * 1.0, faceDirection);`,
      );
  };
  // Distinct cache key so three does not reuse a plain MeshStandardMaterial program.
  material.customProgramCacheKey = () => 'sand-v3';

  return { material, uniforms };
}
