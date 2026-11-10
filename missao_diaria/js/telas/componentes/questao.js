// Componente de questão: enunciado, alternativas A–E, correção imediata e explicação.
import { el, trocar } from './dom.js';

export const LETRAS = ['A', 'B', 'C', 'D', 'E'];

export function explicacao(q, escolhida) {
  const ex = q.explicacao;
  const acertou = escolhida === q.correta;
  return el('div', { class: 'explicacao' },
    el('h2', { class: `veredito ${acertou ? 'veredito--certa' : 'veredito--errada'}`, tabindex: '-1' },
      acertou ? '✔ Certa!' : `✘ Errada. A correta é a ${LETRAS[q.correta]}.`),
    el('h3', {}, 'Como resolver'),
    el('ol', {}, ex.passos.map((p) => el('li', {}, p))),
    el('h3', {}, 'Por que as outras estão erradas'),
    el('ul', {}, Object.keys(ex.porQueErradas).sort().map((i) =>
      el('li', {}, el('strong', {}, `${LETRAS[i]}) `), ex.porQueErradas[i]))),
    el('p', {}, el('strong', {}, 'Pegadinha: '), ex.pegadinha),
    el('p', {}, el('strong', {}, 'Fonte: '), ex.fonte));
}

/**
 * Monta a questão em `raiz`.
 * opcoes: { materiaNome, rotuloProxima, aoResponder({escolhida, acertou, tempo}), aoProxima() }
 */
export function montarQuestao(raiz, q, { materiaNome = '', rotuloProxima = 'Próxima', aoResponder, aoProxima }) {
  const inicio = Date.now();
  let respondida = false;
  const idEnun = `enun-${q.id}`;
  const feedback = el('div', { class: 'feedback', 'aria-live': 'polite', 'aria-atomic': 'false' });

  const botoes = q.alternativas.map((alt, i) => el('button', {
    type: 'button', class: 'alt', 'data-indice': String(i),
    onclick: () => responder(i),
  }, el('span', { class: 'alt__letra', 'aria-hidden': 'true' }, `${LETRAS[i]})`),
  el('span', { class: 'sr-only' }, `Alternativa ${LETRAS[i]}: `), el('span', {}, alt)));

  function responder(i) {
    if (respondida) return;
    respondida = true;
    const acertou = i === q.correta;
    const tempo = Math.max(1, Math.round((Date.now() - inicio) / 1000));
    botoes.forEach((b, j) => {
      b.setAttribute('aria-disabled', 'true');
      if (j === q.correta) {
        b.classList.add('alt--certa');
        b.append(el('span', { class: 'alt__marca' }, ' ✔ correta'));
      } else if (j === i) {
        b.classList.add('alt--errada');
        b.append(el('span', { class: 'alt__marca' }, ' ✘ sua resposta'));
      }
    });
    aoResponder?.({ escolhida: i, acertou, tempo });
    feedback.append(explicacao(q, i), el('button', {
      type: 'button', class: 'btn btn--primario', 'data-acao': 'proxima', onclick: () => aoProxima?.(),
    }, rotuloProxima));
    feedback.querySelector('.veredito').scrollIntoView({ block: 'nearest' });
  }

  trocar(raiz, el('section', { class: 'questao', 'aria-labelledby': idEnun },
    materiaNome && el('p', { class: 'questao__meta' }, `${materiaNome} · ${q.assunto}`),
    q.texto && el('blockquote', { class: 'questao__texto' }, q.texto),
    el('p', { id: idEnun, class: 'questao__enunciado' }, q.enunciado),
    el('div', { class: 'alts', role: 'group', 'aria-labelledby': idEnun }, botoes),
    feedback));
}
