import { YourTurnShell } from '../../../ui/YourTurnShell';
import { CircleControls, CircleReadout } from './Controls';
import { useCircle } from './useCircle';

/** Chapter 2's Your-turn moment: choose the number of slices and the radius. */
export function YourTurnPanel({ onContinue }: { onContinue: () => void }) {
  const c = useCircle();
  return (
    <YourTurnShell
      onContinue={onContinue}
      labHref="/lab/circle-area"
      body="Choose how many slices. The more you cut, the closer the row comes to a perfect πr × r rectangle."
    >
      <CircleControls c={c} idPrefix="yt" />
      <CircleReadout c={c} />
      {c.n >= 256 ? <span className="badge">✦ 256 slices: practically a rectangle</span> : null}
    </YourTurnShell>
  );
}
