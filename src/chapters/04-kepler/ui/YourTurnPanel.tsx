import { YourTurnShell } from '../../../ui/YourTurnShell';
import { OrbitControls, OrbitReadout } from './Controls';
import { useOrbit } from './useOrbit';

/** Chapter 4's Your-turn moment: reshape the orbit and recut its year; the fans always come out equal. */
export function YourTurnPanel({ onContinue }: { onContinue: () => void }) {
  const o = useOrbit();
  return (
    <YourTurnShell
      onContinue={onContinue}
      labHref="/lab/kepler"
      body="Stretch the orbit, recut its year: the fans always come out equal."
    >
      <OrbitControls o={o} idPrefix="yt" />
      <OrbitReadout o={o} />
    </YourTurnShell>
  );
}
