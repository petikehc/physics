import { useEffect, useRef, useState } from 'react';
import { drawnVersion } from '../drawn';
import { fourierRig } from '../rig';

export interface FourierSnapshot {
  shape: number;
  count: number;
  dcount: number;
  /** Bumped each time the viewer draws a new shape (or goes back to the ambulance). */
  drawn: number;
}

const read = (): FourierSnapshot => {
  const rig = fourierRig();
  return { shape: rig.shape, count: rig.count, dcount: rig.dcount, drawn: drawnVersion() };
};

const differs = (p: FourierSnapshot, q: FourierSnapshot) =>
  p.drawn !== q.drawn ||
  Math.abs(p.shape - q.shape) > 1e-3 ||
  Math.abs(p.count - q.count) > 1e-3 ||
  Math.abs(p.dcount - q.dcount) > 1e-3;

/** Polls the chapter rig each frame and re-renders only when the recipe or the number of circles change. */
export function useFourier(): FourierSnapshot & { refresh: () => void } {
  const [snap, setSnap] = useState(read);
  const last = useRef(snap);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const now = read();
      if (differs(now, last.current)) {
        last.current = now;
        setSnap(now);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /** Re-reads the rig now (call after writing to it from a control, so controlled inputs never lag). */
  const refresh = () => {
    last.current = read();
    setSnap(last.current);
  };

  return { ...snap, refresh };
}
