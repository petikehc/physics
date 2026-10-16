import { useState } from 'react';
import { FLUIDS, MATERIALS } from '../math';
import { chooseFluid, chooseMaterial, currentChoice } from '../interaction';

const g = (x: number) => (x >= 10 ? x.toFixed(1) : x.toFixed(2));

/** Two rows of choices (material, fluid) and a sentence saying what happens. */
export function FloatControls({ disabled = false }: { disabled?: boolean }) {
  const [, setTick] = useState(0);
  const c = currentChoice();
  const pick = (fn: (i: number) => void, i: number) => {
    fn(i);
    setTick((t) => t + 1);
  };

  return (
    <>
      <div className="field">
        <span className="field__row">
          <span id="material-label">Drop in</span>
        </span>
        <div className="choices" role="group" aria-labelledby="material-label">
          {MATERIALS.map((m, i) => (
            <button
              key={m.id}
              className="choice"
              aria-pressed={c.m.id === m.id}
              disabled={disabled}
              onClick={() => pick(chooseMaterial, i)}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="field__row">
          <span id="fluid-label">Fill with</span>
        </span>
        <div className="choices" role="group" aria-labelledby="fluid-label">
          {FLUIDS.map((f, i) => (
            <button
              key={f.id}
              className="choice"
              aria-pressed={c.f.id === f.id}
              disabled={disabled}
              onClick={() => pick(chooseFluid, i)}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>
      <div className="readout" aria-live="polite">
        <span>
          {c.m.name} {g(c.m.density)} g/cm³ · {c.f.name.toLowerCase()}{' '}
          <span style={{ color: 'var(--sym-p)' }}>{g(c.f.density)} g/cm³</span>
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--chalk-dim)' }}>
          {c.floats
            ? `It floats, ${Math.round(c.fraction * 100)} % under the surface: just enough to push aside its own weight.`
            : `It sinks. Even fully under, it pushes aside less than its own weight.`}
        </span>
      </div>
    </>
  );
}
