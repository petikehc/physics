/** How much of the journey must actually have played, so stepping or swiping through doesn't count. */
export const ONE_GO_SHARE = 0.8;
const CHAPTER_COUNT = 10;

/**
 * One run through the journey, from one page load's start (or a jump) to its end: did the viewer watch it all in one
 * go? That means: started at chapter I, reached every chapter, reached the end of the finale, and played at least
 * ONE_GO_SHARE of the runtime at normal speed. Tabbing away doesn't count against it; a reload starts afresh.
 */
export class RunTracker {
  private reached = new Set<number>();
  private playedSeconds = 0;
  private ended = false;

  constructor(
    private readonly duration: number,
    private readonly fromStart: boolean,
  ) {}

  /** The playhead entered chapter `n` (1–10). */
  reach(n: number) {
    if (n >= 1 && n <= CHAPTER_COUNT) this.reached.add(n);
  }

  /** Timeline seconds played at normal speed (not seeking or stepping). */
  played(seconds: number) {
    if (seconds > 0) this.playedSeconds += seconds;
  }

  /** The end of the finale was reached. */
  end() {
    this.ended = true;
  }

  qualifies(): boolean {
    return (
      this.fromStart &&
      this.ended &&
      this.reached.size === CHAPTER_COUNT &&
      this.playedSeconds >= ONE_GO_SHARE * this.duration
    );
  }
}
