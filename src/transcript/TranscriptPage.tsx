import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '../state/store';
import { journeyScript, type ScriptBeat } from '../journey/script';
import { segmentBySlug } from '../chapters/finale/meta';
import { chapterBySlug } from '../chapters/registry';
import { renderCaption } from '../ui/caption';
import { tex } from '../engine/labels/tex';
import { TopBar } from '../ui/TopBar';
import { ChaptersMenu } from '../ui/ChaptersMenu';

/** The journey's beats, gathered by the chapter (or the finale) they belong to. */
function byChapter(beats: ScriptBeat[]) {
  const parts: Array<{ slug: string; beats: ScriptBeat[] }> = [];
  for (const b of beats) {
    const last = parts[parts.length - 1];
    if (last && last.slug === b.chapter) last.beats.push(b);
    else parts.push({ slug: b.chapter, beats: [b] });
  }
  return parts;
}

function Beat({ beat, slug }: { beat: ScriptBeat; slug: string }) {
  const formula = chapterBySlug(slug)?.formulaTeX;
  switch (beat.kind) {
    case 'flight':
      return null;
    case 'title':
      return <p className="transcript__lead">{renderCaption(beat.body)}</p>;
    case 'yourTurn':
      return (
        <p className="transcript__turn">
          <strong>Your turn.</strong> The journey pauses here for you to try it.{' '}
          <Link to={`/lab/${slug}`}>Open the Lab →</Link>
        </p>
      );
    case 'formula':
      return (
        <div className="transcript__beat">
          {formula ? (
            <div className="transcript__formula" dangerouslySetInnerHTML={{ __html: tex(formula, true) }} />
          ) : null}
          {beat.heading ? <h3>{beat.heading}</h3> : null}
          <p>{renderCaption(beat.body)}</p>
        </div>
      );
    default:
      return (
        <div className="transcript__beat">
          {beat.heading ? <h3>{beat.heading}</h3> : null}
          {beat.body ? <p>{renderCaption(beat.body)}</p> : null}
        </div>
      );
  }
}

/**
 * Every word of the journey on one page, chapter by chapter: to read at your own pace, search, or follow without
 * sound or 3D. Drawn from the chapters' own timelines, so it always matches what plays.
 */
export default function TranscriptPage() {
  const set = useApp((s) => s.set);
  const [menu, setMenu] = useState(false);
  const parts = useMemo(() => byChapter(journeyScript()), []);

  useEffect(() => {
    set({ mode: 'page' });
    document.title = 'Transcript · From Sand to Stars';
    return () => {
      document.title = 'From Sand to Stars';
    };
  }, [set]);

  return (
    <div className="overlay overlay--reading">
      <main className="page transcript">
        <div className="page__inner">
          <span className="eyebrow">From Sand to Stars</span>
          <h1>Transcript</h1>
          <p className="transcript__intro">
            Every word of the journey, chapter by chapter. Each one can also be played on its own, or explored
            in its Lab.
          </p>
          <nav aria-label="Chapters" className="transcript__contents">
            <ol>
              {parts.map(({ slug }) => {
                const s = segmentBySlug(slug)!;
                return (
                  <li key={slug}>
                    <a href={`#${slug}`}>
                      <span style={{ color: s.accent }}>{s.eyebrow}</span> {s.title}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
          {parts.map(({ slug, beats }) => {
            const s = segmentBySlug(slug)!;
            return (
              <section key={slug} id={slug} className="transcript__chapter" aria-labelledby={`${slug}-title`}>
                <span className="eyebrow" style={{ color: s.accent }}>
                  {s.eyebrow}
                </span>
                <h2 id={`${slug}-title`}>{s.title}</h2>
                <span className="chip">{s.chip}</span>
                {beats.map((b, i) => (
                  <Beat key={i} beat={b} slug={slug} />
                ))}
                <p className="transcript__play">
                  <Link className="btn" to={`/play/${slug}`}>
                    Play this {slug === 'finale' ? 'finale' : 'chapter'}
                  </Link>
                </p>
              </section>
            );
          })}
        </div>
      </main>
      <TopBar onChapters={() => setMenu(true)} />
      {menu ? <ChaptersMenu onClose={() => setMenu(false)} /> : null}
    </div>
  );
}
