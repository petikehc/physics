import { useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { runtime } from '../../../engine/runtime';
import { shotVars } from '../../../engine/camera/shots';
import { station } from '../../../engine/world/stations';
import { audio } from '../../../audio';
import { countFor, LEVELS, setLevel } from '../interaction';
import { areaTo, columns, curve, STORY_YS, X_MAX } from '../math';
import { calculusRig, CALCULUS_DEFAULTS, heights } from '../rig';
import { AreaReadout, CurveControls } from './Controls';
import { useCalculus } from './useCalculus';

const SLUG = 'calculus';
type V3 = [number, number, number];
/** The panel sits on the right, so the Lab frames both walls a little left of centre. */
const HOME: [V3, V3] = [
  [3.9, 2.65, 17.7],
  [3.9, 2.35, -1.3],
];

/** Lab-mode display: the story's curve on its wall, the area so far above it, a and b set, the columns put away. */
export function enterCalculusLab() {
  runtime.world.space = 1;
  Object.assign(calculusRig(), {
    ...CALCULUS_DEFAULTS,
    ...heights(STORY_YS),
    realm: 1,
    wallF: 1,
    wallA: 1,
    words: 1,
    curve: 1,
    areaCurve: 1,
    bounds: 1,
    a: 1,
    b: 3,
    split: 1,
    interactive: 1,
    lab: 1,
  });
  Object.assign(runtime.camera, {
    ...shotVars(SLUG, { pos: HOME[0], target: HOME[1] }),
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
    x: o.x + 3,
    y: o.y + 2,
    z: o.z - 1,
    scale: 4.2,
    size: 0.6,
    spin: 0.002,
    swirl: 0.3,
    drift: 0.2,
    colorA: '#f4efe6',
    colorB: '#cbbcff',
  });
}

const fmt = (v: number) => v.toFixed(2);

export function LabPanel() {
  const c = useCalculus();
  const [shown, setShown] = useState(false);
  // The count asked for (the columns take a moment to split or merge into it).
  const [level, setLevelShown] = useState(() => Math.round(Math.min(Math.max(c.split, 0), LEVELS - 1)));
  const n = countFor(level);
  const k = curve(c.ys);

  /** Fills the area with columns (or takes them away). */
  const toggle = () => {
    audio.ui('click');
    const on = !shown;
    setShown(on);
    gsap.to(calculusRig(), { columns: on ? 1 : 0, duration: 0.8, ease: 'power1.inOut', overwrite: 'auto' });
  };

  return (
    <aside className="lab-panel" aria-label="Calculus lab">
      <span className="eyebrow">Lab · Chapter VI</span>
      <h1>The Fundamental Theorem of Calculus</h1>
      <p>
        Drag the curve&rsquo;s points to reshape it. Above it, A(x) is the area under it so far: its slope at
        every x is the curve&rsquo;s height there.
      </p>
      <CurveControls c={c} idPrefix="lab" />
      <AreaReadout c={c} />
      <div className="field">
        <div className="field__row">
          <label htmlFor="lab-n">Columns</label>
          <span className="field__value">{n}</span>
        </div>
        <input
          id="lab-n"
          className="range"
          type="range"
          min={0}
          max={LEVELS - 1}
          step={1}
          value={level}
          aria-valuetext={`${n} columns`}
          onChange={(ev) => {
            setLevelShown(+ev.target.value);
            setLevel(+ev.target.value);
          }}
        />
        <span style={{ fontSize: 14, color: 'var(--chalk-dim)' }}>
          {n} columns add up to {fmt(columns(k, n).sum)}; the whole area is {fmt(areaTo(k, X_MAX))}.
        </span>
      </div>
      <div className="lab-actions">
        <button className="btn" onClick={toggle} aria-pressed={shown}>
          {shown ? 'Hide the columns' : 'Show the columns'}
        </button>
      </div>
      <Link
        to="/play/calculus"
        className="btn btn--ghost"
        style={{ alignSelf: 'flex-start', padding: '6px 0' }}
      >
        ← Back to the journey
      </Link>
    </aside>
  );
}
