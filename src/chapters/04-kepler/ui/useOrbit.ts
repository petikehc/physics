import { useEffect, useRef, useState } from 'react';
import { keplerRig } from '../rig';

export interface OrbitSnapshot {
  e: number;
  n: number;
}

const read = (): OrbitSnapshot => {
  const { e, fanCount } = keplerRig();
  return { e, n: Math.round(fanCount) };
};

/** Polls the chapter rig each frame and re-renders only when the orbit's shape or its fan count changes. */
export function useOrbit(): OrbitSnapshot & { refresh: () => void } {
  const [snap, setSnap] = useState(read);
  const last = useRef(snap);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const now = read();
      if (Math.abs(now.e - last.current.e) > 0.0005 || now.n !== last.current.n) {
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
