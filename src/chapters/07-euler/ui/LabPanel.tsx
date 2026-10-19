import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { runtime } from '../../../engine/runtime';
import { shotVars } from '../../../engine/camera/shots';
import { station } from '../../../engine/world/stations';
import { audio } from '../../../audio';
import { useApp } from '../../../state/store';
import { setTerms, THETA_MAX_TURN, THETA_MIN } from '../interaction';
import { eulerRig, EULER_DEFAULTS, TERMS } from '../rig';
import { PointReadout, SeriesReadout, ThetaControls } from './Controls';
import { useEuler } from './useEuler';

const SLUG = 'euler';
type V3 = [number, number, number];
type Frame = { pos: V3; target: V3; portrait: number };
/** The plane alone, close, left of centre: the panel sits on the right (on a phone, below it). */
const CLOSE: Frame = { pos: [1.2, 2.6, 8.5], target: [1.2, 2.6, 0], portrait: 0.8 };
/** With the series: wide enough for its arrows at θ = π (out to the left and up) and at θ = −π (left and down). */
const WIDE: Frame = { pos: [0.5, 2.6, 15], target: [0.5, 2.6, 0], portrait: 0.5 };
const frameFor = (terms: number) => (terms > 0 ? WIDE : CLOSE);

/** Lab-mode display: the plane, and the point a sixth of a turn round with its triangle. */
export function enterEulerLab() {
  runtime.world.space = 1;
  Object.assign(eulerRig(), {
    ...EULER_DEFAULTS,
    plane: 1,
    marks: 1,
    point: 1,
    tag: 1,
    theta: Math.PI / 3,
    angle: 1,
    triangle: 1,
    interactive: 1,
    lab: 1,
  });
  Object.assign(runtime.camera, {
    ...shotVars(SLUG, CLOSE),
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
    colorB: '#a8ecf5',
  });
}

export function LabPanel() {
  const c = useEuler();
  const set = useApp((s) => s.set);
  // The count asked for (the arrows take a moment to lay down or lift away).
  const [n, setN] = useState(0);
  const [triangle, setTriangle] = useState(true);
  const move = useRef<gsap.core.Tween | null>(null);

  useEffect(() => () => void move.current?.kill(), []);

  /** Steps the camera back to make room for the series' arrows, or comes in again without them. */
  const reframe = (terms: number) => {
    move.current?.kill();
    set({ cameraMode: 'directed' });
    move.current = gsap.to(runtime.camera, {
      ...shotVars(SLUG, frameFor(terms)),
      duration: 1.2,
      ease: 'power2.inOut',
      onComplete: () => set({ cameraMode: 'interactive' }),
    });
  };

  /** Once round the circle, from −π to π, singing all the way. */
  const goRound = () => {
    audio.ui('click');
    const rig = eulerRig();
    gsap.killTweensOf(rig, 'theta,voice');
    rig.theta = THETA_MIN;
    rig.voice = 1;
    gsap.to(rig, {
      theta: THETA_MAX_TURN,
      duration: 6,
      ease: 'none',
      onComplete: () => void (rig.voice = 0),
    });
  };

  const toggleTriangle = () => {
    audio.ui('click');
    const on = !triangle;
    setTriangle(on);
    gsap.to(eulerRig(), { triangle: on ? 1 : 0, duration: 0.6, ease: 'power1.inOut', overwrite: 'auto' });
  };

  return (
    <aside className="lab-panel" aria-label="Euler lab">
      <span className="eyebrow">Lab · Chapter VII</span>
      <h1>Euler&rsquo;s Identity</h1>
      <p>
        The point e<sup>iθ</sup> is θ round the circle: across by cos θ, up by sin θ. Drag it, or set θ. The
        series&rsquo; arrows, laid head to tail, always spiral in onto it.
      </p>
      <ThetaControls c={c} idPrefix="lab" />
      <PointReadout c={c} />
      <div className="field">
        <div className="field__row">
          <label htmlFor="lab-terms">Terms of the series</label>
          <span className="field__value">{n}</span>
        </div>
        <input
          id="lab-terms"
          className="range"
          type="range"
          min={0}
          max={TERMS}
          step={1}
          value={n}
          aria-valuetext={`${n} terms`}
          onChange={(ev) => {
            const to = +ev.target.value;
            if (to > 0 !== n > 0) reframe(to);
            setN(to);
            setTerms(to);
          }}
        />
        <SeriesReadout c={{ ...c, terms: n }} />
      </div>
      <div className="lab-actions">
        <button className="btn" onClick={goRound}>
          Go once round
        </button>
        <button className="btn btn--ghost" onClick={toggleTriangle} aria-pressed={triangle}>
          {triangle ? 'Hide the triangle' : 'Show the triangle'}
        </button>
      </div>
      <Link to="/play/euler" className="btn btn--ghost" style={{ alignSelf: 'flex-start', padding: '6px 0' }}>
        ← Back to the journey
      </Link>
    </aside>
  );
}
