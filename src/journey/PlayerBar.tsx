import { useEffect, useRef, useState } from 'react';
import { useApp } from '../state/store';
import { controller } from './controller';
import { CHAPTERS, chapterBySlug } from '../chapters/registry';
import { segmentBySlug } from '../chapters/finale/meta';
import { CaptionsIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon } from '../ui/Icons';
import { audio } from '../audio';

const SPEEDS = [0.75, 1, 1.25];

function fmt(t: number) {
  const s = Math.max(0, Math.floor(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function PlayerBar() {
  const playing = useApp((s) => s.playing);
  const speed = useApp((s) => s.speed);
  const captionsOn = useApp((s) => s.captionsOn);
  const setPrefs = useApp((s) => s.setPrefs);
  const fill = useRef<HTMLDivElement>(null);
  const time = useRef<HTMLSpanElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; label: string } | null>(null);
  const dragging = useRef(false);

  const journey = controller.journey;
  const duration = journey?.duration ?? 1;

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const t = controller.time;
      if (fill.current) fill.current.style.transform = `scaleX(${t / duration})`;
      if (time.current) time.current.textContent = `${fmt(t)} / ${fmt(duration)}`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  const timeAt = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    return (Math.min(Math.max(clientX - r.left, 0), r.width) / r.width) * duration;
  };

  const labelAt = (t: number) => {
    const beats = journey?.beats ?? [];
    let b = beats[0];
    for (const x of beats) if (x.start <= t) b = x;
    const seg = segmentBySlug(b?.chapter);
    return `${seg ? seg.short : ''}${b?.heading ? ` — ${b.heading}` : ''}`;
  };

  return (
    <div className="player" role="group" aria-label="Journey player">
      <button
        className="player__play"
        onClick={() => {
          audio.ui('click');
          controller.toggle();
        }}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div className="player__group">
        <button className="icon-btn" onClick={() => controller.step(-1)} aria-label="Previous beat">
          <PrevIcon />
        </button>
        <button className="icon-btn" onClick={() => controller.step(1)} aria-label="Next beat">
          <NextIcon />
        </button>
      </div>
      <span className="player__time" ref={time} aria-hidden="true" />
      <div
        className="scrubber"
        ref={track}
        role="slider"
        aria-label="Journey position"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(controller.time)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') controller.step(1);
          if (e.key === 'ArrowLeft') controller.step(-1);
        }}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as Element).setPointerCapture(e.pointerId);
          controller.seek(timeAt(e.clientX));
        }}
        onPointerMove={(e) => {
          const t = timeAt(e.clientX);
          const r = track.current!.getBoundingClientRect();
          setHover({ x: e.clientX - r.left, label: labelAt(t) });
          if (dragging.current) controller.seek(t);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerLeave={() => setHover(null)}
      >
        <div className="scrubber__track">
          <div className="scrubber__fill" ref={fill} />
        </div>
        {journey?.beats.map((b) => (
          <span
            key={b.key}
            className="scrubber__marker"
            style={{ left: `${(b.start / duration) * 100}%`, opacity: 0.5 }}
          />
        ))}
        {journey?.chapters.map((c) => {
          const meta = chapterBySlug(c.slug);
          const soon = meta?.status === 'soon';
          return (
            <span
              key={c.slug}
              className={`scrubber__marker scrubber__marker--chapter ${soon ? 'scrubber__marker--soon' : ''}`}
              style={{
                left: `${(c.start / duration) * 100}%`,
                borderColor: soon ? undefined : segmentBySlug(c.slug)?.accent,
              }}
            />
          );
        })}
        {hover ? (
          <span className="scrubber__tip" style={{ left: hover.x }}>
            {hover.label}
          </span>
        ) : null}
      </div>
      <div className="player__group" aria-label="Chapters" title="Ten chapters">
        {CHAPTERS.map((c) => (
          <span
            key={c.slug}
            title={`${c.numeral} · ${c.title}${c.status === 'soon' ? ' (in production)' : ''}`}
            style={{
              width: 6,
              height: 6,
              borderRadius: 6,
              background: c.status === 'ready' ? c.accent : 'rgba(244,239,230,0.18)',
              display: 'inline-block',
            }}
          />
        ))}
      </div>
      <div className="player__group">
        <button
          className="player__speed"
          onClick={() => controller.setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]!)}
          aria-label={`Playback speed ${speed}×`}
        >
          {speed}×
        </button>
        <button
          className="icon-btn"
          onClick={() => setPrefs({ captionsOn: !captionsOn })}
          aria-pressed={captionsOn}
          aria-label={captionsOn ? 'Hide captions' : 'Show captions'}
          style={{ opacity: captionsOn ? 1 : 0.5 }}
        >
          <CaptionsIcon />
        </button>
      </div>
    </div>
  );
}
