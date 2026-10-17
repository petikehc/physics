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

  const slices = panel.getByLabel('Slices');
  await slices.focus();
  // One step at a time: on a slow machine a second key press can land before the first has re-rendered the slider.
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

test('labs that are not built yet say so', async ({ page }) => {
  await page.goto('/lab/newton?quality=low');
  await expect(page.getByText('This Lab is in production.')).toBeVisible();
});
