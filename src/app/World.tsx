import { Suspense, useEffect } from 'react';
import { advance, Canvas, useThree } from '@react-three/fiber';
import gsap from 'gsap';
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

declare global {
  interface Window {
    /** For recording a film of the world frame by frame (scripts/record-teaser.mjs). */
    __film?: { start: () => void; step: (seconds: number) => void };
  }
}

/**
 * Takes the world's two clocks off real time on request: GSAP's (every timeline and tween) and the renderer's
 * (every frame's delta). Each step then moves both on by exactly the same amount and draws one frame, however long
 * that frame takes to draw.
 */
function FilmClock() {
  const get = useThree((s) => s.get);
  const paused = useApp((s) => s.worldPaused);
  // Back from a pause, start counting again from now: the first frame should not see the whole pause as one step.
  useEffect(() => {
    if (!paused) get().clock.getDelta();
  }, [paused, get]);
  useEffect(() => {
    let tweens = 0;
    let frames = 0;
    const pixel = new Uint8Array(4);
    window.__film = {
      start: () => {
        useApp.getState().set({ worldPaused: true });
        gsap.ticker.remove(gsap.updateRoot);
        tweens = gsap.ticker.time;
        frames = get().clock.elapsedTime;
      },
      step: (seconds) => {
        tweens += seconds;
        frames += seconds;
        gsap.updateRoot(tweens);
        advance(frames);
        // Wait until the frame is drawn, so steps never queue up ahead of a slow renderer.
        const gl = get().gl.getContext();
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      },
    };
    return () => {
      delete window.__film;
    };
  }, [get]);
  return null;
}

/** The single persistent 3D world behind every route. */
export function World() {
  const quality = useApp((s) => s.quality);
  const mode = useApp((s) => s.mode);
  const chapterSlug = useApp((s) => s.chapterSlug);
  const set = useApp((s) => s.set);
  const paused = useApp((s) => s.worldPaused);
  const showStations = mode === 'journey' || mode === 'lab' || mode === 'map';

  return (
    <Canvas
      className="world"
      frameloop={paused ? 'never' : 'always'}
      dpr={DPR[quality]}
      shadows={quality !== 'low'}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 40, near: 0.05, far: 2500, position: [0, 28.2, 9.5] }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => set({ quality: DOWN[useApp.getState().quality] })} flipflops={2} />
      <FilmClock />
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
