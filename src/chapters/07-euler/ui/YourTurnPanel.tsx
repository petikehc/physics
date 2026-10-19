import { YourTurnShell } from '../../../ui/YourTurnShell';
import { PointReadout, ThetaControls } from './Controls';
import { useEuler } from './useEuler';

/** Chapter 7's Your-turn moment: send the point round the circle and read off its cos θ and sin θ. */
export function YourTurnPanel({ onContinue }: { onContinue: () => void }) {
  const c = useEuler();
  return (
    <YourTurnShell
      onContinue={onContinue}
      labHref="/lab/euler"
      body="Drag the point round the circle, or set θ. Listen: it sits left or right with cos θ, and sings higher or lower with sin θ."
    >
      <ThetaControls c={c} idPrefix="yt" />
      <PointReadout c={c} />
    </YourTurnShell>
  );
}
