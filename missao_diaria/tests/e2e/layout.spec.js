import { test, expect } from '@playwright/test';

// iPhone 12 Pro Max e celulares estreitos: nada pode passar da largura da tela
// e nenhum "null" pode aparecer como texto.
for (const largura of [428, 360]) {
  test(`sem estouro lateral nem "null" em ${largura}px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 });
    await page.goto('./');
    for (const aba of ['Hoje', 'Revisão', 'Simulado', 'Painel', 'Ajustes']) {
      await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: aba }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(aba);
      await page.waitForLoadState('networkidle');
      const largo = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        return [...document.querySelectorAll('main *')]
          .filter((n) => n.getBoundingClientRect().right > vw + 1)
          .map((n) => `${n.tagName}.${n.className}`);
      });
      expect(largo, `elementos passando da tela em ${aba}`).toEqual([]);
      await expect(page.locator('main')).not.toContainText(/\bnull\b/);
    }
  });
}
