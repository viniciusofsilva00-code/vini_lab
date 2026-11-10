// Estatísticas do painel. Funções puras; datas como 'AAAA-MM-DD'.
import { somarDias, diferencaDias } from './datas.js';

export const SEMANAS = 8;
export const MIN_RESPOSTAS = 10; // por matéria, para comparar início × agora
const FRACAO_JANELA = 0.2;
const SEGUNDA_REFERENCIA = '1970-01-05';

const pct = (a, t) => Math.round((a / t) * 100);

export function inicioDaSemana(data) {
  const dia = ((diferencaDias(SEGUNDA_REFERENCIA, data) % 7) + 7) % 7;
  return somarDias(data, -dia);
}

export function percentualPorSemana(respostas, hoje, n = SEMANAS) {
  const atual = inicioDaSemana(hoje);
  const semanas = Array.from({ length: n }, (_, i) => ({ inicio: somarDias(atual, -7 * (n - 1 - i)), total: 0, acertos: 0, percentual: null }));
  const indice = new Map(semanas.map((s) => [s.inicio, s]));
  for (const r of respostas) {
    const s = indice.get(inicioDaSemana(r.data));
    if (!s) continue;
    s.total++;
    if (r.acertou) s.acertos++;
  }
  for (const s of semanas) s.percentual = s.total ? pct(s.acertos, s.total) : null;
  return semanas;
}

// Por matéria: % nas primeiras 20% respostas × nas últimas 20% (as respostas já vêm em ordem cronológica).
export function inicioVsAgora(respostas, materiaDe) {
  const grupos = {};
  for (const r of respostas) {
    const m = materiaDe(r.questao);
    if (m) (grupos[m] ??= []).push(r);
  }
  const saida = {};
  for (const [m, lista] of Object.entries(grupos)) {
    if (lista.length < MIN_RESPOSTAS) continue;
    const k = Math.ceil(lista.length * FRACAO_JANELA);
    const taxa = (parte) => pct(parte.filter((x) => x.acertou).length, parte.length);
    const inicio = taxa(lista.slice(0, k));
    const agora = taxa(lista.slice(-k));
    saida[m] = { total: lista.length, inicio, agora, melhora: agora - inicio };
  }
  return saida;
}

// Dia conta se a missão foi concluída. A atual segue viva se hoje ainda não foi feito.
export function sequencia(missoes, hoje) {
  const feitos = Object.values(missoes).filter((x) => x.concluida).map((x) => x.data).sort();
  let recorde = 0;
  let corrente = 0;
  feitos.forEach((d, i) => {
    corrente = i > 0 && diferencaDias(feitos[i - 1], d) === 1 ? corrente + 1 : 1;
    recorde = Math.max(recorde, corrente);
  });
  const set = new Set(feitos);
  let dia = set.has(hoje) ? hoje : somarDias(hoje, -1);
  let atual = 0;
  while (set.has(dia)) { atual++; dia = somarDias(dia, -1); }
  return { atual, recorde };
}

export function totalDominadas(cartoes) {
  return Object.values(cartoes).filter((c) => c.dominada).length;
}

export function fraseMelhora(comparativo, nomes) {
  const itens = Object.entries(comparativo);
  if (!itens.length) return `Responda pelo menos ${MIN_RESPOSTAS} questões de uma matéria para ver sua evolução. Cada missão conta!`;
  const [materia, x] = itens.reduce((a, b) => (b[1].melhora > a[1].melhora ? b : a));
  if (x.melhora <= 0) return 'Continue firme: a evolução aparece com a constância. Foque nas questões que você erra.';
  return `Você melhorou ${x.melhora} ${x.melhora === 1 ? 'ponto percentual' : 'pontos percentuais'} em ${nomes[materia] ?? materia} desde o início.`;
}
