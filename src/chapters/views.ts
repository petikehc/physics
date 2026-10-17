import type { ComponentType } from 'react';
import { YourTurnPanel as PythagorasYourTurn } from './01-pythagoras/ui/YourTurnPanel';
import { LabPanel as PythagorasLab, enterLabState as enterPythagorasLab } from './01-pythagoras/ui/LabPanel';
import { YourTurnPanel as CircleYourTurn } from './02-circle-area/ui/YourTurnPanel';
import { LabPanel as CircleLab, enterCircleLab } from './02-circle-area/ui/LabPanel';
import { YourTurnPanel as ArchimedesYourTurn } from './03-archimedes/ui/YourTurnPanel';
import { LabPanel as ArchimedesLab, enterArchimedesLab } from './03-archimedes/ui/LabPanel';
import { YourTurnPanel as KeplerYourTurn } from './04-kepler/ui/YourTurnPanel';
import { LabPanel as KeplerLab, enterKeplerLab } from './04-kepler/ui/LabPanel';

/** The page-level React side of a chapter: its Your-turn panel, its Lab and its formula. */
export interface ChapterViews {
  YourTurn: ComponentType<{ onContinue: () => void }>;
  Lab: ComponentType;
  /** Puts the scene into the Lab's starting state. */
  enterLab: () => void;
  /** The formula, with each symbol coloured as in the scene. */
  formula: { tex: string; caption: string };
}

export const VIEWS: Record<string, ChapterViews> = {
  pythagoras: {
    YourTurn: PythagorasYourTurn,
    Lab: PythagorasLab,
    enterLab: enterPythagorasLab,
    formula: {
      tex: '\\textcolor{#f2b04a}{a}^2 + \\textcolor{#45c4b8}{b}^2 = \\textcolor{#e2704f}{c}^2',
      caption: 'The Pythagorean theorem',
    },
  },
  'circle-area': {
    YourTurn: CircleYourTurn,
    Lab: CircleLab,
    enterLab: enterCircleLab,
    formula: {
      tex: 'A = \\textcolor{#8fd3ff}{\\pi}\\, \\textcolor{#f2b04a}{r}^2',
      caption: 'The area of a circle',
    },
  },
  archimedes: {
    YourTurn: ArchimedesYourTurn,
    Lab: ArchimedesLab,
    enterLab: enterArchimedesLab,
    formula: {
      tex: '\\textcolor{#5fd3e8}{F_\\text{b}} = \\textcolor{#5fd3e8}{\\rho}\\, V g',
      caption: "Archimedes' principle",
    },
  },
  kepler: {
    YourTurn: KeplerYourTurn,
    Lab: KeplerLab,
    enterLab: enterKeplerLab,
    formula: {
      tex: '\\frac{\\textcolor{#f2b04a}{\\Delta A}}{\\textcolor{#8fd3ff}{\\Delta t}} = \\text{constant}',
      caption: "Kepler's second law",
    },
  },
};
