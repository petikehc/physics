import { release, setFriction, setHill, setMass } from '../interaction';
import { HEIGHT_RANGE, MASS_RANGE } from '../sandbox';
import { SYM10 } from '../rig';
import type { EnergySnapshot } from './useEnergy';

interface Props {
  c: EnergySnapshot & { refresh: () => void };
  idPrefix: string;
}

function Slider(props: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  text: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="field">
      <div className="field__row">
        <label htmlFor={props.id}>{props.label}</label>
        <span className="field__value">{props.text}</span>
      </div>
      <input
        id={props.id}
        className="range"
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        aria-valuetext={props.text}
        onChange={(ev) => props.onChange(+ev.target.value)}
      />
    </div>
  );
}

/** The test track's start and far hill, friction, the car's mass, and a button to let the car go again. */
export function TrackControls({ c, idPrefix, full = false }: Props & { full?: boolean }) {
  const change = (f: () => void) => {
    f();
    c.refresh();
  };
  return (
    <>
      <Slider
        id={`${idPrefix}-h0`}
        label="Start"
        value={c.h0}
        min={HEIGHT_RANGE[0]}
        max={HEIGHT_RANGE[1]}
        step={0.5}
        text={`${c.h0.toFixed(1)} m`}
        onChange={(v) => change(() => setHill('h0', v))}
      />
      <Slider
        id={`${idPrefix}-h4`}
        label="Far hill"
        value={c.h4}
        min={HEIGHT_RANGE[0]}
        max={HEIGHT_RANGE[1]}
        step={0.5}
        text={`${c.h4.toFixed(1)} m`}
        onChange={(v) => change(() => setHill('h4', v))}
      />
      <Slider
        id={`${idPrefix}-mu`}
        label="Friction"
        value={c.mu}
        min={0}
        max={0.2}
        step={0.01}
        text={c.mu === 0 ? 'none' : `${Math.round(c.mu * 100)}% of its weight`}
        onChange={(v) => change(() => setFriction(v))}
      />
      {full ? (
        <Slider
          id={`${idPrefix}-mass`}
          label="Mass"
          value={c.mass}
          min={MASS_RANGE[0]}
          max={MASS_RANGE[1]}
          step={50}
          text={`${c.mass} kg`}
          onChange={(v) => change(() => setMass(v))}
        />
      ) : null}
      <div className="lab-actions">
        <button className="btn btn--ghost" onClick={release}>
          Let it go again
        </button>
      </div>
    </>
  );
}

/** The car's energy as three bars and their total, and how fast and how high it is. */
export function EnergyReadout({ c }: { c: EnergySnapshot }) {
  const total = c.pe + c.ke + c.heat;
  const bar = (kj: number, colour: string, name: string) => (
    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 64px', alignItems: 'center', gap: 8 }}>
      <span style={{ color: colour, fontFamily: 'var(--font-body)', fontSize: 13 }}>{name}</span>
      <span
        style={{
          height: 8,
          borderRadius: 4,
          background: colour,
          width: `${Math.min(100, (kj / Math.max(c.full, 1)) * 100)}%`,
          transition: 'width 0.1s linear',
        }}
      />
      <span style={{ textAlign: 'right' }}>{kj} kJ</span>
    </div>
  );
  return (
    <div className="readout" aria-live="polite">
      {bar(c.pe, SYM10.pe, 'height')}
      {bar(c.ke, SYM10.ke, 'speed')}
      {bar(c.heat, SYM10.heat, 'heat')}
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--chalk-dim)' }}>
        Total {total} kJ · {c.kmh} km/h at {c.h.toFixed(1)} m
      </span>
    </div>
  );
}
