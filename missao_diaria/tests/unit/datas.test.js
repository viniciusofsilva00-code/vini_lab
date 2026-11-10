import { describe, it, expect } from 'vitest';
import { hoje, somarDias, diferencaDias, formatarData } from '../../js/lib/datas.js';

describe('datas', () => {
  it('hoje usa o fuso de São Paulo (UTC-3)', () => {
    expect(hoje(new Date('2026-03-10T02:30:00Z'))).toBe('2026-03-09');
    expect(hoje(new Date('2026-03-10T03:00:00Z'))).toBe('2026-03-10');
  });
  it('somarDias atravessa mês e ano e aceita negativo', () => {
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28');
    expect(somarDias('2028-02-28', 1)).toBe('2028-02-29');
  });
  it('diferencaDias é b - a', () => {
    expect(diferencaDias('2026-03-01', '2026-03-08')).toBe(7);
    expect(diferencaDias('2026-03-08', '2026-03-01')).toBe(-7);
    expect(diferencaDias('2026-12-31', '2027-01-01')).toBe(1);
  });
});

describe('formatarData', () => {
  it('dd/mm/aaaa', () => expect(formatarData('2026-11-09')).toBe('09/11/2026'));
});
