import { goTo, setTheta, THETA_MAX_TURN, THETA_MIN } from '../interaction';
import { expi, series, thetaText } from '../math';
import { SYM7 } from '../rig';
import type { EulerSnapshot } from './useEuler';

interface Props {
  c: EulerSnapshot & { refresh: () => void };
  idPrefix: string;
}

const PRESETS: Array<[string, number]> = [
  ['0', 0],
  ['π/2', Math.PI / 2],
  ['π', Math.PI],
  ['−π/2', -Math.PI / 2],
];

/** θ, from a slider or a preset. (The point itself is dragged round the circle in the scene.) */
export function ThetaControls({ c, idPrefix }: Props) {
  return (
    <>
      <div className="field">
        <div className="field__row">
          <label htmlFor={`${idPrefix}-theta`}>θ</label>
          <span className="field__value">{thetaText(c.theta)}</span>
        </div>
        <input
          id={`${idPrefix}-theta`}
          className="range"
          type="range"
          min={THETA_MIN}
          max={THETA_MAX_TURN}
          step={0.01}
          value={c.theta}
          aria-valuetext={`θ = ${thetaText(c.theta)}`}
          onChange={(ev) => {
            setTheta(+ev.target.value, true, true);
            c.refresh();
          }}
        />
      </div>
      <div className="field">
        <span className="field__row">
          <span id={`${idPrefix}-go`}>Go to</span>
        </span>
        <div className="choices" role="group" aria-labelledby={`${idPrefix}-go`}>
          {PRESETS.map(([name, t]) => (
            <button
              key={name}
              className="choice"
              aria-pressed={
                Math.abs(c.theta - t) < 1e-6 || (t === Math.PI && Math.abs(c.theta + Math.PI) < 1e-6)
              }
              onClick={() => goTo(t)}
            >
              θ = {name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

const fmt = (v: number) => (Math.abs(v) < 0.005 ? '0.00' : v.toFixed(2));
const complex = (re: number, im: number) => `${fmt(re)} ${im < -0.005 ? '−' : '+'} ${fmt(Math.abs(im))} i`;

/** e^{iθ} as cos θ + i sin θ, and cos² θ + sin² θ = 1. */
export function PointReadout({ c }: { c: EulerSnapshot }) {
  const [re, im] = expi(c.theta);
  return (
    <div className="readout" aria-live="polite">
      <span className="readout__eq">
        e<sup>iθ</sup> = <span style={{ color: SYM7.cos }}>{fmt(re)}</span> {im < -0.005 ? '−' : '+'}{' '}
        <span style={{ color: SYM7.sin }}>{fmt(Math.abs(im))}</span> i
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--chalk-dim)' }}>
        cos² θ + sin² θ = {fmt(re * re)} + {fmt(im * im)} = {(re * re + im * im).toFixed(2)}
      </span>
    </div>
  );
}

/** Where the first n terms of the series land, and how far that is from the point. */
export function SeriesReadout({ c }: { c: EulerSnapshot }) {
  const n = Math.round(c.terms);
  if (n < 1) {
    return (
      <span style={{ fontSize: 14, color: 'var(--chalk-dim)' }}>
        Add terms to lay the series&rsquo; arrows head to tail.
      </span>
    );
  }
  const s = series(c.theta, n).sums[n - 1]!;
  const [re, im] = expi(c.theta);
  const off = Math.hypot(s[0] - re, s[1] - im);
  return (
    <span style={{ fontSize: 14, color: 'var(--chalk-dim)' }}>
      {n} {n === 1 ? 'term lands' : 'terms land'} at {complex(s[0], s[1])}:{' '}
      {off < 0.0005 ? 'on the point' : `${off < 0.01 ? off.toExponential(1) : off.toFixed(2)} from the point`}
      .
    </span>
  );
}
