import { YourTurnShell } from '../../../ui/YourTurnShell';
import { HearingReadout, SourceControls } from './Controls';
import { useDoppler } from './useDoppler';

/** Chapter 9's Your-turn moment: set the ambulance going, put the listener anywhere, and hear what they hear. */
export function YourTurnPanel({ onContinue }: { onContinue: () => void }) {
  const c = useDoppler();
  return (
    <YourTurnShell
      onContinue={onContinue}
      labHref="/lab/doppler"
      body="Set how fast the ambulance goes, and drag the listener anywhere along the street. Listen to what they hear."
    >
      <SourceControls c={c} idPrefix="yt" />
      <HearingReadout c={c} />
    </YourTurnShell>
  );
}
