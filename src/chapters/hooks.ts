import gsap from 'gsap';
import { resetRig } from '../engine/rigs';
import { pythagorasRig, PYTHAGORAS_DEFAULTS } from './01-pythagoras/rig';
import { circleRig, CIRCLE_DEFAULTS } from './02-circle-area/rig';
import { leaveCircleYourTurn } from './02-circle-area/interaction';
import { archimedesRig, ARCHIMEDES_DEFAULTS } from './03-archimedes/rig';
import { leaveArchimedesYourTurn } from './03-archimedes/interaction';
import { keplerRig, KEPLER_DEFAULTS } from './04-kepler/rig';
import { leaveKeplerYourTurn } from './04-kepler/interaction';
import { newtonRig, NEWTON_DEFAULTS } from './05-newton/rig';
import { leaveNewtonYourTurn } from './05-newton/interaction';
import { calculusRig, CALCULUS_DEFAULTS } from './06-calculus/rig';
import { leaveCalculusYourTurn } from './06-calculus/interaction';
import { eulerRig, EULER_DEFAULTS } from './07-euler/rig';
import { leaveEulerYourTurn } from './07-euler/interaction';

/** What the journey controller needs from a chapter, outside React. */
export interface ChapterHooks {
  /** Puts the chapter's rig back to its defaults before the journey timeline is built. */
  reset: () => void;
  /** Leaves the Your-turn moment. `restore` is true when the story continues from it. */
  leaveYourTurn?: (restore: boolean) => void;
}

export const HOOKS: Record<string, ChapterHooks> = {
  pythagoras: {
    reset: () => resetRig(pythagorasRig(), { ...PYTHAGORAS_DEFAULTS }),
    leaveYourTurn: (restore) => {
      const rig = pythagorasRig();
      rig.interactive = 0;
      // The story's triangle is 3-4-5 again before the handoff swings it.
      if (restore) gsap.to(rig, { a: 3, b: 4, gamma: 90, duration: 0.8, ease: 'power2.inOut' });
    },
  },
  'circle-area': {
    reset: () => resetRig(circleRig(), { ...CIRCLE_DEFAULTS }),
    leaveYourTurn: leaveCircleYourTurn,
  },
  archimedes: {
    reset: () => resetRig(archimedesRig(), { ...ARCHIMEDES_DEFAULTS }),
    leaveYourTurn: leaveArchimedesYourTurn,
  },
  kepler: {
    reset: () => resetRig(keplerRig(), { ...KEPLER_DEFAULTS }),
    leaveYourTurn: leaveKeplerYourTurn,
  },
  newton: {
    reset: () => resetRig(newtonRig(), { ...NEWTON_DEFAULTS }),
    leaveYourTurn: leaveNewtonYourTurn,
  },
  calculus: {
    reset: () => resetRig(calculusRig(), { ...CALCULUS_DEFAULTS }),
    leaveYourTurn: leaveCalculusYourTurn,
  },
  euler: {
    reset: () => resetRig(eulerRig(), { ...EULER_DEFAULTS }),
    leaveYourTurn: leaveEulerYourTurn,
  },
};

export function resetChapterRigs() {
  for (const h of Object.values(HOOKS)) h.reset();
}
