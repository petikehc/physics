import { expect, test } from '@playwright/test';
import { collectErrors, expectCanvasRendered, seek, waitForJourney } from './helpers';

const Q = '?quality=low';

// The tests work each Your-turn panel themselves. Left on, its 14 s countdown can run out while a slow,
// software-rendered run is still checking the panel, and the journey moves on underneath the test.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem('sand-to-stars:prefs', JSON.stringify({ autoContinue: false })),
  );
});

test('the landing teaser renders and offers the journey', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`/${Q}`);
  await expect(page.getByRole('heading', { name: /From Sand to Stars/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Begin the journey/ })).toBeVisible();
  await page.waitForTimeout(3000);
  await expectCanvasRendered(page);
  expect(errors).toEqual([]);
});

for (const viewport of [
  { width: 1440, height: 900, name: 'desktop' },
  { width: 390, height: 844, name: 'phone' },
]) {
  test(`every beat of the journey renders (${viewport.name})`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize(viewport);
    await page.goto(`/play${Q}`);
    await waitForJourney(page);
    const beats = await page.evaluate(() => window.__journey!.beats);
    expect(beats.length).toBeGreaterThan(20);
    // Time for every beat, however long the journey grows: a software-rendered seek and screenshot take a few seconds.
    test.setTimeout(120_000 + beats.length * 8_000);
    for (const b of beats) {
      await seek(page, b.start + Math.min((b.end - b.start) * 0.7, 6));
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: test.info().outputPath(`${viewport.name}-${b.key.replace(':', '_')}.png`),
      });
    }
    await expectCanvasRendered(page);
    expect(errors).toEqual([]);
  });
}

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

test("chapter 5: Your turn fires Newton's cannon, and the ball lands, circles or escapes", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto(`/play/newton${Q}`);
  await waitForJourney(page);
  const pauseAt = await page.evaluate(
    () => window.__journey!.beats.find((b) => b.key === 'newton:yourTurn')!.pauseAt!,
  );
  await seek(page, pauseAt - 0.4);
  await page.evaluate(() => window.__journey!.play());
  const panel = page.getByRole('complementary', { name: 'Your turn' });
  await expect(panel).toBeVisible({ timeout: 30_000 });
  await expect(panel).toContainText('It lands 12,410 km away');

  // The ball is in the air, and keeps flying while the story waits.
  const fly = () => page.evaluate(() => (window.__journey!.rigs['newton'] as { fly: number }).fly);
  const before = await fly();
  await expect.poll(fly, { timeout: 10_000 }).toBeGreaterThan(before);

  await panel.getByRole('button', { name: 'Circles' }).click();
  await expect(panel).toContainText('A circle, 1,600 km up');
  await expect(panel).toContainText('Once round every 1 h 58 min');
  await panel.getByRole('button', { name: 'Escapes' }).click();
  await expect(panel).toContainText('It escapes');

  await panel.getByRole('button', { name: /Continue/ }).click();
  await expect(panel).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__journey!.time()), { timeout: 20_000 })
    .toBeGreaterThan(pauseAt + 0.2);
  expect(errors).toEqual([]);
});

test('chapter 6: Your turn reshapes the curve, and the area from a to b always equals the climb', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto(`/play/calculus${Q}`);
  await waitForJourney(page);
  const pauseAt = await page.evaluate(
    () => window.__journey!.beats.find((b) => b.key === 'calculus:yourTurn')!.pauseAt!,
  );
  await seek(page, pauseAt - 0.4);
  await page.evaluate(() => window.__journey!.play());
  const panel = page.getByRole('complementary', { name: 'Your turn' });
  await expect(panel).toBeVisible({ timeout: 30_000 });
  await expect(panel).toContainText('Area from a to b: 2.37');
  await expect(panel).toContainText('A(b) − A(a) = 4.36 − 1.99 = 2.37');
  // In the scene, the area shaded between a and b, and the climb of the area curve between them, agree.
  await expect(page.getByText('area: 2.37')).toBeVisible();
  await expect(page.getByText('climb: 2.37')).toBeVisible();

  await panel.getByRole('button', { name: 'Flat' }).click();
  await expect(panel).toContainText('Area from a to b: 3.00');
  // Ten steps of b to the right, from 3 to 3.5: a flat curve 1.5 high gains 0.75.
  const b = panel.getByLabel('b', { exact: true });
  await b.focus();
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
  await expect(b).toHaveValue('3.5');
  await expect(panel).toContainText('Area from a to b: 3.75');
  await expect(page.getByText('climb: 3.75')).toBeVisible();

  await panel.getByRole('button', { name: /Continue/ }).click();
  await expect(panel).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__journey!.time()), { timeout: 20_000 })
    .toBeGreaterThan(pauseAt + 0.2);
  expect(errors).toEqual([]);
});

test('chapter 7: Your turn sends the point round, reading off cos θ and sin θ', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`/play/euler${Q}`);
  await waitForJourney(page);
  const pauseAt = await page.evaluate(
    () => window.__journey!.beats.find((b) => b.key === 'euler:yourTurn')!.pauseAt!,
  );
  await seek(page, pauseAt - 0.4);
  await page.evaluate(() => window.__journey!.play());
  const panel = page.getByRole('complementary', { name: 'Your turn' });
  await expect(panel).toBeVisible({ timeout: 30_000 });
  // The point starts at −1, where the story left it.
  await expect(panel).toContainText('= −1.00 + 0.00 i');
  await expect(panel).toContainText('cos² θ + sin² θ = 1.00 + 0.00 = 1.00');

  // A quarter turn: i, named so in the scene once the point comes to rest there.
  await panel.getByRole('button', { name: 'θ = π/2' }).click();
  await expect(panel).toContainText('= 0.00 + 1.00 i', { timeout: 10_000 });
  await expect(page.getByText('eiπ/2 = i')).toBeVisible();
  // Twenty steps back along the slider: a little under π/2, and still on the circle.
  const theta = panel.getByLabel('θ', { exact: true });
  await theta.focus();
  for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowLeft');
  const v = Number(await theta.inputValue());
  expect(v).toBeGreaterThan(1.3);
  expect(v).toBeLessThan(1.4);
  await expect(panel).toContainText(`= ${Math.cos(v).toFixed(2)} + ${Math.sin(v).toFixed(2)} i`);
  await expect(panel).toContainText('= 1.00');

  await panel.getByRole('button', { name: /Continue/ }).click();
  await expect(panel).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__journey!.time()), { timeout: 20_000 })
    .toBeGreaterThan(pauseAt + 0.2);
  expect(errors).toEqual([]);
});

test('chapter 8: Your turn builds a wave from circles', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`/play/fourier${Q}`);
  await waitForJourney(page);
  const pauseAt = await page.evaluate(
    () => window.__journey!.beats.find((b) => b.key === 'fourier:yourTurn')!.pauseAt!,
  );
  await seek(page, pauseAt - 0.4);
  await page.evaluate(() => window.__journey!.play());
  const panel = page.getByRole('complementary', { name: 'Your turn' });
  await expect(panel).toBeVisible({ timeout: 30_000 });
  // A square wave from four circles: odd speeds, each a smaller fraction.
  await expect(panel).toContainText('Speeds 1, 3, 5, 7');
  await expect(panel).toContainText('Sizes 1, 1/3, 1/5, 1/7');
  await expect(panel).toContainText('still 9% over the square');

  // Two more circles, then a sawtooth: every speed, each 1/n.
  const circles = panel.getByLabel('Circles');
  await circles.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(panel).toContainText('Speeds 1, 3, 5, 7, 9, …');
  await panel.getByRole('button', { name: 'Sawtooth' }).click();
  await expect(panel).toContainText('Speeds 1, 2, 3, 4, 5, …');
  await panel.getByRole('button', { name: 'Triangle' }).click();
  await expect(panel).toContainText('Sizes 1, 1/9, 1/25, 1/49, 1/81, …');

  await panel.getByRole('button', { name: /Continue/ }).click();
  await expect(panel).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__journey!.time()), { timeout: 20_000 })
    .toBeGreaterThan(pauseAt + 0.2);
  expect(errors).toEqual([]);
});

test('chapter 9: Your turn sets the ambulance going for a listener on the street', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`/play/doppler${Q}`);
  await waitForJourney(page);
  const pauseAt = await page.evaluate(
    () => window.__journey!.beats.find((b) => b.key === 'doppler:yourTurn')!.pauseAt!,
  );
  await seek(page, pauseAt - 0.4);
  await page.evaluate(() => window.__journey!.play());
  const panel = page.getByRole('complementary', { name: 'Your turn' });
  await expect(panel).toBeVisible({ timeout: 30_000 });
  // Half the speed of sound: twice the pitch straight ahead, two thirds of it behind.
  await expect(panel).toContainText('0.50 × the speed of sound');
  await expect(panel).toContainText('Straight ahead: 2.00 f. Straight behind: 0.67 f.');

  // Faster (which also stops the countdown to the story going on).
  const speed = panel.getByLabel('Ambulance');
  await speed.focus();
  await page.keyboard.press('ArrowRight');
  await expect(panel).toContainText('0.55 × the speed of sound');
  await expect(panel).toContainText('Straight ahead: 2.22 f');

  // The listener, ahead of the ambulance, hears it higher than its siren, and says so in the street too.
  await expect(panel).toContainText(/The listener hears \d\.\d\d f, higher than the siren/);
  await expect(page.getByText(/you hear \d\.\d\d f/)).toBeVisible();

  await panel.getByRole('button', { name: /Continue/ }).click();
  await expect(panel).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__journey!.time()), { timeout: 20_000 })
    .toBeGreaterThan(pauseAt + 0.2);
  expect(errors).toEqual([]);
});

test('chapter 10: Your turn reshapes the test track, and the total energy never changes', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto(`/play/energy${Q}`);
  await waitForJourney(page);
  const pauseAt = await page.evaluate(
    () => window.__journey!.beats.find((b) => b.key === 'energy:yourTurn')!.pauseAt!,
  );
  await seek(page, pauseAt - 0.4);
  await page.evaluate(() => window.__journey!.play());
  const panel = page.getByRole('complementary', { name: 'Your turn' });
  await expect(panel).toBeVisible({ timeout: 30_000 });
  await expect(panel).toContainText('12.0 m');
  await expect(panel).toContainText('16.0 m');

  // A little friction (which also stops the countdown to the story going on), and a higher start.
  const friction = panel.getByLabel('Friction');
  await friction.focus();
  await page.keyboard.press('ArrowRight');
  await expect(panel).toContainText('1% of its weight');
  const start = panel.getByLabel('Start');
  await start.focus();
  await page.keyboard.press('ArrowRight');
  await expect(panel).toContainText('12.5 m');
  await panel.getByRole('button', { name: 'Let it go again' }).click();

  // The car rolls, trading height for speed and losing a little to heat, but the total stays put.
  const total = async () => Number((await panel.textContent())!.match(/Total (\d+) kJ/)![1]);
  const first = await total();
  await expect(panel).toContainText(/[1-9]\d* km\/h/, { timeout: 15_000 });
  for (let i = 0; i < 4; i++) {
    expect(Math.abs((await total()) - first)).toBeLessThanOrEqual(1);
    await page.waitForTimeout(400);
  }

  await panel.getByRole('button', { name: /Continue/ }).click();
  await expect(panel).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__journey!.time()), { timeout: 20_000 })
    .toBeGreaterThan(pauseAt + 0.2);
  expect(errors).toEqual([]);
});

test('the journey ends at the constellation, which leads back into any chapter', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`/play/finale${Q}`);
  await waitForJourney(page);
  const duration = await page.evaluate(() => window.__journey!.duration);
  await seek(page, duration);
  const panel = page.getByRole('complementary', { name: 'The constellation' });
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(panel).toContainText('Ten stars, one thread');

  // Kepler's star: what it kept the same, and the way back into it.
  await panel.getByRole('button', { name: /^IV · / }).click();
  await expect(panel).toContainText('Equal areas.');
  await expect(panel).toContainText('angular momentum');
  await panel.getByRole('button', { name: 'Play chapter IV' }).click();
  await expect(panel).toBeHidden();
  const kepler = await page.evaluate(() => {
    const beats = window.__journey!.beats.filter((b) => b.key.startsWith('kepler:'));
    return { start: beats[0]!.start, end: beats[beats.length - 1]!.end };
  });
  const t = await page.evaluate(() => window.__journey!.time());
  expect(t).toBeGreaterThanOrEqual(kepler.start - 0.01);
  expect(t).toBeLessThan(kepler.end);
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

test.describe('a phone on its side', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });

  test('captions keep to a column above the player, and a Your-turn panel fits with Continue in reach', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(`/play/archimedes${Q}`);
    await waitForJourney(page);
    const beats = await page.evaluate(() => window.__journey!.beats);
    const player = page.getByRole('group', { name: 'Journey player' });

    await seek(page, beats.find((b) => b.key === 'archimedes:lower')!.start + 2);
    const captions = page.locator('.captions');
    await expect(captions).toBeVisible();
    const c = (await captions.boundingBox())!;
    const p = (await player.boundingBox())!;
    expect(c.y + c.height).toBeLessThanOrEqual(p.y);
    expect(c.x + c.width).toBeLessThan(844 / 2);

    // The longest panel: it runs from under the top bar to the bottom, scrolls, and keeps Continue in sight.
    await seek(page, beats.find((b) => b.key === 'archimedes:yourTurn')!.pauseAt! - 0.4);
    await page.evaluate(() => window.__journey!.play());
    const panel = page.getByRole('complementary', { name: 'Your turn' });
    await expect(panel).toBeVisible({ timeout: 30_000 });
    const box = (await panel.boundingBox())!;
    expect(box.y).toBeGreaterThan(0);
    expect(box.y + box.height).toBeLessThanOrEqual(390);
    const beside = (await player.boundingBox())!;
    expect(beside.x + beside.width).toBeLessThanOrEqual(box.x);
    const go = panel.getByRole('button', { name: /Continue/ });
    const b = (await go.boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(box.y + box.height + 1);
    await go.click();
    await expect(panel).toBeHidden();
    expect(errors).toEqual([]);
  });
});
