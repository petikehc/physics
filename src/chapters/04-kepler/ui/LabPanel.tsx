import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { useApp } from '../../../state/store';
import { runtime } from '../../../engine/runtime';
import { shotVars } from '../../../engine/camera/shots';
import { station } from '../../../engine/world/stations';
import { audio } from '../../../audio';
import { STORY } from '../math';
import { keplerRig, KEPLER_DEFAULTS } from '../rig';
import { OrbitControls, OrbitReadout } from './Controls';
import { useOrbit } from './useOrbit';

const SLUG = 'kepler';
type V3 = [number, number, number];
/** The panel sits on the right, so every Lab shot frames the scene left of centre. */
const view = (pos: V3, target: V3) =>
  shotVars(SLUG, { pos: [pos[0] + 2.2, pos[1], pos[2]], target: [target[0] + 2.2, target[1], target[2]] });
const HOME: [V3, V3] = [
  [-1.5, 7.6, 5.8],
  [-1.5, 0, 0.3],
];
const WIDE: [V3, V3] = [
  [0, 25, 30],
  [0, 0, 2.5],
];

/** Lab-mode display: in space, the stretched orbit cut into twelve equal-time fans, the planet running. */
export function enterKeplerLab() {
  runtime.world.space = 1;
  Object.assign(keplerRig(), {
    ...KEPLER_DEFAULTS,
    sun: 1,
    planet: 1,
    e: STORY.e,
    draw: 1,
    ellipse: 1,
    fans: 1,
    swept: STORY.fans,
    interactive: 1,
    lab: 1,
  });
  Object.assign(runtime.camera, {
    ...view(...HOME),
    fov: 42,
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
    y: o.y,
    z: o.z,
    scale: 1,
    size: 0.6,
    spin: 0.004,
    swirl: 0.3,
    drift: 0.2,
    colorA: '#f4efe6',
    colorB: '#bcd4ff',
  });
}

export function LabPanel() {
  const set = useApp((s) => s.set);
  const o = useOrbit();
  const [wide, setWide] = useState(false);
  const [busy, setBusy] = useState(false);
  const move = useRef<gsap.core.Timeline | null>(null);
  const rig = keplerRig();

  useEffect(() => () => void move.current?.kill(), []);

  /** Pulls out to all six planets and raises the third law's pillars, or comes back to the one orbit. */
  const toggle = () => {
    if (busy) return;
    audio.ui('click');
    setBusy(true);
    move.current?.kill();
    set({ cameraMode: 'directed' });
    const out = !wide;
    const tl = gsap.timeline({
      onComplete: () => {
        setBusy(false);
        setWide(out);
        set({ cameraMode: 'interactive' });
      },
    });
    move.current = tl;
    tl.to(runtime.camera, { ...view(...(out ? WIDE : HOME)), duration: 2, ease: 'power2.inOut' }, 0);
    if (out) {
      tl.to(rig, { fans: 0, duration: 0.6 }, 0);
      tl.to(rig, { system: 1, duration: 1.2 }, 0.4);
      tl.to(rig, { pillars: 1, duration: 2.4, ease: 'none' }, 1.4);
      tl.call(() => audio.cue('pillars'), undefined, 1.4);
    } else {
      tl.to(rig, { pillars: 0, duration: 0.8 }, 0);
      tl.to(rig, { system: 0, duration: 1 }, 0.3);
      tl.to(rig, { fans: 1, duration: 0.8 }, 1.2);
    }
  };

  return (
    <aside className="lab-panel" aria-label="Kepler lab">
      <span className="eyebrow">Lab · Chapter IV</span>
      <h1>Kepler&rsquo;s Laws</h1>
      <p>
        A planet moves on an ellipse with the Sun at one focus, and the line from the Sun sweeps equal areas
        in equal times. Reshape the orbit and recut its year.
      </p>
      <OrbitControls o={o} idPrefix="lab" disabled={busy || wide} />
      <OrbitReadout o={o} />
      <div className="lab-actions">
        <button className="btn" onClick={toggle} disabled={busy}>
          {wide ? 'Back to one orbit' : 'Show all six planets (the third law)'}
        </button>
      </div>
      <Link
        to="/play/kepler"
        className="btn btn--ghost"
        style={{ alignSelf: 'flex-start', padding: '6px 0' }}
      >
        ← Back to the journey
      </Link>
    </aside>
  );
}
