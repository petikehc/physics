import { YourTurnShell } from '../../../ui/YourTurnShell';
import { EnergyReadout, TrackControls } from './Controls';
import { useEnergy } from './useEnergy';

/** Chapter 10's Your-turn moment: reshape the test track, add friction, and let the car go. */
export function YourTurnPanel({ onContinue }: { onContinue: () => void }) {
  const c = useEnergy();
  return (
    <YourTurnShell
      onContinue={onContinue}
      labHref="/lab/energy"
      body="Raise or lower the start and the far hill (drag them, or use the sliders), add friction, and let the car go. It never climbs higher than it started."
    >
      <TrackControls c={c} idPrefix="yt" />
      <EnergyReadout c={c} />
    </YourTurnShell>
  );
}
