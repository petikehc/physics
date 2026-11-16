import { describe, expect, it } from 'vitest';
import { chapterEvent, createTracker, GOATCOUNTER_URL, minuteEvent, shouldSend, type Hit } from './track';

describe('createTracker', () => {
  it('sends each once-per-visit event only once', () => {
    const hits: Hit[] = [];
    const t = createTracker((h) => hits.push(h));
    for (let i = 0; i < 3; i++) {
      t.track('start');
      t.track('chapter-01');
      t.track('muted');
    }
    t.track('chapter-02');
    expect(hits.map((h) => h.path)).toEqual(['start', 'chapter-01', 'muted', 'chapter-02']);
    expect(hits.every((h) => h.event)).toBe(true);
  });

  it('counts every pageview, repeats included', () => {
    const hits: Hit[] = [];
    const t = createTracker((h) => hits.push(h));
    t.pageview('/physics/');
    t.pageview('/physics/transcript');
    t.pageview('/physics/');
    expect(hits.map((h) => [h.path, h.event])).toEqual([
      ['/physics/', false],
      ['/physics/transcript', false],
      ['/physics/', false],
    ]);
  });

  it('never throws, even when sending fails', () => {
    const t = createTracker(() => {
      throw new Error('blocked');
    });
    expect(() => t.track('start')).not.toThrow();
    expect(() => t.pageview('/physics/')).not.toThrow();
  });

  it('ignores an undefined event (a slug that is not a chapter)', () => {
    const hits: Hit[] = [];
    createTracker((h) => hits.push(h)).track(chapterEvent('lab', 'finale'));
    expect(hits).toEqual([]);
  });
});

describe('event names', () => {
  it('zero-pads chapters and minutes', () => {
    expect(chapterEvent('chapter', 'pythagoras')).toBe('chapter-01');
    expect(chapterEvent('your-turn', 'circle-area')).toBe('your-turn-02');
    expect(chapterEvent('lab', 'energy')).toBe('lab-10');
    expect(minuteEvent(7)).toBe('time-07');
    expect(minuteEvent(30)).toBe('time-30');
  });
});

describe('shouldSend (the one gate)', () => {
  const live = {
    base: '/physics/',
    hostname: 'petikehc.github.io',
    webdriver: false,
    url: 'https://example.goatcounter.com/count',
  };

  it('sends from the live site', () => {
    expect(shouldSend(live)).toBe(true);
  });

  it('sends nothing from a branch preview', () => {
    expect(shouldSend({ ...live, base: '/physics/preview/feat-analytics/' })).toBe(false);
  });

  it('sends nothing from localhost', () => {
    expect(shouldSend({ ...live, base: '/', hostname: 'localhost' })).toBe(false);
  });

  it('sends nothing from an automated browser (the e2e tests)', () => {
    expect(shouldSend({ ...live, webdriver: true })).toBe(false);
  });

  it('sends nothing while the site code is still the placeholder', () => {
    expect(shouldSend({ ...live, url: GOATCOUNTER_URL })).toBe(false);
  });
});
