import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';

export async function semViolacoes(page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

export async function definirMeta(page, valor) {
  await page.goto('./#ajustes');
  await page.getByLabel('Quantidade').fill(String(valor));
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Ajustes salvos' })).toBeVisible();
}

// Lê o banco real pelo servidor e devolve o índice da alternativa correta do enunciado.
export async function corretaDe(page, enunciado) {
  const base = new URL('./', page.url()).href;
  const indice = await (await page.request.get(`${base}dados/questoes/indice.json`)).json();
  for (const arq of indice.arquivos) {
    const lote = await (await page.request.get(`${base}dados/questoes/${arq}`)).json();
    const q = lote.find((x) => x.enunciado === enunciado);
    if (q) return q.correta;
  }
  throw new Error('questão não encontrada no banco');
}
