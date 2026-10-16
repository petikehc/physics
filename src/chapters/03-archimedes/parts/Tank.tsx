import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { easeOutCubic } from '../../../engine/ease';
import { glassMaterial } from '../../../engine/materials/water';
import { FLUIDS } from '../math';
import { waterY } from '../hang';
import { archimedesRig, OUT, SPOUT, SYM3, TANK, uv } from '../rig';

export const stone = new THREE.MeshStandardMaterial({ color: SYM3.stone, roughness: 0.86, metalness: 0 });

/** The water's surface: a gently moving sheet, visible from above and (for the underwater shot) from below. */
function surfaceMaterial() {
  const uniforms = { uTime: { value: 0 }, uRipple: { value: 0 } };
  const m = new THREE.MeshPhysicalMaterial({
    color: FLUIDS[1]!.color,
    transparent: true,
    opacity: 0.78,
    roughness: 0.18,
    metalness: 0.05,
    emissive: new THREE.Color(FLUIDS[1]!.color),
    emissiveIntensity: 0.18,
    specularIntensity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uRipple;')
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `
        vec3 transformed = vec3(position);
        float r = length(position.xy);
        transformed.z += sin(position.x * 7.0 + uTime * 1.3) * 0.004 + sin(position.y * 9.0 - uTime * 1.1) * 0.004;
        transformed.z += sin(r * 26.0 - uTime * 9.0) * exp(-r * 2.2) * 0.02 * uRipple;`,
      );
  };
  m.customProgramCacheKey = () => 'archimedes-surface-v1';
  return { material: m, uniforms };
}

const wallGeo = new THREE.BoxGeometry(1, 1, 1);
// The body of the water, seen through the glass front: a box with its base at y = 0, scaled to the level.
const bodyGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
const spoutGeo = new THREE.BoxGeometry(0.34, 0.05, 0.14);

/**
 * The tank: a stone floor and three stone walls, and a glass front so the water (and whatever floats in it)
 * can be seen from the side. With its spout and the water's body and surface. Rises out of the sand with `tank`.
 */
export function Tank() {
  const rig = archimedesRig();
  const group = useRef<THREE.Group>(null);
  const surface = useRef<THREE.Mesh>(null);
  const body = useRef<THREE.Mesh>(null);
  const { material, uniforms } = useMemo(() => surfaceMaterial(), []);
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: FLUIDS[1]!.color,
        transparent: true,
        opacity: 0.42,
        roughness: 0.2,
        // A little light of its own, or the water reads as a dark slab against the shaded stone.
        emissive: new THREE.Color(FLUIDS[1]!.color),
        emissiveIntensity: 0.28,
        depthWrite: false,
      }),
    [],
  );
  const colour = useMemo(() => new THREE.Color(), []);
  const target = useMemo(() => new THREE.Color(), []);
  const ripple = useRef({ value: 0, prev: 0 });

  // Floor and four walls, as [centre u, centre v, centre y, size u, size v, size y].
  const walls = useMemo(() => {
    const { w, d, h, wall, floor } = TANK;
    return [
      [0, 0, floor / 2, w, d, floor],
      [-(w - wall) / 2, 0, h / 2, wall, d, h],
      [(w - wall) / 2, 0, h / 2, wall, d, h],
      [0, (d - wall) / 2, h / 2, w - 2 * wall, wall, h],
    ] as const;
  }, []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    g.visible = rig.tank > 0.001;
    if (!g.visible) return;
    g.position.y = -(TANK.h + 0.05) * (1 - easeOutCubic(rig.tank));
    uniforms.uTime.value = state.clock.elapsedTime;

    // Ripples follow anything moving through the surface (decaying when it stops).
    const motion = rig.lower + rig.lineup + rig.bubble + rig.play;
    const r = ripple.current;
    const moving = Math.min(Math.abs(motion - r.prev) / Math.max(dt, 1 / 120), 1);
    r.value += (moving - r.value) * Math.min(1, dt * (moving > r.value ? 8 : 1.2));
    r.prev = motion;
    uniforms.uRipple.value = r.value;

    const y = waterY(rig.level);
    const b = body.current;
    if (b) {
      b.position.y = TANK.floor;
      b.scale.set(TANK.w - 2 * TANK.wall, Math.max(y - TANK.floor - 0.004, 0.001), TANK.d - 2 * TANK.wall);
    }
    const s = surface.current;
    if (s) {
      s.position.y = y;
      const f = FLUIDS[Math.round(rig.fluid)] ?? FLUIDS[1]!;
      target.set(f.color);
      colour.copy(material.color).lerp(target, Math.min(1, dt * 4));
      material.color.copy(colour);
      material.emissive.copy(colour);
      bodyMaterial.color.copy(colour);
      bodyMaterial.emissive.copy(colour);
      // Mercury is opaque and mirror-like; the others are clear.
      const opaque = f.id === 'mercury';
      material.opacity += ((opaque ? 0.97 : 0.78) - material.opacity) * Math.min(1, dt * 4);
      material.metalness += ((opaque ? 0.9 : 0.05) - material.metalness) * Math.min(1, dt * 4);
      bodyMaterial.opacity += ((opaque ? 0.96 : 0.42) - bodyMaterial.opacity) * Math.min(1, dt * 4);
    }
  });

  const inner = { w: TANK.w - 2 * TANK.wall, d: TANK.d - 2 * TANK.wall };
  return (
    <group ref={group} visible={false}>
      {walls.map(([u, v, y, su, sv, sy], i) => (
        <mesh
          key={i}
          geometry={wallGeo}
          material={stone}
          position={uv(u, v, y)}
          scale={[su, sy, sv]}
          castShadow
          receiveShadow
        />
      ))}
      {/* Glass front, between the stone side walls. */}
      <mesh
        geometry={wallGeo}
        material={glassMaterial}
        position={uv(0, -(TANK.d - 0.03) / 2, TANK.h / 2 + TANK.floor / 2)}
        scale={[TANK.w - 2 * TANK.wall, TANK.h - TANK.floor, 0.03]}
        renderOrder={3}
      />
      <mesh
        geometry={spoutGeo}
        material={stone}
        position={uv(SPOUT.u - OUT * 0.06, SPOUT.v, SPOUT.y)}
        castShadow
      />
      <mesh ref={body} geometry={bodyGeo} material={bodyMaterial} renderOrder={1} />
      <mesh ref={surface} material={material} rotation-x={-Math.PI / 2} renderOrder={2}>
        <planeGeometry args={[inner.w, inner.d, 96, 48]} />
      </mesh>
    </group>
  );
}
