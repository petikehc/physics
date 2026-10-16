import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { createSandMaterial } from '../materials/sand';
import { DUSK, SUN_DIR } from './Sky';
import { useApp } from '../../state/store';

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

  const sun = useMemo(() => {
    const light = new THREE.DirectionalLight('#ffb27a', 3.0);
    light.castShadow = quality !== 'low';
    const size = quality === 'high' ? 2048 : 1024;
    light.shadow.mapSize.set(size, size);
    const cam = light.shadow.camera;
    cam.left = -12;
    cam.right = 12;
    cam.top = 12;
    cam.bottom = -12;
    cam.near = 1;
    cam.far = 80;
    light.shadow.bias = -0.0004;
    light.shadow.normalBias = 0.03;
    return light;
  }, [quality]);

  useEffect(() => () => sun.dispose(), [sun]);

  useFrame((state) => {
    beachSand.uTime.value = state.clock.elapsedTime;
    // Keep the shadow frustum centred under the camera's target area.
    const cam = state.camera;
    const fx = Math.round(cam.position.x / 4) * 4;
    const fz = Math.round(cam.position.z / 4) * 4;
    sun.target.position.set(fx, 0, fz - 3);
    // A higher virtual sun than the visible one keeps shadows readable at dusk.
    sun.position.set(fx + SUN_DIR.x * 40, 14, fz - 3 + SUN_DIR.z * 40);
    sun.target.updateMatrixWorld();
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
