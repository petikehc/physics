import {
  choosePreset,
  ELEVATION_RANGE,
  fireCannon,
  PRESETS,
  setElevation,
  setSpeed,
  shotFacts,
  SPEED_RANGE,
} from '../interaction';
import type { CannonSnapshot } from './useCannon';

interface Props {
  c: CannonSnapshot & { refresh: () => void };
  disabled?: boolean;
  idPrefix: string;
  /** Show the angle control (the Lab), or only the speed (Your turn). */
  angle?: boolean;
}

/** A speed set more finely than the slider's steps (a preset such as the circle's 7.67 km/s). */
const fine = (v: number) => Math.abs(v * 10 - Math.round(v * 10)) > 0.01;

/** The cannon's speed (with a few shots to try) and, in the Lab, its angle; plus a button to fire again. */
export function CannonControls({ c, disabled = false, idPrefix, angle = false }: Props) {
  return (
    <>
      <div className="field">
        <span className="field__row">
          <span id={`${idPrefix}-preset`}>Try a shot</span>
        </span>
        <div className="choices" role="group" aria-labelledby={`${idPrefix}-preset`}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className="choice"
              aria-pressed={Math.abs(c.speed - p.speed) < 0.005 && c.elevation === 0}
              disabled={disabled}
              onClick={() => {
                choosePreset(p.speed);
                c.refresh();
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <div className="field__row">
          <label htmlFor={`${idPrefix}-v`} style={{ color: 'var(--sym-v)' }}>
            Speed
          </label>
          <span className="field__value">{c.speed.toFixed(fine(c.speed) ? 2 : 1)} km/s</span>
        </div>
        <input
          id={`${idPrefix}-v`}
          className="range"
          type="range"
          min={SPEED_RANGE.min}
          max={SPEED_RANGE.max}
          step={SPEED_RANGE.step}
          value={c.speed}
          aria-valuetext={`${c.speed.toFixed(1)} kilometres a second`}
          onChange={(ev) => {
            setSpeed(+ev.target.value);
            c.refresh();
          }}
          disabled={disabled}
        />
      </div>
      {angle ? (
        <div className="field">
          <div className="field__row">
            <label htmlFor={`${idPrefix}-a`}>Angle above the horizon</label>
            <span className="field__value">{Math.round(c.elevation)}°</span>
          </div>
          <input
            id={`${idPrefix}-a`}
            className="range"
            type="range"
            min={ELEVATION_RANGE.min}
            max={ELEVATION_RANGE.max}
            step={ELEVATION_RANGE.step}
            value={c.elevation}
            onChange={(ev) => {
              setElevation(+ev.target.value);
              c.refresh();
            }}
            disabled={disabled}
          />
        </div>
      ) : null}
      <button
        className="btn btn--ghost"
        style={{ alignSelf: 'flex-start' }}
        onClick={fireCannon}
        disabled={disabled}
      >
        Fire again
      </button>
    </>
  );
}

const km = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

/** "1 h 32 min", "6 min". */
function duration(minutes: number) {
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

/** What the shot does: where it lands, how long an orbit takes and how high it reaches, or that it escapes. */
export function ShotReadout({ c }: { c: CannonSnapshot }) {
  const f = shotFacts(c.speed, c.elevation);
  const circle = `${f.circular.toFixed(1)} km/s`;
  const escape = `${f.escape.toFixed(1)} km/s`;
  const [what, more] =
    f.outcome === 'lands'
      ? [
          `It lands ${km.format(Math.round(f.rangeKm / 10) * 10)} km away`,
          `${duration(f.minutes)} after firing. Fired level, it circles at ${circle}.`,
        ]
      : f.outcome === 'escapes'
        ? ['It escapes', `Past ${escape} the pull never turns it back.`]
        : f.circle
          ? ['A circle, 1,600 km up', `Once round every ${duration(f.minutes)}, falling all the way.`]
          : [
              `An ellipse, up to ${km.format(Math.round(f.highKm / 100) * 100)} km high`,
              `Once round every ${duration(f.minutes)}. Past ${escape} it would escape.`,
            ];
  return (
    <div className="readout" aria-live="polite">
      <span className="readout__eq">{what}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--chalk-dim)' }}>{more}</span>
    </div>
  );
}
