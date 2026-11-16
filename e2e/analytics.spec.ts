import { expect, test, type Page } from '@playwright/test';
import { collectErrors, seek, waitForJourney } from './helpers';

/** The hits logged so far with ?analytics=debug: events by name, pageviews as "pageview <path>". */
const hits = (page: Page) =>
  page.evaluate(() => (window.__analytics ?? []).map((h) => (h.event ? h.path : `pageview ${h.path}`)));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem('sand-to-stars:prefs', JSON.stringify({ autoContinue: false })),
  );
});

test('with ?analytics=debug, events are logged once each and nothing is sent', async ({ page }) => {
  const errors = collectErrors(page);
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));

  await page.goto('/play?quality=low&analytics=debug');
  await waitForJourney(page);
  await expect
    .poll(() => hits(page))
    .toEqual(expect.arrayContaining(['pageview /play', 'start', 'chapter-01']));

  // Reaching a chapter by seeking counts too, and only once however often it's reached.
  const second = await page.evaluate(() =>
    window.__journey!.beats.find((b) => b.key.startsWith('circle-area:'))!,
  );
  await seek(page, second.start + 1);
  await seek(page, 0.5);
  await seek(page, second.start + 1);
  await expect.poll(() => hits(page)).toContain('chapter-02');
  expect((await hits(page)).filter((h) => h === 'chapter-02')).toHaveLength(1);

  await page.getByRole('button', { name: 'Chapters' }).click();
  await expect.poll(() => hits(page)).toContain('chapters-menu');
  // The first chapter's Lab, from the menu: a route change (a pageview) and the Lab event.
  await page.getByRole('dialog', { name: 'Chapters' }).getByRole('link', { name: 'Lab' }).first().click();
  await expect.poll(() => hits(page)).toEqual(expect.arrayContaining(['pageview /lab/pythagoras', 'lab-01']));

  expect(requests.filter((u) => u.includes('goatcounter') || u.includes('gc.zgo.at'))).toEqual([]);
  expect(errors).toEqual([]);
});

test('off the live site, analytics stay off: no script, no log', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/play?quality=low');
  await waitForJourney(page);
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => window.__analytics)).toBeUndefined();
  expect(requests.filter((u) => u.includes('goatcounter') || u.includes('gc.zgo.at'))).toEqual([]);
});
