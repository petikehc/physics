import { YourTurnShell } from '../../../ui/YourTurnShell';
import { CannonControls, ShotReadout } from './Controls';
import { useCannon } from './useCannon';

/** Chapter 5's Your-turn moment: set the cannon's speed and watch the ball land, circle, swing out or escape. */
export function YourTurnPanel({ onContinue }: { onContinue: () => void }) {
  const c = useCannon();
  return (
    <YourTurnShell
      onContinue={onContinue}
      labHref="/lab/newton"
      body="Set the speed and fire: it lands, circles, swings out on an ellipse, or escapes."
    >
      <CannonControls c={c} idPrefix="yt" />
      <ShotReadout c={c} />
    </YourTurnShell>
  );
}
