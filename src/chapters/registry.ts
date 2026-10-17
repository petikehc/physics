export type ChapterStatus = 'ready' | 'soon';

export interface ChapterMeta {
  slug: string;
  index: number;
  numeral: string;
  title: string;
  /** Short name for menus and the player bar. */
  short: string;
  formulaTeX: string;
  year: string;
  figure: string;
  place: string;
  kind: 'math' | 'physics';
  accent: string;
  /** Key of the Dust icon used by the teaser and the chapter stubs. */
  dustIcon: string;
  status: ChapterStatus;
}

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: 'pythagoras',
    index: 0,
    numeral: 'I',
    title: 'The Pythagorean Theorem',
    short: 'Pythagoras',
    formulaTeX: 'a^2 + b^2 = c^2',
    year: 'c. 530 BC',
    figure: 'Pythagoras',
    place: 'Samos',
    kind: 'math',
    accent: '#e2704f',
    dustIcon: 'pythagoras',
    status: 'ready',
  },
  {
    slug: 'circle-area',
    index: 1,
    numeral: 'II',
    title: 'The Area of a Circle',
    short: 'Circle area',
    formulaTeX: 'A = \\pi r^2',
    year: 'c. 250 BC',
    figure: 'Archimedes',
    place: 'Syracuse',
    kind: 'math',
    accent: '#c98b4a',
    dustIcon: 'circle',
    status: 'ready',
  },
  {
    slug: 'archimedes',
    index: 2,
    numeral: 'III',
    title: "Archimedes' Principle",
    short: 'Buoyancy',
    formulaTeX: 'F_b = \\rho V g',
    year: 'c. 250 BC',
    figure: 'Archimedes',
    place: 'Syracuse',
    kind: 'physics',
    accent: '#4fc3d9',
    dustIcon: 'crown',
    status: 'ready',
  },
  {
    slug: 'kepler',
    index: 3,
    numeral: 'IV',
    title: "Kepler's Laws",
    short: 'Kepler',
    formulaTeX: '\\tfrac{\\Delta A}{\\Delta t} = \\text{const}',
    year: '1609–1619',
    figure: 'Johannes Kepler',
    place: 'Prague',
    kind: 'physics',
    accent: '#f2b04a',
    dustIcon: 'orbit',
    status: 'ready',
  },
  {
    slug: 'newton',
    index: 4,
    numeral: 'V',
    title: 'Universal Gravitation',
    short: 'Newton',
    formulaTeX: 'F = G\\tfrac{m_1 m_2}{r^2}',
    year: '1687',
    figure: 'Isaac Newton',
    place: 'Cambridge',
    kind: 'physics',
    accent: '#d9534f',
    dustIcon: 'apple',
    status: 'soon',
  },
  {
    slug: 'calculus',
    index: 5,
    numeral: 'VI',
    title: 'The Fundamental Theorem of Calculus',
    short: 'Calculus',
    formulaTeX: '\\int_a^b f\\,dx = F(b) - F(a)',
    year: '1660s–1680s',
    figure: 'Newton & Leibniz',
    place: 'Cambridge & Hanover',
    kind: 'math',
    accent: '#9b7bf0',
    dustIcon: 'calculus',
    status: 'soon',
  },
  {
    slug: 'euler',
    index: 6,
    numeral: 'VII',
    title: "Euler's Identity",
    short: 'Euler',
    formulaTeX: 'e^{i\\pi} + 1 = 0',
    year: '1748',
    figure: 'Leonhard Euler',
    place: 'Berlin',
    kind: 'math',
    accent: '#3fd0e8',
    dustIcon: 'helix',
    status: 'soon',
  },
  {
    slug: 'fourier',
    index: 7,
    numeral: 'VIII',
    title: 'Fourier Series',
    short: 'Fourier',
    formulaTeX: 'f(t) = \\sum a_n \\sin(n\\omega t + \\varphi_n)',
    year: '1807–1822',
    figure: 'Joseph Fourier',
    place: 'Grenoble',
    kind: 'math',
    accent: '#e05bb4',
    dustIcon: 'epicycles',
    status: 'soon',
  },
  {
    slug: 'doppler',
    index: 8,
    numeral: 'IX',
    title: 'The Doppler Effect',
    short: 'Doppler',
    formulaTeX: "f' = f\\,\\tfrac{v + v_o}{v - v_s}",
    year: '1842',
    figure: 'Christian Doppler',
    place: 'Prague',
    kind: 'physics',
    accent: '#5b8cff',
    dustIcon: 'waves',
    status: 'soon',
  },
  {
    slug: 'energy',
    index: 9,
    numeral: 'X',
    title: 'Conservation of Energy',
    short: 'Energy',
    formulaTeX: '\\tfrac12 mv^2 + mgh = \\text{const}',
    year: '1840s',
    figure: 'Mayer, Joule & Helmholtz',
    place: 'Heilbronn, Manchester & Berlin',
    kind: 'physics',
    accent: '#f28a3c',
    dustIcon: 'coaster',
    status: 'soon',
  },
];

export function chapterBySlug(slug: string | undefined): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}
