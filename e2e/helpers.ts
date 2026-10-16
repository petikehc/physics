import { expect, type Page } from '@playwright/test';

/** Console noise we accept (library deprecation notices). */
const IGNORED = [/THREE\.Clock/, /PCFSoftShadowMap/, /GPU stall/, /GL Driver Message/, /WebGL: INVALID/];

export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (IGNORED.some((r) => r.test(m.text()))) return;
    errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

export async function waitForJourney(page: Page) {
  await page.waitForFunction(() => !!window.__journey, null, { timeout: 60_000 });
}

/** A rendered 3D frame compresses far worse than a blank one: use the PNG size as a cheap "not blank" check. */
export async function expectCanvasRendered(page: Page) {
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
  const box = (await canvas.boundingBox())!;
  const shot = await page.screenshot({
    clip: {
      x: box.x + box.width * 0.1,
      y: box.y + box.height * 0.25,
      width: box.width * 0.8,
      height: box.height * 0.4,
    },
  });
  expect(shot.length).toBeGreaterThan(40_000);
}

export async function seek(page: Page, labelOrTime: string | number) {
  await page.evaluate((x) => window.__journey!.seek(x), labelOrTime);
}
