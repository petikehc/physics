import { Fragment, type ReactNode } from 'react';

const TOKEN = /\[(a|b|c|r|pi|w|p|area|t|v|pull|f|cos|sin|hi|lo|sup):([^\]]+)\]/g;

/**
 * Turns `[a:text]` markup into spans coloured with a symbol's colour: a, b, c, r, pi, w for weight, p for the
 * water's push, area for an area swept and t for the time it took, v for a velocity, pull for gravity's pull and
 * f for a curve and its height, cos and sin for a point's real and imaginary parts, hi and lo for waves bunched up
 * (higher, bluer) and stretched out (lower, redder). `[sup:iθ]` is a power, raised.
 */
export function renderCaption(text: string | undefined): ReactNode {
  if (!text) return null;
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(<Fragment key={`t${last}`}>{text.slice(last, at)}</Fragment>);
    out.push(
      m[1] === 'sup' ? (
        <sup key={`s${at}`}>{m[2]}</sup>
      ) : (
        <span key={`s${at}`} className={`sym-${m[1]}`}>
          {m[2]}
        </span>
      ),
    );
    last = at + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={`t${last}`}>{text.slice(last)}</Fragment>);
  return out;
}

export function plainCaption(text: string | undefined): string {
  return (text ?? '').replace(TOKEN, (_, kind: string, inner: string) =>
    kind === 'sup' ? `^${inner}` : inner,
  );
}
