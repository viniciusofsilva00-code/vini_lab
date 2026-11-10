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

const CHAVE = 'missao_diaria:v1';

export async function bancoReal(page) {
  const base = new URL('./', page.url()).href;
  const indice = await (await page.request.get(`${base}dados/questoes/indice.json`)).json();
  const lotes = await Promise.all(indice.arquivos.map(async (a) => (await page.request.get(`${base}dados/questoes/${a}`)).json()));
  return lotes.flat();
}

export const dataSP = (deslocamentoDias = 0) =>
  new Date(Date.now() + deslocamentoDias * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

// Grava o estado completo no localStorage (a página precisa já ter sido aberta uma vez).
export async function injetarEstado(page, estado) {
  await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CHAVE, estado]);
}

export const lerEstado = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), CHAVE);

export function estadoComRespostas(respostas, extra = {}) {
  return {
    versao: 1, perfil: { meta: { tipo: 'questoes', valor: 10 }, modoLeve: false, incluirAcertosRevisao: false, inicio: dataSP(-60) },
    respostas, cartoes: {}, missoes: {}, simulados: [], ultimoBackup: null, ...extra,
  };
}
