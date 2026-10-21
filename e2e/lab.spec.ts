import { expect, test } from '@playwright/test';
import { collectErrors, expectCanvasRendered } from './helpers';

test('the Pythagoras lab updates live and explains a broken right angle', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/lab/pythagoras?quality=low');
  const panel = page.getByRole('complementary', { name: 'Pythagoras lab' });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('a² = 9');

  const a = panel.getByLabel('Side a');
  await a.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(panel).toContainText('a² = 36');
  await expect(panel.getByText(/Pythagorean triple: 6–4|Pythagorean triple/)).toHaveCount(0);

  // 6-8-10 is a triple.
  const b = panel.getByLabel('Side b');
  await b.focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
  await expect(panel.getByText('✦ Pythagorean triple: 6–8–10')).toBeVisible();

  const angle = panel.getByLabel('Angle between a and b');
  await angle.focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowLeft');
  await expect(panel).toContainText('Acute angle');
  await expect(panel.getByRole('button', { name: 'Play the pour proof' })).toBeDisabled();

  await page.waitForTimeout(1500);
  await expectCanvasRendered(page);
  await page.screenshot({ path: test.info().outputPath('lab.png') });
  expect(errors).toEqual([]);
});

test('the circle lab re-slices the disc and follows the radius', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/lab/circle-area?quality=low');
  const panel = page.getByRole('complementary', { name: 'Circle area lab' });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('= 4.40 × 1.40 = 6.16');
  // Read once, not polled: the panel must show the Lab's 16 slices as soon as it appears, or a key press can
  // land on the slider before it has caught up.
  expect(await panel.textContent()).toContain('16 straight-edged triangles');

  const slices = panel.getByLabel('Slices');
  await slices.focus();
  await page.keyboard.press('ArrowRight');
  await expect(panel).toContainText('32 straight-edged triangles');
  await page.keyboard.press('ArrowRight');
  await expect(panel).toContainText('64 straight-edged triangles cover 6.15: 0.2% short');

  const radius = panel.getByLabel('Radius r');
  await radius.focus();
  for (const r of ['1.45', '1.5', '1.55', '1.6']) {
    await page.keyboard.press('ArrowRight');
    await expect(radius).toHaveValue(r);
  }
  await expect(panel).toContainText('= 5.03 × 1.60 = 8.04');

  await page.waitForTimeout(1500);
  await expectCanvasRendered(page);
  await page.screenshot({ path: test.info().outputPath('lab-circle.png') });
  expect(errors).toEqual([]);
});

test('the Archimedes lab drops materials into fluids', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/lab/archimedes?quality=low');
  const panel = page.getByRole('complementary', { name: 'Archimedes lab' });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Ice 0.92 g/cm³');
  await panel.getByRole('button', { name: 'Cork' }).click();
  await panel.getByRole('button', { name: 'Dead Sea water' }).click();
  await expect(panel).toContainText('It floats, 19 % under the surface');
  await expect(panel.getByRole('button', { name: 'Replay the crown on the scale' })).toBeEnabled();
  await page.waitForTimeout(1500);
  await expectCanvasRendered(page);
  await page.screenshot({ path: test.info().outputPath('lab-archimedes.png') });
  expect(errors).toEqual([]);
});

test('the Kepler lab reshapes the orbit and shows all six planets', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/lab/kepler?quality=low');
  const panel = page.getByRole('complementary', { name: 'Kepler lab' });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('each fan = 1/12 of the area');
  await panel.getByRole('button', { name: 'Earth' }).click();
  await expect(panel).toContainText('semitone (16 : 15)');
  await panel.getByRole('button', { name: /Show all six planets/ }).click();
  await expect(panel.getByRole('button', { name: 'Back to one orbit' })).toBeEnabled({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  await expectCanvasRendered(page);
  await page.screenshot({ path: test.info().outputPath('lab-kepler.png') });
  expect(errors).toEqual([]);
});

test('the Newton lab fires the cannon at any speed and angle, and shows the forces', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/lab/newton?quality=low');
  const panel = page.getByRole('complementary', { name: 'Newton lab' });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('It lands 9,790 km away');
  await panel.getByRole('button', { name: 'Ellipse' }).click();
  await expect(panel).toContainText('An ellipse, up to 7,800 km high');

  const angle = panel.getByLabel('Angle above the horizon');
  await angle.focus();
  for (const a of ['1', '2', '3']) {
    await page.keyboard.press('ArrowRight');
    await expect(angle).toHaveValue(a);
  }
  await expect(panel).toContainText('3°');

  await panel.getByRole('button', { name: 'Show the forces' }).click();
  await expect(panel.getByRole('button', { name: 'Hide the forces' })).toBeVisible();
  await expect(page.getByText('straight on')).toBeVisible();
  await page.waitForTimeout(1500);
  await expectCanvasRendered(page);
  await page.screenshot({ path: test.info().outputPath('lab-newton.png') });
  expect(errors).toEqual([]);
});

test('the calculus lab reshapes the curve, moves a and b, and fills the area with columns', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('/lab/calculus?quality=low');
  const panel = page.getByRole('complementary', { name: 'Calculus lab' });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Area from a to b: 2.37');
  await expect(panel).toContainText('8 columns add up to 6.06; the whole area is 6.05.');

  // Two steps up the column counts: 32.
  const n = panel.getByLabel('Columns');
  await n.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(panel).toContainText('32 columns add up to 6.05');

  await panel.getByRole('button', { name: 'Hill' }).click();
  await expect(panel).toContainText('Area from a to b: 4.68');
  await panel.getByRole('button', { name: 'Show the columns' }).click();
  await expect(panel.getByRole('button', { name: 'Hide the columns' })).toBeVisible();
  await page.waitForTimeout(1500);
  await expectCanvasRendered(page);
  await page.screenshot({ path: test.info().outputPath('lab-calculus.png') });
  expect(errors).toEqual([]);
});

test('the euler lab sends the point round and lays the series onto it', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/lab/euler?quality=low');
  const panel = page.getByRole('complementary', { name: 'Euler lab' });
  await expect(panel).toBeVisible();
  // A sixth of a turn round; six of the series' terms come close, but not yet onto it.
  await expect(panel).toContainText('= 0.50 + 0.87 i');
  const n = panel.getByLabel('Terms of the series');
  await n.focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
  await expect(panel).toContainText('6 terms land at 0.50 + 0.87 i: 0.0018 from the point.');

  // Four more terms, and the series lands on the point.
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
  await expect(panel).toContainText('10 terms land at 0.50 + 0.87 i: on the point.');

  // Half a turn: the arrows swing wide first, and ten of them are still a little short of −1.
  await panel.getByRole('button', { name: 'θ = π', exact: true }).click();
  await expect(panel).toContainText('= −1.00 + 0.00 i', { timeout: 10_000 });
  await expect(panel).toContainText('10 terms land at −0.98 + 0.01 i');

  await panel.getByRole('button', { name: 'Hide the triangle' }).click();
  await expect(panel.getByRole('button', { name: 'Show the triangle' })).toBeVisible();
  await panel.getByRole('button', { name: 'Go once round' }).click();
  await page.waitForTimeout(1500);
  await expectCanvasRendered(page);
  await page.screenshot({ path: test.info().outputPath('lab-euler.png') });
  expect(errors).toEqual([]);
});

test('the fourier lab builds waves, turns them side on, and redraws a shape you draw', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/lab/fourier?quality=low');
  const panel = page.getByRole('complementary', { name: 'Fourier lab' });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Speeds 1, 3, 5, 7');

  await panel.getByRole('button', { name: 'Side view' }).click();
  await expect(panel.getByRole('button', { name: 'Side view' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('speed', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('1/3', { exact: true })).toBeVisible();

  // Draw a closed loop on the stars: the circles take it over.
  await panel.getByRole('button', { name: 'Draw a shape' }).click();
  await expect(panel).toContainText('The ambulance, from 101 circles.');
  await page.waitForTimeout(2000);
  const box = (await page.locator('canvas').boundingBox())!;
  const cx = box.x + box.width * 0.33;
  const cy = box.y + box.height * 0.45;
  await page.mouse.move(cx + 120, cy);
  await page.mouse.down();
  for (let i = 1; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    await page.mouse.move(cx + 120 * Math.cos(a), cy + 70 * Math.sin(3 * a) * 0.5 + 60 * Math.sin(a));
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await expect(panel).toContainText('Your shape, from 101 circles.');
  const fewer = panel.getByLabel('Circles');
  await fewer.focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft');
  await expect(panel).toContainText('Your shape, from 96 circles.');
  await panel.getByRole('button', { name: 'Back to the ambulance' }).click();
  await expect(panel).toContainText('The ambulance, from 96 circles.');
  await page.waitForTimeout(1500);
  await expectCanvasRendered(page);
  await page.screenshot({ path: test.info().outputPath('lab-fourier.png') });
  expect(errors).toEqual([]);
});

test('the doppler lab plays an ambulance and a jet to a listener, and red-shifts a galaxy', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('/lab/doppler?quality=low');
  const panel = page.getByRole('complementary', { name: 'Doppler lab' });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Straight ahead: 2.00 f');
  await expect(page.getByText(/you hear/)).toBeVisible({ timeout: 10_000 });

  // The listener walks towards the ambulance's side of the street.
  const walk = panel.getByLabel('Listener');
  await walk.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(panel).toContainText('0.05 × the speed of sound, to the left');

  // Faster than sound: nothing is heard ahead of the jet until its cone has gone by.
  await panel.getByRole('button', { name: 'Jet' }).click();
  await expect(panel.getByRole('button', { name: 'Jet' })).toHaveAttribute('aria-pressed', 'true');
  await expect(panel).toContainText('1.40 × the speed of sound');
  await expect(panel).toContainText('Straight ahead: nothing until it has passed.');

  // Light: a red shift of 0.4 stretches every wavelength by 1.4.
  await panel.getByRole('button', { name: 'Light' }).click();
  await panel.getByLabel('Red shift z').fill('0.4');
  await expect(panel).toContainText('Moving away at 32.4% of the speed of light', { timeout: 10_000 });
  await expect(panel).toContainText('arrives at 681 nm');
  await page.waitForTimeout(2500);
  await expect(page.getByText('Hα', { exact: true })).toBeVisible();
  await expectCanvasRendered(page);
  await page.screenshot({ path: test.info().outputPath('lab-doppler.png') });
  expect(errors).toEqual([]);
});

test('the energy lab lets a car go on a valley you shape, and runs the coaster with its tanks', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('/lab/energy?quality=low');
  const panel = page.getByRole('complementary', { name: 'Energy lab' });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('12.0 m');
  await expect(panel).toContainText('400 kg');

  // A heavier car: more energy of every kind, and the total still never changes as it rolls.
  const mass = panel.getByLabel('Mass');
  await mass.focus();
  await page.keyboard.press('ArrowRight');
  await expect(panel).toContainText('450 kg');
  await panel.getByRole('button', { name: 'Let it go again' }).click();
  const total = async () => Number((await panel.textContent())!.match(/Total (\d+) kJ/)![1]);
  const first = await total();
  await expect(panel).toContainText(/[1-9]\d* km\/h/, { timeout: 15_000 });
  for (let i = 0; i < 3; i++) {
    expect(Math.abs((await total()) - first)).toBeLessThanOrEqual(1);
    await page.waitForTimeout(400);
  }

  // The coaster, with its tanks.
  await panel.getByRole('button', { name: 'The coaster' }).click();
  await expect(panel.getByRole('button', { name: 'The coaster' })).toHaveAttribute('aria-pressed', 'true');
  await expect(panel).toContainText('The tanks keep count.');
  await expect(page.getByText('height · mgh')).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(2500);
  await expectCanvasRendered(page);
  await page.screenshot({ path: test.info().outputPath('lab-energy.png') });
  expect(errors).toEqual([]);
});

test('the map is the constellation: choose a star to read what it kept, and open its Lab', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('/map?quality=low');
  const panel = page.getByRole('complementary', { name: 'The constellation' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('group', { name: 'Chapters' }).getByRole('button')).toHaveCount(10);
  await page.waitForTimeout(3000);
  await expectCanvasRendered(page);

  await panel.getByRole('button', { name: /^X · / }).click();
  await expect(panel.getByRole('button', { name: /^X · / })).toHaveAttribute('aria-pressed', 'true');
  await expect(panel).toContainText('Energy.');
  await expect(panel.getByRole('link', { name: 'Play chapter X' })).toHaveAttribute(
    'href',
    /\/play\/energy$/,
  );
  await page.screenshot({ path: test.info().outputPath('map.png') });
  await panel.getByRole('link', { name: 'Open the Lab' }).click();
  await expect(page).toHaveURL(/\/lab\/energy/);
  await expect(page.getByRole('complementary', { name: 'Energy lab' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('a Lab that does not exist says so', async ({ page }) => {
  await page.goto('/lab/nowhere?quality=low');
  await expect(page.getByText('There is no Lab here.', { exact: false })).toBeVisible();
});
