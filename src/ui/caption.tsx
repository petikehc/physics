import { Fragment, type ReactNode } from 'react';

const TOKEN = /\[(a|b|c|r|pi):([^\]]+)\]/g;

/** Turns `[a:text]` markup into spans coloured with a symbol's colour (a, b, c, r or pi). */
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
