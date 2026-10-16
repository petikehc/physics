import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useApp } from '../state/store';
import { controller } from './controller';
import { renderCaption } from '../ui/caption';
import { Formula } from '../engine/labels/Formula';
import { chapterBySlug } from '../chapters/registry';
import { VIEWS } from '../chapters/views';

function useBeat() {
  const key = useApp((s) => s.beatKey);
  return controller.journey?.beats.find((b) => b.key === key);
}

/** Caption for the current beat; lines rise in through a mask when the beat changes. */
export function Captions() {
  const beat = useBeat();
  const on = useApp((s) => s.captionsOn);
  const reduced = useApp((s) => s.reducedMotion);
  const yourTurn = useApp((s) => s.yourTurn);
  const ref = useRef<HTMLDivElement>(null);
  const show =
    on &&
    beat &&
    beat.kind !== 'title' &&
    beat.kind !== 'flight' &&
    beat.kind !== 'end' &&
    beat.kind !== 'yourTurn';

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !show) return;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
        return;
      }
      const heading = el.querySelector('.captions__heading');
      const body = el.querySelector('.captions__body');
      const split = body ? SplitText.create(body, { type: 'lines', mask: 'lines' }) : null;
      gsap.set(el, { autoAlpha: 1 });
      if (heading)
        gsap.fromTo(
          heading,
          { y: 24, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.8, ease: 'expo.out' },
        );
      if (split)
        gsap.fromTo(
          split.lines,
          { yPercent: 105 },
          {
            yPercent: 0,
            duration: 0.9,
            stagger: 0.08,
            ease: 'expo.out',
            delay: 0.12,
            onComplete: () => split.revert(),
          },
        );
    }, el);
    return () => ctx.revert();
  }, [beat?.key, show, reduced]);

  if (!show || !beat || yourTurn) return null;
  return (
    <div key={beat.key} className="captions" ref={ref} aria-live="polite" style={{ visibility: 'hidden' }}>
      {beat.heading ? <h2 className="captions__heading">{beat.heading}</h2> : null}
      <p className="captions__body">{renderCaption(beat.body)}</p>
    </div>
  );
}

/** Big title card for a chapter's opening beat. */
export function TitleCard() {
  const beat = useBeat();
  const reduced = useApp((s) => s.reducedMotion);
  const ref = useRef<HTMLDivElement>(null);
  const visible = beat?.kind === 'title';
  const ch = chapterBySlug(beat?.chapter);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !visible) return;
    const ctx = gsap.context(() => {
      const title = el.querySelector('.title-card__title');
      const tl = gsap.timeline();
      tl.set(el, { autoAlpha: 1 });
      if (reduced || !title) {
        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 });
      } else {
        const split = SplitText.create(title, { type: 'chars,words', mask: 'chars' });
        tl.fromTo(
          '.title-card__numeral',
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.8 },
          1.4,
        );
        tl.fromTo(
          split.chars,
          { yPercent: 110 },
          { yPercent: 0, duration: 1.1, stagger: 0.025, ease: 'expo.out', onComplete: () => split.revert() },
          1.6,
        );
        tl.fromTo('.title-card__meta', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 2.4);
        tl.fromTo('.title-card__body', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 3.0);
      }
    }, el);
    return () => ctx.revert();
  }, [visible, beat?.key, reduced]);

  if (!visible || !ch) return null;
  return (
    <div key={beat?.key} className="title-card" ref={ref} style={{ visibility: 'hidden' }}>
      <div>
        <div className="title-card__numeral" style={{ color: ch.accent }}>
          Chapter {ch.numeral}
        </div>
        <h1 className="title-card__title">{ch.title}</h1>
        <div className="title-card__meta">
          <span className="chip">
            {ch.figure} · {ch.place} · {ch.year}
          </span>
        </div>
        <p className="title-card__body captions__body" style={{ maxWidth: 520, margin: '18px auto 0' }}>
          {renderCaption(beat?.body)}
        </p>
      </div>
    </div>
  );
}

/** The chapter formula, assembled during the formula beat. */
export function FormulaOverlay() {
  const beat = useBeat();
  const reduced = useApp((s) => s.reducedMotion);
  const visible = beat?.kind === 'formula';
  // Keep the last formula while it dissolves after its beat.
  const last = useRef(VIEWS.pythagoras!.formula);
  const f = beat ? VIEWS[beat.chapter]?.formula : undefined;
  if (visible && f) last.current = f;
  return (
    <Formula source={last.current.tex} visible={visible} caption={last.current.caption} reduced={reduced} />
  );
}
