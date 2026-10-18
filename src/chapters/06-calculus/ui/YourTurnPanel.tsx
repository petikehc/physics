import { YourTurnShell } from '../../../ui/YourTurnShell';
import { AreaReadout, CurveControls } from './Controls';
import { useCalculus } from './useCalculus';

/** Chapter 6's Your-turn moment: reshape the curve, move a and b, and watch the area match the climb. */
export function YourTurnPanel({ onContinue }: { onContinue: () => void }) {
  const c = useCalculus();
  return (
    <YourTurnShell
      onContinue={onContinue}
      labHref="/lab/calculus"
      body="Drag the curve's points, or pick a curve, and move a and b: the area between them is how far A climbs."
    >
      <CurveControls c={c} idPrefix="yt" />
      <AreaReadout c={c} />
    </YourTurnShell>
  );
}
