import { describe, expect, it } from 'vitest';
import { buildJourney } from './journey';
import { journeyScript } from './script';

describe('journeyScript', () => {
  it('reads the same words, in the same order, as the journey that plays', () => {
    const words = (b: { chapter: string; kind?: string; heading?: string; body?: string }) => [
      b.chapter,
      b.kind,
      b.heading,
      b.body,
    ];
    expect(journeyScript().map(words)).toEqual(buildJourney().beats.map(words));
  });
});
