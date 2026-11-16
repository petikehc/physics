/** Minutes are counted up to this, then the clock stops. */
export const MAX_MINUTES = 30;
/** The longest step taken at once, so a throttled background timer can't add a burst of time. */
const MAX_STEP = 5;

/**
 * Engaged time, in whole minutes: it runs only while `engaged` (the tab visible, the journey playing or waiting on the
 * viewer, or a Lab open). Each minute is reported once, up to MAX_MINUTES.
 */
export class EngagedClock {
  private seconds = 0;
  private reported = 0;

  /** Adds `seconds` if engaged; returns the minutes (1-based) completed by this step, if any. */
  advance(seconds: number, engaged: boolean): number[] {
    if (!engaged || !(seconds > 0) || this.reported >= MAX_MINUTES) return [];
    this.seconds += Math.min(seconds, MAX_STEP);
    const done: number[] = [];
    while (this.reported < MAX_MINUTES && this.seconds >= (this.reported + 1) * 60) {
      this.reported += 1;
      done.push(this.reported);
    }
    return done;
  }
}
