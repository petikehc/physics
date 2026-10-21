// Written by scripts/record-teaser.mjs with the videos in public/teaser: re-record rather than edit.

/** The landing page's film: how long it runs, and which chapter is on screen from when (seconds). */
export const FILM = {
  duration: 35.5,
  clips: [
    { slug: 'pythagoras', from: 0 },
    { slug: 'pythagoras', from: 3.2 },
    { slug: 'circle-area', from: 6.1 },
    { slug: 'archimedes', from: 8.9 },
    { slug: 'kepler', from: 11.8 },
    { slug: 'newton', from: 14.7 },
    { slug: 'calculus', from: 17.6 },
    { slug: 'euler', from: 20.5 },
    { slug: 'fourier', from: 23.4 },
    { slug: 'doppler', from: 26.3 },
    { slug: 'energy', from: 29.2 },
    { slug: 'finale', from: 31.6 },
  ],
};
