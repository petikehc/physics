import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useApp } from '../state/store';
import { runtime } from '../engine/runtime';
import { createCameraRig, createDustRig, resetRig } from '../engine/rigs';
import { ICON_ORDER } from '../engine/dust/shapes';
import { TEASER } from '../engine/world/stations';
import { CHAPTERS } from '../chapters/registry';
import { audio } from '../audio';
import { TopBar } from '../ui/TopBar';
import { ChaptersMenu } from '../ui/ChaptersMenu';
import { PlayIcon } from '../ui/Icons';

const MORPH = 2.4;
const HOLD = 1.8;

/** Builds the looping sneak-peek: the Dust re-forms into each chapter's icon while the camera drifts. */
function buildTeaser(onIcon: (i: number) => void) {
  const dust = runtime.dust;
  const cam = runtime.camera;
  resetRig(cam, createCameraRig());
  resetRig(dust, createDustRig());
  Object.assign(cam, {
    tx: TEASER.x,
    ty: TEASER.y,
    tz: TEASER.z,
    orbitMix: 1,
    orbitAngle: Math.PI / 2,
    orbitRadius: 11.5,
    orbitHeight: -0.3,
    shake: 0.7,
  });
  Object.assign(dust, {
    x: TEASER.x,
    y: TEASER.y + 1.6,
    z: TEASER.z,
    scale: 0.85,
    from: 'pythagoras',
    to: 'pythagoras',
    morph: 1,
  });

  const sway = gsap.timeline({ repeat: -1, yoyo: true });
  sway.to(cam, { orbitAngle: Math.PI / 2 + 0.3, orbitHeight: 0.4, duration: 9, ease: 'sine.inOut' });
  sway.to(cam, { orbitAngle: Math.PI / 2 - 0.28, orbitHeight: -0.8, duration: 11, ease: 'sine.inOut' });

  const loop = gsap.timeline({ repeat: -1 });
  ICON_ORDER.forEach((icon, i) => {
    const next = ICON_ORDER[(i + 1) % ICON_ORDER.length]!;
    const accent = CHAPTERS[(i + 1) % CHAPTERS.length]!.accent;
    loop.to({}, { duration: HOLD });
    loop.set(dust, { from: icon, to: next, morph: 0 });
    loop.to(dust, { morph: 1, duration: MORPH, ease: 'power2.inOut' });
    loop.to(dust, { colorB: accent, duration: MORPH }, '<');
    // Name the next idea once its shape becomes recognisable.
    loop.call(() => onIcon((i + 1) % ICON_ORDER.length), undefined, `<${MORPH * 0.55}`);
  });
  // Start on the first icon in the first chapter's colour.
  dust.colorB = CHAPTERS[0]!.accent;
  return { loop, sway };
}

export default function Landing() {
  const navigate = useNavigate();
  const set = useApp((s) => s.set);
  const [icon, setIcon] = useState(0);
  const [menu, setMenu] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const teaser = useRef<ReturnType<typeof buildTeaser> | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    set({ mode: 'teaser', cameraMode: 'directed' });
    audio.setScene('teaser');
    teaser.current = buildTeaser(setIcon);
    return () => {
      teaser.current?.loop.kill();
      teaser.current?.sway.kill();
      audio.setScene(null);
    };
  }, [set]);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const split = SplitText.create('.landing__title', { type: 'chars', mask: 'chars' });
      // Revert the split afterwards: the masks would otherwise clip the title's glow into boxes.
      gsap.from(split.chars, {
        yPercent: 110,
        duration: 1.4,
        stagger: 0.035,
        ease: 'expo.out',
        delay: 0.3,
        onComplete: () => split.revert(),
      });
      gsap.from('.landing__sub, .landing__actions, .landing__foot', {
        autoAlpha: 0,
        y: 16,
        duration: 1,
        stagger: 0.12,
        delay: 1.0,
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const begin = (withSound: boolean) => {
    if (leaving) return;
    setLeaving(true);
    if (withSound) {
      void audio.enable();
      set({ soundEnabled: true });
      audio.cue('uiClick');
    }
    const t = teaser.current;
    t?.loop.pause();
    t?.sway.pause();
    const dust = runtime.dust;
    const cam = runtime.camera;
    const out = gsap.timeline({ onComplete: () => navigate('/play') });
    // Finish whatever shape is forming, then gather into the first chapter's triangle.
    out.to(dust, { morph: 1, duration: 0.35, ease: 'power1.out' });
    if (dust.to !== 'pythagoras') {
      out.add(() => Object.assign(dust, { from: dust.to, to: 'pythagoras', morph: 0 }));
      out.to(dust, { morph: 1, colorB: CHAPTERS[0]!.accent, duration: 1.1, ease: 'power2.inOut' });
    }
    out.to(
      cam,
      { orbitAngle: Math.PI / 2, orbitHeight: -0.3, orbitRadius: 11.5, duration: 1.1, ease: 'power2.inOut' },
      0,
    );
    out.to('.landing__inner, .landing__foot', { autoAlpha: 0, y: -12, duration: 0.6, ease: 'power2.in' }, 0);
    // Hand over with the camera in the same place the journey's first shot starts from.
    out.add(() => {
      const p = {
        x: cam.tx + Math.cos(cam.orbitAngle) * cam.orbitRadius,
        y: cam.ty + cam.orbitHeight,
        z: cam.tz + Math.sin(cam.orbitAngle) * cam.orbitRadius,
      };
      Object.assign(cam, { px: p.x, py: p.y, pz: p.z, orbitMix: 0 });
    });
  };

  const current = CHAPTERS[icon % CHAPTERS.length]!;

  return (
    <div className="overlay" ref={root}>
      <TopBar onChapters={() => setMenu(true)} />
      <div className="landing">
        <div className="landing__inner">
          <span
            className="chip"
            aria-live="polite"
            style={{ borderColor: `${current.accent}66`, color: current.accent }}
          >
            {current.numeral} · {current.title}
          </span>
          <h1 className="landing__title">
            From Sand to <em>Stars</em>
          </h1>
          <p className="landing__sub">
            Ten theorems of mathematics and physics, told as one cinematic journey, from a triangle in the
            sand to the stars.
          </p>
          <div className="landing__actions">
            <button
              className="btn btn--primary"
              onClick={() => begin(true)}
              onMouseEnter={() => audio.ui('hover')}
            >
              <PlayIcon /> Begin the journey
            </button>
            <button className="btn" onClick={() => begin(false)}>
              Watch in silence
            </button>
            <button className="btn btn--ghost" onClick={() => setMenu(true)}>
              Chapters
            </button>
          </div>
        </div>
        <p className="landing__foot">
          Chapter I is ready (about 2 minutes) · best with headphones · space to pause, arrows to step
        </p>
      </div>
      {menu ? <ChaptersMenu onClose={() => setMenu(false)} /> : null}
    </div>
  );
}
