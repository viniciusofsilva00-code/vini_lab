// Simulado cronometrado. Funções puras (rng e relógio injetáveis).
import { aplicarResposta } from './revisao.js';

export const LIMITES = { questoes: [10, 60], minutos: [10, 300] };
export const NOTA_MINIMA = 0.5; // 30 de 60, proporcional

function inteiro(valor) {
  return typeof valor === 'string' && valor.trim() === '' ? NaN : Number(valor);
}

export function validarConfig(questoes, minutos) {
  const q = inteiro(questoes);
  const m = inteiro(minutos);
  const [qa, qb] = LIMITES.questoes;
  const [ma, mb] = LIMITES.minutos;
  if (!Number.isInteger(q) || q < qa || q > qb) return { ok: false, erro: `Informe um número inteiro de ${qa} a ${qb} questões.` };
  if (!Number.isInteger(m) || m < ma || m > mb) return { ok: false, erro: `Informe um número inteiro de ${ma} a ${mb} minutos.` };
  return { ok: true, config: { questoes: q, minutos: m } };
}

function embaralhar(lista, rng) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Cota por matéria: proporcional a questoesNaProva (maior resto), limitada ao que existe no banco.
function cotas(grupos, edital, n) {
  const pesos = edital.materias.filter((m) => grupos.get(m.id)?.length).map((m) => ({ id: m.id, peso: m.questoesNaProva, max: grupos.get(m.id).length }));
  const cota = Object.fromEntries(pesos.map((p) => [p.id, 0]));
  let restante = Math.min(n, pesos.reduce((s, p) => s + p.max, 0));
  let ativos = pesos;
  while (restante > 0 && ativos.length) {
    const soma = ativos.reduce((s, p) => s + p.peso, 0);
    const alvo = ativos.map((p) => ({ p, exato: (restante * p.peso) / soma }));
    let dado = 0;
    for (const { p, exato } of alvo) {
      const d = Math.min(Math.floor(exato), p.max - cota[p.id]);
      cota[p.id] += d; dado += d;
    }
    let sobra = restante - dado;
    const porResto = [...alvo].sort((a, b) => (b.exato - Math.floor(b.exato)) - (a.exato - Math.floor(a.exato)));
    for (const { p } of porResto) {
      if (sobra <= 0) break;
      if (cota[p.id] < p.max) { cota[p.id]++; sobra--; dado++; }
    }
    restante -= dado;
    ativos = ativos.filter((p) => cota[p.id] < p.max);
    if (!dado) break;
  }
  return cota;
}

export function montarSimulado({ questoes, edital, n, rng = Math.random }) {
  const grupos = new Map();
  for (const q of questoes) {
    if (!grupos.has(q.materia)) grupos.set(q.materia, []);
    grupos.get(q.materia).push(q.id);
  }
  const cota = cotas(grupos, edital, n);
  return edital.materias.flatMap((m) => embaralhar(grupos.get(m.id) ?? [], rng).slice(0, cota[m.id] ?? 0));
}

export function restanteSegundos(andamento, agora) {
  return Math.max(0, andamento.minutos * 60 - Math.floor((agora - andamento.inicio) / 1000));
}

// Soma ao tempo da questão atual o que passou desde a última marca.
export function acumularTempo(andamento, agora) {
  const id = andamento.ids[andamento.atual];
  const dt = Math.max(0, Math.round((agora - andamento.marca) / 1000));
  return { ...andamento, marca: agora, tempos: { ...andamento.tempos, [id]: (andamento.tempos[id] ?? 0) + dt } };
}

export function notaSobre60(s) {
  return s.total ? Math.round((s.acertos / s.total) * 60) : 0;
}

// Corrige, grava respostas/cartões e o registro do simulado; encerra o simulado em andamento.
export function finalizar({ estado, andamento, porId, agora, data }) {
  const fim = acumularTempo(andamento, Math.min(agora, andamento.inicio + andamento.minutos * 60_000));
  const porMateria = {};
  let acertos = 0;
  for (const id of fim.ids) {
    const q = porId.get(id);
    const escolhida = fim.respostas[id];
    const x = (porMateria[q.materia] ??= { acertos: 0, total: 0 });
    x.total++;
    if (escolhida === q.correta) { x.acertos++; acertos++; }
    if (escolhida !== undefined) {
      aplicarResposta(estado, {
        questao: id, escolhida, acertou: escolhida === q.correta,
        tempo: Math.max(1, fim.tempos[id] ?? 0), contexto: 'simulado', data,
      });
    }
  }
  const segundos = Math.min(Math.floor((agora - fim.inicio) / 1000), fim.minutos * 60);
  const registro = {
    data, minutos: fim.minutos, segundos, total: fim.ids.length, acertos, porMateria,
    tempoMedio: Math.round(segundos / fim.ids.length), ids: fim.ids, respostas: fim.respostas,
  };
  estado.simulados.push(registro);
  estado.simuladoAtual = null;
  return registro;
}
