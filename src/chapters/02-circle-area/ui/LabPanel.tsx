import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { useApp } from '../../../state/store';
import { runtime } from '../../../engine/runtime';
import { shotVars } from '../../../engine/camera/shots';
import { station } from '../../../engine/world/stations';
import { audio } from '../../../audio';
import { circleRig, CIRCLE_DEFAULTS, RING_COUNT } from '../rig';
import { dealTo } from '../interaction';
import { CircleControls, CircleReadout } from './Controls';
import { useCircle } from './useCircle';

const SLUG = 'circle-area';
type V3 = [number, number, number];
/** The panel sits on the right, so every Lab shot frames the scene left of centre. */
const view = (pos: V3, target: V3) =>
  shotVars(SLUG, { pos: [pos[0] + 1.6, pos[1], pos[2]], target: [target[0] + 1.6, target[1], target[2]] });
const HOME: [V3, V3] = [
  [0, 6.4, 5.0],
  [0, 0, 0.2],
];

/** Lab-mode display: the disc dealt into a row of 16, all controls live. */
export function enterCircleLab() {
  const rig = circleRig();
  Object.assign(rig, {
    ...CIRCLE_DEFAULTS,
    disc: 1,
    whole: 0,
    n: 16,
    fromN: 0,
    deal: 1,
    lift: 0.45,
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
  const c = useCircle();
  const set = useApp((s) => s.set);
  const [busy, setBusy] = useState(false);
  const proof = useRef<gsap.core.Timeline | null>(null);
  const rig = circleRig();

  useEffect(() => () => void proof.current?.kill(), []);

  /** Plays a proof with a directed camera, then hands the camera back. */
  const run = (kind: 'slices' | 'onion') => {
    if (busy) return;
    audio.ui('click');
    setBusy(true);
    proof.current?.kill();
    set({ cameraMode: 'directed' });
    rig.interactive = 0;
    const cam = runtime.camera;
    const tl = gsap.timeline({
      onComplete: () => {
        rig.interactive = 1;
        setBusy(false);
        c.refresh();
        set({ cameraMode: 'interactive' });
      },
    });
    proof.current = tl;
    const home = () => tl.to(cam, { ...view(...HOME), duration: 1.6, ease: 'power2.inOut' }, '<');

    if (kind === 'slices') {
      // Back into a whole disc, cut it again, deal 8, then keep halving.
      tl.to(cam, { ...view([0.4, 4.6, 4.4], [0, 0, 0]), duration: 1.4 }, 0);
      tl.set(rig, { fromN: 0, explode: 0, ghost: 0, dims: 0 }, 0);
      tl.to(rig, { deal: 0, duration: 1.6, ease: 'none' }, 0);
      tl.set(rig, { whole: 1, cut: 0, n: 8 }, 1.7);
      tl.to(rig, { radius: 1, duration: 0.5 }, 1.7);
      tl.to(rig, { cut: 1, duration: 2.4, ease: 'none' }, 2.3);
      for (let i = 0; i < 4; i++) tl.call(() => audio.cue('cut', { i }), undefined, 2.3 + i * 0.6);
      tl.set(rig, { whole: 0 }, 4.8);
      tl.to(rig, { radius: 0, explode: 0.1, duration: 0.6, ease: 'back.out(2)' }, 4.8);
      tl.call(() => audio.cue('lift'), undefined, 5.5);
      tl.to(rig, { deal: 1, duration: 2.8, ease: 'none' }, 5.5);
      tl.call(() => audio.cue('riffle', { n: 8, dur: 1.4 }), undefined, 6.9);
      tl.to(cam, { ...view([0, 7.4, 1.4], [0, 0, 0.05]), duration: 2 }, 5.5);
      let t = 8.6;
      let from = 8;
      for (const n of [16, 32, 64]) {
        tl.set(rig, { fromN: from, n, deal: 0, lift: n >= 64 ? 0.15 : 0.35 }, t);
        tl.call(() => audio.cue('double', { k: Math.log2(n) - 3 }), undefined, t);
        tl.to(rig, { deal: 1, duration: 1.3, ease: 'none' }, t);
        from = n;
        t += 1.6;
      }
      tl.to(rig, { ghost: 1, dims: 1, duration: 0.9 }, t);
      tl.call(() => audio.cue('glow', { which: 0 }), undefined, t);
      tl.to({}, { duration: 3 }, t + 0.9);
      tl.to(rig, { ghost: 0, dims: 0, duration: 0.6 });
      home();
    } else {
      tl.to(rig, { piecesSink: 1, ghost: 0, dims: 0, duration: 1.2, ease: 'power2.in' }, 0);
      tl.call(() => audio.cue('sink'), undefined, 0);
      tl.to(cam, { ...view([2.6, 3.6, 4.4], [0, 0, 0]), duration: 1.6 }, 0);
      tl.set(rig, { rings: 0, unroll: 0, ringsSink: 0, triDims: 0 }, 0);
      tl.to(rig, { rings: 1, duration: 1.2, ease: 'power2.out' }, 1.0);
      tl.call(() => audio.cue('rise', { gain: 0.6 }), undefined, 1.0);
      const t0 = 2.6;
      const d = 5;
      tl.to(rig, { unroll: 1, duration: d, ease: 'none' }, t0);
      tl.call(() => audio.cue('uncoil'), undefined, t0);
      const stagger = 0.55 / (RING_COUNT - 1);
      const span = 1 - stagger * (RING_COUNT - 1);
      for (let i = 0, k = 0; i < RING_COUNT; i += 3, k++)
        tl.call(() => audio.cue('tink', { i: k + 1 }), undefined, t0 + d * (span + i * stagger));
      const h = 6 + c.r * 3.2;
      tl.to(cam, { ...view([0, h, 1.4], [0, 0, 0.1]), duration: 2.6 }, t0);
      tl.to(rig, { triDims: 1, duration: 0.8 }, t0 + d);
      tl.to({}, { duration: 3 });
      tl.to(rig, { triDims: 0, ringsSink: 1, duration: 1.2, ease: 'power2.in' });
      tl.set(rig, { rings: 0, unroll: 0, ringsSink: 0 });
      tl.to(rig, { piecesSink: 0, duration: 1.2, ease: 'power2.out' });
      home();
    }
  };

  return (
    <aside className="lab-panel" aria-label="Circle area lab">
      <span className="eyebrow">Lab · Chapter II</span>
      <h1>The Area of a Circle</h1>
      <p>
        Cut the disc into more slices and deal them into a row. Change the radius and watch the area follow.
      </p>
      <CircleControls c={c} disabled={busy} idPrefix="lab" />
      <CircleReadout c={c} />
      <div className="lab-actions">
        <button className="btn" onClick={() => run('slices')} disabled={busy}>
          Play the slicing proof
        </button>
        <button className="btn" onClick={() => run('onion')} disabled={busy}>
          Play the onion proof
        </button>
        <button
          className="btn btn--ghost"
          disabled={busy}
          onClick={() => {
            gsap.to(rig, { r: CIRCLE_DEFAULTS.r, duration: 0.6, ease: 'power2.inOut', onUpdate: c.refresh });
            dealTo(16);
          }}
        >
          Reset
        </button>
      </div>
      <Link
        to="/play/circle-area"
        className="btn btn--ghost"
        style={{ alignSelf: 'flex-start', padding: '6px 0' }}
      >
        ← Back to the journey
      </Link>
    </aside>
  );
}
