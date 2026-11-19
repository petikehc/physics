/**
 * What the render scripts share: a browser that can draw the 3D world without a GPU, and the journey opened in it.
 */
import { chromium } from '@playwright/test';

/** Chromium with software WebGL (SwiftShader). CHROMIUM_PATH points it at another build of Chromium if needed. */
export function launchBrowser() {
  return chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: [
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });
}

/**
 * Opens the journey (or one chapter of it, with `path`) and waits for its test hook.
 * `prefs` are saved settings to start with (e.g. { autoContinue: false }); `scale` is the device pixel ratio.
 */
export async function openJourney(
  browser,
  { url, path = '/play', width, height, quality, scale = 1, prefs },
) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  if (prefs) {
    await page.addInitScript(
      (p) => window.localStorage.setItem('sand-to-stars:prefs', JSON.stringify(p)),
      prefs,
    );
  }
  await page.goto(`${url}${path}?quality=${quality}`);
  await page.waitForFunction(() => !!window.__journey, null, { timeout: 60_000 });
  return page;
}
