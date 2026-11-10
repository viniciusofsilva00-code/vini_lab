import { test, expect } from '@playwright/test';
import { semViolacoes, definirMeta, corretaDe } from './ajuda.js';

test('errar de propósito leva a questão para "Só erradas"', async ({ page }) => {
  await definirMeta(page, 5);
  await page.goto('./#hoje');
  const enunciado = await page.locator('.questao__enunciado').innerText();
  const correta = await corretaDe(page, enunciado);
  await page.locator('.alt').nth((correta + 1) % 5).click();
  await expect(page.locator('.veredito--errada')).toBeVisible();
  await expect(page.locator('.alt--errada')).toHaveCount(1);

  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Revisão' }).click();
  await expect(page.locator('[data-contador="erradas"]')).toHaveText('1');
  await semViolacoes(page);

  await page.getByRole('button', { name: 'Só erradas' }).click();
  await expect(page.getByRole('button', { name: 'Só erradas' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('1 questão para revisar.')).toBeVisible();
  await page.getByRole('button', { name: 'Começar' }).click();
  await expect(page.locator('.questao__enunciado')).toHaveText(enunciado);

  await page.locator('.alt').nth(correta).click();
  await expect(page.locator('.veredito--certa')).toBeVisible();
  await semViolacoes(page);
  await page.locator('[data-acao="proxima"]').click();
  await expect(page.getByRole('heading', { name: 'Revisão concluída' })).toBeVisible();

  await page.getByRole('button', { name: 'Voltar à revisão' }).click();
  // questão já errada continua na revisão (caixa 2) até ser acertada na caixa 5
  await expect(page.locator('[data-contador="erradas"]')).toHaveText('1');
  await expect(page.locator('[data-contador="acertadas"]')).toHaveText('0');
});
