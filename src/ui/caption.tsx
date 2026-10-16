import { Fragment, type ReactNode } from 'react';

const TOKEN = /\[(a|b|c):([^\]]+)\]/g;

/** Turns `[a:text]` markup into spans coloured with the symbol colour of a, b or c. */
export function renderCaption(text: string | undefined): ReactNode {
  if (!text) return null;
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(<Fragment key={`t${last}`}>{text.slice(last, at)}</Fragment>);
    out.push(
      <span key={`s${at}`} className={`sym-${m[1]}`}>
        {m[2]}
      </span>,
    );
    last = at + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={`t${last}`}>{text.slice(last)}</Fragment>);
  return out;
}

export function plainCaption(text: string | undefined): string {
  return (text ?? '').replace(TOKEN, '$2');
}
