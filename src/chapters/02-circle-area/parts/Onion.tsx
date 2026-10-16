import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { easeInOutCubic, easeOutCubic, staggered } from '../../../engine/ease';
import { ringRadii, triangleBars } from '../math';
import { circleRig, RING_COUNT, RING_THICKNESS, SYM2 } from '../rig';

/**
 * Bends a straight strip into an arc of constant curvature. The strip is a box with x ∈ [-½, ½] along its
 * length and z ∈ [-½, ½] across its width. At uMix = 0 the strip closes into a full ring of radius uRho;
 * at uMix = 1 it is a straight bar 2π·uRho long. uAnchor is the strip's midpoint in station (u, v).
 */
const bendChunk = /* glsl */ `
  uniform float uRho;
  uniform float uDr;
  uniform float uMix;
  uniform vec2 uAnchor;
  uniform float uLift;

  float bendAngle(vec3 p) {
    float kappa = (1.0 - uMix) / uRho;
    return kappa * p.x * 6.2831853 * uRho;
  }

  vec2 bendPoint(vec3 p) {
    float L = 6.2831853 * uRho;
    float s = p.x * L;
    float kappa = (1.0 - uMix) / uRho;
    float a = kappa * s;
    vec2 c = kappa < 1e-4 ? vec2(s, 0.0) : vec2(sin(a) / kappa, (1.0 - cos(a)) / kappa);
    vec2 n = vec2(-sin(a), cos(a));
    // Width runs along -n, so that (with v = -z) the mapping is a pure rotation and keeps the winding.
    return uAnchor + c - n * (p.z * uDr);
  }
`;

interface RingUniforms {
  uRho: { value: number };
  uDr: { value: number };
  uMix: { value: number };
  uAnchor: { value: THREE.Vector2 };
  uLift: { value: number };
}

const BEND_VERTEX = /* glsl */ `
  vec2 bendUv = bendPoint(position);
  vec3 transformed = vec3(bendUv.x, position.y + uLift, -bendUv.y);`;

const BEND_NORMAL = /* glsl */ `
  float bendA = bendAngle(position);
  // The bend turns each slice of the strip about +y by bendA.
  vec3 objectNormal = vec3(
    normal.x * cos(bendA) + normal.z * sin(bendA),
    normal.y,
    -normal.x * sin(bendA) + normal.z * cos(bendA)
  );
  #ifdef USE_TANGENT
    vec3 objectTangent = vec3(tangent.xyz);
  #endif`;

/**
 * A ring's surface material and its shadow-pass twin, sharing one set of bend uniforms. Without the twin the
 * shadow map would see the unbent strip: a unit box over the station that shades everything under it.
 */
function ringMaterials(color: string) {
  const uniforms: RingUniforms = {
    uRho: { value: 1 },
    uDr: { value: 0.05 },
    uMix: { value: 0 },
    uAnchor: { value: new THREE.Vector2() },
    uLift: { value: 0 },
  };
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.35,
    roughness: 0.4,
    envMapIntensity: 1,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${bendChunk}`)
      .replace('#include <beginnormal_vertex>', BEND_NORMAL)
      .replace('#include <begin_vertex>', BEND_VERTEX);
  };
  material.customProgramCacheKey = () => 'onion-ring-v1';

  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  depth.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${bendChunk}`)
      .replace('#include <begin_vertex>', BEND_VERTEX);
  };
  depth.customProgramCacheKey = () => 'onion-ring-depth-v1';
  return { material, depth, uniforms };
}

// Long strip with many segments so the bend is smooth; base at y = 0.
const stripGeo = new THREE.BoxGeometry(1, RING_THICKNESS, 1, 160, 1, 1).translate(0, RING_THICKNESS / 2, 0);

/** The onion proof: a disc of thin rings that uncoil, outermost first, and stack into a triangle. */
export function Onion() {
  const rig = circleRig();
  const group = useRef<THREE.Group>(null);

  const rings = useMemo(
    () =>
      Array.from({ length: RING_COUNT }, (_, k) => {
        const { material, depth, uniforms } = ringMaterials(k % 2 === 0 ? SYM2.bronzeA : SYM2.bronzeB);
        const mesh = new THREE.Mesh(stripGeo, material);
        mesh.customDepthMaterial = depth;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        return { mesh, uniforms };
      }),
    [],
  );

  useEffect(
    () => () =>
      rings.forEach(({ mesh }) => {
        (mesh.material as THREE.Material).dispose();
        mesh.customDepthMaterial?.dispose();
      }),
    [rings],
  );

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const r = rig.r;
    g.visible = rig.rings > 0.001 && rig.ringsSink < 0.999;
    if (!g.visible) return;
    const radii = ringRadii(RING_COUNT, r);
    const bars = triangleBars(RING_COUNT, r);
    const dr = r / RING_COUNT;
    const rise = -RING_THICKNESS * 1.4 * (1 - easeOutCubic(rig.rings)) - rig.ringsSink * RING_THICKNESS * 1.6;
    const stagger = 0.55 / (RING_COUNT - 1);
    rings.forEach(({ uniforms }, k) => {
      const rho = radii[k]!;
      // Outermost rings unroll first.
      const q = staggered(rig.unroll, RING_COUNT - 1 - k, RING_COUNT, stagger);
      const e = easeInOutCubic(q);
      uniforms.uRho.value = rho;
      uniforms.uDr.value = dr * 0.92;
      uniforms.uMix.value = e;
      // The anchor (the ring's lowest point) travels from the disc to its place in the stack.
      const startV = -rho;
      const endV = bars[k]!.v;
      uniforms.uAnchor.value.set(0, startV + (endV - startV) * e);
      uniforms.uLift.value = rise + 0.008 + Math.sin(Math.PI * q) * 0.35;
    });
  });

  return (
    <group ref={group} visible={false}>
      {rings.map(({ mesh }) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
    </group>
  );
}
