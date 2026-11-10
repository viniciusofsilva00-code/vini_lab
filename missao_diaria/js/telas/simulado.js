import { carregarBanco } from '../lib/questoes.js';
import { carregar } from '../lib/armazenamento.js';
import { hoje as hojeStr, formatarData } from '../lib/datas.js';
import {
  LIMITES, NOTA_MINIMA, validarConfig, montarSimulado, restanteSegundos, acumularTempo, finalizar, notaSobre60,
} from '../lib/simulado.js';
import { el, trocar } from './componentes/dom.js';
import { salvarComAviso as salvar } from './componentes/salvar.js';
import { explicacao, LETRAS } from './componentes/questao.js';

const titulo = () => el('h1', { class: 'vl-h1 tela__titulo' }, 'Simulado');

function formatarTempo(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  const p = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

const duracao = (seg) => (seg >= 60 ? `${Math.floor(seg / 60)} min ${seg % 60} s` : `${seg} s`);

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
  const padrao = edital.prova.simuladoPadrao;

  // ---------- configuração ----------
  function configuracao() {
    const erro = el('p', { class: 'erro', role: 'alert', id: 'erro-sim' });
    const qtd = el('input', { id: 'sim-questoes', class: 'campo', type: 'number', inputmode: 'numeric', value: String(Math.min(padrao.questoes, questoes.length)), 'aria-describedby': 'erro-sim dica-sim-q' });
    const min = el('input', { id: 'sim-minutos', class: 'campo', type: 'number', inputmode: 'numeric', value: String(padrao.minutos), 'aria-describedby': 'erro-sim dica-sim-m' });
    const ultimo = estado.simulados.at(-1);
    trocar(raiz, titulo(),
      el('p', { class: 'tela__texto' }, `O padrão é o da prova real: ${padrao.questoes} questões em ${padrao.minutos} minutos. A correção aparece só no fim, como na prova.`),
      el('form', { class: 'form', novalidate: true, onsubmit: (ev) => {
        ev.preventDefault();
        const v = validarConfig(qtd.value, min.value);
        if (!v.ok) { erro.textContent = v.erro; (v.erro.includes('questões') ? qtd : min).focus(); return; }
        iniciar(v.config);
      } },
      el('label', { for: 'sim-questoes', class: 'rotulo' }, 'Número de questões'), qtd,
      el('p', { class: 'tela__texto', id: 'dica-sim-q' }, `De ${LIMITES.questoes[0]} a ${LIMITES.questoes[1]} questões (o banco tem ${questoes.length}).`),
      el('label', { for: 'sim-minutos', class: 'rotulo' }, 'Tempo em minutos'), min,
      el('p', { class: 'tela__texto', id: 'dica-sim-m' }, `De ${LIMITES.minutos[0]} a ${LIMITES.minutos[1]} minutos.`),
      erro,
      el('button', { type: 'submit', class: 'btn btn--primario', 'data-acao': 'iniciar' }, 'Iniciar simulado')),
      ultimo ? el('button', { type: 'button', class: 'btn', 'data-acao': 'ultimo', onclick: () => resultado(ultimo) }, 'Ver resultado do último simulado') : null);
  }

  function iniciar(config) {
    const ids = montarSimulado({ questoes, edital, n: config.questoes });
    if (!ids.length) return;
    const agora = Date.now();
    estado.simuladoAtual = { inicio: agora, marca: agora, minutos: config.minutos, ids, atual: 0, respostas: {}, tempos: {} };
    salvar(estado);
    prova();
  }

  // ---------- prova ----------
  function prova() {
    let and = estado.simuladoAtual;
    const guardar = () => { estado.simuladoAtual = and; salvar(estado); };
    const cron = el('p', { class: 'cronometro', role: 'timer', id: 'cronometro' });
    const aviso = el('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite', id: 'aviso-tempo' });
    const palco = el('div');
    const navegacao = el('div');
    const confirmacao = el('div');
    let anunciado = -1;

    function entregar(esgotou) {
      clearInterval(timer);
      const registro = finalizar({ estado, andamento: and, porId, agora: Date.now(), data: hojeStr() });
      salvar(estado);
      resultado(registro, esgotou);
    }

    function tique() {
      if (!cron.isConnected) { clearInterval(timer); return; }
      const resta = restanteSegundos(and, Date.now());
      cron.textContent = `Tempo restante: ${formatarTempo(resta)}`;
      if (resta === 0) return entregar(true);
      const marco = resta === 60 || (resta > 60 && resta % 300 === 0);
      if (marco && anunciado !== resta) {
        anunciado = resta;
        aviso.textContent = resta === 60 ? 'Falta 1 minuto.' : `Faltam ${resta / 60} minutos.`;
      }
    }

    function desenharNav() {
      trocar(navegacao, el('ul', { class: 'numeros' }, and.ids.map((id, i) => el('li', {}, el('button', {
        type: 'button', class: `numero${and.respostas[id] !== undefined ? ' numero--feita' : ''}`,
        'aria-label': `Questão ${i + 1}, ${and.respostas[id] !== undefined ? 'respondida' : 'em branco'}`,
        'aria-current': i === and.atual ? 'true' : false,
        onclick: () => ir(i),
      }, String(i + 1))))));
    }

    function ir(i) {
      and = acumularTempo(and, Date.now());
      and.atual = i;
      guardar();
      desenharQuestao();
      palco.focus({ preventScroll: true });
      palco.scrollIntoView({ block: 'start' });
    }

    function desenharQuestao() {
      const q = porId.get(and.ids[and.atual]);
      const n = and.ids.length;
      const idEnun = `enun-${q.id}`;
      const marcada = and.respostas[q.id];
      trocar(palco, el('div', { class: 'questao' },
        el('p', { class: 'questao__meta' }, `Questão ${and.atual + 1} de ${n} · ${nomeMateria.get(q.materia)}`),
        q.texto && el('blockquote', { class: 'questao__texto' }, q.texto),
        el('p', { id: idEnun, class: 'questao__enunciado' }, q.enunciado),
        el('div', { class: 'alts', role: 'radiogroup', 'aria-labelledby': idEnun }, q.alternativas.map((alt, i) => el('label', { class: 'alt alt--radio' },
          el('input', { type: 'radio', name: 'alt-sim', value: String(i), checked: marcada === i, onchange: () => {
            and = { ...and, respostas: { ...and.respostas, [q.id]: i } };
            guardar();
            desenharNav();
          } }),
          el('span', { class: 'alt__letra', 'aria-hidden': 'true' }, `${LETRAS[i]})`),
          el('span', { class: 'sr-only' }, `Alternativa ${LETRAS[i]}: `), el('span', {}, alt))))),
      el('div', { class: 'acoes' },
        el('button', { type: 'button', class: 'btn', 'data-acao': 'anterior', 'aria-disabled': and.atual === 0 ? 'true' : false,
          onclick: () => and.atual > 0 && ir(and.atual - 1) }, 'Anterior'),
        el('button', { type: 'button', class: 'btn', 'data-acao': 'proxima', 'aria-disabled': and.atual === n - 1 ? 'true' : false,
          onclick: () => and.atual < n - 1 && ir(and.atual + 1) }, 'Próxima')));
    }

    function pedirEntrega() {
      const feitas = Object.keys(and.respostas).length;
      const em = and.ids.length - feitas;
      trocar(confirmacao, el('div', { class: 'aviso', role: 'group', 'aria-labelledby': 'entrega-titulo' },
        el('p', { id: 'entrega-titulo' }, el('strong', {}, 'Entregar o simulado?')),
        el('p', {}, `Você respondeu ${feitas} de ${and.ids.length} questões${em ? ` (${em} em branco)` : ''}. Depois de entregar não dá para mudar.`),
        el('button', { type: 'button', class: 'btn btn--primario', 'data-acao': 'confirmar-entrega', onclick: () => entregar(false) }, 'Entregar agora'),
        el('button', { type: 'button', class: 'btn', onclick: () => confirmacao.replaceChildren() }, 'Continuar a prova')));
      confirmacao.querySelector('button').focus();
    }

    trocar(raiz, titulo(),
      el('div', { class: 'barra-prova' }, cron, aviso),
      palco,
      el('button', { type: 'button', class: 'btn btn--primario', 'data-acao': 'entregar', onclick: pedirEntrega }, 'Entregar simulado'),
      confirmacao, navegacao);
    palco.setAttribute('tabindex', '-1');
    palco.className = 'palco-prova';
    desenharQuestao();
    desenharNav();
    const timer = setInterval(tique, 1000);
    tique();
  }

  // ---------- resultado ----------
  function resultado(r, esgotou = false) {
    const pct = r.total ? Math.round((r.acertos / r.total) * 100) : 0;
    const acima = r.total && r.acertos / r.total >= NOTA_MINIMA;
    const revisao = r.ids.map((id, i) => {
      const q = porId.get(id);
      if (!q) return null;
      const esc = r.respostas[id];
      const estadoQ = esc === undefined ? 'em branco' : esc === q.correta ? 'certa' : 'errada';
      return el('details', { class: 'revisao-q' },
        el('summary', {}, `Questão ${i + 1} · ${nomeMateria.get(q.materia)} · ${estadoQ === 'certa' ? '✔ certa' : estadoQ === 'errada' ? '✘ errada' : '– em branco'}`),
        q.texto && el('blockquote', { class: 'questao__texto' }, q.texto),
        el('p', { class: 'questao__enunciado' }, q.enunciado),
        esc === undefined ? el('p', {}, 'Você deixou esta questão em branco.') : el('p', {}, `Sua resposta: ${LETRAS[esc]}) ${q.alternativas[esc]}`),
        explicacao(q, esc));
    });
    trocar(raiz, titulo(),
      esgotou ? el('p', { class: 'aviso', role: 'status' }, 'Tempo esgotado: o simulado foi entregue automaticamente.') : null,
      el('section', { class: 'resumo', 'aria-labelledby': 'h-resultado' },
        el('h2', { id: 'h-resultado', tabindex: '-1' }, `Resultado do simulado de ${formatarData(r.data)}`),
        el('p', { class: 'resumo__nota', 'data-resultado': 'nota' }, `Nota: ${r.acertos}/${r.total} (${pct}%)`),
        el('p', {}, `Na escala da prova: ${notaSobre60(r)}/60.`),
        el('p', { class: acima ? 'veredito veredito--certa' : 'aviso' },
          acima ? '✔ Você ficou acima da nota mínima de 30/60, proporcional.' : 'Abaixo da nota mínima de 30/60 (proporcional). Revise os erros e tente de novo.'),
        el('p', {}, `Tempo médio por questão: ${duracao(r.tempoMedio)}. Tempo total: ${duracao(r.segundos)}.`),
        el('h3', {}, 'Por matéria'),
        el('ul', {}, Object.entries(r.porMateria).map(([m, x]) =>
          el('li', {}, `${nomeMateria.get(m) ?? m}: ${x.acertos} de ${x.total} (${Math.round((x.acertos / x.total) * 100)}%)`)))),
      el('h2', {}, 'Revisão das questões'),
      el('p', { class: 'tela__texto' }, 'Abra cada questão para ver a correção e a explicação. As erradas entraram na sua revisão.'),
      ...revisao,
      el('button', { type: 'button', class: 'btn btn--primario', 'data-acao': 'novo', onclick: configuracao }, 'Novo simulado'));
    raiz.querySelector('#h-resultado').focus({ preventScroll: true });
  }

  // ---------- entrada ----------
  const and = estado.simuladoAtual;
  if (and && and.ids.every((id) => porId.has(id))) {
    if (restanteSegundos(and, Date.now()) === 0) {
      const r = finalizar({ estado, andamento: and, porId, agora: Date.now(), data: hojeStr() });
      salvar(estado);
      resultado(r, true);
    } else {
      and.marca = Date.now(); // o tempo fora da tela não conta para a questão atual
      prova();
    }
  } else configuracao();
}
