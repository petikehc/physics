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
  // A sixth of a turn round, and six of the series' terms: close, but not yet on it.
  await expect(panel).toContainText('= 0.50 + 0.87 i');
  await expect(panel).toContainText('6 terms land at 0.50 + 0.87 i: 0.0018 from the point.');

  // Four more terms, and the series lands on the point.
  const n = panel.getByLabel('Terms of the series');
  await n.focus();
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

test('labs that are not built yet say so', async ({ page }) => {
  await page.goto('/lab/fourier?quality=low');
  await expect(page.getByText('This Lab is in production.')).toBeVisible();
});
