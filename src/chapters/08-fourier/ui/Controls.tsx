import { useState } from 'react';
import { chooseRecipe, recipeAt, setCount } from '../interaction';
import { harmonicsOf, peak, RECIPE_ORDER, RECIPES } from '../math';
import { MAX_COUNT } from '../rig';
import type { FourierSnapshot } from './useFourier';

interface Props {
  c: FourierSnapshot & { refresh: () => void };
  idPrefix: string;
}

/** Which wave to build, and from how many circles. */
export function WaveControls({ c, idPrefix }: Props) {
  // The count asked for (the clockwork takes a moment to grow or shed its circles).
  const [asked, setAsked] = useState(() => Math.round(c.count));
  const current = recipeAt(c.shape);
  return (
    <>
      <div className="field">
        <span className="field__row">
          <span id={`${idPrefix}-wave`}>Wave</span>
        </span>
        <div className="choices" role="group" aria-labelledby={`${idPrefix}-wave`}>
          {RECIPE_ORDER.map((id) => (
            <button
              key={id}
              className="choice"
              aria-pressed={current === id && Math.abs(c.shape - RECIPE_ORDER.indexOf(id)) < 0.01}
              onClick={() => {
                chooseRecipe(id);
                c.refresh();
              }}
            >
              {RECIPES[id].name}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <div className="field__row">
          <label htmlFor={`${idPrefix}-circles`}>Circles</label>
          <span className="field__value">{asked}</span>
        </div>
        <input
          id={`${idPrefix}-circles`}
          className="range"
          type="range"
          min={1}
          max={MAX_COUNT}
          step={1}
          value={asked}
          aria-valuetext={`${asked} ${asked === 1 ? 'circle' : 'circles'}`}
          onChange={(ev) => {
            setAsked(+ev.target.value);
            setCount(+ev.target.value);
          }}
        />
      </div>
    </>
  );
}

const fraction = (ratio: number) => (ratio === 1 ? '1' : `1/${ratio}`);

/** The circles' speeds and sizes, and how high the wave they build reaches. */
export function WaveReadout({ c }: { c: FourierSnapshot }) {
  const id = recipeAt(c.shape);
  const n = Math.max(1, Math.round(c.count));
  const hs = harmonicsOf(id, n);
  const shown = hs.slice(0, 5);
  const more = hs.length > shown.length ? ', …' : '';
  const first = hs[0]!.a;
  const top = peak(id, n, 2000);
  return (
    <div className="readout" aria-live="polite">
      <span className="readout__eq" style={{ color: 'var(--sym-ring)' }}>
        Speeds {shown.map((h) => h.n).join(', ')}
        {more}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--chalk-dim)' }}>
        Sizes {shown.map((h) => fraction(Math.round(first / h.a))).join(', ')}
        {more}. Highest point {top.toFixed(2)}
        {id === 'square' && n >= 3 ? ': it overshoots each jump by 9% of the jump, however many circles.' : '.'}
      </span>
    </div>
  );
}
