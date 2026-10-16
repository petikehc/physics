import katex from 'katex';

/** Renders TeX to an HTML string (with MathML for screen readers). */
export function tex(source: string, displayMode = false): string {
  return katex.renderToString(source, { throwOnError: false, output: 'htmlAndMathml', displayMode });
}
