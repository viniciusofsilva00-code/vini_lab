import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { semViolacoes, bancoReal, dataSP, injetarEstado, lerEstado, estadoComRespostas } from './ajuda.js';

test('exporta, apaga, importa com confirmação e o progresso volta igual', async ({ page }, info) => {
  await page.goto('./#hoje');
  const qs = (await bancoReal(page)).slice(0, 6);
  const respostas = qs.map((q, i) => ({ questao: q.id, data: dataSP(-i), escolhida: 1, acertou: i % 2 === 0, tempo: 9, contexto: 'missao' }));
  const cartoes = { [qs[1].id]: { caixa: 1, proxima: dataSP(1), ultimaErrou: true, jaErrou: true, dominada: false } };
  await injetarEstado(page, estadoComRespostas(respostas, { cartoes }));
  await page.goto('./#ajustes');
  await page.reload();
  await expect(page.getByText('Você ainda não fez backup.')).toBeVisible();
  await semViolacoes(page);

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar backup' }).click()]);
  expect(download.suggestedFilename()).toBe(`missao-diaria-backup-${dataSP()}.json`);
  const arquivo = info.outputPath('backup.json');
  await download.saveAs(arquivo);
  const conteudo = JSON.parse(readFileSync(arquivo, 'utf8'));
  expect(conteudo).toMatchObject({ app: 'missao_diaria', versao: 1 });
  expect(conteudo.estado.respostas).toHaveLength(6);
  const original = await lerEstado(page);
  expect(original.ultimoBackup).toBe(dataSP());

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#arquivo-backup').setInputFiles(arquivo);
  await expect(page.getByText('Substituir seu progresso atual por este backup?')).toBeVisible();
  await expect(page.getByText(/O backup tem 6 respostas/)).toBeVisible();
  await semViolacoes(page);
  await page.getByRole('button', { name: 'Substituir progresso' }).click();
  await expect(page.getByText('Progresso restaurado: 6 respostas.')).toBeVisible();
  expect(await lerEstado(page)).toEqual(original);
});

test('arquivo inválido mostra erro claro e não altera nada', async ({ page }, info) => {
  await page.goto('./#ajustes');
  const { writeFileSync } = await import('node:fs');
  const ruim = info.outputPath('ruim.json');
  writeFileSync(ruim, JSON.stringify({ app: 'outro' }));
  await page.locator('#arquivo-backup').setInputFiles(ruim);
  await expect(page.getByRole('alert').filter({ hasText: 'não é um backup do Missão Diária' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Substituir progresso' })).toHaveCount(0);
  await semViolacoes(page);
});

test('aviso de backup na tela Hoje aparece com 20+ respostas e pode ser dispensado', async ({ page }) => {
  await page.goto('./#hoje');
  const qs = (await bancoReal(page)).slice(0, 20);
  await injetarEstado(page, estadoComRespostas(qs.map((q) => ({ questao: q.id, data: dataSP(-1), escolhida: 0, acertou: true, tempo: 5, contexto: 'revisao' }))));
  await page.reload();
  await expect(page.getByText('Você ainda não fez backup do seu progresso.')).toBeVisible();
  await semViolacoes(page);
  await page.getByRole('button', { name: 'Dispensar' }).click();
  await expect(page.getByText('Você ainda não fez backup do seu progresso.')).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Você ainda não fez backup do seu progresso.')).toHaveCount(0);
});
