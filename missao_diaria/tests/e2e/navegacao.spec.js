import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ABAS = [
  ['Hoje', 'Hoje'],
  ['Revisão', 'Revisão'],
  ['Simulado', 'Simulado'],
  ['Painel', 'Painel'],
  ['Ajustes', 'Ajustes'],
];

for (const esquema of ['light', 'dark']) {
  test(`navega pelas 5 abas e passa no axe (${esquema})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: esquema });
    await page.goto('./');
    await expect(page).toHaveTitle(/Missão Diária/);
    await expect(page).toHaveURL(/#hoje$/);

    for (const [aba, titulo] of ABAS) {
      await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: aba }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(titulo);
      await expect(page.locator('.nav a[aria-current="page"]')).toHaveText(aba);
      const box = await page.locator('.nav a[aria-current="page"]').boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    }
  });
}

test('render antigo e lento não sobrescreve a aba atual', async ({ page }) => {
  await page.route('**/dados/**', async (rota) => {
    await new Promise((r) => setTimeout(r, 800));
    await rota.continue();
  });
  await page.goto('./#hoje');
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Ajustes' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ajustes');
  await page.waitForTimeout(2500);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ajustes');
  await expect(page.locator('.nav a[aria-current="page"]')).toHaveText('Ajustes');
});
