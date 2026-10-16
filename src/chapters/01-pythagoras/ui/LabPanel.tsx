import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { useApp } from '../../../state/store';
import { runtime } from '../../../engine/runtime';
import { shotVars } from '../../../engine/camera/shots';
import { audio } from '../../../audio';
import { pyInteraction } from '../parts/Handles';
import {
  FRAME_ORIGIN,
  BASE_SCALE,
  INTERACTIVE_SCALE,
  LEG_MAX,
  LEG_MIN,
  pythagorasRig,
  SLIDE_STAGGER,
  SLIDING_TILES,
  TILE_STAGGER,
  uvToLocal,
} from '../rig';
import { useTriangle } from './useTriangle';

const fmt = (x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(2));

/** Lab-mode display: the triangle with its three tanks, all controls live. */
export function enterLabState() {
  const rig = pythagorasRig();
  Object.assign(rig, {
    a: 3,
    b: 4,
    gamma: 90,
    scale: INTERACTIVE_SCALE,
    draw: 3,
    groove: 1,
    stick: 0,
    labels: 1,
    rightMark: 1,
    tanks: 1,
    pourA: 0,
    pourB: 0,
    cFull: 1,
    areaLabels: 1,
    frame: 0,
    tiles: 0,
    layout: 0,
    glowA: 0,
    glowB: 0,
    proofSink: 0,
    radius: 0,
    circle: 0,
    interactive: 1,
    lab: 1,
  });
  Object.assign(runtime.camera, {
    ...shotVars('pythagoras', { pos: [3.2, 4.6, 5.8], target: [0, 0.3, 0], fov: 42, shake: 0, dof: 0 }),
    orbitMix: 0,
    lift: 0,
    roll: 0,
    veil: 0,
  });
  Object.assign(runtime.dust, {
    from: 'sand',
    to: 'sand',
    morph: 1,
    x: 0,
    y: 0,
    z: 0,
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
  const t = useTriangle();
  const set = useApp((s) => s.set);
  const [snap, setSnap] = useState(pyInteraction.snap);
  const [busy, setBusy] = useState(false);
  const proof = useRef<gsap.core.Timeline | null>(null);
  const rig = pythagorasRig();

  useEffect(() => () => void proof.current?.kill(), []);

  const right = Math.abs(t.gamma - 90) < 1e-6;
  const a2 = t.a * t.a;
  const b2 = t.b * t.b;
  const c2 = t.c * t.c;
  const diff = c2 - (a2 + b2);

  const setLeg = (k: 'a' | 'b', v: number) => {
    rig[k] = snap ? Math.round(v) : v;
    t.refresh();
  };

  /** Plays a proof with a directed camera, then hands the camera back. */
  const run = (kind: 'pour' | 'rearrange') => {
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
        set({ cameraMode: 'interactive' });
      },
    });
    proof.current = tl;
    if (kind === 'pour') {
      tl.set(rig, { cFull: 0, pourA: 0, pourB: 0 });
      tl.to(
        cam,
        {
          ...shotVars('pythagoras', { pos: [4.2, 5.4, 6.6], target: [0.4, 0.4, -0.3] }),
          duration: 1.6,
          ease: 'power2.inOut',
        },
        0,
      );
      tl.call(() => audio.cue('lift'), undefined, 0.2);
      tl.to(rig, { pourA: 1, duration: 4.2, ease: 'none' }, 0.2);
      tl.call(() => audio.cue('lift'), undefined, 4.6);
      tl.to(rig, { pourB: 1, duration: 4.2, ease: 'none' }, 4.6);
      tl.call(() => audio.cue('brim'), undefined, 8.8);
      tl.to({}, { duration: 1.6 });
      tl.set(rig, { cFull: 1, pourA: 0, pourB: 0 });
    } else {
      const [fx, , fz] = uvToLocal(
        FRAME_ORIGIN[0] + (t.a + t.b) / 2,
        FRAME_ORIGIN[1] + (t.a + t.b) / 2,
        BASE_SCALE,
      );
      const h = 2.4 + (t.a + t.b) * BASE_SCALE * 1.1;
      tl.to(rig, { scale: BASE_SCALE, duration: 1.2, ease: 'power2.inOut' }, 0);
      tl.to(rig, { tanks: 0, areaLabels: 0, duration: 1.0, ease: 'power2.in' }, 0);
      tl.to(
        cam,
        {
          ...shotVars('pythagoras', { pos: [fx, h, fz + 1.6], target: [fx, 0, fz + 0.1] }),
          duration: 2.2,
          ease: 'power3.inOut',
        },
        0.2,
      );
      tl.set(rig, { tiles: 0, layout: 0, frame: 0, proofSink: 0, glowA: 0, glowB: 0 }, 0);
      tl.to(rig, { frame: 1, duration: 1.2, ease: 'power2.out' }, 1.0);
      const t0 = 1.8;
      const dur = 3.8;
      tl.to(rig, { tiles: 1, duration: dur, ease: 'none' }, t0);
      const span = 1 - TILE_STAGGER * 3;
      for (let i = 0; i < 4; i++)
        tl.call(() => audio.cue('clack', { i }), undefined, t0 + dur * (i * TILE_STAGGER + span));
      tl.to(rig, { glowA: 1, duration: 0.8 }, t0 + dur);
      const t1 = t0 + dur + 1.8;
      const d1 = 3.2;
      tl.to(rig, { layout: 1, duration: d1, ease: 'none' }, t1);
      const span2 = 1 - SLIDE_STAGGER * (SLIDING_TILES.length - 1);
      for (let k = 0; k < SLIDING_TILES.length; k++)
        tl.call(() => audio.cue('clack', { i: k + 4 }), undefined, t1 + d1 * (k * SLIDE_STAGGER + span2));
      tl.to(rig, { glowB: 1, duration: 0.8 }, t1 + d1);
      tl.call(() => audio.cue('glow', { which: 1 }), undefined, t1 + d1);
      tl.to({}, { duration: 2.4 });
      tl.to(rig, { proofSink: 1, glowB: 0, duration: 1.2, ease: 'power2.in' });
      tl.set(rig, { tiles: 0, layout: 0, frame: 0, proofSink: 0, glowA: 0 });
      tl.to(rig, { scale: INTERACTIVE_SCALE, tanks: 1, areaLabels: 1, duration: 1.4, ease: 'power2.out' });
      tl.to(
        cam,
        {
          ...shotVars('pythagoras', { pos: [3.2, 4.6, 5.8], target: [0, 0.3, 0] }),
          duration: 1.8,
          ease: 'power2.inOut',
        },
        '<',
      );
    }
  };

  return (
    <aside className="lab-panel" aria-label="Pythagoras lab">
      <span className="eyebrow">Lab · Chapter I</span>
      <h1>The Pythagorean Theorem</h1>
      <p>
        Drag the glowing corners in the scene, or use the sliders. Each tank holds the area of the square on
        its side.
      </p>

      <div className="field">
        <div className="field__row">
          <label htmlFor="lab-a" style={{ color: 'var(--sym-a)' }}>
            Side a
          </label>
          <span className="field__value">{fmt(t.a)}</span>
        </div>
        <input
          id="lab-a"
          className="range"
          type="range"
          min={LEG_MIN}
          max={LEG_MAX}
          step={snap ? 1 : 0.01}
          value={t.a}
          onChange={(e) => setLeg('a', +e.target.value)}
          disabled={busy}
        />
      </div>
      <div className="field">
        <div className="field__row">
          <label htmlFor="lab-b" style={{ color: 'var(--sym-b)' }}>
            Side b
          </label>
          <span className="field__value">{fmt(t.b)}</span>
        </div>
        <input
          id="lab-b"
          className="range"
          type="range"
          min={LEG_MIN}
          max={LEG_MAX}
          step={snap ? 1 : 0.01}
          value={t.b}
          onChange={(e) => setLeg('b', +e.target.value)}
          disabled={busy}
        />
      </div>
      <div className="field">
        <div className="field__row">
          <label htmlFor="lab-g">Angle between a and b</label>
          <span className="field__value">{fmt(t.gamma)}°</span>
        </div>
        <input
          id="lab-g"
          className="range"
          type="range"
          min={20}
          max={160}
          step={snap ? 5 : 1}
          value={t.gamma}
          onChange={(e) => {
            rig.gamma = +e.target.value;
            t.refresh();
          }}
          disabled={busy}
        />
      </div>
      <label className="toggle">
        <input
          type="checkbox"
          checked={snap}
          onChange={(e) => {
            pyInteraction.snap = e.target.checked;
            setSnap(e.target.checked);
          }}
        />
        Snap to whole numbers
      </label>

      <div className="readout" aria-live="polite">
        <span>
          <span style={{ color: 'var(--sym-a)' }}>a² = {fmt(a2)}</span> ·{' '}
          <span style={{ color: 'var(--sym-b)' }}>b² = {fmt(b2)}</span>
        </span>
        <span>
          <span style={{ color: 'var(--sym-c)' }}>c² = {fmt(c2)}</span> · a² + b² = {fmt(a2 + b2)}
        </span>
        <span
          className={right ? '' : 'warn'}
          style={{ fontFamily: 'var(--font-body)', fontSize: 14, marginTop: 4 }}
        >
          {right
            ? 'Right angle: a² + b² = c² exactly. The big tank fills to the brim.'
            : diff < 0
              ? `Acute angle: c² is ${fmt(-diff)} smaller, so the big tank overflows.`
              : `Obtuse angle: c² is ${fmt(diff)} bigger, so the big tank is left short.`}
        </span>
        {!right ? (
          <span style={{ color: 'var(--chalk-dim)' }}>Law of cosines: c² = a² + b² − 2ab·cos γ</span>
        ) : null}
      </div>
      {t.triple ? (
        <span className="badge">✦ Pythagorean triple: {`${t.a}–${t.b}–${Math.round(t.c)}`}</span>
      ) : null}

      <div className="lab-actions">
        <button className="btn" onClick={() => run('pour')} disabled={busy || !right}>
          Play the pour proof
        </button>
        <button className="btn" onClick={() => run('rearrange')} disabled={busy || !right}>
          Play the rearrangement proof
        </button>
        <button
          className="btn btn--ghost"
          disabled={busy}
          onClick={() => {
            gsap.to(rig, { a: 3, b: 4, gamma: 90, duration: 0.6, ease: 'power2.inOut' });
          }}
        >
          Reset
        </button>
      </div>
      {!right ? <p>Proofs work only for right triangles. Set the angle back to 90°.</p> : null}
      <Link
        to="/play/pythagoras"
        className="btn btn--ghost"
        style={{ alignSelf: 'flex-start', padding: '6px 0' }}
      >
        ← Back to the journey
      </Link>
    </aside>
  );
}
