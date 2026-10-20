import { useEffect, useRef, useState } from 'react';
import { hearing } from '../sound';
import { dopplerRig } from '../rig';

export interface DopplerSnapshot {
  /** The source's speed and the listener's (Mach numbers), and which source it is (0 ambulance, 1 jet). */
  sm: number;
  lm: number;
  kind: number;
  /** What the listener hears over what is sent (to two places), or null while nothing has reached them. */
  ratio: number | null;
  /** The galaxy's red shift (the Lab's light). */
  z: number;
}

const read = (): DopplerSnapshot => {
  const rig = dopplerRig();
  const h = hearing(rig);
  return {
    sm: rig.sm,
    lm: rig.lm,
    kind: rig.kind,
    ratio: h ? Math.round(h.ratio * 100) / 100 : null,
    z: rig.z,
  };
};

const differs = (p: DopplerSnapshot, q: DopplerSnapshot) =>
  p.kind !== q.kind ||
  p.ratio !== q.ratio ||
  Math.abs(p.sm - q.sm) > 1e-3 ||
  Math.abs(p.lm - q.lm) > 1e-3 ||
  Math.abs(p.z - q.z) > 1e-4;

/** Polls the chapter rig each frame and re-renders only when a speed or what the listener hears changes. */
export function useDoppler(): DopplerSnapshot & { refresh: () => void } {
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
