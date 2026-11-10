// Revisão espaçada em caixas. Funções puras.
import { somarDias, diferencaDias } from './datas.js';

export const INTERVALOS = [1, 3, 7, 15, 30];
export const CAIXA_MIN_ACERTO = 3; // acertos só voltam a partir daqui

export function registrar(cartao, acertou, data) {
  let caixa;
  if (!acertou) caixa = 1;
  else if (!cartao) caixa = 2;
  else caixa = Math.min(INTERVALOS.length, cartao.caixa + 1);
  return { caixa, proxima: somarDias(data, INTERVALOS[caixa - 1]), ultimaErrou: !acertou };
}

export function vencidas(cartoes, data, { incluirAcertos = false } = {}) {
  return Object.entries(cartoes)
    .filter(([, c]) => c.proxima <= data && (c.ultimaErrou || (incluirAcertos && c.caixa >= CAIXA_MIN_ACERTO)))
    .map(([id, c]) => ({ id, ...c, atraso: diferencaDias(c.proxima, data) }))
    .sort((a, b) => Number(b.ultimaErrou) - Number(a.ultimaErrou) || b.atraso - a.atraso || a.id.localeCompare(b.id));
}

// Grava a resposta no estado e atualiza (ou cria) o cartão da questão.
export function aplicarResposta(estado, { questao, escolhida, acertou, tempo, contexto, data }) {
  estado.respostas.push({ questao, data, escolhida, acertou, tempo, contexto });
  estado.cartoes[questao] = registrar(estado.cartoes[questao], acertou, data);
}
