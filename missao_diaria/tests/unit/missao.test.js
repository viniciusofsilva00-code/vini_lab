import { describe, it, expect } from 'vitest';
import { gerarMissao } from '../../js/lib/missao.js';
import { estadoPadrao } from '../../js/lib/armazenamento.js';

function semente(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const edital = {
  materias: [
    { id: 'pt', nome: 'Português', questoesNaProva: 20, assuntos: ['Crase'] },
    { id: 'mt', nome: 'Matemática', questoesNaProva: 5, assuntos: ['Porcentagem'] },
    { id: 'at', nome: 'Atualidades', questoesNaProva: 5, assuntos: ['Atualidades'] },
  ],
};
const gerar = (materia, n) => Array.from({ length: n }, (_, i) => ({ id: `${materia}-${i}`, materia, assunto: materia === 'at' ? 'Atualidades' : 'x' }));
const banco = () => [...gerar('pt', 30), ...gerar('mt', 30)];
const DIA = '2026-03-10';

function estado(extra = {}) {
  const e = estadoPadrao();
  e.perfil.inicio = DIA;
  return Object.assign(e, extra);
}

describe('gerarMissao', () => {
  it('tamanho = meta efetiva, sem repetir, e salva em estado.missoes', () => {
    const e = estado();
    const m = gerarMissao({ questoes: banco(), edital, estado: e, data: DIA, rng: semente(1) });
    expect(m.ids).toHaveLength(10);
    expect(new Set(m.ids).size).toBe(10);
    expect(m.data).toBe(DIA);
    expect(e.missoes[DIA]).toBe(m);
  });
  it('é determinística com o mesmo rng e fixa no mesmo dia', () => {
    const a = gerarMissao({ questoes: banco(), edital, estado: estado(), data: DIA, rng: semente(7) });
    const b = gerarMissao({ questoes: banco(), edital, estado: estado(), data: DIA, rng: semente(7) });
    expect(a.ids).toEqual(b.ids);
    const e = estado();
    const m1 = gerarMissao({ questoes: banco(), edital, estado: e, data: DIA, rng: semente(1) });
    const m2 = gerarMissao({ questoes: banco(), edital, estado: e, data: DIA, rng: semente(99) });
    expect(m2.ids).toEqual(m1.ids);
  });
  it('modo leve usa metade (mín. 3)', () => {
    const e = estado();
    e.perfil.modoLeve = true;
    expect(gerarMissao({ questoes: banco(), edital, estado: e, data: DIA, rng: semente(1) }).ids).toHaveLength(5);
  });
  it('meta maior que o banco usa o que houver', () => {
    const e = estado();
    e.perfil.meta = { tipo: 'questoes', valor: 40 };
    const m = gerarMissao({ questoes: gerar('pt', 6), edital, estado: e, data: DIA, rng: semente(1) });
    expect(m.ids).toHaveLength(6);
  });
  it('revisão ocupa no máximo 40%, erradas primeiro, excedente fica de fora', () => {
    const e = estado();
    for (let i = 0; i < 8; i++) e.cartoes[`pt-${i}`] = { caixa: 1, proxima: '2026-03-0' + (i + 1), ultimaErrou: true };
    for (let i = 0; i < 8; i++) e.respostas.push({ questao: `pt-${i}`, acertou: false, data: '2026-03-01', contexto: 'missao' });
    const m = gerarMissao({ questoes: banco(), edital, estado: e, data: DIA, rng: semente(3) });
    const rev = m.ids.filter((id) => e.cartoes[id]);
    expect(rev).toHaveLength(4);
    expect(rev).toEqual(['pt-0', 'pt-1', 'pt-2', 'pt-3']);
    expect(m.ids).toHaveLength(10);
  });
  it('novas nunca foram respondidas', () => {
    const e = estado();
    for (let i = 0; i < 25; i++) e.respostas.push({ questao: `pt-${i}`, acertou: true, data: '2026-03-01', contexto: 'missao' });
    const m = gerarMissao({ questoes: banco(), edital, estado: e, data: DIA, rng: semente(5) });
    expect(m.ids.every((id) => !id.startsWith('pt-') || Number(id.slice(3)) >= 25)).toBe(true);
  });
  it('faltando novas, completa com revisão além dos 40%', () => {
    const e = estado();
    const qs = gerar('pt', 8);
    qs.forEach((q, i) => {
      e.respostas.push({ questao: q.id, acertou: false, data: '2026-03-01', contexto: 'missao' });
      e.cartoes[q.id] = { caixa: 1, proxima: '2026-03-02', ultimaErrou: true };
      void i;
    });
    qs.push(...gerar('mt', 1));
    const m = gerarMissao({ questoes: qs, edital, estado: e, data: DIA, rng: semente(1) });
    expect(m.ids).toHaveLength(9);
  });
  it('peso por matéria segue a prova (português 4x matemática)', () => {
    let pt = 0; let mt = 0;
    for (let s = 1; s <= 200; s++) {
      const m = gerarMissao({ questoes: banco(), edital, estado: estado(), data: DIA, rng: semente(s) });
      for (const id of m.ids) id.startsWith('pt') ? pt++ : mt++;
    }
    expect(pt / mt).toBeGreaterThan(2.5);
    expect(pt / mt).toBeLessThan(6);
  });
  it('matéria com muito erro (≥5 respostas) ganha peso', () => {
    const e = estado();
    for (let i = 0; i < 10; i++) e.respostas.push({ questao: `mt-${i}`, acertou: false, data: '2026-03-01', contexto: 'missao' });
    for (let i = 0; i < 4; i++) e.respostas.push({ questao: `pt-${i}`, acertou: false, data: '2026-03-01', contexto: 'missao' });
    // mt tem taxa 100% (peso 5*2=10); pt só 4 respostas (peso 20*1)
    const qs = [...gerar('pt', 60), ...gerar('mt', 60)];
    let pt = 0; let mt = 0;
    for (let s = 1; s <= 200; s++) {
      const m = gerarMissao({ questoes: qs, edital, estado: { ...e, missoes: {} }, data: DIA, rng: semente(s) });
      for (const id of m.ids) id.startsWith('pt') ? pt++ : mt++;
    }
    expect(pt / mt).toBeGreaterThan(1.3);
    expect(pt / mt).toBeLessThan(3);
  });
  it('sem questões de Atualidades, esse assunto não aparece', () => {
    const m = gerarMissao({ questoes: banco(), edital, estado: estado(), data: DIA, rng: semente(2) });
    expect(m.ids.some((id) => id.startsWith('at'))).toBe(false);
  });
});

describe('gerarExtras', () => {
  it('sorteia novas fora da missão do dia, sem repetir', async () => {
    const { gerarExtras } = await import('../../js/lib/missao.js');
    const e = estado();
    const m = gerarMissao({ questoes: banco(), edital, estado: e, data: DIA, rng: semente(1) });
    const extras = gerarExtras({ questoes: banco(), edital, estado: e, data: DIA, n: 5, rng: semente(2) });
    expect(extras).toHaveLength(5);
    expect(new Set([...extras, ...m.ids]).size).toBe(15);
  });
});
