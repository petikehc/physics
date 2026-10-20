import { YourTurnShell } from '../../../ui/YourTurnShell';
import { WaveControls, WaveReadout } from './Controls';
import { useFourier } from './useFourier';

/** Chapter 8's Your-turn moment: build a wave from circles, and hear it. */
export function YourTurnPanel({ onContinue }: { onContinue: () => void }) {
  const c = useFourier();
  return (
    <YourTurnShell
      onContinue={onContinue}
      labHref="/lab/fourier"
      body="Pick a wave and how many circles build it. Listen: each circle is a harmonic, and together they make the wave's sound."
    >
      <WaveControls c={c} idPrefix="yt" />
      <WaveReadout c={c} />
    </YourTurnShell>
  );
}
