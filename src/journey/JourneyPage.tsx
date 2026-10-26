import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../state/store';
import { controller } from './controller';
import { audio } from '../audio';
import { runtime } from '../engine/runtime';
import { chapterBySlug } from '../chapters/registry';
import { FINALE, segmentBySlug } from '../chapters/finale/meta';
import { TopBar } from '../ui/TopBar';
import { ChaptersMenu } from '../ui/ChaptersMenu';
import { PlayerBar } from './PlayerBar';
import { Captions, FormulaOverlay, TitleCard } from './Overlays';
import { EndCard } from './EndCard';
import { VIEWS } from '../chapters/views';

/** What a touch can start on without being a swipe through the story: the controls and the panels that scroll. */
const CONTROLS =
  'button, a, input, select, textarea, label, [role="slider"], .player, .topbar, .popover, .your-turn, .constellation';

/** The cinematic journey: one master timeline, a player, and overlays driven by the current beat. */
export default function JourneyPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const set = useApp((s) => s.set);
  const yourTurn = useApp((s) => s.yourTurn);
  const ended = useApp((s) => s.ended);
  const beatKey = useApp((s) => s.beatKey);
  const reduced = useApp((s) => s.reducedMotion);
  const [menu, setMenu] = useState(false);
  const journeyId = useApp((s) => s.journeyId);
  const ready = journeyId > 0;
  const veil = useRef<HTMLDivElement>(null);

  const meta = chapterBySlug(slug);
  // A chapter that is ready, or the finale.
  const known = !!slug && (meta?.status === 'ready' || slug === FINALE.slug);
  useEffect(() => {
    if (slug && !known) navigate('/', { replace: true });
  }, [slug, known, navigate]);

  useEffect(() => {
    set({ mode: 'journey', chapterSlug: known ? slug! : 'pythagoras' });
    audio.setScene('journey');
    controller.start(known ? slug : undefined);
    controller.play();
    return () => {
      controller.dispose();
      audio.setScene(null);
      set({ playing: false, beatKey: null, yourTurn: false, ended: false, cameraMode: 'directed' });
    };
  }, [set, slug, known]);

  // Keyboard, wheel and swipe all step one beat at a time.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        controller.toggle();
      } else if (e.key === 'ArrowRight' && (e.target as HTMLElement)?.getAttribute('role') !== 'slider')
        controller.step(1);
      else if (e.key === 'ArrowLeft' && (e.target as HTMLElement)?.getAttribute('role') !== 'slider')
        controller.step(-1);
    };
    let wheelAcc = 0;
    let wheelLock = 0;
    const onWheel = (e: WheelEvent) => {
      if (useApp.getState().yourTurn || menu) return;
      const now = performance.now();
      if (now < wheelLock) return;
      wheelAcc += e.deltaY;
      if (Math.abs(wheelAcc) > 60) {
        controller.step(wheelAcc > 0 ? 1 : -1);
        wheelAcc = 0;
        wheelLock = now + 900;
      }
    };
    let touch: { x: number; y: number } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      // Only one finger across the scene itself is a swipe: not a drag on a control, a scroll in a panel or a pinch.
      const onControl = (e.target as Element | null)?.closest?.(CONTROLS);
      touch = t && e.touches.length === 1 && !onControl && !menu ? { x: t.clientX, y: t.clientY } : null;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!touch || !t || useApp.getState().yourTurn) return;
      const dx = t.clientX - touch.x;
      const dy = t.clientY - touch.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) controller.step(dx < 0 ? 1 : -1);
      else if (Math.abs(dy) > 80) controller.step(dy < 0 ? 1 : -1);
      touch = null;
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [menu]);

  // Reduced motion: hide long camera flights behind a veil.
  useEffect(() => {
    if (!reduced) return;
    let raf = 0;
    const loop = () => {
      if (veil.current) veil.current.style.opacity = String(runtime.camera.veil);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const onContinue = useCallback(() => controller.continueFromYourTurn(), []);
  const chapter = chapterBySlug(beatKey?.split(':')[0]);
  const segment = segmentBySlug(beatKey?.split(':')[0]);
  const YourTurn = chapter ? VIEWS[chapter.slug]?.YourTurn : undefined;

  return (
    <div className="overlay">
      <div className="bottom-shade" />
      {ready ? (
        <>
          <TitleCard />
          <FormulaOverlay />
          <Captions />
          {yourTurn && YourTurn ? <YourTurn onContinue={onContinue} /> : null}
          {ended ? <EndCard /> : null}
          <PlayerBar />
        </>
      ) : null}
      <TopBar
        chapterLabel={chapter ? `${chapter.numeral} · ${chapter.short} · ${chapter.year}` : segment?.short}
        onChapters={() => setMenu(true)}
      />
      {menu ? <ChaptersMenu onClose={() => setMenu(false)} /> : null}
      <div className="fade-veil" ref={veil} />
    </div>
  );
}
