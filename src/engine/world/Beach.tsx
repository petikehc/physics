import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { createSandMaterial } from '../materials/sand';
import { SUN_DIR } from './Sky';
import { createPalette, DUSK, skyPalette } from './palette';
import { useApp } from '../../state/store';
import { runtime } from '../runtime';
import { station } from './stations';

/** Half-size of the shadow frustum around the active station (centred by its `shadow` offset). */
const SHADOW_HALF = 11;
/** Elevation of the shadow-casting sun (the visible sun sits much lower, on the horizon). */
const SHADOW_ELEVATION = (50 * Math.PI) / 180;
/** Light and fog as the world turns from the dusk beach (space 0) into deep space (space 1). */
const SUN_LIGHT = 1.7;
const HEMI_LIGHT = 0.75;
const FOG: Record<'near' | 'far', [number, number]> = { near: [26, 140], far: [150, 460] };

const sand = createSandMaterial();
sand.uniforms.uZenith.value.set(DUSK.zenith);
sand.uniforms.uMid.value.set(DUSK.mid);
sand.uniforms.uHorizon.value.set(DUSK.horizon);
sand.uniforms.uGlow.value.set(DUSK.glow);
sand.uniforms.uSunDir.value.copy(SUN_DIR);

/** Uniforms of the shared beach sand. Chapter stations write their grooves here every frame. */
export const beachSand = sand.uniforms;

/**
 * The dusk beach shared by the first chapters: sand plane, low sun with soft shadows, sky/ground fill,
 * fog that melts the horizon into the sky, and a procedural environment map for glass highlights.
 */
export function Beach() {
  const quality = useApp((s) => s.quality);
  const scene = useThree((s) => s.scene);

  const fog = useMemo(() => new THREE.Fog(DUSK.fog, FOG.near[0], FOG.far[0]), []);
  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  const chapterSlug = useApp((s) => s.chapterSlug);

  const sun = useMemo(() => {
    // Dim enough that the high shadow-casting angle doesn't flatten the dusk light.
    const light = new THREE.DirectionalLight('#ffb27a', SUN_LIGHT);
    light.castShadow = quality !== 'low';
    light.shadow.mapSize.set(2048, 2048);
    const cam = light.shadow.camera;
    cam.left = -SHADOW_HALF;
    cam.right = SHADOW_HALF;
    cam.top = SHADOW_HALF;
    cam.bottom = -SHADOW_HALF;
    cam.near = 5;
    cam.far = 90;
    light.shadow.bias = -0.0003;
    light.shadow.normalBias = 0.02;
    // Soft PCF edges instead of stair-stepped ones, and lighter shadows that don't read as holes.
    light.shadow.radius = 2.5;
    light.shadow.intensity = 0.72;
    return light;
  }, [quality]);

  // The last `space` the lights and haze were set for (a new sun light starts at full dusk strength).
  const last = useRef(-1);
  useEffect(() => {
    last.current = -1;
    return () => sun.dispose();
  }, [sun]);

  // The shadow frustum is fixed around the active station. Following the camera made shadows swim and jump.
  useEffect(() => {
    const o = station(chapterSlug);
    const cx = o.x + (o.shadow?.[0] ?? 0);
    const cz = o.z + (o.shadow?.[1] ?? 0);
    sun.target.position.set(cx, o.y, cz);
    sun.target.updateMatrixWorld();
    // A higher virtual sun than the visible one keeps shadows short and readable at dusk.
    const h = Math.hypot(SUN_DIR.x, SUN_DIR.z);
    const el = SHADOW_ELEVATION;
    sun.position.set(
      cx + (SUN_DIR.x / h) * Math.cos(el) * 40,
      o.y + Math.sin(el) * 40,
      cz + (SUN_DIR.z / h) * Math.cos(el) * 40,
    );
    sun.shadow.needsUpdate = true;
  }, [sun, chapterSlug]);

  const hemi = useRef<THREE.HemisphereLight>(null);
  const ground = useRef<THREE.Mesh>(null);
  const palette = useMemo(() => createPalette(), []);

  useFrame((state) => {
    beachSand.uTime.value = state.clock.elapsedTime;
    const space = runtime.world.space;
    if (space === last.current) return;
    last.current = space;
    // Rising into space: the sun and the sky's glow go out, the haze (and the sand far below, which fades into
    // it) turns the colour of the night, and the fog draws back so a whole solar system fits in view.
    skyPalette(space, palette);
    beachSand.uZenith.value.copy(palette.zenith);
    beachSand.uMid.value.copy(palette.mid);
    beachSand.uHorizon.value.copy(palette.horizon);
    beachSand.uGlow.value.copy(palette.glow);
    fog.color.copy(palette.fog);
    fog.near = THREE.MathUtils.lerp(FOG.near[0], FOG.near[1], space);
    fog.far = THREE.MathUtils.lerp(FOG.far[0], FOG.far[1], space);
    sun.intensity = SUN_LIGHT * (1 - space);
    if (hemi.current) hemi.current.intensity = HEMI_LIGHT * (1 - 0.85 * space);
    if (ground.current) ground.current.visible = space < 0.99;
  });

  return (
    <>
      <primitive object={sun} />
      <primitive object={sun.target} />
      <hemisphereLight ref={hemi} args={['#6a78a8', '#3a2418', HEMI_LIGHT]} />
      <ambientLight intensity={0.08} />
      <mesh ref={ground} rotation-x={-Math.PI / 2} receiveShadow material={sand.material}>
        <planeGeometry args={[4000, 4000, 1, 1]} />
      </mesh>
      <Environment resolution={128} frames={1}>
        <color attach="background" args={['#120f16']} />
        <Lightformer
          form="rect"
          intensity={3}
          color="#ffb070"
          position={[-6, 1.2, -8]}
          scale={[18, 1.6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          color="#7f8fc8"
          position={[0, 8, 0]}
          rotation-x={Math.PI / 2}
          scale={[20, 20, 1]}
        />
        <Lightformer form="rect" intensity={1.2} color="#f4efe6" position={[8, 2, 6]} scale={[4, 4, 1]} />
      </Environment>
    </>
  );
}
