import { BOUND_STEP, chooseShape, setBound } from '../interaction';
import { areaTo, curve, SHAPES, X_MAX } from '../math';
import type { CalculusSnapshot } from './useCalculus';

interface Props {
  c: CalculusSnapshot & { refresh: () => void };
  idPrefix: string;
}

const same = (p: readonly number[], q: readonly number[]) => p.every((y, i) => Math.abs(y - q[i]!) < 0.005);

/** Curves to try, and the bounds a and b. (The curve's own points are dragged in the scene.) */
export function CurveControls({ c, idPrefix }: Props) {
  return (
    <>
      <div className="field">
        <span className="field__row">
          <span id={`${idPrefix}-shape`}>Try a curve</span>
        </span>
        <div className="choices" role="group" aria-labelledby={`${idPrefix}-shape`}>
          {SHAPES.map((s) => (
            <button
              key={s.id}
              className="choice"
              aria-pressed={same(c.ys, s.ys)}
              onClick={() => {
                chooseShape(s.ys);
                c.refresh();
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
      {(['a', 'b'] as const).map((w) => (
        <div className="field" key={w}>
          <div className="field__row">
            <label htmlFor={`${idPrefix}-${w}`}>{w}</label>
            <span className="field__value">{c[w].toFixed(2)}</span>
          </div>
          <input
            id={`${idPrefix}-${w}`}
            className="range"
            type="range"
            min={0}
            max={X_MAX}
            step={BOUND_STEP}
            value={c[w]}
            onChange={(ev) => {
              setBound(w, +ev.target.value);
              c.refresh();
            }}
          />
        </div>
      ))}
    </>
  );
}

const fmt = (v: number) => v.toFixed(2);

/** The area from a to b, and how far the area curve climbs between them: always the same. */
export function AreaReadout({ c }: { c: CalculusSnapshot }) {
  const k = curve(c.ys);
  const Aa = areaTo(k, Math.min(c.a, c.b));
  const Ab = areaTo(k, Math.max(c.a, c.b));
  const f = { Aa, Ab, area: Ab - Aa };
  return (
    <div className="readout" aria-live="polite">
      <span className="readout__eq" style={{ color: 'var(--sym-area)' }}>
        Area from a to b: {fmt(f.area)}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--chalk-dim)' }}>
        A(b) − A(a) = {fmt(f.Ab)} − {fmt(f.Aa)} = {fmt(f.area)}
      </span>
    </div>
  );
}
