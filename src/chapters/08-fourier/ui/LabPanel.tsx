import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { runtime } from '../../../engine/runtime';
import { shotVars } from '../../../engine/camera/shots';
import { station } from '../../../engine/world/stations';
import { audio } from '../../../audio';
import { useApp } from '../../../state/store';
import { setDrawCount } from '../interaction';
import { hasDrawn, setDrawn } from '../drawn';
import { DRAW_TERMS, fourierRig, FOURIER_DEFAULTS, P, Q } from '../rig';
import { WaveControls, WaveReadout } from './Controls';
import { useFourier } from './useFourier';

const SLUG = 'fourier';
type V3 = [number, number, number];
type Frame = { pos: V3; target: V3; portrait: number };
type Mode = 'waves' | 'side' | 'draw';

/** The panel sits on the right (on a phone, below), so each view keeps its subject left of centre. */
const FRAMES: Record<Mode, Frame> = {
  waves: { pos: [2.5, 1.9, 14], target: [2.5, 1.9, 0], portrait: 1 },
  side: { pos: [P[0] + 10, P[1] + 1.8, -4.4], target: [P[0], P[1] - 0.2, -4.4], portrait: 0.8 },
  draw: { pos: [Q[0] + 2, 2.6, 11.5], target: [Q[0] + 2, 2.6, 0], portrait: 0.9 },
};

/** What each view shows. */
const SHOWS: Record<Mode, Partial<typeof FOURIER_DEFAULTS>> = {
  waves: { stage: 1, clockwork: 1, trace: 1, ghost: 1, sing: 0.6, align: 0, layers: 0, bars: 0, drawing: 0 },
  side: { stage: 0, clockwork: 1, trace: 0, ghost: 0, sing: 0.6, align: 1, layers: 1, bars: 1, drawing: 0 },
  draw: { stage: 0, clockwork: 0, trace: 0, ghost: 0, sing: 0, align: 0, layers: 0, bars: 0, drawing: 1 },
};

/** Lab-mode display: a square wave from four circles, turning, its chart beside it. */
export function enterFourierLab() {
  runtime.world.space = 1;
  Object.assign(fourierRig(), {
    ...FOURIER_DEFAULTS,
    ...SHOWS.waves,
    count: 4,
    shape: 0,
    dcount: DRAW_TERMS,
    dtrace: 1,
    interactive: 1,
    lab: 1,
  });
  Object.assign(runtime.camera, {
    ...shotVars(SLUG, FRAMES.waves),
    fov: 40,
    shake: 0,
    dof: 0,
    orbitMix: 0,
    lift: 0,
    roll: 0,
    veil: 0,
  });
  const o = station(SLUG);
  Object.assign(runtime.dust, {
    from: 'stars',
    to: 'stars',
    morph: 1,
    x: o.x,
    y: o.y + 2.6,
    z: o.z - 2,
    scale: 4.2,
    size: 0.6,
    spin: 0.002,
    swirl: 0.3,
    drift: 0.2,
    colorA: '#f4efe6',
    colorB: '#f6c6e3',
  });
}

export function LabPanel() {
  const c = useFourier();
  const set = useApp((s) => s.set);
  const [mode, setMode] = useState<Mode>('waves');
  const [circles, setCircles] = useState(DRAW_TERMS);
  const move = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => () => void move.current?.kill(), []);

  /** Switches view: the camera moves (directed, then handed back) as the scene changes over. */
  const show = (next: Mode) => {
    if (next === mode) return;
    audio.ui('click');
    setMode(next);
    move.current?.kill();
    set({ cameraMode: 'directed' });
    const rig = fourierRig();
    if (next === 'draw') rig.dt = 0;
    if (next === 'waves') rig.since = rig.t;
    const tl = gsap.timeline({ onComplete: () => set({ cameraMode: 'interactive' }) });
    tl.to(rig, { ...SHOWS[next], duration: 1.2, ease: 'power2.inOut' }, 0);
    tl.to(runtime.camera, { ...shotVars(SLUG, FRAMES[next]), duration: 1.6, ease: 'power2.inOut' }, 0);
    move.current = tl;
  };

  const ambulance = () => {
    audio.ui('click');
    setDrawn(null);
    fourierRig().dt = 0;
    c.refresh();
  };

  return (
    <aside className="lab-panel" aria-label="Fourier lab">
      <span className="eyebrow">Lab · Chapter VIII</span>
      <h1>Fourier Series</h1>
      <div className="choices" role="group" aria-label="View">
        {(
          [
            ['waves', 'Waves'],
            ['side', 'Side view'],
            ['draw', 'Draw a shape'],
          ] as const
        ).map(([m, name]) => (
          <button key={m} className="choice" aria-pressed={mode === m} onClick={() => show(m)}>
            {name}
          </button>
        ))}
      </div>
      {mode !== 'draw' ? (
        <>
          <p>
            {mode === 'waves'
              ? 'Circles turning at whole-number speeds, each on the tip of the last: the tip traces the wave. Each circle is also a harmonic you can hear.'
              : 'Side on, each circle is a bar: as tall as it is big, standing at its speed. That is the wave’s spectrum.'}
          </p>
          <WaveControls c={c} idPrefix="lab" />
          <WaveReadout c={c} />
        </>
      ) : (
        <>
          <p>
            Draw any closed shape on the stars (it closes itself when you let go). A hundred and one circles,
            turning both ways at every speed, redraw it. Use fewer, and see how much of it a few big circles
            catch.
          </p>
          <div className="field">
            <div className="field__row">
              <label htmlFor="lab-draw-circles">Circles</label>
              <span className="field__value">{circles}</span>
            </div>
            <input
              id="lab-draw-circles"
              className="range"
              type="range"
              min={1}
              max={DRAW_TERMS}
              step={1}
              value={circles}
              aria-valuetext={`${circles} circles`}
              onChange={(ev) => {
                setCircles(+ev.target.value);
                setDrawCount(+ev.target.value);
              }}
            />
          </div>
          <div className="lab-actions">
            <button className="btn btn--ghost" onClick={ambulance} disabled={!hasDrawn()}>
              Back to the ambulance
            </button>
          </div>
          <span style={{ fontSize: 14, color: 'var(--chalk-dim)' }} aria-live="polite">
            {hasDrawn() ? 'Your shape' : 'The ambulance'}, from {Math.round(c.dcount)} circles.
          </span>
        </>
      )}
      <Link
        to="/play/fourier"
        className="btn btn--ghost"
        style={{ alignSelf: 'flex-start', padding: '6px 0' }}
      >
        ← Back to the journey
      </Link>
    </aside>
  );
}
