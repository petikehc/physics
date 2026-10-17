import { choosePreset, orbitFacts, PRESETS, setEccentricity, setFanCount } from '../interaction';
import { MAX_FANS } from '../rig';
import type { OrbitSnapshot } from './useOrbit';

const FAN_STEPS = [4, 6, 8, 12, 16, 24].filter((n) => n <= MAX_FANS);

interface Props {
  o: OrbitSnapshot & { refresh: () => void };
  disabled?: boolean;
  idPrefix: string;
}

/** The orbit's shape (with a few real ones to try) and how many equal times to cut its year into. */
export function OrbitControls({ o, disabled = false, idPrefix }: Props) {
  const step = Math.max(0, FAN_STEPS.indexOf(o.n));
  return (
    <>
      <div className="field">
        <span className="field__row">
          <span id={`${idPrefix}-preset`}>Try an orbit</span>
        </span>
        <div className="choices" role="group" aria-labelledby={`${idPrefix}-preset`}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className="choice"
              aria-pressed={Math.abs(o.e - p.e) < 0.002}
              disabled={disabled}
              onClick={() => choosePreset(p.e)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <div className="field__row">
          <label htmlFor={`${idPrefix}-e`}>Stretch (eccentricity)</label>
          <span className="field__value">{o.e.toFixed(2)}</span>
        </div>
        <input
          id={`${idPrefix}-e`}
          className="range"
          type="range"
          min={0}
          max={0.9}
          step={0.01}
          value={o.e}
          onChange={(ev) => {
            setEccentricity(+ev.target.value);
            o.refresh();
          }}
          disabled={disabled}
        />
      </div>
      <div className="field">
        <div className="field__row">
          <label htmlFor={`${idPrefix}-n`} style={{ color: 'var(--sym-t)' }}>
            Equal times per year
          </label>
          <span className="field__value">{o.n}</span>
        </div>
        <input
          id={`${idPrefix}-n`}
          className="range"
          type="range"
          min={0}
          max={FAN_STEPS.length - 1}
          step={1}
          value={step}
          aria-valuetext={`${o.n} equal times`}
          onChange={(ev) => {
            setFanCount(FAN_STEPS[+ev.target.value] ?? 12);
            o.refresh();
          }}
          disabled={disabled}
        />
      </div>
    </>
  );
}

/** "a fifth", "an octave", "two octaves". */
const withArticle = (name: string) =>
  name.startsWith('two') ? name : name.startsWith('octave') ? `an ${name}` : `a ${name}`;

/** What the orbit does: every fan the same area, the speed range, and the interval Kepler would hear in it. */
export function OrbitReadout({ o }: { o: OrbitSnapshot }) {
  const f = orbitFacts(o.e);
  return (
    <div className="readout" aria-live="polite">
      <span className="readout__eq">
        each fan = <span style={{ color: 'var(--sym-area)' }}>1/{o.n}</span> of the area, in{' '}
        <span style={{ color: 'var(--sym-t)' }}>1/{o.n}</span> of the year
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--chalk-dim)' }}>
        {f.circle
          ? 'A circle: the same speed all the way round, and one steady note.'
          : `${f.speed.toFixed(f.speed < 1.1 ? 2 : 1)}× faster near the Sun than far away. ${
              f.interval
                ? `Kepler would hear ${withArticle(f.interval.name)} (${f.interval.ratio[0]} : ${f.interval.ratio[1]}).`
                : `Its note would slide through ${f.octaves.toFixed(1)} octaves.`
            }`}
      </span>
    </div>
  );
}
