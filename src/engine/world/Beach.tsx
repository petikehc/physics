import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { createSandMaterial } from '../materials/sand';
import { DUSK, SUN_DIR } from './Sky';
import { useApp } from '../../state/store';
import { station } from './stations';

/** Half-size of the shadow frustum, and its centre relative to the station (covers the tanks and the proof frame). */
const SHADOW_HALF = 11;
const SHADOW_CENTRE: [number, number] = [3, 0];
/** Elevation of the shadow-casting sun (the visible sun sits much lower, on the horizon). */
const SHADOW_ELEVATION = (50 * Math.PI) / 180;

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

  useEffect(() => {
    scene.fog = new THREE.Fog(DUSK.fog, 26, 150);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  const chapterSlug = useApp((s) => s.chapterSlug);

  const sun = useMemo(() => {
    // Dim enough that the high shadow-casting angle doesn't flatten the dusk light.
    const light = new THREE.DirectionalLight('#ffb27a', 1.7);
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

  useEffect(() => () => sun.dispose(), [sun]);

  // The shadow frustum is fixed around the active station. Following the camera made shadows swim and jump.
  useEffect(() => {
    const o = station(chapterSlug);
    const cx = o.x + SHADOW_CENTRE[0];
    const cz = o.z + SHADOW_CENTRE[1];
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

  useFrame((state) => {
    beachSand.uTime.value = state.clock.elapsedTime;
  });

  return (
    <>
      <primitive object={sun} />
      <primitive object={sun.target} />
      <hemisphereLight args={['#6a78a8', '#3a2418', 0.75]} />
      <ambientLight intensity={0.08} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow material={sand.material}>
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
