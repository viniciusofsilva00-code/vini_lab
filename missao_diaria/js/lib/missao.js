// Sorteio da missão diária. rng injetável (0 <= rng() < 1) para ser determinístico.
import { metaEfetiva } from './perfil.js';
import { vencidas } from './revisao.js';

export const FRACAO_REVISAO = 0.4;
const MIN_RESPOSTAS_TAXA = 5;

function taxaDeErro(estado, materiaDe) {
  const t = {};
  for (const r of estado.respostas) {
    const m = materiaDe.get(r.questao);
    if (!m) continue;
    const x = (t[m] ??= { total: 0, erros: 0 });
    x.total++;
    if (!r.acertou) x.erros++;
  }
  return (m) => (t[m] && t[m].total >= MIN_RESPOSTAS_TAXA ? t[m].erros / t[m].total : 0);
}

function sortearNovas(novas, n, edital, taxa, rng) {
  const grupos = new Map();
  for (const q of novas) {
    if (!grupos.has(q.materia)) grupos.set(q.materia, []);
    grupos.get(q.materia).push(q);
  }
  const peso = (m) => (edital.materias.find((x) => x.id === m)?.questoesNaProva ?? 1) * (1 + taxa(m));
  const escolhidas = [];
  while (escolhidas.length < n && grupos.size) {
    const ms = [...grupos.keys()];
    const total = ms.reduce((s, m) => s + peso(m), 0);
    let x = rng() * total;
    let m = ms[ms.length - 1];
    for (const c of ms) { x -= peso(c); if (x < 0) { m = c; break; } }
    const lista = grupos.get(m);
    escolhidas.push(lista.splice(Math.floor(rng() * lista.length), 1)[0].id);
    if (!lista.length) grupos.delete(m);
  }
  return escolhidas;
}

export function gerarMissao({ questoes, edital, estado, data, rng = Math.random }) {
  if (estado.missoes[data]) return estado.missoes[data];
  const n = metaEfetiva(estado.perfil);
  const existentes = new Set(questoes.map((q) => q.id));
  const materiaDe = new Map(questoes.map((q) => [q.id, q.materia]));

  const venc = vencidas(estado.cartoes, data, { incluirAcertos: estado.perfil.incluirAcertosRevisao })
    .map((c) => c.id).filter((id) => existentes.has(id));
  const revisao = venc.slice(0, Math.floor(n * FRACAO_REVISAO));

  const vistas = new Set([...estado.respostas.map((r) => r.questao), ...Object.keys(estado.cartoes)]);
  const novas = questoes.filter((q) => !vistas.has(q.id));
  const sorteadas = sortearNovas(novas, n - revisao.length, edital, taxaDeErro(estado, materiaDe), rng);

  const ids = [...revisao, ...sorteadas];
  if (ids.length < n) ids.push(...venc.filter((id) => !ids.includes(id)).slice(0, n - ids.length));

  const missao = { data, ids, concluida: false };
  estado.missoes[data] = missao;
  return missao;
}

// Questões novas extras ("treino extra"), fora da missão do dia.
export function gerarExtras({ questoes, edital, estado, data, n, rng = Math.random }) {
  const fora = new Set([
    ...estado.respostas.map((r) => r.questao), ...Object.keys(estado.cartoes),
    ...(estado.missoes[data]?.ids ?? []), ...(estado.missoes[data]?.extras ?? []),
  ]);
  const materiaDe = new Map(questoes.map((q) => [q.id, q.materia]));
  return sortearNovas(questoes.filter((q) => !fora.has(q.id)), n, edital, taxaDeErro(estado, materiaDe), rng);
}
