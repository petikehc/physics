import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { runtime } from '../../../engine/runtime';
import { shotVars } from '../../../engine/camera/shots';
import { station } from '../../../engine/world/stations';
import { audio } from '../../../audio';
import { useApp } from '../../../state/store';
import { chooseSource } from '../interaction';
import { loopReset } from '../loop';
import { dopplerRig, DOPPLER_DEFAULTS, LOOP_START, SIREN_NEAR, type DopplerRig } from '../rig';
import { HearingReadout, LightControls, ListenerControls, SourceControls } from './Controls';
import { useDoppler } from './useDoppler';

const SLUG = 'doppler';
type V3 = [number, number, number];
type Frame = { pos: V3; target: V3; portrait: number };
type Mode = 'sound' | 'light';

/** The panel sits on the right (on a phone, below), so each view keeps its subject left of centre. */
const FRAMES: Record<Mode, Frame> = {
  sound: { pos: [8, 26, 36], target: [8, 0, -1], portrait: 1 },
  light: { pos: [3, 86, -82], target: [3, 92, -130], portrait: 0.8 },
};

/** What each view shows, and the world it is in (the street at night, or deep space). */
const SHOWS: Record<Mode, Partial<DopplerRig>> = {
  sound: { street: 1, spheres: 1, rings: 1, you: 1, galaxy: 0, spectra: 0 },
  light: { street: 0, spheres: 0, rings: 0, you: 0, galaxy: 1, spectra: 1 },
};

/** Lab-mode display: the ambulance going round the street at half the speed of sound, a listener ahead. */
export function enterDopplerLab() {
  Object.assign(runtime.world, { night: 1, space: 0 });
  Object.assign(dopplerRig(), {
    ...DOPPLER_DEFAULTS,
    ...SHOWS.sound,
    mode: 2,
    kind: 0,
    ambulance: 1,
    siren: SIREN_NEAR,
    sm: LOOP_START.m,
    sandT: LOOP_START.t,
    lx: LOOP_START.lx,
    lz: LOOP_START.lz,
    interactive: 1,
    lab: 1,
  });
  loopReset(LOOP_START.m);
  Object.assign(runtime.camera, {
    ...shotVars(SLUG, FRAMES.sound),
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
    x: o.x - 20,
    y: o.y + 2.6,
    z: o.z - 20,
    scale: 4.2,
    size: 0.55,
    spin: 0.001,
    swirl: 0.3,
    drift: 0.15,
    colorA: '#f4efe6',
    colorB: '#cdd9ff',
  });
}

export function LabPanel() {
  const c = useDoppler();
  const set = useApp((s) => s.set);
  const [mode, setMode] = useState<Mode>('sound');
  const move = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => () => void move.current?.kill(), []);

  /** Switches view: the camera moves (directed, then handed back) as the scene changes over. */
  const show = (next: Mode) => {
    if (next === mode) return;
    audio.ui('click');
    setMode(next);
    move.current?.kill();
    set({ cameraMode: 'directed' });
    const rig = dopplerRig();
    // The siren and the roar go quiet up among the galaxies.
    const heard =
      next === 'sound'
        ? { siren: rig.kind < 0.5 ? SIREN_NEAR : 0, roar: rig.kind > 0.5 ? 1 : 0 }
        : { siren: 0, roar: 0 };
    const tl = gsap.timeline({ onComplete: () => set({ cameraMode: 'interactive' }) });
    tl.to(rig, { ...SHOWS[next], ...heard, duration: 1.4, ease: 'power2.inOut' }, 0);
    // Between the street and space by way of the night, never back through the dusk beach.
    if (next === 'light') {
      tl.to(runtime.world, { space: 1, duration: 0.3, ease: 'none' }, 0);
      tl.to(runtime.world, { night: 0, duration: 1.6, ease: 'power1.inOut' }, 0.3);
    } else {
      tl.to(runtime.world, { night: 1, duration: 1.6, ease: 'power1.inOut' }, 0);
      tl.to(runtime.world, { space: 0, duration: 0.3, ease: 'none' }, 1.6);
    }
    tl.to(runtime.camera, { ...shotVars(SLUG, FRAMES[next]), duration: 2, ease: 'power2.inOut' }, 0);
    move.current = tl;
  };

  return (
    <aside className="lab-panel" aria-label="Doppler lab">
      <span className="eyebrow">Lab · Chapter IX</span>
      <h1>The Doppler Effect</h1>
      <div className="choices" role="group" aria-label="View">
        {(
          [
            ['sound', 'Sound'],
            ['light', 'Light'],
          ] as const
        ).map(([m, name]) => (
          <button key={m} className="choice" aria-pressed={mode === m} onClick={() => show(m)}>
            {name}
          </button>
        ))}
      </div>
      {mode === 'sound' ? (
        <>
          <p>
            Waves spread from wherever the source was when it sent them: bunched ahead, stretched behind. Drag
            the listener anywhere; let them walk, too. Past the speed of sound, the jet outruns its own waves.
          </p>
          <div className="choices" role="group" aria-label="Source">
            {(
              [
                ['ambulance', 'Ambulance'],
                ['jet', 'Jet'],
              ] as const
            ).map(([k, name]) => (
              <button
                key={k}
                className="choice"
                aria-pressed={c.kind > 0.5 === (k === 'jet')}
                onClick={() => {
                  chooseSource(k);
                  c.refresh();
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <SourceControls key={c.kind} c={c} idPrefix="lab" />
          <ListenerControls c={c} idPrefix="lab" />
          <HearingReadout c={c} />
        </>
      ) : (
        <>
          <p>
            A galaxy moving away stretches its light: hydrogen's dark lines, the same pattern as here on
            Earth, all slide towards the red end, each by the same factor.
          </p>
          <LightControls
            c={c}
            idPrefix="lab"
            onZ={(z) => {
              gsap.to(dopplerRig(), { z, duration: 0.4, ease: 'power1.out', overwrite: 'auto' });
            }}
          />
        </>
      )}
      <Link
        to="/play/doppler"
        className="btn btn--ghost"
        style={{ alignSelf: 'flex-start', padding: '6px 0' }}
      >
        ← Back to the journey
      </Link>
    </aside>
  );
}
