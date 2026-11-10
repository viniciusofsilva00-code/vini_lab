import { describe, it, expect } from 'vitest';
import {
  inicioDaSemana, percentualPorSemana, inicioVsAgora, sequencia, totalDominadas, fraseMelhora, MIN_RESPOSTAS,
} from '../../js/lib/estatisticas.js';

const r = (questao, data, acertou) => ({ questao, data, acertou, escolhida: 0, tempo: 5, contexto: 'missao' });

describe('estatisticas: semanas', () => {
  it('inicio da semana é a segunda-feira', () => {
    expect(inicioDaSemana('2026-11-10')).toBe('2026-11-09'); // terça
    expect(inicioDaSemana('2026-11-09')).toBe('2026-11-09');
    expect(inicioDaSemana('2026-11-15')).toBe('2026-11-09'); // domingo
  });
  it('devolve 8 semanas, da mais antiga para a atual, com % ou null', () => {
    const resp = [r('a', '2026-11-10', true), r('b', '2026-11-11', false), r('c', '2026-11-02', true), r('d', '2026-11-03', true)];
    const s = percentualPorSemana(resp, '2026-11-12');
    expect(s).toHaveLength(8);
    expect(s[7]).toEqual({ inicio: '2026-11-09', total: 2, acertos: 1, percentual: 50 });
    expect(s[6]).toEqual({ inicio: '2026-11-02', total: 2, acertos: 2, percentual: 100 });
    expect(s[0]).toEqual({ inicio: '2026-09-21', total: 0, acertos: 0, percentual: null });
  });
  it('ignora respostas fora das 8 semanas', () => {
    const s = percentualPorSemana([r('a', '2025-01-01', true)], '2026-11-12');
    expect(s.every((x) => x.total === 0)).toBe(true);
  });
});

describe('estatisticas: início × agora por matéria', () => {
  const materiaDe = (id) => (id.startsWith('m') ? 'mat' : 'por');
  it('compara os primeiros 20% com os últimos 20%', () => {
    const resp = [];
    for (let i = 0; i < 20; i++) resp.push(r(`m${i}`, '2026-10-01', i >= 4 && i < 8 ? false : i < 4 ? false : true));
    // primeiras 4 erradas (0%), últimas 4 certas (100%)
    const res = inicioVsAgora(resp, materiaDe);
    expect(res.mat).toEqual({ total: 20, inicio: 0, agora: 100, melhora: 100 });
  });
  it('arredonda para cima o tamanho da janela e exige o mínimo de respostas', () => {
    const resp = Array.from({ length: MIN_RESPOSTAS - 1 }, (_, i) => r(`m${i}`, '2026-10-01', true));
    expect(inicioVsAgora(resp, materiaDe).mat).toBeUndefined();
    const dez = Array.from({ length: MIN_RESPOSTAS }, (_, i) => r(`m${i}`, '2026-10-01', i >= 2));
    expect(inicioVsAgora(dez, materiaDe).mat).toEqual({ total: 10, inicio: 0, agora: 100, melhora: 100 });
  });
  it('separa por matéria', () => {
    const resp = [];
    for (let i = 0; i < 10; i++) resp.push(r(`m${i}`, '2026-10-01', true), r(`p${i}`, '2026-10-01', i % 2 === 0));
    const res = inicioVsAgora(resp, materiaDe);
    expect(Object.keys(res).sort()).toEqual(['mat', 'por']);
    expect(res.mat.melhora).toBe(0);
  });
});

describe('estatisticas: sequência', () => {
  const m = (...datas) => Object.fromEntries(datas.map((d) => [d, { data: d, ids: [], concluida: true }]));
  it('conta dias seguidos com missão concluída até hoje', () => {
    expect(sequencia(m('2026-11-08', '2026-11-09', '2026-11-10'), '2026-11-10')).toEqual({ atual: 3, recorde: 3 });
  });
  it('hoje ainda não concluído não zera a sequência de ontem', () => {
    expect(sequencia(m('2026-11-08', '2026-11-09'), '2026-11-10').atual).toBe(2);
  });
  it('um dia perdido zera a atual e mantém o recorde', () => {
    expect(sequencia(m('2026-11-01', '2026-11-02', '2026-11-03', '2026-11-09'), '2026-11-10')).toEqual({ atual: 1, recorde: 3 });
  });
  it('missão não concluída não conta e sem dados é zero', () => {
    const x = { '2026-11-09': { data: '2026-11-09', ids: [], concluida: false } };
    expect(sequencia(x, '2026-11-10')).toEqual({ atual: 0, recorde: 0 });
    expect(sequencia({}, '2026-11-10')).toEqual({ atual: 0, recorde: 0 });
  });
});

describe('estatisticas: dominadas e frase', () => {
  it('conta cartões dominados', () => {
    expect(totalDominadas({ a: { dominada: true }, b: { dominada: false }, c: {} })).toBe(1);
  });
  const nomes = { mat: 'Matemática', por: 'Língua Portuguesa' };
  it('frase com a maior melhora', () => {
    const f = fraseMelhora({ mat: { melhora: 12 }, por: { melhora: 30 } }, nomes);
    expect(f).toBe('Você melhorou 30 pontos percentuais em Língua Portuguesa desde o início.');
  });
  it('singular', () => {
    expect(fraseMelhora({ mat: { melhora: 1 } }, nomes)).toBe('Você melhorou 1 ponto percentual em Matemática desde o início.');
  });
  it('sem dados suficientes ou sem melhora: incentivo', () => {
    expect(fraseMelhora({}, nomes)).toMatch(/10 questões/);
    expect(fraseMelhora({ mat: { melhora: 0 } }, nomes)).toMatch(/Continue/);
    expect(fraseMelhora({ mat: { melhora: -5 } }, nomes)).toMatch(/Continue/);
  });
});
