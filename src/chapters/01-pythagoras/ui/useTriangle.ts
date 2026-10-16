import { useEffect, useRef, useState } from 'react';
import { audio } from '../../../audio';
import { isPythagoreanTriple, triangle } from '../math';
import { pythagorasRig } from '../rig';

export interface TriangleSnapshot {
  a: number;
  b: number;
  gamma: number;
  c: number;
  triple: boolean;
}

/** Polls the chapter rig each frame and re-renders only when the triangle changes; chimes on new triples. */
export function useTriangle(chime = true): TriangleSnapshot & { refresh: () => void } {
  const rig = pythagorasRig();
  const read = (): TriangleSnapshot => {
    const t = triangle(rig.a, rig.b, rig.gamma);
    return {
      a: rig.a,
      b: rig.b,
      gamma: rig.gamma,
      c: t.c,
      triple: rig.gamma === 90 && isPythagoreanTriple(t.a, t.b, t.c),
    };
  };
  const [snap, setSnap] = useState(read);
  const last = useRef(snap);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const p = last.current;
      if (rig.a !== p.a || rig.b !== p.b || rig.gamma !== p.gamma) {
        const next = read();
        if (chime && next.triple && !(p.triple && p.a === next.a && p.b === next.b)) audio.cue('triple');
        last.current = next;
        setSnap(next);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chime]);

  /** Re-reads the rig now (call after writing to it from a control, so controlled inputs never lag). */
  const refresh = () => {
    const next = read();
    last.current = next;
    setSnap(next);
  };

  return { ...snap, refresh };
}
