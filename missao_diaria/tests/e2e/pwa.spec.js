import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('registra o service worker e o manifest é servido', async ({ page }) => {
  await page.goto('./');
  const escopo = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(escopo.endsWith('/missao_diaria/')).toBe(true);
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const r = await page.request.get(new URL(href, page.url()).href);
  expect(r.ok()).toBe(true);
  expect((await r.json()).short_name).toBe('Missão');
});
