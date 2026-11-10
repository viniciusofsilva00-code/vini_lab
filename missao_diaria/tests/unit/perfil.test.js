import { describe, it, expect } from 'vitest';
import { perfilPadrao, validarMeta, metaEfetiva } from '../../js/lib/perfil.js';

describe('perfil', () => {
  it('padrão', () => {
    expect(perfilPadrao('2026-03-01')).toEqual({
      meta: { tipo: 'questoes', valor: 10 }, modoLeve: false, incluirAcertosRevisao: false, inicio: '2026-03-01',
    });
  });
  it('valida questões de 5 a 40', () => {
    expect(validarMeta('questoes', 5).ok).toBe(true);
    expect(validarMeta('questoes', 40).ok).toBe(true);
    expect(validarMeta('questoes', 4).ok).toBe(false);
    expect(validarMeta('questoes', 41).ok).toBe(false);
    expect(validarMeta('questoes', 'abc').ok).toBe(false);
    expect(validarMeta('questoes', 7.5).ok).toBe(false);
    expect(validarMeta('questoes', '12').meta).toEqual({ tipo: 'questoes', valor: 12 });
  });
  it('valida minutos de 10 a 120', () => {
    expect(validarMeta('minutos', 10).ok).toBe(true);
    expect(validarMeta('minutos', 120).ok).toBe(true);
    expect(validarMeta('minutos', 9).ok).toBe(false);
    expect(validarMeta('minutos', 121).ok).toBe(false);
    expect(validarMeta('outro', 10).ok).toBe(false);
    expect(validarMeta('questoes', 3).erro).toMatch(/5/);
  });
  it('metaEfetiva converte minutos (2 min/questão)', () => {
    expect(metaEfetiva({ meta: { tipo: 'minutos', valor: 30 }, modoLeve: false })).toBe(15);
    expect(metaEfetiva({ meta: { tipo: 'questoes', valor: 10 }, modoLeve: false })).toBe(10);
  });
  it('modo leve é metade com mínimo de 3', () => {
    expect(metaEfetiva({ meta: { tipo: 'questoes', valor: 20 }, modoLeve: true })).toBe(10);
    expect(metaEfetiva({ meta: { tipo: 'questoes', valor: 5 }, modoLeve: true })).toBe(3);
    expect(metaEfetiva({ meta: { tipo: 'minutos', valor: 10 }, modoLeve: true })).toBe(3);
  });
});
