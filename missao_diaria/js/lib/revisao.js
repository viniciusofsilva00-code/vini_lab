// Revisão espaçada em caixas. Funções puras.
import { somarDias, diferencaDias } from './datas.js';

export const INTERVALOS = [1, 3, 7, 15, 30];
export const CAIXA_MIN_ACERTO = 3; // acertos só voltam a partir daqui

const jaErrou = (c) => Boolean(c.jaErrou || c.ultimaErrou);

// Já foi errada alguma vez e ainda não foi "dominada" (acertada na caixa 5).
export function emRevisao(c) {
  return jaErrou(c) && !c.dominada;
}

export function registrar(cartao, acertou, data) {
  let caixa;
  if (!acertou) caixa = 1;
  else if (!cartao) caixa = 2;
  else caixa = Math.min(INTERVALOS.length, cartao.caixa + 1);
  const errouAntes = Boolean(cartao && jaErrou(cartao));
  const dominada = acertou && errouAntes && cartao.caixa === INTERVALOS.length;
  return {
    caixa, proxima: somarDias(data, INTERVALOS[caixa - 1]), ultimaErrou: !acertou,
    jaErrou: errouAntes || !acertou, dominada,
  };
}

export function vencidas(cartoes, data, { incluirAcertos = false } = {}) {
  return Object.entries(cartoes)
    .filter(([, c]) => c.proxima <= data && (emRevisao(c) || (incluirAcertos && c.caixa >= CAIXA_MIN_ACERTO)))
    .map(([id, c]) => ({ id, ...c, atraso: diferencaDias(c.proxima, data) }))
    .sort((a, b) => Number(emRevisao(b)) - Number(emRevisao(a)) || Number(b.ultimaErrou) - Number(a.ultimaErrou)
      || b.atraso - a.atraso || a.id.localeCompare(b.id));
}

// Grava a resposta no estado e atualiza (ou cria) o cartão da questão.
export function aplicarResposta(estado, { questao, escolhida, acertou, tempo, contexto, data }) {
  estado.respostas.push({ questao, data, escolhida, acertou, tempo, contexto });
  estado.cartoes[questao] = registrar(estado.cartoes[questao], acertou, data);
}
