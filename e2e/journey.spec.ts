import { expect, test } from '@playwright/test';
import { collectErrors, expectCanvasRendered, seek, waitForJourney } from './helpers';

const Q = '?quality=low';

test('the landing teaser renders and offers the journey', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`/${Q}`);
  await expect(page.getByRole('heading', { name: /From Sand to Stars/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Begin the journey/ })).toBeVisible();
  await page.waitForTimeout(3000);
  await expectCanvasRendered(page);
  expect(errors).toEqual([]);
});

test('every beat of chapter 1 renders (desktop and phone)', async ({ page }) => {
  test.setTimeout(400_000);
  const errors = collectErrors(page);
  for (const viewport of [
    { width: 1440, height: 900, name: 'desktop' },
    { width: 390, height: 844, name: 'phone' },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(`/play${Q}`);
    await waitForJourney(page);
    const beats = await page.evaluate(() => window.__journey!.beats);
    expect(beats.length).toBeGreaterThan(10);
    for (const b of beats) {
      await seek(page, b.start + Math.min((b.end - b.start) * 0.7, 6));
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: test.info().outputPath(`${viewport.name}-${b.key.replace(':', '_')}.png`),
      });
    }
    await expectCanvasRendered(page);
  }
  expect(errors).toEqual([]);
});

test('Your turn pauses the journey, and Continue resumes it', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`/play${Q}`);
  await waitForJourney(page);
  const pauseAt = await page.evaluate(
    () => window.__journey!.beats.find((b) => b.key === 'pythagoras:yourTurn')!.pauseAt!,
  );
  await seek(page, pauseAt - 0.4);
  await page.evaluate(() => window.__journey!.play());
  const panel = page.getByRole('complementary', { name: 'Your turn' });
  await expect(panel).toBeVisible({ timeout: 30_000 });
  await expect(panel).toContainText('9 + 16 = 25');
  await expect(panel.getByText(/Pythagorean triple: 3–4–5/)).toBeVisible();
  await panel.getByRole('button', { name: /Continue/ }).click();
  await expect(panel).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__journey!.time()), { timeout: 20_000 })
    .toBeGreaterThan(pauseAt + 0.2);
  expect(errors).toEqual([]);
});

test('the player steps between beats with the keyboard', async ({ page }) => {
  await page.goto(`/play${Q}`);
  await waitForJourney(page);
  await seek(page, 'pythagoras:draw');
  const start = await page.evaluate(
    () => window.__journey!.beats.find((b) => b.key === 'pythagoras:squares')!.start,
  );
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(() => page.evaluate(() => window.__journey!.time()), { timeout: 20_000 })
    .toBeGreaterThanOrEqual(start - 0.01);
});

test('"Begin the journey" turns sound on; "Watch in silence" never loads the audio engine', async ({
  browser,
}) => {
  const silent = await browser.newPage();
  const requested: string[] = [];
  silent.on('request', (r) => requested.push(r.url()));
  await silent.goto(`/${Q}`);
  await silent.getByRole('button', { name: 'Watch in silence' }).click();
  await silent.waitForURL(/\/play/);
  await waitForJourney(silent);
  await silent.waitForTimeout(1500);
  expect(requested.some((u) => /\/engine-[^/]+\.js$/.test(u))).toBe(false);
  expect(await silent.evaluate(() => window.__audio?.loaded)).toBe(false);
  await silent.close();

  const loud = await browser.newPage();
  const errors = collectErrors(loud);
  await loud.goto(`/${Q}`);
  await loud.getByRole('button', { name: /Begin the journey/ }).click();
  await loud.waitForURL(/\/play/);
  await expect.poll(() => loud.evaluate(() => window.__audio?.loaded), { timeout: 30_000 }).toBe(true);
  expect(await loud.evaluate(() => window.__audio?.state)).toBe('running');
  expect(errors).toEqual([]);
  await loud.close();
});

test('reduced motion: no film grain, and playback stops at the end of each beat', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/play${Q}`);
  await waitForJourney(page);
  await expect(page.locator('.grain')).toHaveCount(0);
  const next = await page.evaluate(
    () => window.__journey!.beats.find((b) => b.key === 'pythagoras:squares')!.start,
  );
  await seek(page, next - 0.25);
  await page.evaluate(() => window.__journey!.play());
  // Software rendering is slow, so poll until the playhead reaches the boundary…
  await expect
    .poll(() => page.evaluate(() => window.__journey!.time()), { timeout: 60_000 })
    .toBeGreaterThanOrEqual(next - 0.001);
  // …then check it stays there instead of playing on.
  await page.waitForTimeout(2000);
  const t = await page.evaluate(() => window.__journey!.time());
  expect(Math.abs(t - next)).toBeLessThan(0.001);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
});
