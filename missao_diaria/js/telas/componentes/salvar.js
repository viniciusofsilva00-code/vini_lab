import { salvar } from '../../lib/armazenamento.js';
import { el } from './dom.js';

let avisou = false;

// Salva e, se o aparelho não guardou (cota cheia, modo privado), avisa uma vez.
export function salvarComAviso(estado) {
  const ok = salvar(estado);
  if (!ok && !avisou) {
    avisou = true;
    const aviso = el('p', { class: 'aviso', role: 'alert' }, 'Não foi possível salvar no aparelho; faça backup.');
    document.getElementById('tela')?.before(aviso);
  }
  return ok;
}
