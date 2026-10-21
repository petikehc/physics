import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { audio } from '../../../audio';
import { useLiftAbove } from '../../../ui/useLiftAbove';
import { CHAPTERS } from '../../registry';
import { INVARIANTS } from '../layout';
import { useConstellation } from '../store';

interface Props {
  /** At the end of the journey (play a chapter on the same timeline), or on the map page (go to it). */
  where: 'journey' | 'map';
  onPlay?: (slug: string) => void;
  onReplay?: () => void;
}

/**
 * The constellation as the index: a star for each chapter, chosen here or by pointing at it in the sky, with what
 * that chapter kept the same and the way back into it.
 */
export function ConstellationIndex({ where, onPlay, onReplay }: Props) {
  const selected = useConstellation((s) => s.selected);
  const set = useConstellation((s) => s.set);
  const panel = useRef<HTMLElement>(null);
  useLiftAbove(() => panel.current);
  useEffect(() => () => set({ selected: null, hovered: null }), [set]);

  const meta = selected !== null ? CHAPTERS[selected] : undefined;
  const kept = selected !== null ? INVARIANTS[selected] : undefined;

  return (
    <aside ref={panel} className={`constellation constellation--${where}`} aria-label="The constellation">
      <span className="eyebrow">From sand to stars</span>
      <h2>Ten stars, one thread</h2>
      <p>Every star is a chapter. Choose one, here or in the sky, to go back to it.</p>
      <div className="constellation__stars" role="group" aria-label="Chapters">
        {CHAPTERS.map((c, i) => (
          <button
            key={c.slug}
            className="constellation__star"
            style={{ color: c.accent }}
            aria-pressed={selected === i}
            aria-label={`${c.numeral} · ${c.title}`}
            title={`${c.numeral} · ${c.title}`}
            onClick={() => {
              audio.ui('click');
              set({ selected: i });
            }}
            onPointerEnter={() => set({ hovered: i })}
            onPointerLeave={() => set({ hovered: null })}
            onFocus={() => set({ hovered: i })}
            onBlur={() => set({ hovered: null })}
          >
            {c.numeral}
          </button>
        ))}
      </div>
      {meta && kept ? (
        <div className="constellation__detail" aria-live="polite">
          <span className="eyebrow" style={{ color: meta.accent }}>
            Chapter {meta.numeral} · {meta.figure} · {meta.year}
          </span>
          <h3>{meta.title}</h3>
          <p>
            <strong>{kept.heading}.</strong> {kept.body}
          </p>
          <div className="constellation__actions">
            {where === 'journey' ? (
              <button className="btn btn--primary" onClick={() => onPlay?.(meta.slug)}>
                Play chapter {meta.numeral}
              </button>
            ) : (
              <Link className="btn btn--primary" to={`/play/${meta.slug}`}>
                Play chapter {meta.numeral}
              </Link>
            )}
            <Link className="btn" to={`/lab/${meta.slug}`}>
              Open the Lab
            </Link>
          </div>
        </div>
      ) : null}
      <div className="constellation__actions">
        {where === 'journey' ? (
          <>
            <button className="btn btn--ghost" onClick={onReplay}>
              Replay from the start
            </button>
            <Link className="btn btn--ghost" to="/">
              Back to the start
            </Link>
          </>
        ) : (
          <Link className="btn btn--ghost" to="/play">
            Begin the journey
          </Link>
        )}
      </div>
    </aside>
  );
}
