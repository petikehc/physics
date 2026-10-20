import { useEffect, useRef, useState } from 'react';
import { energyRig } from '../rig';
import { readGauge } from '../sandbox';

export interface EnergySnapshot {
  /** The test track's start and far hill (m), friction, the car's mass (kg). */
  h0: number;
  h4: number;
  mu: number;
  mass: number;
  /** What the tanks would show, in kJ (rounded), and the speed (km/h) and height (m) now. */
  pe: number;
  ke: number;
  heat: number;
  full: number;
  kmh: number;
  h: number;
}

const read = (): EnergySnapshot => {
  const rig = energyRig();
  const r = readGauge(rig);
  return {
    h0: rig.h0,
    h4: rig.h4,
    mu: rig.mu,
    mass: rig.mass,
    pe: Math.round(r.pe / 1000),
    ke: Math.round(r.ke / 1000),
    heat: Math.round(r.heat / 1000),
    full: Math.round(r.full / 1000),
    kmh: Math.round(Math.abs(r.v) * 3.6),
    h: Math.round(r.h * 10) / 10,
  };
};

const differs = (p: EnergySnapshot, q: EnergySnapshot) =>
  (Object.keys(p) as Array<keyof EnergySnapshot>).some((k) => Math.abs(p[k] - q[k]) > 1e-6);

/** Polls the chapter rig each frame and re-renders only when a setting or a reading changes. */
export function useEnergy(): EnergySnapshot & { refresh: () => void } {
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
