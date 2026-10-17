import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import gsap from 'gsap';
import { useApp } from '../state/store';
import { audio } from '../audio';
import { chapterBySlug } from '../chapters/registry';
import { TopBar } from '../ui/TopBar';
import { ChaptersMenu } from '../ui/ChaptersMenu';
import { VIEWS } from '../chapters/views';
import { createSoundFrame } from '../chapters/sound';
import { resetChapterRigs } from '../chapters/hooks';
import { orbitLimits } from '../engine/camera/CameraDirector';
import { runtime } from '../engine/runtime';
import { createCameraRig, resetRig } from '../engine/rigs';

/** /lab/:slug — a theorem as a sandbox. */
export default function LabPage() {
  const { slug } = useParams();
  const meta = chapterBySlug(slug);
  const set = useApp((s) => s.set);
  const [menu, setMenu] = useState(false);
  const views = meta?.status === 'ready' ? VIEWS[meta.slug] : undefined;

  useEffect(() => {
    if (!views || !meta) {
      set({ mode: 'page' });
      return;
    }
    // Neighbouring stations stay mounted: clear whatever the journey left on them (and the teaser on the camera).
    resetChapterRigs();
    resetRig(runtime.camera, createCameraRig());
    views.enterLab();
    Object.assign(orbitLimits, { minDistance: 2, maxDistance: 22 });
    set({ mode: 'lab', chapterSlug: meta.slug, cameraMode: 'directed' });
    audio.setScene('lab');
    audio.setBeat(`${meta.slug}:lab`);
    // Let the directed camera land on the Lab framing for a frame, then hand it to the viewer.
    const id = window.setTimeout(() => set({ cameraMode: 'interactive' }), 120);
    let last = performance.now();
    const soundFrame = createSoundFrame();
    const tick = () => {
      const now = performance.now();
      soundFrame((now - last) / 1000, meta.slug);
      last = now;
    };
    gsap.ticker.add(tick);
    return () => {
      window.clearTimeout(id);
      gsap.ticker.remove(tick);
      audio.setScene(null);
      audio.setBeat(null);
      set({ cameraMode: 'directed', dragging: false });
    };
  }, [views, meta, set]);

  return (
    <div className="overlay">
      <TopBar
        chapterLabel={meta ? `Lab · ${meta.numeral} · ${meta.short}` : 'Lab'}
        onChapters={() => setMenu(true)}
      />
      {views ? (
        <views.Lab />
      ) : (
        <div className="page">
          <div className="page__inner">
            <span className="eyebrow">Lab</span>
            <h1>{meta ? meta.title : 'Unknown chapter'}</h1>
            <p style={{ color: 'var(--chalk-dim)' }}>
              This Lab is in production. Chapters I–III are ready to explore now.
            </p>
            <p style={{ marginTop: 24 }}>
              <Link className="btn btn--primary" to="/lab/pythagoras">
                Open the Pythagoras Lab
              </Link>
            </p>
          </div>
        </div>
      )}
      {menu ? <ChaptersMenu onClose={() => setMenu(false)} /> : null}
    </div>
  );
}
