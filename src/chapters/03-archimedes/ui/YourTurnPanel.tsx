import { YourTurnShell } from '../../../ui/YourTurnShell';
import { FloatControls } from './Controls';

/** Chapter 3's Your-turn moment: drop materials into fluids. */
export function YourTurnPanel({ onContinue }: { onContinue: () => void }) {
  return (
    <YourTurnShell
      onContinue={onContinue}
      labHref="/lab/archimedes"
      body="Drop something in. Does it float, and how much of it sits under the surface?"
    >
      <FloatControls />
    </YourTurnShell>
  );
}
