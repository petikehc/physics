import { dealTo } from '../interaction';
import { circleRig, R_MAX, R_MIN, SLICE_COUNTS } from '../rig';
import { fmt2, pct, type CircleSnapshot } from './useCircle';

interface Props {
  c: CircleSnapshot & { refresh: () => void };
  disabled?: boolean;
  idPrefix: string;
}

/** The two controls both the Your-turn panel and the Lab use: number of slices and radius. */
export function CircleControls({ c, disabled = false, idPrefix }: Props) {
  return (
    <>
      <div className="field">
        <div className="field__row">
          <label htmlFor={`${idPrefix}-n`}>Slices</label>
          <span className="field__value">{c.n}</span>
        </div>
        <input
          id={`${idPrefix}-n`}
          className="range"
          type="range"
          min={0}
          max={SLICE_COUNTS.length - 1}
          step={1}
          value={c.step}
          aria-valuetext={`${c.n} slices`}
          onChange={(e) => {
            dealTo(SLICE_COUNTS[+e.target.value] ?? 8);
            c.refresh();
          }}
          disabled={disabled}
        />
      </div>
      <div className="field">
        <div className="field__row">
          <label htmlFor={`${idPrefix}-r`} style={{ color: 'var(--sym-r)' }}>
            Radius r
          </label>
          <span className="field__value">{fmt2(c.r)}</span>
        </div>
        <input
          id={`${idPrefix}-r`}
          className="range"
          type="range"
          min={R_MIN}
          max={R_MAX}
          step={0.05}
          value={c.r}
          onChange={(e) => {
            circleRig().r = +e.target.value;
            c.refresh();
          }}
          disabled={disabled}
        />
      </div>
    </>
  );
}

/** Live numbers: the exact area, and how far the straight-edged shape falls short of it. */
export function CircleReadout({ c }: { c: CircleSnapshot }) {
  return (
    <div className="readout" aria-live="polite">
      <span className="readout__eq">
        <span style={{ color: 'var(--sym-pi)' }}>π</span>
        <span style={{ color: 'var(--sym-r)' }}>r</span>² ={' '}
        <span style={{ color: 'var(--sym-pi)' }}>{fmt2(Math.PI * c.r)}</span> ×{' '}
        <span style={{ color: 'var(--sym-r)' }}>{fmt2(c.r)}</span> = {fmt2(c.exact)}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--chalk-dim)' }}>
        Ignoring the bumps, {c.n} straight-edged triangles cover {fmt2(c.straight)}: {pct(c.error)} short. The
        bumps hold the rest.
      </span>
    </div>
  );
}
