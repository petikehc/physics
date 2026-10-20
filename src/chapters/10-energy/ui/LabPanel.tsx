import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { runtime } from '../../../engine/runtime';
import { shotVars } from '../../../engine/camera/shots';
import { station } from '../../../engine/world/stations';
import { audio } from '../../../audio';
import { useApp } from '../../../state/store';
import { energyRig, ENERGY_DEFAULTS, STORY_TEST, type EnergyRig } from '../rig';
import { EnergyReadout, TrackControls } from './Controls';
import { useEnergy } from './useEnergy';

const SLUG = 'energy';
type V3 = [number, number, number];
type Frame = { pos: V3; target: V3; portrait: number };
type Mode = 'test' | 'coaster';

/** The panel sits on the right (on a phone, below), so each view keeps its subject left of centre. */
const FRAMES: Record<Mode, Frame> = {
  test: { pos: [16, 11, 70], target: [16, 7, 22], portrait: 1 },
  coaster: { pos: [42, 16, 100], target: [42, 12, -2], portrait: 0.9 },
};

/** What each view shows. */
const SHOWS: Record<Mode, Partial<EnergyRig>> = {
  test: { test: 1, tanks: 0, gauge: 1, loop: 0, level: 1 },
  coaster: { test: 0, tanks: 1, gauge: 0, loop: 1, level: 0, gx: 72, gz: 18, heat: 1 },
};

/** Lab-mode display: the test track, let go from 12 m towards a 16 m hill, at the fairground at night. */
export function enterEnergyLab() {
  Object.assign(runtime.world, { night: 1, space: 0 });
  Object.assign(energyRig(), {
    ...ENERGY_DEFAULTS,
    ...SHOWS.test,
    fair: 1,
    train: 1,
    h0: STORY_TEST.h0,
    h4: STORY_TEST.h4,
    heat: 1,
    interactive: 1,
    lab: 1,
  });
  Object.assign(runtime.camera, {
    ...shotVars(SLUG, FRAMES.test),
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
    y: o.y + 80,
    z: o.z - 70,
    scale: 80,
    size: 0.55,
    spin: 0.001,
    swirl: 0.3,
    drift: 0.15,
    colorA: '#f4efe6',
    colorB: '#ffe2c4',
  });
}

export function LabPanel() {
  const c = useEnergy();
  const set = useApp((s) => s.set);
  const [mode, setMode] = useState<Mode>('test');
  const move = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => () => void move.current?.kill(), []);

  /** Switches view: the camera moves (directed, then handed back) as the scene changes over. */
  const show = (next: Mode) => {
    if (next === mode) return;
    audio.ui('click');
    setMode(next);
    move.current?.kill();
    set({ cameraMode: 'directed' });
    const rig = energyRig();
    Object.assign(rig, SHOWS[next]);
    if (next === 'coaster') rig.rideT = 0;
    const tl = gsap.timeline({ onComplete: () => set({ cameraMode: 'interactive' }) });
    tl.to(runtime.camera, { ...shotVars(SLUG, FRAMES[next]), duration: 1.8, ease: 'power2.inOut' }, 0);
    move.current = tl;
    c.refresh();
  };

  return (
    <aside className="lab-panel" aria-label="Energy lab">
      <span className="eyebrow">Lab · Chapter X</span>
      <h1>Conservation of Energy</h1>
      <div className="choices" role="group" aria-label="View">
        {(
          [
            ['test', 'Test track'],
            ['coaster', 'The coaster'],
          ] as const
        ).map(([m, name]) => (
          <button key={m} className="choice" aria-pressed={mode === m} onClick={() => show(m)}>
            {name}
          </button>
        ))}
      </div>
      {mode === 'test' ? (
        <>
          <p>
            Shape the valley and let the car go. Without friction it climbs back to exactly the height it
            started from; with friction, a little lower each time, the rest turned to heat. A heavier car has
            more energy of every kind, but rolls exactly alike.
          </p>
          <TrackControls c={c} idPrefix="lab" full />
        </>
      ) : (
        <p>
          The coaster, round and round: the chain puts the energy in as height, the ride trades it between
          height and speed, and the brakes turn what is left into heat. The tanks keep count.
        </p>
      )}
      <EnergyReadout c={c} />
      <Link
        to="/play/energy"
        className="btn btn--ghost"
        style={{ alignSelf: 'flex-start', padding: '6px 0' }}
      >
        ← Back to the journey
      </Link>
    </aside>
  );
}
