import { expect, test } from '@playwright/test';
import { collectErrors, waitForJourney } from './helpers';

test('the transcript has every chapter, its words and formula, and plays any chapter from there', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('/transcript');
  await expect(page.getByRole('heading', { name: 'Transcript', level: 1 })).toBeVisible();
  // Ten chapters and the finale, each a section of its own; no 3D world is drawn for words alone.
  await expect(page.locator('.transcript__chapter')).toHaveCount(11);
  await expect(page.locator('canvas')).toHaveCount(0);
  const kepler = page.getByRole('region', { name: "Kepler's Laws" });
  await expect(kepler.getByRole('heading', { name: 'Two pins and a loop of string' })).toBeVisible();
  await expect(kepler.locator('.transcript__formula .katex')).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Something Stays the Same' })).toContainText('Emmy Noether');

  await page
    .getByRole('navigation', { name: 'Chapters' })
    .getByRole('link', { name: /Euler's Identity/ })
    .click();
  await expect(page).toHaveURL(/#euler$/);
  await page
    .getByRole('region', { name: "Euler's Identity" })
    .getByRole('link', { name: 'Play this chapter' })
    .click();
  await expect(page).toHaveURL(/\/play\/euler/);
  await waitForJourney(page);
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('without WebGL, the site says so over a still of the journey, and offers the transcript', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error: a browser without 3D answers null for WebGL and keeps its 2D canvas.
    HTMLCanvasElement.prototype.getContext = function (kind: string, ...rest: unknown[]) {
      return kind.startsWith('webgl') ? null : get.call(this, kind, ...rest);
    };
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'This journey needs WebGL' })).toBeVisible();
  const still = await page.locator('.page--still').evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(still).toContain('still.jpg');
  await page.getByRole('link', { name: 'Read the transcript' }).click();
  await expect(page.getByRole('heading', { name: 'Transcript', level: 1 })).toBeVisible();
  await expect(page.locator('.transcript__chapter')).toHaveCount(11);
});
