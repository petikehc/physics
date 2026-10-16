import { lazy, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { useApp, type QualityTier } from '../state/store';
import { CameraDirector } from '../engine/camera/CameraDirector';
import { Dust } from '../engine/dust/Dust';
import { Sky } from '../engine/world/Sky';
import { Beach } from '../engine/world/Beach';
import { PostFX } from '../engine/world/PostFX';

const PythagorasStation = lazy(() => import('../chapters/01-pythagoras/Station'));

const DPR: Record<QualityTier, [number, number]> = { low: [1, 1.25], medium: [1, 1.5], high: [1, 2] };
const DOWN: Record<QualityTier, QualityTier> = { high: 'medium', medium: 'low', low: 'low' };

/** The single persistent 3D world behind every route. */
export function World() {
  const quality = useApp((s) => s.quality);
  const mode = useApp((s) => s.mode);
  const set = useApp((s) => s.set);
  const showStation = mode === 'journey' || mode === 'lab';

  return (
    <Canvas
      className="world"
      dpr={DPR[quality]}
      shadows={quality !== 'low'}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 40, near: 0.05, far: 2500, position: [0, 28.2, 9.5] }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => set({ quality: DOWN[useApp.getState().quality] })} flipflops={2} />
      <CameraDirector />
      <Sky />
      <Beach />
      <Dust />
      {showStation ? (
        <Suspense fallback={null}>
          <PythagorasStation />
        </Suspense>
      ) : null}
      <PostFX />
    </Canvas>
  );
}
