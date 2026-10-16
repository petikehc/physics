import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '../state/store';
import { CHAPTERS } from '../chapters/registry';
import { TopBar } from '../ui/TopBar';
import { ChaptersMenu } from '../ui/ChaptersMenu';

/** Placeholder for the Constellation index (built with the finale in a later phase). */
export default function MapPage() {
  const set = useApp((s) => s.set);
  const [menu, setMenu] = useState(false);
  useEffect(() => set({ mode: 'page' }), [set]);
  return (
    <div className="overlay">
      <TopBar chapterLabel="Constellation" onChapters={() => setMenu(true)} />
      <div className="page">
        <div className="page__inner">
          <span className="eyebrow">The constellation</span>
          <h1>Ten stars, one thread</h1>
          <p style={{ color: 'var(--chalk-dim)', maxWidth: 560 }}>
            At the end of the journey, the heat of the roller coaster drifts up and becomes these stars. The
            3D constellation arrives with the finale; for now, here is the map.
          </p>
          <ol className="chapter-list" style={{ marginTop: 24 }}>
            {CHAPTERS.map((c) => (
              <li key={c.slug} className={`chapter-row ${c.status === 'soon' ? 'chapter-row--soon' : ''}`}>
                <span
                  className="chapter-row__num"
                  style={{ color: c.status === 'ready' ? c.accent : undefined }}
                >
                  {c.numeral}
                </span>
                <div>
                  <div className="chapter-row__title">{c.title}</div>
                  <div className="chapter-row__meta">
                    {c.figure} · {c.year}
                  </div>
                </div>
                {c.status === 'ready' ? (
                  <Link className="btn btn--primary" to={`/play/${c.slug}`}>
                    Play
                  </Link>
                ) : (
                  <span className="chip">Soon</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
      {menu ? <ChaptersMenu onClose={() => setMenu(false)} /> : null}
    </div>
  );
}
