// Perfil e meta diária. Funções puras.
export const MIN_POR_QUESTAO = 2;
export const MAX_QUESTOES = 40;
const LIMITES = { questoes: [5, 40], minutos: [10, 120] };

export function perfilPadrao(inicio) {
  return { meta: { tipo: 'questoes', valor: 10 }, modoLeve: false, incluirAcertosRevisao: false, inicio };
}

export function validarMeta(tipo, valor) {
  const lim = LIMITES[tipo];
  if (!lim) return { ok: false, erro: 'Escolha questões ou minutos.' };
  const n = typeof valor === 'string' && valor.trim() === '' ? NaN : Number(valor);
  const unidade = tipo === 'questoes' ? 'questões' : 'minutos';
  if (!Number.isInteger(n) || n < lim[0] || n > lim[1]) {
    return { ok: false, erro: `Informe um número inteiro de ${lim[0]} a ${lim[1]} ${unidade}.` };
  }
  return { ok: true, meta: { tipo, valor: n } };
}

export function metaEfetiva(perfil) {
  const { tipo, valor } = perfil.meta;
  const n = tipo === 'minutos' ? Math.min(MAX_QUESTOES, Math.round(valor / MIN_POR_QUESTAO)) : valor;
  return perfil.modoLeve ? Math.max(3, Math.ceil(n / 2)) : n;
}
