import { test, expect } from '@playwright/test';
import { semViolacoes } from './ajuda.js';

test('simulado de 10 questões: tempo esgotado entrega sozinho e o resultado vai ao painel', async ({ page }) => {
  await page.clock.install();
  await page.goto('./#simulado');
  await expect(page.getByLabel('Número de questões')).toHaveValue('60');
  await expect(page.getByLabel('Tempo em minutos')).toHaveValue('180');
  await semViolacoes(page);

  await page.getByLabel('Número de questões').fill('9');
  await page.getByRole('button', { name: 'Iniciar simulado' }).click();
  await expect(page.getByRole('alert')).toContainText('10 a 60 questões');
  await page.getByLabel('Número de questões').fill('10');
  await page.getByLabel('Tempo em minutos').fill('10');
  await page.getByRole('button', { name: 'Iniciar simulado' }).click();

  await expect(page.locator('#cronometro')).toContainText('Tempo restante: ');
  await expect(page.locator('.numero')).toHaveCount(10);
  await page.locator('.alt--radio').nth(1).click();
  await page.locator('[data-acao="proxima"]').click();
  await expect(page.getByText('Questão 2 de 10')).toBeVisible();
  await expect(page.locator('.alt--certa, .alt--errada, .veredito')).toHaveCount(0); // sem correção na prova
  await page.locator('.alt--radio').nth(2).click();
  await expect(page.getByRole('button', { name: 'Questão 2, respondida' })).toBeVisible();
  await semViolacoes(page);

  // sobrevive a recarregar
  await page.reload();
  await expect(page.getByText('Questão 2 de 10')).toBeVisible();
  await expect(page.locator('.alt--radio input').nth(2)).toBeChecked();

  await page.clock.fastForward('10:30');
  await expect(page.getByText('Tempo esgotado: o simulado foi entregue automaticamente.')).toBeVisible();
  await expect(page.locator('[data-resultado="nota"]')).toContainText('/10');
  await expect(page.getByText('Tempo médio por questão')).toBeVisible();
  await page.getByText(/^Questão 1 ·/).click();
  await expect(page.locator('details[open] .explicacao').first()).toBeVisible();
  await semViolacoes(page);

  await page.goto('./#painel');
  await expect(page.getByText(/nota \d+\/60 \(\d+ de 10 questões\)/)).toBeVisible();
  await expect(page.locator('[data-numero="respondidas"]')).toHaveText('2');
  await semViolacoes(page);
});

test('entregar manualmente pede confirmação', async ({ page }) => {
  await page.goto('./#simulado');
  await page.getByLabel('Número de questões').fill('10');
  await page.getByRole('button', { name: 'Iniciar simulado' }).click();
  await page.getByRole('button', { name: 'Entregar simulado' }).click();
  await expect(page.getByText('Você respondeu 0 de 10 questões (10 em branco).')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar a prova' }).click();
  await expect(page.getByText('Entregar o simulado?')).toHaveCount(0);
  await page.getByRole('button', { name: 'Entregar simulado' }).click();
  await page.locator('[data-acao="confirmar-entrega"]').click();
  await expect(page.locator('[data-resultado="nota"]')).toContainText('0/10');
  await expect(page.getByText('Abaixo da nota mínima de 30/60')).toBeVisible();
});
