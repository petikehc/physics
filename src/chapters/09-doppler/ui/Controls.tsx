import { useState } from 'react';
import { setListenerSpeed, setSourceSpeed } from '../interaction';
import { BALMER, recession } from '../math';
import { SYM9 } from '../rig';
import type { DopplerSnapshot } from './useDoppler';

interface Props {
  c: DopplerSnapshot & { refresh: () => void };
  idPrefix: string;
}

const speed = (m: number) => `${m.toFixed(2)} × the speed of sound`;

/** How fast the source goes: the ambulance up to just under the speed of sound, the jet up to twice it. */
export function SourceControls({ c, idPrefix }: Props) {
  const jet = c.kind > 0.5;
  const max = jet ? 2 : 0.9;
  // The speed asked for (the source takes a moment to get there).
  const [asked, setAsked] = useState(() => Math.round(c.sm * 20) / 20);
  const shown = Math.min(asked, max);
  return (
    <div className="field">
      <div className="field__row">
        <label htmlFor={`${idPrefix}-source`}>{jet ? 'Jet' : 'Ambulance'}</label>
        <span className="field__value">{speed(shown)}</span>
      </div>
      <input
        id={`${idPrefix}-source`}
        className="range"
        type="range"
        min={0}
        max={max}
        step={0.05}
        value={shown}
        aria-valuetext={speed(shown)}
        onChange={(ev) => {
          setAsked(+ev.target.value);
          setSourceSpeed(+ev.target.value);
        }}
      />
    </div>
  );
}

/** Lab: how fast the listener walks along the street, either way. */
export function ListenerControls({ c, idPrefix }: Props) {
  const words =
    Math.abs(c.lm) < 1e-3
      ? 'standing still'
      : `${speed(Math.abs(c.lm))}, ${c.lm > 0 ? 'to the right' : 'to the left'}`;
  return (
    <div className="field">
      <div className="field__row">
        <label htmlFor={`${idPrefix}-listener`}>Listener</label>
        <span className="field__value">{words}</span>
      </div>
      <input
        id={`${idPrefix}-listener`}
        className="range"
        type="range"
        min={-0.5}
        max={0.5}
        step={0.05}
        value={c.lm}
        aria-valuetext={words}
        onChange={(ev) => {
          setListenerSpeed(+ev.target.value);
          c.refresh();
        }}
      />
    </div>
  );
}

/** What the listener hears now, and what anyone straight ahead of the source or straight behind it would. */
export function HearingReadout({ c }: { c: DopplerSnapshot }) {
  const m = c.sm;
  const source = c.kind > 0.5 ? "jet's own roar" : 'siren';
  const ahead = m < 1 ? `${(1 / (1 - m)).toFixed(2)} f` : 'nothing until it has passed';
  const behind = `${(1 / (1 + m)).toFixed(2)} f`;
  const now =
    c.ratio === null
      ? 'The listener hears nothing yet: the source is ahead of its own sound.'
      : `The listener hears ${c.ratio.toFixed(2)} f${
          c.ratio > 1.005
            ? `, higher than the ${source}`
            : c.ratio < 0.995
              ? `, lower than the ${source}`
              : ', its true pitch'
        }.`;
  return (
    <div className="readout" aria-live="polite">
      <span className="readout__eq" style={{ color: SYM9.ear }}>
        {now}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--chalk-dim)' }}>
        Straight ahead: <span style={{ color: 'var(--sym-hi)' }}>{ahead}</span>. Straight behind:{' '}
        <span style={{ color: 'var(--sym-lo)' }}>{behind}</span>.
      </span>
    </div>
  );
}

/** Lab: the galaxy's speed away from us, as its red shift. */
export function LightControls({ c, idPrefix, onZ }: Props & { onZ: (z: number) => void }) {
  // The red shift asked for (the galaxy takes a moment to get there).
  const [asked, setAsked] = useState(() => Math.round(c.z * 100) / 100);
  // The numbers are for the red shift chosen; the galaxy and its lines slide there a moment later.
  const beta = recession(asked);
  const hb = BALMER[1]!;
  return (
    <>
      <div className="field">
        <div className="field__row">
          <label htmlFor={`${idPrefix}-z`}>Red shift z</label>
          <span className="field__value">{asked.toFixed(2)}</span>
        </div>
        <input
          id={`${idPrefix}-z`}
          className="range"
          type="range"
          min={0}
          max={0.8}
          step={0.01}
          value={asked}
          aria-valuetext={`red shift ${asked.toFixed(2)}`}
          onChange={(ev) => {
            setAsked(+ev.target.value);
            onZ(+ev.target.value);
          }}
        />
      </div>
      <div className="readout" aria-live="polite">
        <span className="readout__eq" style={{ color: 'var(--sym-lo)' }}>
          Moving away at {(beta * 100).toFixed(1)}% of the speed of light
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--chalk-dim)' }}>
          Every wavelength × {(1 + asked).toFixed(2)}: hydrogen's blue-green {hb.name} line,{' '}
          {hb.nm.toFixed(0)} nm here, arrives at {(hb.nm * (1 + asked)).toFixed(0)} nm.
        </span>
      </div>
    </>
  );
}
