import { test, expect } from '@playwright/test';
import { semViolacoes, bancoReal, dataSP, injetarEstado, estadoComRespostas } from './ajuda.js';

for (const esquema of ['light', 'dark']) test(`painel mostra a melhora, gráfico, tabela e sequência (${esquema})`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: esquema });
  await page.goto('./#hoje');
  const mat = (await bancoReal(page)).filter((q) => q.materia === 'matematica').slice(0, 10);
  const respostas = mat.map((q, i) => ({
    questao: q.id, data: dataSP(-(10 - i)), escolhida: 0, acertou: i >= 2, tempo: 20, contexto: 'missao',
  }));
  const missoes = Object.fromEntries([-2, -1, 0].map((d) => [dataSP(d), { data: dataSP(d), ids: [], concluida: true }]));
  await injetarEstado(page, estadoComRespostas(respostas, { missoes, simulados: [
    { data: dataSP(-1), minutos: 180, segundos: 5000, total: 60, acertos: 42, porMateria: {}, tempoMedio: 83, ids: [], respostas: {} },
  ] }));

  await page.goto('./#painel');
  await page.reload();
  await expect(page.locator('[data-frase="melhora"]')).toHaveText('Você melhorou 100 pontos percentuais em Matemática desde o início.');
  await expect(page.locator('[data-numero="sequencia"]')).toHaveText('3');
  await expect(page.locator('[data-numero="respondidas"]')).toHaveText('10');
  const grafico = page.getByRole('img', { name: 'Porcentagem de acerto por semana' });
  await expect(grafico).toBeVisible();
  await expect(page.locator('.barra--inicio .barra__valor')).toHaveText('0%');
  await expect(page.locator('.barra--agora .barra__valor')).toHaveText('100%');
  await expect(page.getByText('nota 42/60 (42 de 60 questões)')).toBeVisible();
  await page.getByText('Ver os valores em tabela').click();
  await expect(page.getByRole('table')).toBeVisible();
  await semViolacoes(page);
});

test('painel sem dados mostra mensagem de incentivo', async ({ page }) => {
  await page.goto('./#painel');
  await expect(page.locator('[data-frase="melhora"]')).toContainText('Responda pelo menos 10 questões');
  await semViolacoes(page);
});
