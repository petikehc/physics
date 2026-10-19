import gsap from 'gsap';
import { audio } from '../../audio';
import { RECIPE_ORDER, type RecipeId } from './math';
import { DRAW_TERMS, fourierRig, MAX_COUNT } from './rig';

/** The recipe `shape` is nearest to. */
export const recipeAt = (shape: number): RecipeId =>
  RECIPE_ORDER[Math.min(Math.max(Math.round(shape), 0), RECIPE_ORDER.length - 1)]!;

/** Reshapes the clockwork into another recipe's wave. */
export function chooseRecipe(id: RecipeId) {
  audio.ui('click');
  gsap.to(fourierRig(), {
    shape: RECIPE_ORDER.indexOf(id),
    duration: 0.8,
    ease: 'power2.inOut',
    overwrite: 'auto',
  });
}

/** How many circles build the wave (1 to 16). */
export function setCount(n: number) {
  const to = Math.min(Math.max(Math.round(n), 1), MAX_COUNT);
  gsap.to(fourierRig(), { count: to, duration: 0.5, ease: 'power1.out', overwrite: 'auto' });
}

/** Lab: how many of the drawing's circles turn (1 to 101). */
export function setDrawCount(n: number) {
  const to = Math.min(Math.max(Math.round(n), 1), DRAW_TERMS);
  gsap.to(fourierRig(), { dcount: to, duration: 0.5, ease: 'power1.out', overwrite: 'auto' });
}

export function leaveFourierYourTurn() {
  fourierRig().interactive = 0;
}
