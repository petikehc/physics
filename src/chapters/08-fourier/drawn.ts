import { resample, transform, type Complex, type Term } from './math';
import { DRAW_TERMS, sirenTerms } from './rig';

/** A shape the viewer drew in the Lab, as its clockwork (null: none yet, so the ambulance is shown). */
let custom: Term[] | null = null;
let version = 0;
let pen = false;

/** Turns a drawn stroke (in the drawing's own units) into a clockwork, closing it up first. */
export function setDrawn(points: readonly Complex[] | null) {
  custom = points && points.length >= 8 ? transform(resample(points, 512), (DRAW_TERMS - 1) / 2) : null;
  version++;
}

/** The clockwork being drawn: the viewer's own shape, if there is one, else the ambulance. */
export const drawnTerms = (): Term[] => custom ?? sirenTerms();
export const drawnVersion = () => version;
export const hasDrawn = () => custom !== null;

/** Whether the viewer is drawing a new shape right now (the old clockwork steps aside meanwhile). */
export const penDown = () => pen;
export const setPen = (on: boolean) => void (pen = on);
