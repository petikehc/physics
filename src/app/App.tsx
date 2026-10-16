import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router';
import { World } from './World';
import { useApp } from '../state/store';
import Landing from '../landing/Landing';

const JourneyPage = lazy(() => import('../journey/JourneyPage'));
const LabPage = lazy(() => import('../lab/LabPage'));
const MapPage = lazy(() => import('../map/MapPage'));

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function NoWebGL() {
  return (
    <div className="page">
      <div className="page__inner">
        <span className="eyebrow">From Sand to Stars</span>
        <h1>This journey needs WebGL</h1>
        <p style={{ color: 'var(--chalk-dim)' }}>
          Your browser could not start 3D graphics. Try a recent version of Chrome, Edge, Firefox or Safari,
          or enable hardware acceleration.
        </p>
      </div>
    </div>
  );
}

export function App() {
  const reduced = useApp((s) => s.reducedMotion);
  const set = useApp((s) => s.set);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => set({ reducedMotion: mq.matches });
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [set]);

  if (!hasWebGL()) return <NoWebGL />;

  return (
    <>
      <World />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/play" element={<JourneyPage />} />
          <Route path="/play/:slug" element={<JourneyPage />} />
          <Route path="/lab/:slug" element={<LabPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </Suspense>
      {reduced ? null : <div className="grain" aria-hidden="true" />}
    </>
  );
}
