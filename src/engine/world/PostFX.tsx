import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing';
import { runtime } from '../runtime';
import { useApp } from '../../state/store';

/** Cinematic finish: depth of field on macro shots (high tier), bloom, vignette, film grain, ACES. */
export function PostFX() {
  const quality = useApp((s) => s.quality);
  // Grain drawn anew every frame is noise to a video encoder, and the landing page lays its own over the film.
  const recording = useApp((s) => s.recording);
  const dof = useRef<DepthOfFieldEffect>(null);

  useFrame(() => {
    const effect = dof.current;
    if (!effect) return;
    const rig = runtime.camera;
    effect.target?.set(rig.fx, rig.fy, rig.fz);
    effect.bokehScale = rig.dof * 4;
  });

  return (
    <EffectComposer multisampling={quality === 'high' ? 4 : 0} enableNormalPass={false}>
      {quality === 'high' ? (
        <DepthOfField
          ref={dof}
          target={[0, 0, 0]}
          worldFocusRange={3.5}
          bokehScale={0}
          resolutionScale={0.5}
        />
      ) : (
        <></>
      )}
      <Bloom
        mipmapBlur
        intensity={quality === 'low' ? 0.5 : 0.8}
        luminanceThreshold={0.72}
        luminanceSmoothing={0.2}
        radius={0.7}
      />
      {/* Tone map before grading: grain and vignette must work on display values, not raw HDR, or bright
          highlights split into colour fringes. */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.72} />
      {recording ? <></> : <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />}
    </EffectComposer>
  );
}
