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

test('every beat of the journey renders (desktop and phone)', async ({ page }) => {
  test.setTimeout(900_000);
  const errors = collectErrors(page);
  for (const viewport of [
    { width: 1440, height: 900, name: 'desktop' },
    { width: 390, height: 844, name: 'phone' },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(`/play${Q}`);
    await waitForJourney(page);
    const beats = await page.evaluate(() => window.__journey!.beats);
    expect(beats.length).toBeGreaterThan(20);
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

test('chapter 2: Your turn re-slices the disc, and Continue hands it back to the story', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`/play/circle-area${Q}`);
  await waitForJourney(page);
  // The chapter link starts the journey at chapter 2.
  const start = await page.evaluate(
    () => window.__journey!.beats.find((b) => b.key === 'circle-area:flight')!.start,
  );
  expect(await page.evaluate(() => window.__journey!.time())).toBeGreaterThanOrEqual(start - 0.01);

  const pauseAt = await page.evaluate(
    () => window.__journey!.beats.find((b) => b.key === 'circle-area:yourTurn')!.pauseAt!,
  );
  await seek(page, pauseAt - 0.4);
  await page.evaluate(() => window.__journey!.play());
  const panel = page.getByRole('complementary', { name: 'Your turn' });
  await expect(panel).toBeVisible({ timeout: 30_000 });
  await expect(panel).toContainText('= 4.40 × 1.40 = 6.16');
  await expect(panel).toContainText('16 straight-edged triangles cover 6.00');

  await panel.getByLabel('Slices').focus();
  await page.keyboard.press('ArrowRight');
  await expect(panel).toContainText('32 straight-edged triangles');
  const n = () => page.evaluate(() => (window.__journey!.rigs['circle-area'] as { n: number }).n);
  expect(await n()).toBe(32);

  await panel.getByRole('button', { name: /Continue/ }).click();
  await expect(panel).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__journey!.time()), { timeout: 20_000 })
    .toBeGreaterThan(pauseAt + 0.2);
  expect(errors).toEqual([]);
});

test('chapter 3: Your turn floats and sinks things in different fluids', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`/play/archimedes${Q}`);
  await waitForJourney(page);
  const pauseAt = await page.evaluate(
    () => window.__journey!.beats.find((b) => b.key === 'archimedes:yourTurn')!.pauseAt!,
  );
  await seek(page, pauseAt - 0.4);
  await page.evaluate(() => window.__journey!.play());
  const panel = page.getByRole('complementary', { name: 'Your turn' });
  await expect(panel).toBeVisible({ timeout: 30_000 });
  await expect(panel).toContainText('It floats, 92 % under the surface');

  await panel.getByRole('button', { name: 'Gold' }).click();
  await expect(panel).toContainText('It sinks.');
  // Iron floats on mercury.
  await panel.getByRole('button', { name: 'Iron' }).click();
  await panel.getByRole('button', { name: 'Mercury' }).click();
  await expect(panel).toContainText('It floats, 58 % under the surface');
  await expect(panel.getByRole('button', { name: 'Mercury' })).toHaveAttribute('aria-pressed', 'true');

  await panel.getByRole('button', { name: /Continue/ }).click();
  await expect(panel).toBeHidden();
  expect(errors).toEqual([]);
});

test('chapter 4: Your turn reshapes the orbit, and the fans stay equal', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`/play/kepler${Q}`);
  await waitForJourney(page);
  const pauseAt = await page.evaluate(
    () => window.__journey!.beats.find((b) => b.key === 'kepler:yourTurn')!.pauseAt!,
  );
  await seek(page, pauseAt - 0.4);
  await page.evaluate(() => window.__journey!.play());
  const panel = page.getByRole('complementary', { name: 'Your turn' });
  await expect(panel).toBeVisible({ timeout: 30_000 });
  await expect(panel).toContainText('each fan = 1/12 of the area, in 1/12 of the year');

  // Mars' real orbit: its speed swings through Kepler's fifth.
  await panel.getByRole('button', { name: 'Mars' }).click();
  await expect(panel).toContainText('so it turns 1.5× faster: a fifth (3 : 2), as Kepler heard it.');
  await panel.getByLabel('Equal times per year').focus();
  await page.keyboard.press('ArrowRight');
  await expect(panel).toContainText('each fan = 1/16 of the area');
  const fans = () => page.evaluate(() => (window.__journey!.rigs['kepler'] as { fanCount: number }).fanCount);
  expect(await fans()).toBe(16);

  await panel.getByRole('button', { name: /Continue/ }).click();
  await expect(panel).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__journey!.time()), { timeout: 20_000 })
    .toBeGreaterThan(pauseAt + 0.2);
  expect(errors).toEqual([]);
});

test('jumping ahead loads the chapter the playhead lands in', async ({ page }) => {
  const errors = collectErrors(page);
  // Start at chapter 1, whose neighbours are loaded with it, then jump two chapters on.
  await page.goto(`/play${Q}`);
  await waitForJourney(page);
  const t = await page.evaluate(
    () => window.__journey!.beats.find((b) => b.key === 'archimedes:push')!.start + 2,
  );
  await seek(page, t);
  // The overflow beaker's label only exists once chapter 3's station is mounted.
  await expect(page.getByText(/^65 mL/)).toBeVisible({ timeout: 60_000 });
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
  // The step is a ~1.4 s tween, but GSAP slows its clock when frames take too long, and software rendering
  // on CI is slow: allow it the same headroom as the reduced-motion test.
  await expect
    .poll(() => page.evaluate(() => window.__journey!.time()), { timeout: 60_000 })
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
