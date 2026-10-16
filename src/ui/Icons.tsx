const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export const PlayIcon = () => (
  <svg {...base} fill="currentColor" stroke="none" aria-hidden="true">
    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z" />
  </svg>
);
export const PauseIcon = () => (
  <svg {...base} fill="currentColor" stroke="none" aria-hidden="true">
    <rect x="6" y="4.5" width="4" height="15" rx="1" />
    <rect x="14" y="4.5" width="4" height="15" rx="1" />
  </svg>
);
export const SoundOnIcon = () => (
  <svg {...base} aria-hidden="true">
    <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" />
    <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);
export const SoundOffIcon = () => (
  <svg {...base} aria-hidden="true">
    <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" />
    <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" />
  </svg>
);
export const ListIcon = () => (
  <svg {...base} aria-hidden="true">
    <path d="M8 6h12M8 12h12M8 18h12" />
    <circle cx="4" cy="6" r="0.6" fill="currentColor" />
    <circle cx="4" cy="12" r="0.6" fill="currentColor" />
    <circle cx="4" cy="18" r="0.6" fill="currentColor" />
  </svg>
);
export const PrevIcon = () => (
  <svg {...base} aria-hidden="true">
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
export const NextIcon = () => (
  <svg {...base} aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const CloseIcon = () => (
  <svg {...base} aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const CaptionsIcon = () => (
  <svg {...base} aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M10 10.5a2 2 0 1 0 0 3M17 10.5a2 2 0 1 0 0 3" />
  </svg>
);
