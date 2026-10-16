import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import gsap from 'gsap';
import { useApp } from '../state/store';
import { audio } from '../audio';
import { chapterBySlug } from '../chapters/registry';
import { TopBar } from '../ui/TopBar';
import { ChaptersMenu } from '../ui/ChaptersMenu';
import { LabPanel, enterLabState } from '../chapters/01-pythagoras/ui/LabPanel';
import { pythagorasSoundFrame } from '../chapters/01-pythagoras/sound';
import { orbitLimits } from '../engine/camera/CameraDirector';

/** /lab/:slug — a theorem as a sandbox. Only chapter 1 has a Lab so far. */
export default function LabPage() {
  const { slug } = useParams();
  const meta = chapterBySlug(slug);
  const set = useApp((s) => s.set);
  const [menu, setMenu] = useState(false);
  const ready = meta?.status === 'ready';

  useEffect(() => {
    if (!ready) {
      set({ mode: 'page' });
      return;
    }
    enterLabState();
    Object.assign(orbitLimits, { minDistance: 2, maxDistance: 22 });
    set({ mode: 'lab', chapterSlug: meta.slug, cameraMode: 'directed' });
    audio.setScene('lab');
    // Let the directed camera land on the Lab framing for a frame, then hand it to the viewer.
    const id = window.setTimeout(() => set({ cameraMode: 'interactive' }), 120);
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      pythagorasSoundFrame((now - last) / 1000, true);
      last = now;
    };
    gsap.ticker.add(tick);
    return () => {
      window.clearTimeout(id);
      gsap.ticker.remove(tick);
      audio.setScene(null);
      set({ cameraMode: 'directed', dragging: false });
    };
  }, [ready, meta, set]);

  return (
    <div className="overlay">
      <TopBar
        chapterLabel={meta ? `Lab · ${meta.numeral} · ${meta.short}` : 'Lab'}
        onChapters={() => setMenu(true)}
      />
      {ready ? (
        <LabPanel />
      ) : (
        <div className="page">
          <div className="page__inner">
            <span className="eyebrow">Lab</span>
            <h1>{meta ? meta.title : 'Unknown chapter'}</h1>
            <p style={{ color: 'var(--chalk-dim)' }}>
              This Lab is in production. Chapter I is ready to explore now.
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
