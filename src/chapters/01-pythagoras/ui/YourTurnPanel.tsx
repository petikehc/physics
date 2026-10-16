import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '../../../state/store';
import { pyInteraction } from '../parts/Handles';
import { useTriangle } from './useTriangle';

const AUTO_SECONDS = 14;

function fmt(x: number) {
  return Number.isInteger(x) ? String(x) : x.toFixed(2);
}

/** Chapter 1's Your-turn moment: live readouts, snapping, triple detection and Continue. */
export function YourTurnPanel({ onContinue }: { onContinue: () => void }) {
  const t = useTriangle();
  const autoContinue = useApp((s) => s.autoContinue);
  const reduced = useApp((s) => s.reducedMotion);
  const setPrefs = useApp((s) => s.setPrefs);
  const [snap, setSnap] = useState(pyInteraction.snap);
  const [touched, setTouched] = useState(false);
  const [left, setLeft] = useState(AUTO_SECONDS);
  const start = useRef(0);
  const auto = autoContinue && !reduced && !touched;

  // Any interaction with the scene cancels the auto-continue countdown.
  useEffect(() => {
    const cancel = () => setTouched(true);
    window.addEventListener('pointerdown', cancel, { once: true });
    window.addEventListener('wheel', cancel, { once: true });
    return () => {
      window.removeEventListener('pointerdown', cancel);
      window.removeEventListener('wheel', cancel);
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

  const a2 = t.a * t.a;
  const b2 = t.b * t.b;
  const c2 = t.c * t.c;
  const circumference = 2 * Math.PI * 7;

  return (
    <aside className="your-turn" aria-label="Your turn">
      <h2 className="your-turn__title">Your turn</h2>
      <p className="your-turn__body">
        Drag the glowing corners. Can you find another right triangle whose sides are{' '}
        <em>all whole numbers</em>?
      </p>
      <div className="readout" aria-live="polite">
        <span>
          <span style={{ color: 'var(--sym-a)' }}>a = {fmt(t.a)}</span> ·{' '}
          <span style={{ color: 'var(--sym-b)' }}>b = {fmt(t.b)}</span> ·{' '}
          <span style={{ color: 'var(--sym-c)' }}>c = {fmt(Math.round(t.c * 100) / 100)}</span>
        </span>
        <span className="readout__eq">
          <span style={{ color: 'var(--sym-a)' }}>{fmt(a2)}</span> +{' '}
          <span style={{ color: 'var(--sym-b)' }}>{fmt(b2)}</span> ={' '}
          <span style={{ color: 'var(--sym-c)' }}>{fmt(Math.round(c2 * 100) / 100)}</span>
        </span>
      </div>
      {t.triple ? (
        <span className="badge">✦ Pythagorean triple: {`${t.a}–${t.b}–${Math.round(t.c)}`}</span>
      ) : null}
      <label className="toggle">
        <input
          type="checkbox"
          checked={snap}
          onChange={(e) => {
            pyInteraction.snap = e.target.checked;
            setSnap(e.target.checked);
          }}
        />
        Snap to whole numbers
      </label>
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
        <Link to="/lab/pythagoras" className="btn btn--ghost" style={{ padding: '6px 0' }}>
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
