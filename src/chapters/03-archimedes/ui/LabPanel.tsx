import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { useApp } from '../../../state/store';
import { runtime } from '../../../engine/runtime';
import { shotVars } from '../../../engine/camera/shots';
import { station } from '../../../engine/world/stations';
import { audio } from '../../../audio';
import { immersionWindow } from '../hang';
import { archimedesRig, ARCHIMEDES_DEFAULTS, CROWN_SIZE } from '../rig';
import { FloatControls } from './Controls';

const SLUG = 'archimedes';
type V3 = [number, number, number];
/** The panel sits on the right, so every Lab shot frames the scene left of centre. */
const view = (pos: V3, target: V3) =>
  shotVars(SLUG, { pos: [pos[0] + 1.3, pos[1], pos[2]], target: [target[0] + 1.3, target[1], target[2]] });
const HOME: [V3, V3] = [
  [0, 1.9, 4.2],
  [0, 0.9, 0],
];

/** Lab-mode display: the tank and the scale, with a block of ice floating in fresh water. */
export function enterArchimedesLab() {
  Object.assign(archimedesRig(), {
    ...ARCHIMEDES_DEFAULTS,
    tank: 1,
    gantry: 1,
    crown: 1,
    hookOut: 1,
    play: 1,
    material: 2,
    fluid: 1,
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
    from: 'sand',
    to: 'sand',
    morph: 1,
    x: o.x,
    y: o.y,
    z: o.z,
    scale: 1,
    size: 0.55,
    spin: 0,
    swirl: 0.5,
    drift: 0.3,
    colorA: '#ffe7c4',
    colorB: '#ffb46a',
  });
}

export function LabPanel() {
  const set = useApp((s) => s.set);
  const [busy, setBusy] = useState(false);
  const proof = useRef<gsap.core.Timeline | null>(null);
  const rig = archimedesRig();

  useEffect(() => () => void proof.current?.kill(), []);

  /** Replays the crown on the scale: weigh it, lower it, spill, read the push; then hand the tank back. */
  const run = () => {
    if (busy) return;
    audio.ui('click');
    setBusy(true);
    proof.current?.kill();
    set({ cameraMode: 'directed' });
    rig.interactive = 0;
    const cam = runtime.camera;
    const w = immersionWindow(CROWN_SIZE.h);
    const tl = gsap.timeline({
      onComplete: () => {
        rig.interactive = 1;
        setBusy(false);
        set({ cameraMode: 'interactive' });
      },
    });
    proof.current = tl;
    tl.to(rig, { play: 0, duration: 0.6 }, 0);
    tl.set(rig, { fluid: 1, bar: 0, lower: 0, spillA: 0, spillB: 0, swap: 0, level: 1, arrows: 0 }, 0.6);
    tl.to(rig, { hookOut: 0, readout: 1, beakers: 1, duration: 1.2, ease: 'power2.out' }, 0.6);
    tl.to(cam, { ...view([-2.0, 2.3, 4.6], [0.5, 1.1, 0]), duration: 1.6, ease: 'power2.inOut' }, 0.2);
    const t0 = 2.2;
    const d = 4;
    tl.to(rig, { lower: 1, duration: d, ease: 'none' }, t0);
    tl.to(rig, { spillA: 1, duration: d * (w.under - w.touch), ease: 'none' }, t0 + d * w.touch);
    tl.call(() => audio.cue('plunk'), undefined, t0 + d * w.touch);
    tl.to(rig, { arrows: 1, duration: 0.8, ease: 'back.out(1.6)' }, t0 + d + 0.2);
    tl.call(() => audio.cue('glow', { which: 1 }), undefined, t0 + d + 0.2);
    tl.to({}, { duration: 3.2 }, t0 + d + 1);
    tl.to(rig, { arrows: 0, lower: 0, duration: 1.4, ease: 'power1.inOut' }, '>');
    tl.to(rig, { hookOut: 1, readout: 0, beakers: 0, duration: 1.2, ease: 'power2.in' }, '>');
    tl.set(rig, { spillA: 0 });
    tl.to(rig, { play: 1, duration: 0.8 });
    tl.to(cam, { ...view(...HOME), duration: 1.6, ease: 'power2.inOut' }, '<');
  };

  return (
    <aside className="lab-panel" aria-label="Archimedes lab">
      <span className="eyebrow">Lab · Chapter III</span>
      <h1>Archimedes&rsquo; Principle</h1>
      <p>
        Anything in a fluid is pushed up by the weight of the fluid it pushes aside. Drop things in and see
        how far they sink.
      </p>
      <FloatControls disabled={busy} />
      <div className="lab-actions">
        <button className="btn" onClick={run} disabled={busy}>
          Replay the crown on the scale
        </button>
      </div>
      <Link
        to="/play/archimedes"
        className="btn btn--ghost"
        style={{ alignSelf: 'flex-start', padding: '6px 0' }}
      >
        ← Back to the journey
      </Link>
    </aside>
  );
}
