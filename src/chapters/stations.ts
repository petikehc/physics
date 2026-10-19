import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** Each chapter's 3D station, as its own chunk. The World mounts the current chapter and its neighbours. */
export const STATION_VIEWS: Record<string, LazyExoticComponent<ComponentType>> = {
  pythagoras: lazy(() => import('./01-pythagoras/Station')),
  'circle-area': lazy(() => import('./02-circle-area/Station')),
  archimedes: lazy(() => import('./03-archimedes/Station')),
  kepler: lazy(() => import('./04-kepler/Station')),
  newton: lazy(() => import('./05-newton/Station')),
  calculus: lazy(() => import('./06-calculus/Station')),
  euler: lazy(() => import('./07-euler/Station')),
  fourier: lazy(() => import('./08-fourier/Station')),
};
