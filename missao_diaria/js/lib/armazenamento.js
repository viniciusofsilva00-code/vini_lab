// Estado do usuário em localStorage, versionado, com fallback em memória.
import { hoje } from './datas.js';
import { perfilPadrao } from './perfil.js';

export const CHAVE = 'missao_diaria:v1';
export const CORROMPIDO = 'missao_diaria:v1:corrompido';
export const VERSAO = 1;
let memoria = null; // usado quando o localStorage não está disponível

export function estadoPadrao() {
  return { versao: VERSAO, perfil: perfilPadrao(hoje()), respostas: [], cartoes: {}, missoes: {}, simulados: [], ultimoBackup: null };
}

// Aceita estados de versões anteriores e completa o que faltar.
export function migrar(bruto) {
  const base = estadoPadrao();
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return base;
  return {
    ...base,
    ...bruto,
    versao: VERSAO,
    perfil: { ...base.perfil, ...(bruto.perfil || {}) },
  };
}

function armazem(a) {
  if (a) return a;
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function carregar(a) {
  let s = null;
  try { s = armazem(a); } catch { s = null; }
  try {
    if (!s) throw new Error('sem armazenamento');
    const txt = s.getItem(CHAVE);
    if (txt === null) return memoria ? migrar(JSON.parse(memoria)) : estadoPadrao();
    try {
      return migrar(JSON.parse(txt));
    } catch {
      // Preserva o texto bruto para recuperação manual antes de devolver o padrão.
      try { s.setItem(CORROMPIDO, txt); } catch { /* sem espaço: segue com o padrão */ }
      return estadoPadrao();
    }
  } catch {
    return memoria ? migrar(JSON.parse(memoria)) : estadoPadrao();
  }
}

// Devolve true se gravou no aparelho; false se caiu para a memória (cota cheia, modo privado).
export function salvar(estado, a) {
  const txt = JSON.stringify(estado);
  try {
    const s = armazem(a);
    if (!s) throw new Error('sem armazenamento');
    s.setItem(CHAVE, txt);
    memoria = null;
    return true;
  } catch {
    memoria = txt;
    return false;
  }
}

export function resetar(a) {
  memoria = null;
  try { armazem(a)?.removeItem(CHAVE); } catch { /* sem armazenamento: nada a apagar */ }
}
