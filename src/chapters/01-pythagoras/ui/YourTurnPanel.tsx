import { useState } from 'react';
import { YourTurnShell } from '../../../ui/YourTurnShell';
import { pyInteraction } from '../parts/Handles';
import { useTriangle } from './useTriangle';

function fmt(x: number) {
  return Number.isInteger(x) ? String(x) : x.toFixed(2);
}

/** Chapter 1's Your-turn moment: live readouts, snapping and triple detection. */
export function YourTurnPanel({ onContinue }: { onContinue: () => void }) {
  const t = useTriangle();
  const [snap, setSnap] = useState(pyInteraction.snap);

  const a2 = t.a * t.a;
  const b2 = t.b * t.b;
  const c2 = t.c * t.c;

  return (
    <YourTurnShell
      onContinue={onContinue}
      labHref="/lab/pythagoras"
      body={
        <>
          Drag the glowing corners. Can you find another right triangle whose sides are{' '}
          <em>all whole numbers</em>?
        </>
      }
    >
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
    </YourTurnShell>
  );
}
