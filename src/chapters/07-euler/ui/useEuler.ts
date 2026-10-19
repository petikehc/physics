import { useEffect, useRef, useState } from 'react';
import { eulerRig } from '../rig';

export interface EulerSnapshot {
  theta: number;
  terms: number;
  triangle: number;
}

const read = (): EulerSnapshot => {
  const rig = eulerRig();
  return { theta: rig.theta, terms: rig.terms, triangle: rig.triangle };
};

const differs = (p: EulerSnapshot, q: EulerSnapshot) =>
  Math.abs(p.theta - q.theta) > 1e-4 ||
  Math.abs(p.terms - q.terms) > 1e-3 ||
  Math.abs(p.triangle - q.triangle) > 1e-3;

/** Polls the chapter rig each frame and re-renders only when θ, the series or the triangle change. */
export function useEuler(): EulerSnapshot & { refresh: () => void } {
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
