import { Link } from 'react-router';
import { controller } from './controller';
import { CHAPTERS } from '../chapters/registry';

/** Shown when the journey reaches the end of what has been built so far (the finale is still to come). */
export function EndCard() {
  const ready = CHAPTERS.filter((c) => c.status === 'ready');
  const next = CHAPTERS.find((c) => c.status === 'soon');
  const last = ready[ready.length - 1];
  const done =
    ready.length === 1
      ? `Chapter ${ready[0]!.numeral} is`
      : `Chapters ${ready[0]!.numeral}–${last!.numeral} are`;
  return (
    <div className="end-card" role="dialog" aria-label="End of the current journey">
      {next ? (
        <span className="eyebrow">
          Chapter {next.numeral} · {next.title}
        </span>
      ) : (
        <span className="eyebrow">From sand to stars</span>
      )}
      <h2>{next ? 'The story continues soon' : 'The end, for now'}</h2>
      <p>
        {next
          ? `${done} complete. The remaining chapters are in production; this is where the journey will carry on.`
          : 'All ten chapters are told. The finale, where their stars gather into one constellation, is in production.'}
      </p>
      <div className="end-card__actions">
        <button
          className="btn btn--primary"
          onClick={() => {
            controller.gotoChapter(ready[0]!.slug);
            controller.play();
          }}
        >
          Replay from the start
        </button>
        {last ? (
          <Link className="btn" to={`/lab/${last.slug}`}>
            Open the {last.short} Lab
          </Link>
        ) : null}
        <Link className="btn btn--ghost" to="/">
          Back to the start
        </Link>
      </div>
    </div>
  );
}
