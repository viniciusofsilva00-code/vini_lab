import { carregarBanco } from '../lib/questoes.js';
import { carregar } from '../lib/armazenamento.js';
import { hoje as hojeStr, somarDias } from '../lib/datas.js';
import { gerarMissao, gerarExtras } from '../lib/missao.js';
import { aplicarResposta, vencidas } from '../lib/revisao.js';
import { resumo } from '../lib/notas.js';
import { avisoBackup, dispensarAviso } from '../lib/backup.js';
import { el, trocar } from './componentes/dom.js';
import { salvarComAviso as salvar } from './componentes/salvar.js';
import { montarQuestao } from './componentes/questao.js';

const EXTRA = 5;
const titulo = () => el('h1', { class: 'vl-h1 tela__titulo' }, 'Hoje');

export async function render(raiz, ativo = () => true) {
  trocar(raiz, titulo(), el('p', { class: 'tela__texto', role: 'status' }, 'Carregando a missão…'));
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
  if (!questoes.length) {
    trocar(raiz, titulo(), el('p', { class: 'tela__texto' }, 'O banco de questões ainda está vazio.'));
    return;
  }
  const porId = new Map(questoes.map((q) => [q.id, q]));
  const nomeMateria = new Map(edital.materias.map((m) => [m.id, m.nome]));
  const estado = carregar();
  const data = hojeStr();
  const missao = gerarMissao({ questoes, edital, estado, data });
  salvar(estado);

  const feitasHoje = () => new Set(estado.respostas.filter((r) => r.data >= data && r.contexto === 'missao').map((r) => r.questao));
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
    trocar(raiz, ...cabecalho(feitas, ids.length, rotulo), palco);
    if (feitas === 0 && !estado.respostas.length) {
      palco.before(el('p', { class: 'aviso' }, 'Primeira missão! A meta padrão é de 10 questões por dia. ',
        el('a', { href: '#ajustes' }, 'Definir minha meta')));
    }
    montarQuestao(palco, q, {
      materiaNome: nomeMateria.get(q.materia),
      rotuloProxima: feitas + 1 === ids.length ? 'Ver resumo' : 'Próxima',
      aoResponder: ({ escolhida, acertou, tempo }) => {
        aplicarResposta(estado, { questao: q.id, escolhida, acertou, tempo, contexto: 'missao', data: hojeStr() });
        if (!proximaDe(missao.ids)) missao.concluida = true;
        salvar(estado);
      },
      aoProxima: () => mostrarQuestao(ids, rotulo),
    });
  }

  function resumoDia(rotulo, ids) {
    const respostas = estado.respostas.filter((r) => r.data >= data && r.contexto === 'missao' && ids.includes(r.questao));
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
    trocar(raiz, titulo(), el('p', { class: 'veredito veredito--certa', role: 'status' }, '✔ Missão cumprida!'),
      resumoDia('Resumo do dia', missao.ids),
      novas.length ? el('button', { type: 'button', class: 'btn', 'data-acao': 'extra', onclick: iniciarExtra }, `Treino extra (${EXTRA} questões)`) : null);
  }

  function iniciarExtra() {
    if (!missao.extras?.length || !proximaDe(missao.loteExtra ?? missao.extras)) {
      const lote = gerarExtras({ questoes, edital, estado, data, n: EXTRA });
      missao.extras = [...(missao.extras ?? []), ...lote];
      missao.loteExtra = lote;
      salvar(estado);
    }
    mostrarQuestao(missao.loteExtra ?? missao.extras.slice(-EXTRA), 'Treino extra');
  }

  function fimExtra() {
    const ids = missao.loteExtra ?? missao.extras.slice(-EXTRA);
    trocar(raiz, titulo(), resumoDia('Resumo do treino extra', ids),
      el('button', { type: 'button', class: 'btn', onclick: fimMissao }, 'Voltar'));
  }

  function avisoDeBackup() {
    const tipo = avisoBackup(estado, data);
    if (!tipo) return null;
    const aviso = el('div', { class: 'aviso aviso--backup', role: 'region', 'aria-label': 'Aviso de backup' },
      el('p', {}, tipo === 'nunca'
        ? 'Você ainda não fez backup do seu progresso. '
        : 'Faz mais de 7 dias desde o seu último backup. ',
      el('a', { href: '#ajustes' }, 'Fazer backup agora')),
      el('button', { type: 'button', class: 'btn', 'data-acao': 'dispensar-backup', onclick: () => {
        dispensarAviso(estado, data);
        salvar(estado);
        aviso.remove();
      } }, 'Dispensar'));
    return aviso;
  }

  if (!proximaDe(missao.ids)) {
    missao.concluida = true;
    if (missao.extras?.length && proximaDe(missao.loteExtra ?? missao.extras.slice(-EXTRA))) iniciarExtra();
    else fimMissao();
  } else mostrarQuestao(missao.ids, 'Missão do dia');
  raiz.querySelector('h1')?.after(avisoDeBackup() ?? '');
}
