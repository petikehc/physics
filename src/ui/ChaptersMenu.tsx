import { useEffect } from 'react';
import { Link } from 'react-router';
import { CHAPTERS } from '../chapters/registry';
import { FINALE } from '../chapters/finale/meta';
import { CloseIcon } from './Icons';

/** The ten chapters, with Play / Lab links for the ones that are ready, and the finale. */
export function ChaptersMenu({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Chapters"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head">
          <h2 className="sheet__title">Ten ideas, one journey</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close chapters" autoFocus>
            <CloseIcon />
          </button>
        </div>
        <ol className="chapter-list">
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
                  {c.figure} · {c.year} · {c.kind === 'math' ? 'Mathematics' : 'Physics'}
                  {c.status === 'soon' ? ' · in production' : ''}
                </div>
              </div>
              {c.status === 'ready' ? (
                <div className="chapter-row__actions">
                  <Link className="btn btn--primary" to={`/play/${c.slug}`} onClick={onClose}>
                    Play
                  </Link>
                  <Link className="btn" to={`/lab/${c.slug}`} onClick={onClose}>
                    Lab
                  </Link>
                </div>
              ) : (
                <span className="chip">Soon</span>
              )}
            </li>
          ))}
          <li className="chapter-row">
            <span className="chapter-row__num" style={{ color: FINALE.accent }}>
              ✦
            </span>
            <div>
              <div className="chapter-row__title">{FINALE.title}</div>
              <div className="chapter-row__meta">
                Finale · the ten stars, and why something always stays the same
              </div>
            </div>
            <div className="chapter-row__actions">
              <Link className="btn btn--primary" to="/play/finale" onClick={onClose}>
                Play
              </Link>
              <Link className="btn" to="/map" onClick={onClose}>
                Map
              </Link>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}
