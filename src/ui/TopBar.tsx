import { Link } from 'react-router';
import type { ReactNode } from 'react';
import { SoundButton } from './SoundButton';
import { ListIcon } from './Icons';

interface Props {
  chapterLabel?: string;
  onChapters: () => void;
  extra?: ReactNode;
}

export function TopBar({ chapterLabel, onChapters, extra }: Props) {
  return (
    <header className="topbar">
      <Link to="/" className="brand" aria-label="From Sand to Stars, home">
        <span className="brand__name">From Sand to Stars</span>
        {chapterLabel ? <span className="brand__chapter">{chapterLabel}</span> : null}
      </Link>
      <div className="topbar__actions">
        {extra}
        <SoundButton />
        <button className="icon-btn" onClick={onChapters} aria-label="Chapters">
          <ListIcon />
        </button>
      </div>
    </header>
  );
}
