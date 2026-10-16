import gsap from 'gsap';
import { useApp } from '../state/store';
import { audio } from '../audio';
import { runtime } from '../engine/runtime';
import { beatAt, cuesBetween, type BeatMarker, type Journey } from './builder';
import { buildJourney } from './journey';
import { continuousLevels, pythagorasSoundFrame, sample } from '../chapters/01-pythagoras/sound';
import { pythagorasRig, PYTHAGORAS_DEFAULTS } from '../chapters/01-pythagoras/rig';

const EPS = 0.05;

/**
 * Owns the master timeline while the journey route is open: playback, stepping, the Your-turn pause,
 * sound cues, and syncing the few discrete bits of state the React UI needs.
 */
class JourneyController {
  journey: Journey | null = null;
  private stepTween: gsap.core.Tween | null = null;
  private lastTime = 0;
  private lastReal = 0;
  private lastBeat: BeatMarker | undefined;
  private wantPlay = false;

  start(slug?: string) {
    this.dispose();
    const journey = buildJourney();
    this.journey = journey;
    this.lastTime = 0;
    this.lastReal = performance.now();
    this.lastBeat = undefined;
    gsap.ticker.add(this.tick);
    const s = useApp.getState();
    journey.master.timeScale(s.speed);
    if (slug) {
      const first = journey.beats.find((b) => b.chapter === slug);
      if (first && first.start > 0) journey.master.seek(first.start, false);
    }
    useApp.getState().set({
      ended: false,
      yourTurn: false,
      cameraMode: 'directed',
      journeyId: useApp.getState().journeyId + 1,
    });
    exposeTestHook(this);
    return journey;
  }

  dispose() {
    gsap.ticker.remove(this.tick);
    this.stepTween?.kill();
    this.stepTween = null;
    this.journey?.master.kill();
    this.journey = null;
    audio.setPlaying(false);
    if (useApp.getState().journeyId !== 0) useApp.getState().set({ journeyId: 0 });
  }

  get time() {
    return this.journey?.master.time() ?? 0;
  }

  play() {
    const j = this.journey;
    if (!j) return;
    if (useApp.getState().yourTurn) return this.continueFromYourTurn();
    if (j.master.time() >= j.duration - EPS) j.master.seek(0, false);
    this.stepTween?.kill();
    this.stepTween = null;
    this.wantPlay = true;
    j.master.play();
  }

  pause() {
    this.wantPlay = false;
    this.stepTween?.kill();
    this.stepTween = null;
    this.journey?.master.pause();
  }

  toggle() {
    if (this.journey?.master.paused() !== false && !this.stepTween) this.play();
    else this.pause();
  }

  setSpeed(speed: number) {
    useApp.getState().set({ speed });
    this.journey?.master.timeScale(speed);
  }

  /** Jumps (without animation) to a time; used by the scrubber. */
  seek(time: number) {
    const j = this.journey;
    if (!j) return;
    this.leaveYourTurn(false);
    this.stepTween?.kill();
    this.stepTween = null;
    j.master.seek(Math.min(Math.max(time, 0), j.duration), false);
    this.lastTime = j.master.time();
    this.lastBeat = beatAt(j.beats, this.lastTime);
  }

  /** Fast-forwards (or rewinds) to the start of the next/previous beat. */
  step(direction: 1 | -1) {
    const j = this.journey;
    if (!j) return;
    const t = j.master.time();
    const current = beatAt(j.beats, t);
    const idx = current ? j.beats.indexOf(current) : 0;
    let target: BeatMarker | undefined;
    if (direction > 0) target = j.beats[idx + 1];
    else target = t - (current?.start ?? 0) > 1.2 ? current : j.beats[Math.max(idx - 1, 0)];
    if (!target) return;
    this.stepTo(target.start);
  }

  stepTo(time: number) {
    const j = this.journey;
    if (!j) return;
    const wasPlaying = this.wantPlay || !j.master.paused();
    this.leaveYourTurn(false);
    this.stepTween?.kill();
    j.master.pause();
    const dist = Math.abs(time - j.master.time());
    const reduced = useApp.getState().reducedMotion;
    this.stepTween = j.master.tweenTo(time, {
      duration: reduced ? 0.01 : Math.min(Math.max(dist * 0.12, 0.5), 1.4),
      ease: 'power2.inOut',
      onComplete: () => {
        this.stepTween = null;
        if (wasPlaying) {
          this.wantPlay = true;
          j.master.play();
        }
      },
    });
  }

  gotoChapter(slug: string) {
    const j = this.journey;
    const first = j?.beats.find((b) => b.chapter === slug);
    if (first) this.seek(first.start);
  }

  continueFromYourTurn() {
    const j = this.journey;
    if (!j) return;
    this.leaveYourTurn(true);
    this.wantPlay = true;
    j.master.play();
  }

  private leaveYourTurn(restore: boolean) {
    const s = useApp.getState();
    if (!s.yourTurn && s.cameraMode === 'directed') return;
    const rig = pythagorasRig();
    rig.interactive = 0;
    if (restore) {
      gsap.to(rig, {
        a: PYTHAGORAS_DEFAULTS.a,
        b: PYTHAGORAS_DEFAULTS.b,
        gamma: 90,
        duration: 0.8,
        ease: 'power2.inOut',
      });
    }
    s.set({ yourTurn: false, cameraMode: 'directed', dragging: false });
  }

  private tick = () => {
    const j = this.journey;
    if (!j) return;
    const s = useApp.getState();
    const now = performance.now();
    const realDt = Math.max((now - this.lastReal) / 1000, 1e-4);
    this.lastReal = now;
    const t = j.master.time();
    const dt = t - this.lastTime;
    const playing = !j.master.paused() && !this.stepTween;

    // "Normal" = the playhead advanced at roughly real-time speed (not a seek or a fast-forward).
    const normal = playing && dt > 0 && dt <= realDt * s.speed * 2.5 + 0.08;
    // One-shot cues fire only during normal forward playback, never while seeking or fast-forwarding.
    if (normal) {
      for (const c of cuesBetween(j.cues, this.lastTime, t)) audio.cue(c.id, c.params);
    }

    const beat = beatAt(j.beats, t);
    if (beat !== this.lastBeat) {
      // Reduced motion: stop at the end of each beat and let the viewer step on.
      if (
        s.reducedMotion &&
        normal &&
        this.lastBeat &&
        beat &&
        beat.start > this.lastBeat.start &&
        beat.kind !== 'flight'
      ) {
        j.master.pause();
        j.master.seek(beat.start, false);
        this.wantPlay = false;
      }
      this.lastBeat = beat;
      audio.setBeat(beat?.key ?? null);
    }

    const atPause =
      beat?.pauseAt !== undefined && Math.abs(t - beat.pauseAt) < EPS && j.master.paused() && !this.stepTween;
    const ended = t >= j.duration - EPS;
    const isPlaying = playing || (!!this.stepTween && this.wantPlay);
    if (atPause && !s.yourTurn) {
      this.wantPlay = false;
      s.set({ yourTurn: true, cameraMode: 'interactive' });
    }
    if (s.playing !== isPlaying || s.beatKey !== (beat?.key ?? null) || s.ended !== ended) {
      s.set({ playing: isPlaying, beatKey: beat?.key ?? null, ended });
    }
    audio.setPlaying(isPlaying || s.yourTurn);

    pythagorasSoundFrame(realDt, s.yourTurn);
    this.lastTime = t;
  };
}

export const controller = new JourneyController();

interface TestHook {
  seek: (labelOrTime: string | number) => number;
  play: () => void;
  pause: () => void;
  time: () => number;
  duration: number;
  beats: Array<{ key: string; start: number; end: number; pauseAt?: number }>;
  camera: typeof runtime.camera;
  /** Renders the soundtrack of the first `seconds` offline and returns a base64 WAV. */
  renderAudio: (seconds?: number) => Promise<string>;
}

declare global {
  interface Window {
    __journey?: TestHook;
  }
}

function exposeTestHook(c: JourneyController) {
  const j = c.journey;
  if (!j || typeof window === 'undefined') return;
  window.__journey = {
    seek: (x) => {
      const time = typeof x === 'number' ? x : (j.beats.find((b) => b.key === x)?.start ?? 0);
      c.pause();
      c.seek(time);
      return time;
    },
    play: () => c.play(),
    pause: () => c.pause(),
    time: () => c.time,
    duration: j.duration,
    beats: j.beats.map((b) => ({ key: b.key, start: b.start, end: b.end, pauseAt: b.pauseAt })),
    camera: runtime.camera,
    renderAudio: async (seconds) => {
      const { renderPlan, encodeWav, toBase64 } = await import('../audio/offline');
      const duration = Math.min(seconds ?? j.duration, j.duration);
      const saved = j.master.time();
      c.pause();
      // Sample the continuous layers by stepping the timeline, exactly as playback would.
      const rig = pythagorasRig();
      const step = 1 / 30;
      const continuous: Array<[number, number, number]> = [];
      j.master.seek(0, false);
      let prev = sample(rig);
      for (let t = step; t <= duration; t += step) {
        j.master.seek(t, false);
        const cur = sample(rig);
        const l = continuousLevels(prev, cur, step);
        continuous.push([t, l.chalk, l.pour]);
        prev = cur;
      }
      j.master.seek(saved, false);
      const buffer = await renderPlan({
        duration,
        beats: j.beats.filter((b) => b.start < duration).map((b) => ({ key: b.key, start: b.start })),
        cues: j.cues.filter((q) => q.time < duration),
        continuous,
      });
      return toBase64(encodeWav(buffer));
    },
  };
}
