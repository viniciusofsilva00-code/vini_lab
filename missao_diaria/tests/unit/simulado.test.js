import { describe, it, expect } from 'vitest';
import {
  validarConfig, montarSimulado, restanteSegundos, acumularTempo, finalizar, notaSobre60, LIMITES,
} from '../../js/lib/simulado.js';
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
    { id: 'pt', nome: 'Português', questoesNaProva: 20 },
    { id: 'mt', nome: 'Matemática', questoesNaProva: 15 },
    { id: 'ia', nome: 'Informática', questoesNaProva: 5 },
    { id: 'vz', nome: 'Vazia', questoesNaProva: 20 },
  ],
};
const gerar = (m, n) => Array.from({ length: n }, (_, i) => ({ id: `${m}-${i}`, materia: m, correta: 1 }));
const banco = () => [...gerar('pt', 40), ...gerar('mt', 40), ...gerar('ia', 40)];
const conta = (ids) => ids.reduce((a, id) => { const m = id.split('-')[0]; a[m] = (a[m] ?? 0) + 1; return a; }, {});

describe('simulado: configuração', () => {
  it('limites 10–60 questões e 10–300 minutos', () => {
    expect(LIMITES).toEqual({ questoes: [10, 60], minutos: [10, 300] });
    expect(validarConfig(60, 180)).toEqual({ ok: true, config: { questoes: 60, minutos: 180 } });
    expect(validarConfig('10', '10').ok).toBe(true);
    expect(validarConfig(9, 100).ok).toBe(false);
    expect(validarConfig(61, 100).erro).toMatch(/10 a 60/);
    expect(validarConfig(20, 301).erro).toMatch(/10 a 300/);
    expect(validarConfig(20.5, 100).ok).toBe(false);
    expect(validarConfig('', 100).ok).toBe(false);
  });
});

describe('simulado: montagem', () => {
  it('é proporcional a questoesNaProva e ignora matérias sem questões', () => {
    const ids = montarSimulado({ questoes: banco(), edital, n: 40, rng: semente(1) });
    expect(ids).toHaveLength(40);
    expect(new Set(ids).size).toBe(40);
    expect(conta(ids)).toEqual({ pt: 20, mt: 15, ia: 5 });
  });
  it('60 questões = distribuição da prova real', () => {
    const ids = montarSimulado({ questoes: banco(), edital: { materias: edital.materias.slice(0, 3) }, n: 40, rng: semente(2) });
    expect(conta(ids)).toEqual({ pt: 20, mt: 15, ia: 5 });
  });
  it('arredonda por maior resto e fecha o total', () => {
    const ids = montarSimulado({ questoes: banco(), edital, n: 10, rng: semente(3) });
    expect(ids).toHaveLength(10);
    expect(conta(ids)).toEqual({ pt: 5, mt: 4, ia: 1 });
  });
  it('matéria com poucas questões cede o excedente às outras', () => {
    const q = [...gerar('pt', 3), ...gerar('mt', 40)];
    const ids = montarSimulado({ questoes: q, edital, n: 20, rng: semente(4) });
    expect(ids).toHaveLength(20);
    expect(conta(ids)).toEqual({ pt: 3, mt: 17 });
  });
  it('se o banco tem menos que n, usa tudo', () => {
    expect(montarSimulado({ questoes: gerar('pt', 7), edital, n: 20, rng: semente(5) })).toHaveLength(7);
  });
  it('determinístico com o mesmo rng e diferente com outro', () => {
    const a = montarSimulado({ questoes: banco(), edital, n: 30, rng: semente(9) });
    expect(montarSimulado({ questoes: banco(), edital, n: 30, rng: semente(9) })).toEqual(a);
    expect(montarSimulado({ questoes: banco(), edital, n: 30, rng: semente(10) })).not.toEqual(a);
  });
});

describe('simulado: tempo', () => {
  const and = { inicio: 1_000_000, minutos: 10, marca: 1_000_000, atual: 0, ids: ['a', 'b'], tempos: {} };
  it('restante nunca fica negativo', () => {
    expect(restanteSegundos(and, 1_000_000)).toBe(600);
    expect(restanteSegundos(and, 1_000_000 + 125_000)).toBe(475);
    expect(restanteSegundos(and, 1_000_000 + 9_999_999)).toBe(0);
  });
  it('acumula o tempo na questão atual', () => {
    const x = acumularTempo(and, 1_000_000 + 30_000);
    expect(x.tempos).toEqual({ a: 30 });
    expect(x.marca).toBe(1_030_000);
    expect(acumularTempo({ ...x, atual: 1 }, 1_050_000).tempos).toEqual({ a: 30, b: 20 });
  });
});

describe('simulado: finalizar', () => {
  const porId = new Map(banco().map((q) => [q.id, q]));
  const andamento = () => ({
    inicio: 0, minutos: 30, marca: 600_000, atual: 0, tempos: { 'pt-0': 40, 'mt-0': 20 },
    ids: ['pt-0', 'pt-1', 'mt-0', 'mt-1'], respostas: { 'pt-0': 1, 'pt-1': 0, 'mt-0': 1 },
  });
  it('calcula nota, por matéria e tempo médio, e atualiza respostas e cartões', () => {
    const e = estadoPadrao();
    const s = finalizar({ estado: e, andamento: andamento(), porId, agora: 600_000, data: '2026-11-10' });
    expect(s).toMatchObject({ data: '2026-11-10', total: 4, acertos: 2, segundos: 600, minutos: 30 });
    expect(s.porMateria).toEqual({ pt: { acertos: 1, total: 2 }, mt: { acertos: 1, total: 2 } });
    expect(s.tempoMedio).toBe(150);
    expect(e.simulados).toEqual([s]);
    expect(e.simuladoAtual).toBeNull();
    expect(e.respostas).toHaveLength(3); // sem resposta não gera registro
    expect(e.respostas[0]).toMatchObject({ questao: 'pt-0', contexto: 'simulado', acertou: true, data: '2026-11-10', tempo: 40 });
    expect(e.cartoes['pt-1']).toMatchObject({ caixa: 1, ultimaErrou: true });
    expect(e.cartoes['pt-0']).toMatchObject({ caixa: 2, ultimaErrou: false });
    expect(e.cartoes['mt-1']).toBeUndefined();
  });
  it('nota proporcional sobre 60', () => {
    expect(notaSobre60({ acertos: 15, total: 30 })).toBe(30);
    expect(notaSobre60({ acertos: 7, total: 10 })).toBe(42);
    expect(notaSobre60({ acertos: 0, total: 0 })).toBe(0);
  });
});
