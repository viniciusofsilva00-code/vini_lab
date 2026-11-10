import { carregarBanco } from '../lib/questoes.js';
import { carregar } from '../lib/armazenamento.js';
import { hoje as hojeStr, formatarData } from '../lib/datas.js';
import {
  percentualPorSemana, inicioVsAgora, sequencia, totalDominadas, fraseMelhora, MIN_RESPOSTAS,
} from '../lib/estatisticas.js';
import { notaSobre60 } from '../lib/simulado.js';
import { el, svg } from './componentes/dom.js';

const titulo = () => el('h1', { class: 'vl-h1 tela__titulo' }, 'Painel');
const curta = (data) => formatarData(data).slice(0, 5);

function graficoSemanal(semanas) {
  const L = 400, A = 200, mE = 36, mD = 12, mT = 14, mB = 34;
  const x = (i) => mE + ((L - mE - mD) * i) / (semanas.length - 1);
  const y = (p) => mT + ((A - mT - mB) * (100 - p)) / 100;
  const pontos = semanas.map((s, i) => (s.percentual === null ? null : { s, i, px: x(i), py: y(s.percentual) }));
  const linhas = [];
  for (let i = 1; i < pontos.length; i++) {
    if (pontos[i] && pontos[i - 1]) {
      linhas.push(svg('line', { class: 'grafico__linha', x1: pontos[i - 1].px, y1: pontos[i - 1].py, x2: pontos[i].px, y2: pontos[i].py }));
    }
  }
  const resumoTxt = semanas.filter((s) => s.total).map((s) => `semana de ${curta(s.inicio)}: ${s.percentual}%`).join('; ');
  return svg('svg', { class: 'grafico', viewBox: `0 0 ${L} ${A}`, role: 'img', 'aria-labelledby': 'graf-t graf-d' },
    svg('title', { id: 'graf-t' }, 'Porcentagem de acerto por semana'),
    svg('desc', { id: 'graf-d' }, resumoTxt || 'Sem respostas nas últimas 8 semanas.'),
    [0, 50, 100].map((v) => svg('g', {},
      svg('line', { class: 'grafico__grade', x1: mE, y1: y(v), x2: L - mD, y2: y(v) }),
      svg('text', { class: 'grafico__rotulo', x: mE - 6, y: y(v) + 4, 'text-anchor': 'end' }, `${v}%`))),
    linhas,
    pontos.filter(Boolean).map((p) => svg('g', {},
      svg('circle', { class: 'grafico__ponto', cx: p.px, cy: p.py, r: 5 }),
      svg('text', { class: 'grafico__valor', x: p.px, y: p.py - 9, 'text-anchor': 'middle' }, `${p.s.percentual}%`))),
    semanas.map((s, i) => (i % 2 === (semanas.length - 1) % 2
      ? svg('text', { class: 'grafico__rotulo', x: x(i), y: A - 12, 'text-anchor': 'middle' }, curta(s.inicio)) : null)));
}

function tabelaSemanal(semanas) {
  return el('details', { class: 'tabela-alt' },
    el('summary', {}, 'Ver os valores em tabela'),
    el('table', { class: 'tabela' },
      el('caption', { class: 'sr-only' }, 'Acerto por semana'),
      el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Semana de'), el('th', { scope: 'col' }, 'Respostas'), el('th', { scope: 'col' }, 'Acerto'))),
      el('tbody', {}, semanas.map((s) => el('tr', {},
        el('th', { scope: 'row' }, formatarData(s.inicio)), el('td', {}, String(s.total)),
        el('td', {}, s.percentual === null ? 'sem respostas' : `${s.percentual}%`))))));
}

function barra(rotulo, valor, tipo) {
  return el('div', { class: `barra barra--${tipo}` },
    el('span', { class: 'barra__rotulo' }, rotulo),
    el('span', { class: 'barra__trilho', 'aria-hidden': 'true' }, el('span', { class: 'barra__preench', style: `width:${valor}%` })),
    el('span', { class: 'barra__valor' }, `${valor}%`));
}

function porMateria(comparativo, nomes) {
  const itens = Object.entries(comparativo);
  if (!itens.length) return el('p', { class: 'tela__texto' }, `Quando você tiver ${MIN_RESPOSTAS} respostas em uma matéria, a comparação aparece aqui.`);
  return el('ul', { class: 'materias' }, itens.map(([m, x]) => el('li', { class: 'materia' },
    el('h3', {}, nomes[m] ?? m, el('span', { class: 'materia__delta' }, ` ${x.melhora >= 0 ? '+' : ''}${x.melhora} p.p.`)),
    barra('Início', x.inicio, 'inicio'), barra('Agora', x.agora, 'agora'),
    el('p', { class: 'materia__nota' }, `${x.total} respostas`))));
}

export async function render(raiz, ativo = () => true) {
  raiz.replaceChildren(titulo(), el('p', { class: 'tela__texto', role: 'status' }, 'Carregando o painel…'));
  let banco;
  try {
    banco = await carregarBanco();
  } catch {
    if (!ativo()) return;
    raiz.replaceChildren(titulo(), el('p', { class: 'aviso', role: 'alert' },
      'Não consegui carregar as questões. Confira a conexão e recarregue a página.'));
    return;
  }
  if (!ativo()) return;
  const estado = carregar();
  const materiaDe = new Map(banco.questoes.map((q) => [q.id, q.materia]));
  const nomes = Object.fromEntries(banco.edital.materias.map((m) => [m.id, m.nome]));
  const data = hojeStr();
  const comparativo = inicioVsAgora(estado.respostas, (id) => materiaDe.get(id));
  const seq = sequencia(estado.missoes, data);
  const semanas = percentualPorSemana(estado.respostas, data);
  const simulados = [...estado.simulados].reverse();
  const numero = (rotulo, valor, id) => el('li', {}, el('strong', { 'data-numero': id }, String(valor)), ` ${rotulo}`);

  raiz.replaceChildren(titulo(),
    el('p', { class: 'aviso', 'data-frase': 'melhora', role: 'status' }, fraseMelhora(comparativo, nomes)),
    el('ul', { class: 'contadores contadores--4' },
      numero(seq.atual === 1 ? 'dia seguido' : 'dias seguidos', seq.atual, 'sequencia'),
      numero(seq.recorde === 1 ? 'dia de recorde' : 'dias de recorde', seq.recorde, 'recorde'),
      numero('respondidas', estado.respostas.length, 'respondidas'),
      numero(totalDominadas(estado.cartoes) === 1 ? 'dominada' : 'dominadas', totalDominadas(estado.cartoes), 'dominadas')),
    el('section', { class: 'bloco', 'aria-labelledby': 'h-semanas' },
      el('h2', { id: 'h-semanas' }, 'Acerto por semana'),
      el('p', { class: 'tela__texto' }, 'Últimas 8 semanas (cada semana começa na segunda-feira).'),
      graficoSemanal(semanas), tabelaSemanal(semanas)),
    el('section', { class: 'bloco', 'aria-labelledby': 'h-materias' },
      el('h2', { id: 'h-materias' }, 'Por matéria: início × agora'),
      el('p', { class: 'tela__texto' }, 'Compara suas primeiras 20% respostas com as últimas 20%.'),
      porMateria(comparativo, nomes)),
    el('section', { class: 'bloco', 'aria-labelledby': 'h-simulados' },
      el('h2', { id: 'h-simulados' }, 'Simulados'),
      simulados.length
        ? el('ul', { class: 'lista-simulados' }, simulados.map((s) => el('li', {},
          `${formatarData(s.data)}: nota ${notaSobre60(s)}/60 (${s.acertos} de ${s.total} questões)`)))
        : el('p', { class: 'tela__texto' }, 'Você ainda não fez nenhum simulado.')));
}
