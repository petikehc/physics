import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useApp } from '../state/store';

const AUTO_SECONDS = 14;

interface Props {
  body: ReactNode;
  labHref: string;
  onContinue: () => void;
  children?: ReactNode;
}

/** The frame every chapter's Your-turn moment shares: title, prompt, Continue with auto-countdown, Lab link. */
export function YourTurnShell({ body, labHref, onContinue, children }: Props) {
  const autoContinue = useApp((s) => s.autoContinue);
  const reduced = useApp((s) => s.reducedMotion);
  const setPrefs = useApp((s) => s.setPrefs);
  const [touched, setTouched] = useState(false);
  const [left, setLeft] = useState(AUTO_SECONDS);
  const start = useRef(0);
  const auto = autoContinue && !reduced && !touched;

  // Any interaction with the scene cancels the auto-continue countdown.
  useEffect(() => {
    const cancel = () => setTouched(true);
    window.addEventListener('pointerdown', cancel, { once: true });
    window.addEventListener('wheel', cancel, { once: true });
    window.addEventListener('keydown', cancel, { once: true });
    return () => {
      window.removeEventListener('pointerdown', cancel);
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('keydown', cancel);
    };
  }, []);

  useEffect(() => {
    if (!auto) return;
    start.current = performance.now();
    const id = window.setInterval(() => {
      const remaining = AUTO_SECONDS - (performance.now() - start.current) / 1000;
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        window.clearInterval(id);
        onContinue();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [auto, onContinue]);

  const circumference = 2 * Math.PI * 7;

  return (
    <aside className="your-turn" aria-label="Your turn">
      <h2 className="your-turn__title">Your turn</h2>
      <p className="your-turn__body">{body}</p>
      {children}
      <button className="btn btn--primary continue-btn" onClick={onContinue}>
        Continue
        {auto ? (
          <svg className="countdown" viewBox="0 0 18 18" aria-hidden="true">
            <circle cx="9" cy="9" r="7" fill="none" stroke="rgba(14,15,19,0.2)" strokeWidth="2" />
            <circle
              cx="9"
              cy="9"
              r="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - left / AUTO_SECONDS)}
            />
          </svg>
        ) : (
          <span aria-hidden="true">▸</span>
        )}
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <Link to={labHref} className="btn btn--ghost" style={{ padding: '6px 0' }}>
          Open the full Lab →
        </Link>
        <label className="toggle" style={{ fontSize: 12 }}>
          <input
            type="checkbox"
            checked={autoContinue}
            onChange={(e) => setPrefs({ autoContinue: e.target.checked })}
          />
          Auto
        </label>
      </div>
    </aside>
  );
}
