import { describe, it, expect } from 'vitest';
import { telaDaHash, TELAS } from '../../js/lib/rotas.js';

describe('telaDaHash', () => {
  it('retorna hoje para hash vazio', () => {
    expect(telaDaHash('')).toBe('hoje');
    expect(telaDaHash('#')).toBe('hoje');
    expect(telaDaHash(undefined)).toBe('hoje');
  });
  it('reconhece as 5 telas', () => {
    expect(TELAS).toEqual(['hoje', 'revisao', 'simulado', 'painel', 'ajustes']);
    for (const t of TELAS) expect(telaDaHash('#' + t)).toBe(t);
  });
  it('aceita hash sem # e ignora caixa', () => {
    expect(telaDaHash('painel')).toBe('painel');
    expect(telaDaHash('#PAINEL')).toBe('painel');
  });
  it('retorna hoje para hash desconhecido', () => {
    expect(telaDaHash('#xyz')).toBe('hoje');
    expect(telaDaHash('#toString')).toBe('hoje');
  });
});
