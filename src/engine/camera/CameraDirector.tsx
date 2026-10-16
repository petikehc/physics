import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls, type CameraControlsImpl } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { runtime } from '../runtime';
import { useApp } from '../../state/store';
import type { CameraRig } from '../rigs';

/** Limits for the free camera in "Your turn" and the Labs. Stations set these when they take over. */
export const orbitLimits = {
  minDistance: 3,
  maxDistance: 26,
  maxPolarAngle: Math.PI * 0.47,
};

const _cart = new THREE.Vector3();
const _orbit = new THREE.Vector3();

export function directedPose(rig: CameraRig, outPos: THREE.Vector3, outTarget: THREE.Vector3) {
  _cart.set(rig.px, rig.py, rig.pz);
  _orbit.set(
    rig.tx + Math.cos(rig.orbitAngle) * rig.orbitRadius,
    rig.ty + rig.orbitHeight,
    rig.tz + Math.sin(rig.orbitAngle) * rig.orbitRadius,
  );
  outPos.copy(_cart).lerp(_orbit, rig.orbitMix);
  outPos.y += rig.lift;
  outTarget.set(rig.tx, rig.ty, rig.tz);
}

function handheld(t: number, seed: number) {
  return (
    Math.sin(t * 0.63 + seed) * 0.55 +
    Math.sin(t * 1.37 + seed * 2.1) * 0.3 +
    Math.sin(t * 2.71 + seed * 0.7) * 0.15
  );
}

/**
 * Applies the camera rig to the R3F camera every frame ("directed" mode), or hands the camera to
 * drei's CameraControls ("interactive" mode). Switching back blends smoothly into the scripted shot.
 */
export function CameraDirector() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const cameraMode = useApp((s) => s.cameraMode);
  const dragging = useApp((s) => s.dragging);
  const reduced = useApp((s) => s.reducedMotion);
  const controls = useRef<CameraControlsImpl>(null);
  const lastTarget = useRef(new THREE.Vector3(0, 0, 0));
  const blend = useRef({ t: 0, pos: new THREE.Vector3(), target: new THREE.Vector3() });
  const pos = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const prevMode = useRef(cameraMode);

  useEffect(() => {
    const wasInteractive = prevMode.current === 'interactive';
    prevMode.current = cameraMode;
    if (cameraMode === 'interactive') {
      const c = controls.current;
      if (!c) return;
      const t = lastTarget.current;
      void c.setLookAt(camera.position.x, camera.position.y, camera.position.z, t.x, t.y, t.z, false);
      return;
    }
    // Back to the script: start from wherever the viewer left the camera.
    if (!wasInteractive) return;
    const b = blend.current;
    b.pos.copy(camera.position);
    b.target.copy(lastTarget.current);
    b.t = 1;
    const tween = gsap.to(b, { t: 0, duration: 1.4, ease: 'power2.inOut' });
    return () => {
      tween.kill();
    };
  }, [cameraMode, camera]);

  useFrame((state) => {
    if (cameraMode === 'interactive') {
      controls.current?.getTarget(lastTarget.current);
      return;
    }
    const rig = runtime.camera;
    directedPose(rig, pos.current, target.current);

    const amp = reduced ? 0 : rig.shake;
    if (amp > 0) {
      const t = state.clock.elapsedTime;
      pos.current.x += handheld(t, 1) * 0.05 * amp;
      pos.current.y += handheld(t, 2) * 0.035 * amp;
      pos.current.z += handheld(t, 3) * 0.05 * amp;
      target.current.x += handheld(t, 4) * 0.025 * amp;
      target.current.y += handheld(t, 5) * 0.02 * amp;
    }

    const b = blend.current;
    if (b.t > 0) {
      pos.current.lerp(b.pos, b.t);
      target.current.lerp(b.target, b.t);
    }

    camera.position.copy(pos.current);
    camera.up.set(0, 1, 0);
    camera.lookAt(target.current);
    if (rig.roll !== 0) camera.rotateZ(rig.roll);
    lastTarget.current.copy(target.current);

    if (Math.abs(camera.fov - rig.fov) > 0.01) {
      camera.fov = rig.fov;
      camera.updateProjectionMatrix();
    }
  });

  if (cameraMode !== 'interactive') return null;
  return (
    <CameraControls
      ref={controls}
      makeDefault
      enabled={!dragging}
      minDistance={orbitLimits.minDistance}
      maxDistance={orbitLimits.maxDistance}
      maxPolarAngle={orbitLimits.maxPolarAngle}
      smoothTime={0.3}
      draggingSmoothTime={0.12}
    />
  );
}
