import { useEffect, useRef, useState } from 'react';
import { newtonRig } from '../rig';

export interface CannonSnapshot {
  speed: number;
  elevation: number;
}

const read = (): CannonSnapshot => {
  const { speed, elevation } = newtonRig();
  return { speed, elevation };
};

/** Polls the chapter rig each frame and re-renders only when the cannon's speed or angle changes. */
export function useCannon(): CannonSnapshot & { refresh: () => void } {
  const [snap, setSnap] = useState(read);
  const last = useRef(snap);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const now = read();
      if (
        Math.abs(now.speed - last.current.speed) > 1e-4 ||
        Math.abs(now.elevation - last.current.elevation) > 1e-4
      ) {
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
