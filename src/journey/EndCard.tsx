import { Link } from 'react-router';
import { controller } from './controller';

/** Shown when the journey reaches the end of what has been built so far. */
export function EndCard() {
  return (
    <div className="end-card" role="dialog" aria-label="End of the current journey">
      <span className="eyebrow">Chapter II · The Area of a Circle</span>
      <h2>Archimedes is still drawing his circles</h2>
      <p>
        Chapter I is complete. The next nine chapters are in production; here is where the journey continues.
      </p>
      <div className="end-card__actions">
        <button
          className="btn btn--primary"
          onClick={() => {
            controller.gotoChapter('pythagoras');
            controller.play();
          }}
        >
          Replay chapter I
        </button>
        <Link className="btn" to="/lab/pythagoras">
          Open the Lab
        </Link>
        <Link className="btn btn--ghost" to="/">
          Back to the start
        </Link>
      </div>
    </div>
  );
}
