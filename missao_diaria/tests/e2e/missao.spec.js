import { test, expect } from '@playwright/test';
import { semViolacoes, definirMeta } from './ajuda.js';

for (const esquema of ['light', 'dark']) test(`completa uma missão de 5 questões com explicação e resumo (${esquema})`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: esquema });
  await page.goto('./#ajustes');
  await semViolacoes(page);
  await definirMeta(page, 5);

  await page.goto('./#hoje');
  await expect(page.locator('.questao')).toBeVisible();
  await expect(page.getByText('Primeira missão')).toBeVisible();
  const total = Number((await page.locator('.progresso').innerText()).match(/0\/(\d+)/)[1]);
  expect(total).toBeGreaterThan(0);
  expect(total).toBeLessThanOrEqual(5);

  for (let i = 0; i < total; i++) {
    await expect(page.locator('.alt')).toHaveCount(5);
    await expect(page.locator('.alt__letra')).toHaveText(['A)', 'B)', 'C)', 'D)', 'E)']);
    await page.locator('.alt').first().click();
    await expect(page.locator('.feedback .veredito')).toBeVisible();
    await expect(page.getByText('Como resolver')).toBeVisible();
    await expect(page.getByText('Pegadinha:')).toBeVisible();
    await expect(page.getByText('Fonte:')).toBeVisible();
    await expect(page.locator('.alt--certa')).toHaveCount(1);
    if (i === 0) await semViolacoes(page);
    await page.locator('[data-acao="proxima"]').click();
  }

  await expect(page.getByText('Missão cumprida')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Resumo do dia' })).toBeVisible();
  await expect(page.getByText(/Nota: \d+%/)).toBeVisible();
  await expect(page.getByText(/voltam? para revisão amanhã/)).toBeVisible();
  await semViolacoes(page);

  // recarregar não pede mais questões: continua no resumo
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Resumo do dia' })).toBeVisible();
  await expect(page.locator('.questao')).toHaveCount(0);
});
