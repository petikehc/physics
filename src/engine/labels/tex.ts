import katex from 'katex';
// Its stylesheet comes with it, only to the pages that set formulas.
import 'katex/dist/katex.min.css';

/** Renders TeX to an HTML string (with MathML for screen readers). */
export function tex(source: string, displayMode = false): string {
  return katex.renderToString(source, { throwOnError: false, output: 'htmlAndMathml', displayMode });
}
