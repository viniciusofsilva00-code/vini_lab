import { carregarBanco } from '../lib/questoes.js';
import { carregar, salvar } from '../lib/armazenamento.js';
import { hoje as hojeStr, somarDias } from '../lib/datas.js';
import { gerarMissao, gerarExtras } from '../lib/missao.js';
import { aplicarResposta, vencidas } from '../lib/revisao.js';
import { resumo } from '../lib/notas.js';
import { el } from './componentes/dom.js';
import { montarQuestao } from './componentes/questao.js';

const EXTRA = 5;
const titulo = () => el('h1', { class: 'vl-h1 tela__titulo' }, 'Hoje');

export async function render(raiz) {
  raiz.replaceChildren(titulo(), el('p', { class: 'tela__texto', role: 'status' }, 'Carregando a missão…'));
  let banco;
  try {
    banco = await carregarBanco();
  } catch {
    raiz.replaceChildren(titulo(), el('p', { class: 'aviso', role: 'alert' },
      'Não consegui carregar as questões. Confira a conexão e recarregue a página.'));
    return;
  }
  const { questoes, edital } = banco;
  if (!questoes.length) {
    raiz.replaceChildren(titulo(), el('p', { class: 'tela__texto' }, 'O banco de questões ainda está vazio.'));
    return;
  }
  const porId = new Map(questoes.map((q) => [q.id, q]));
  const nomeMateria = new Map(edital.materias.map((m) => [m.id, m.nome]));
  const estado = carregar();
  const data = hojeStr();
  const missao = gerarMissao({ questoes, edital, estado, data });
  salvar(estado);

  const feitasHoje = () => new Set(estado.respostas.filter((r) => r.data === data && r.contexto === 'missao').map((r) => r.questao));
  const proximaDe = (ids) => ids.find((id) => !feitasHoje().has(id));

  function cabecalho(feitas, total, rotulo = 'Missão do dia') {
    return [
      titulo(),
      el('p', { class: 'progresso' }, `${rotulo}: ${feitas}/${total}`,
        el('progress', { max: String(total), value: String(feitas), 'aria-label': `${rotulo}: ${feitas} de ${total}` })),
    ];
  }

  function mostrarQuestao(ids, rotulo) {
    const id = proximaDe(ids);
    if (!id) return rotulo === 'Treino extra' ? fimExtra() : fimMissao();
    const q = porId.get(id);
    const feitas = ids.filter((x) => feitasHoje().has(x)).length;
    const palco = el('div');
    raiz.replaceChildren(...cabecalho(feitas, ids.length, rotulo), palco);
    if (feitas === 0 && !estado.respostas.length) {
      palco.before(el('p', { class: 'aviso' }, 'Primeira missão! A meta padrão é de 10 questões por dia. ',
        el('a', { href: '#ajustes' }, 'Definir minha meta')));
    }
    montarQuestao(palco, q, {
      materiaNome: nomeMateria.get(q.materia),
      rotuloProxima: feitas + 1 === ids.length ? 'Ver resumo' : 'Próxima',
      aoResponder: ({ escolhida, acertou, tempo }) => {
        aplicarResposta(estado, { questao: q.id, escolhida, acertou, tempo, contexto: 'missao', data });
        if (!proximaDe(missao.ids)) missao.concluida = true;
        salvar(estado);
      },
      aoProxima: () => mostrarQuestao(ids, rotulo),
    });
  }

  function resumoDia(rotulo, ids) {
    const respostas = estado.respostas.filter((r) => r.data === data && r.contexto === 'missao' && ids.includes(r.questao));
    const r = resumo(respostas, (id) => porId.get(id)?.materia);
    const amanha = vencidas(estado.cartoes, somarDias(data, 1), { incluirAcertos: estado.perfil.incluirAcertosRevisao }).length;
    return el('section', { class: 'resumo' },
      el('h2', {}, rotulo),
      el('p', { class: 'resumo__nota' }, `Nota: ${r.percentual}% (${r.acertos} de ${r.total})`),
      el('ul', {}, Object.entries(r.porMateria).map(([m, x]) =>
        el('li', {}, `${nomeMateria.get(m)}: ${x.acertos} de ${x.total} (${x.percentual}%)`))),
      el('p', {}, `${amanha} ${amanha === 1 ? 'questão volta' : 'questões voltam'} para revisão amanhã.`),
      el('p', { class: 'tela__texto' }, r.percentual >= 70
        ? 'Muito bem! Constância é o que aprova: volte amanhã.'
        : 'Cada erro de hoje vira acerto amanhã. Siga firme na missão!'));
  }

  function fimMissao() {
    const novas = gerarExtras({ questoes, edital, estado, data, n: 1 });
    raiz.replaceChildren(titulo(), el('p', { class: 'veredito veredito--certa', role: 'status' }, '✔ Missão cumprida!'),
      resumoDia('Resumo do dia', missao.ids),
      novas.length ? el('button', { type: 'button', class: 'btn', 'data-acao': 'extra', onclick: iniciarExtra }, `Treino extra (${EXTRA} questões)`) : null);
  }

  function iniciarExtra() {
    if (!missao.extras?.length || !proximaDe(missao.extras)) {
      missao.extras = [...(missao.extras ?? []), ...gerarExtras({ questoes, edital, estado, data, n: EXTRA })];
      salvar(estado);
    }
    mostrarQuestao(missao.extras.slice(-EXTRA), 'Treino extra');
  }

  function fimExtra() {
    const ids = missao.extras.slice(-EXTRA);
    raiz.replaceChildren(titulo(), resumoDia('Resumo do treino extra', ids),
      el('button', { type: 'button', class: 'btn', onclick: fimMissao }, 'Voltar'));
  }

  if (!proximaDe(missao.ids)) {
    missao.concluida = true;
    if (missao.extras?.length && proximaDe(missao.extras.slice(-EXTRA))) iniciarExtra();
    else fimMissao();
  } else mostrarQuestao(missao.ids, 'Missão do dia');
}
