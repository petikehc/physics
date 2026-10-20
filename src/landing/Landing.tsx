import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useApp } from '../state/store';
import { runtime } from '../engine/runtime';
import { createCameraRig, createDustRig, createWorldRig, resetRig } from '../engine/rigs';
import { ICON_ORDER } from '../engine/dust/shapes';
import { TEASER } from '../engine/world/stations';
import { portraitFit } from '../engine/camera/fit';
import { CHAPTERS } from '../chapters/registry';
import { audio } from '../audio';
import { TopBar } from '../ui/TopBar';
import { ChaptersMenu } from '../ui/ChaptersMenu';
import { PlayIcon } from '../ui/Icons';

const MORPH = 2.4;
const HOLD = 1.8;

/** The teaser camera circles TEASER at this distance, with this lens, and the icons float DUST_LIFT above it. */
const RADIUS = 11.5;
const FOV = 40;
const DUST_LIFT = 1.6;
/** How far the largest icons reach above and below their centre (world units, at the teaser's scale). */
const ICON_UP = 1.95;
const ICON_DOWN = 1.75;

/**
 * Fits the icons into the sky between the top of the screen and the chip that names them, so they never sit
 * on the text: steps the camera back if the gap is too small (or in, a little, if it is roomy) and returns the
 * lens shift that centres them in it.
 */
function teaserFrame(width: number, height: number, chipTop: number) {
  const fit = portraitFit(width / height);
  // Screen heights in NDC (−1 at the bottom, 1 at the top).
  const top = 1 - (2 * Math.max(16, height * 0.05)) / height;
  const bottom = Math.min(1 - (2 * (chipTop - 18)) / height, top - 0.3);
  const perUnit = 1 / (RADIUS * fit.dolly * Math.tan((((FOV * fit.fov) / 2) * Math.PI) / 180));
  const hi = (DUST_LIFT + ICON_UP) * perUnit;
  const lo = (DUST_LIFT - ICON_DOWN) * perUnit;
  const room = top - bottom;
  const k = hi - lo > room ? Math.min((hi - lo) / room, 2.5) : Math.max((hi - lo) / (0.8 * room), 0.75);
  // Stepping back by k gathers the icon towards the target, which sits in the middle of the screen.
  const mid = (hi + lo) / 2 / k;
  return { orbitRadius: RADIUS * k, lensY: ((top + bottom) / 2 - mid) / 2 };
}

/** Builds the looping sneak-peek: the Dust re-forms into each chapter's icon while the camera drifts. */
function buildTeaser(onIcon: (i: number) => void) {
  const dust = runtime.dust;
  const cam = runtime.camera;
  resetRig(cam, createCameraRig());
  resetRig(dust, createDustRig());
  resetRig(runtime.world, createWorldRig());
  Object.assign(cam, {
    tx: TEASER.x,
    ty: TEASER.y,
    tz: TEASER.z,
    orbitMix: 1,
    orbitAngle: Math.PI / 2,
    orbitRadius: RADIUS,
    orbitHeight: -0.3,
    fov: FOV,
    shake: 0.7,
  });
  Object.assign(dust, {
    x: TEASER.x,
    y: TEASER.y + DUST_LIFT,
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
  const chip = useRef<HTMLSpanElement>(null);
  const left = useRef(false);

  useEffect(() => {
    set({ mode: 'teaser', cameraMode: 'directed' });
    audio.setScene('teaser');
    teaser.current = buildTeaser(setIcon);
    // Keep the icons above the text whenever the layout changes (resizing, rotating, web fonts arriving).
    const frame = () => {
      const el = chip.current;
      if (!el || left.current) return;
      Object.assign(
        runtime.camera,
        teaserFrame(window.innerWidth, window.innerHeight, el.getBoundingClientRect().top),
      );
    };
    frame();
    const observer = new ResizeObserver(frame);
    if (chip.current?.parentElement) observer.observe(chip.current.parentElement);
    window.addEventListener('resize', frame);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', frame);
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
    left.current = true;
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
      {
        orbitAngle: Math.PI / 2,
        orbitHeight: -0.3,
        orbitRadius: RADIUS,
        lensY: 0,
        duration: 1.1,
        ease: 'power2.inOut',
      },
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
            ref={chip}
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
          Chapters I–IX are ready (about 17 minutes) · best with headphones · space to pause, arrows to step
        </p>
      </div>
      {menu ? <ChaptersMenu onClose={() => setMenu(false)} /> : null}
    </div>
  );
}
