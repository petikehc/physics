import { useEffect, useRef, useState } from 'react';
import { estimateError, straightEstimate } from '../math';
import { circleRig, SLICE_COUNTS } from '../rig';

export interface CircleSnapshot {
  n: number;
  r: number;
  /** Index of n in SLICE_COUNTS (for the slider). */
  step: number;
  exact: number;
  straight: number;
  error: number;
}

const read = (): CircleSnapshot => {
  const { n, r } = circleRig();
  const i = SLICE_COUNTS.indexOf(n as (typeof SLICE_COUNTS)[number]);
  return {
    n,
    r,
    step: i < 0 ? 1 : i,
    exact: Math.PI * r * r,
    straight: straightEstimate(n, r),
    error: estimateError(n, r),
  };
};

/** Polls the chapter rig each frame and re-renders only when the slice count or the radius changes. */
export function useCircle(): CircleSnapshot & { refresh: () => void } {
  const [snap, setSnap] = useState(read);
  const last = useRef(snap);

  useEffect(() => {
    const rig = circleRig();
    let raf = 0;
    const loop = () => {
      if (rig.n !== last.current.n || rig.r !== last.current.r) {
        last.current = read();
        setSnap(last.current);
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

export const fmt2 = (x: number) => x.toFixed(2);
export const pct = (x: number) => (x >= 0.001 ? `${(x * 100).toFixed(1)}%` : `${(x * 100).toFixed(3)}%`);
