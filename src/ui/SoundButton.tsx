import { useEffect, useRef, useState } from 'react';
import { useApp } from '../state/store';
import { audio } from '../audio';
import { SoundOffIcon, SoundOnIcon } from './Icons';

/** Sound on/off plus a popover with music and effects volumes. */
export function SoundButton({ placement = 'down' }: { placement?: 'up' | 'down' }) {
  const enabled = useApp((s) => s.soundEnabled);
  const music = useApp((s) => s.musicVolume);
  const sfx = useApp((s) => s.sfxVolume);
  const set = useApp((s) => s.set);
  const setPrefs = useApp((s) => s.setPrefs);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => audio.setVolumes(music, sfx), [music, sfx]);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  const toggle = () => {
    if (enabled) {
      audio.disable();
      set({ soundEnabled: false });
    } else {
      void audio.enable();
      set({ soundEnabled: true });
    }
  };

  return (
    <div ref={wrap} style={{ position: 'relative', display: 'flex', gap: 6 }}>
      <button
        className="icon-btn"
        onClick={toggle}
        onContextMenu={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        aria-label={enabled ? 'Mute sound' : 'Turn sound on'}
        aria-pressed={enabled}
        title={enabled ? 'Sound on (right-click for volumes)' : 'Sound off'}
      >
        {enabled ? <SoundOnIcon /> : <SoundOffIcon />}
      </button>
      <button
        className="icon-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Volume settings"
        aria-expanded={open}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="10" cy="17" r="2" />
        </svg>
      </button>
      {open ? (
        <div className="popover" style={placement === 'down' ? { top: 50, bottom: 'auto' } : undefined}>
          <label>
            Music
            <input
              className="range"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={music}
              onChange={(e) => setPrefs({ musicVolume: +e.target.value })}
            />
          </label>
          <label>
            Effects
            <input
              className="range"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sfx}
              onChange={(e) => setPrefs({ sfxVolume: +e.target.value })}
            />
          </label>
          {!enabled ? (
            <button className="btn" onClick={toggle} style={{ justifyContent: 'center' }}>
              Turn sound on
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
