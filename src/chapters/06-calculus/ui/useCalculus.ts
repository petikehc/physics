import { useEffect, useRef, useState } from 'react';
import { CONTROLS } from '../math';
import { calculusRig, type CalculusRig } from '../rig';

export interface CalculusSnapshot {
  ys: number[];
  a: number;
  b: number;
  split: number;
  columns: number;
}

const read = (): CalculusSnapshot => {
  const rig = calculusRig();
  return {
    ys: Array.from({ length: CONTROLS }, (_, i) => rig[`k${i}` as keyof CalculusRig] as number),
    a: rig.a,
    b: rig.b,
    split: rig.split,
    columns: rig.columns,
  };
};

const differs = (p: CalculusSnapshot, q: CalculusSnapshot) =>
  Math.abs(p.a - q.a) > 1e-4 ||
  Math.abs(p.b - q.b) > 1e-4 ||
  Math.abs(p.split - q.split) > 1e-3 ||
  Math.abs(p.columns - q.columns) > 1e-3 ||
  p.ys.some((y, i) => Math.abs(y - q.ys[i]!) > 1e-3);

/** Polls the chapter rig each frame and re-renders only when the curve, a, b or the columns change. */
export function useCalculus(): CalculusSnapshot & { refresh: () => void } {
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
