import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { useApp, type QualityTier } from '../state/store';
import { CameraDirector } from '../engine/camera/CameraDirector';
import { Dust } from '../engine/dust/Dust';
import { Sky } from '../engine/world/Sky';
import { Beach } from '../engine/world/Beach';
import { PostFX } from '../engine/world/PostFX';
import { CHAPTERS } from '../chapters/registry';
import { STATION_VIEWS } from '../chapters/stations';

const DPR: Record<QualityTier, [number, number]> = { low: [1, 1.25], medium: [1, 1.5], high: [1, 2] };
const DOWN: Record<QualityTier, QualityTier> = { high: 'medium', medium: 'low', low: 'low' };

/** Every station in the order the journey reaches them: the ten chapters, then the finale. */
const ORDER = [...CHAPTERS.map((c) => c.slug), 'finale'];

/** The stations to keep mounted: the current one and its neighbours, so a flight never lands on nothing. */
function stationWindow(slug: string): string[] {
  const i = Math.max(ORDER.indexOf(slug), 0);
  return ORDER.slice(Math.max(0, i - 1), i + 2).filter((s) => STATION_VIEWS[s]);
}

/** The single persistent 3D world behind every route. */
export function World() {
  const quality = useApp((s) => s.quality);
  const mode = useApp((s) => s.mode);
  const chapterSlug = useApp((s) => s.chapterSlug);
  const set = useApp((s) => s.set);
  const showStations = mode === 'journey' || mode === 'lab' || mode === 'map';

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
      {showStations
        ? (mode === 'map' ? ['finale'] : stationWindow(chapterSlug)).map((slug) => {
            const Station = STATION_VIEWS[slug]!;
            return (
              <Suspense key={slug} fallback={null}>
                <Station />
              </Suspense>
            );
          })
        : null}
      <PostFX />
    </Canvas>
  );
}
