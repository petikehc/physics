import { useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { runtime } from '../../../engine/runtime';
import { shotVars } from '../../../engine/camera/shots';
import { station } from '../../../engine/world/stations';
import { audio } from '../../../audio';
import { newtonRig, NEWTON_DEFAULTS } from '../rig';
import { CannonControls, ShotReadout } from './Controls';
import { useCannon } from './useCannon';

const SLUG = 'newton';
type V3 = [number, number, number];
/** The panel sits on the right, so the Lab frames the planet left of centre. */
const HOME: [V3, V3] = [
  [2.4, -0.7, 15],
  [2.4, -0.7, 0],
];

/** Lab-mode display: in space, the planet with its mountain and cannon, a shot already flying. */
export function enterNewtonLab() {
  runtime.world.space = 1;
  Object.assign(newtonRig(), {
    ...NEWTON_DEFAULTS,
    planet: 1,
    air: 1,
    mountain: 1,
    cannon: 1,
    ball: 1,
    speed: 6.3,
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
    x: o.x,
    y: o.y,
    z: o.z,
    scale: 3.2,
    size: 0.6,
    spin: 0.002,
    swirl: 0.3,
    drift: 0.2,
    colorA: '#f4efe6',
    colorB: '#bcd4ff',
  });
}

export function LabPanel() {
  const c = useCannon();
  const [forces, setForces] = useState(false);

  /** Shows (or hides) the ball's velocity, the pull on it, and the straight line it would take without it. */
  const toggle = () => {
    audio.ui('click');
    const on = !forces;
    setForces(on);
    gsap.to(newtonRig(), { arrows: on ? 1 : 0, straight: on ? 1 : 0, duration: 0.5, overwrite: 'auto' });
  };

  return (
    <aside className="lab-panel" aria-label="Newton lab">
      <span className="eyebrow">Lab · Chapter V</span>
      <h1>Universal Gravitation</h1>
      <p>
        Newton&rsquo;s cannon on a mountain 1,600 km tall, high above the air. Fire it slowly and the ball
        falls back; fast enough and it falls all the way round, forever.
      </p>
      <CannonControls c={c} idPrefix="lab" angle />
      <ShotReadout c={c} />
      <div className="lab-actions">
        <button className="btn" onClick={toggle} aria-pressed={forces}>
          {forces ? 'Hide the forces' : 'Show the forces'}
        </button>
      </div>
      <Link
        to="/play/newton"
        className="btn btn--ghost"
        style={{ alignSelf: 'flex-start', padding: '6px 0' }}
      >
        ← Back to the journey
      </Link>
    </aside>
  );
}
