import { carregarBanco } from '../lib/questoes.js';
import { carregar } from '../lib/armazenamento.js';
import { hoje as hojeStr } from '../lib/datas.js';
import { aplicarResposta, vencidas, emRevisao } from '../lib/revisao.js';
import { resumo } from '../lib/notas.js';
import { el, trocar } from './componentes/dom.js';
import { salvarComAviso as salvar } from './componentes/salvar.js';
import { montarQuestao } from './componentes/questao.js';

const titulo = () => el('h1', { class: 'vl-h1 tela__titulo' }, 'Revisão');
const MODOS = [['vencidas', 'Revisar vencidas'], ['erradas', 'Só erradas'], ['acertadas', 'Só acertadas']];

export async function render(raiz, ativo = () => true) {
  trocar(raiz, titulo(), el('p', { class: 'tela__texto', role: 'status' }, 'Carregando…'));
  let banco;
  try {
    banco = await carregarBanco();
  } catch {
    if (!ativo()) return;
    trocar(raiz, titulo(), el('p', { class: 'aviso', role: 'alert' },
      'Não consegui carregar as questões. Confira a conexão e recarregue a página.'));
    return;
  }
  if (!ativo()) return;
  const { questoes, edital } = banco;
  const porId = new Map(questoes.map((q) => [q.id, q]));
  const nomeMateria = new Map(edital.materias.map((m) => [m.id, m.nome]));
  const estado = carregar();
  const data = hojeStr();
  let modo = 'vencidas';
  let materia = '';

  const cartoes = () => Object.entries(estado.cartoes).filter(([id]) => porId.has(id));
  const dasMaterias = (ids) => ids.filter((id) => !materia || porId.get(id).materia === materia);
  function selecionar() {
    let ids;
    if (modo === 'vencidas') ids = vencidas(estado.cartoes, data, { incluirAcertos: estado.perfil.incluirAcertosRevisao }).map((c) => c.id);
    else {
      const quer = modo === 'erradas';
      ids = cartoes().filter(([, c]) => emRevisao(c) === quer)
        .sort((a, b) => a[1].proxima.localeCompare(b[1].proxima) || a[0].localeCompare(b[0])).map(([id]) => id);
    }
    return dasMaterias(ids.filter((id) => porId.has(id)));
  }

  function inicio() {
    const venc = vencidas(estado.cartoes, data, { incluirAcertos: estado.perfil.incluirAcertosRevisao }).filter((c) => porId.has(c.id)).length;
    const erradas = cartoes().filter(([, c]) => emRevisao(c)).length;
    const acertadas = cartoes().length - erradas;
    const ids = selecionar();
    const botoesModo = MODOS.map(([id, rotulo]) => el('button', {
      type: 'button', class: 'btn btn--chip', 'aria-pressed': String(modo === id), 'data-modo': id,
      onclick: () => { modo = id; inicio(); raiz.querySelector(`[data-modo="${id}"]`).focus(); },
    }, rotulo));
    const seletor = el('select', {
      id: 'filtro-materia', class: 'campo',
      onchange: (e) => { materia = e.target.value; inicio(); raiz.querySelector('#filtro-materia').focus(); },
    }, el('option', { value: '' }, 'Todas as matérias'),
    edital.materias.map((m) => el('option', { value: m.id, selected: m.id === materia }, m.nome)));
    trocar(raiz, titulo(),
      el('ul', { class: 'contadores' },
        el('li', {}, el('strong', { 'data-contador': 'vencidas' }, String(venc)), ' vencidas hoje'),
        el('li', {}, el('strong', { 'data-contador': 'erradas' }, String(erradas)), ' erradas'),
        el('li', {}, el('strong', { 'data-contador': 'acertadas' }, String(acertadas)), ' acertadas')),
      el('div', { role: 'group', 'aria-label': 'Modo de revisão', class: 'modos' }, botoesModo),
      el('label', { for: 'filtro-materia', class: 'rotulo' }, 'Matéria'), seletor,
      el('p', { class: 'tela__texto', role: 'status' }, ids.length ? ids.length === 1 ? '1 questão para revisar.' : `${ids.length} questões para revisar.` : 'Nada para revisar neste filtro.'),
      el('button', { type: 'button', class: 'btn btn--primario', 'data-acao': 'comecar', 'aria-disabled': ids.length ? false : 'true',
        onclick: () => ids.length && sessao(ids) }, 'Começar'));
  }

  function sessao(ids) {
    const feitas = [];
    const passo = (i) => {
      if (i >= ids.length) return fim(feitas);
      const q = porId.get(ids[i]);
      const palco = el('div');
      trocar(raiz, titulo(),
        el('p', { class: 'progresso' }, `Revisão: ${i + 1}/${ids.length}`,
          el('progress', { max: String(ids.length), value: String(i), 'aria-label': `Revisão: ${i} de ${ids.length} respondidas` })),
        palco,
        el('button', { type: 'button', class: 'btn', onclick: inicio }, 'Encerrar revisão'));
      montarQuestao(palco, q, {
        materiaNome: nomeMateria.get(q.materia),
        rotuloProxima: i + 1 === ids.length ? 'Ver resumo' : 'Próxima',
        aoResponder: ({ escolhida, acertou, tempo }) => {
          aplicarResposta(estado, { questao: q.id, escolhida, acertou, tempo, contexto: 'revisao', data: hojeStr() });
          feitas.push(estado.respostas.at(-1));
          salvar(estado);
        },
        aoProxima: () => passo(i + 1),
      });
    };
    passo(0);
  }

  function fim(feitas) {
    const r = resumo(feitas, (id) => porId.get(id)?.materia);
    trocar(raiz, titulo(), el('section', { class: 'resumo' },
      el('h2', {}, 'Revisão concluída'),
      el('p', { class: 'resumo__nota' }, `Nota: ${r.percentual}% (${r.acertos} de ${r.total})`),
      el('ul', {}, Object.entries(r.porMateria).map(([m, x]) =>
        el('li', {}, `${nomeMateria.get(m)}: ${x.acertos} de ${x.total} (${x.percentual}%)`)))),
    el('button', { type: 'button', class: 'btn btn--primario', onclick: inicio }, 'Voltar à revisão'));
  }

  inicio();
}
