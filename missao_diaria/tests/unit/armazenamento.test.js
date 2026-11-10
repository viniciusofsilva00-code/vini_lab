import { describe, it, expect, beforeEach } from 'vitest';
import { carregar, salvar, resetar, estadoPadrao, migrar, CHAVE } from '../../js/lib/armazenamento.js';

function falso() {
  const d = {};
  return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = v; }, removeItem: (k) => { delete d[k]; }, d };
}

describe('armazenamento', () => {
  let s;
  beforeEach(() => { s = falso(); });

  it('estado inicial tem a forma versionada', () => {
    const e = carregar(s);
    expect(e).toMatchObject({ versao: 1, respostas: [], cartoes: {}, missoes: {}, simulados: [], ultimoBackup: null });
    expect(e.perfil.meta).toEqual({ tipo: 'questoes', valor: 10 });
  });
  it('salva e recarrega', () => {
    const e = carregar(s);
    e.respostas.push({ questao: 'x' });
    salvar(e, s);
    expect(CHAVE).toBe('missao_diaria:v1');
    expect(JSON.parse(s.d[CHAVE]).respostas).toHaveLength(1);
    expect(carregar(s).respostas).toHaveLength(1);
  });
  it('JSON corrompido volta ao padrão', () => {
    s.setItem(CHAVE, '{quebrado');
    expect(carregar(s).versao).toBe(1);
  });
  it('resetar apaga tudo', () => {
    salvar({ ...estadoPadrao(), respostas: [{ a: 1 }] }, s);
    resetar(s);
    expect(carregar(s).respostas).toEqual([]);
  });
  it('armazenamento que lança erro usa memória', () => {
    const ruim = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
    const e = carregar(ruim);
    e.respostas.push({ q: 1 });
    expect(() => salvar(e, ruim)).not.toThrow();
    expect(carregar(ruim).respostas).toHaveLength(1);
    resetar(ruim);
  });
  it('migrar completa campos faltantes e rejeita lixo', () => {
    expect(migrar({ versao: 1, respostas: [1] }).cartoes).toEqual({});
    expect(migrar({ versao: 1, respostas: [1] }).respostas).toEqual([1]);
    expect(migrar(null).versao).toBe(1);
    expect(migrar('x').versao).toBe(1);
  });
});
