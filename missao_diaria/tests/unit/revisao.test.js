import { describe, it, expect } from 'vitest';
import { INTERVALOS, registrar, vencidas, emRevisao } from '../../js/lib/revisao.js';

describe('revisao: registrar', () => {
  it('intervalos', () => expect(INTERVALOS).toEqual([1, 3, 7, 15, 30]));
  it('errar volta à caixa 1 com próxima em 1 dia', () => {
    const c = registrar({ caixa: 4, proxima: '2026-03-01', ultimaErrou: false }, false, '2026-03-05');
    expect(c).toEqual({ caixa: 1, proxima: '2026-03-06', ultimaErrou: true, jaErrou: true, dominada: false });
  });
  it('acertar sobe uma caixa e agenda pelo intervalo dela', () => {
    expect(registrar({ caixa: 1, proxima: 'x', ultimaErrou: true }, true, '2026-03-05'))
      .toEqual({ caixa: 2, proxima: '2026-03-08', ultimaErrou: false, jaErrou: true, dominada: false });
    expect(registrar({ caixa: 4, proxima: 'x', ultimaErrou: false }, true, '2026-03-05').proxima).toBe('2026-04-04');
  });
  it('máximo na caixa 5', () => {
    expect(registrar({ caixa: 5, proxima: 'x', ultimaErrou: false }, true, '2026-03-05').caixa).toBe(5);
  });
  it('primeira vez: acerto cria cartão na caixa 2; erro na caixa 1', () => {
    expect(registrar(undefined, true, '2026-03-05')).toEqual({ caixa: 2, proxima: '2026-03-08', ultimaErrou: false, jaErrou: false, dominada: false });
    expect(registrar(undefined, false, '2026-03-05')).toEqual({ caixa: 1, proxima: '2026-03-06', ultimaErrou: true, jaErrou: true, dominada: false });
  });
  it('questão já errada só é dominada ao acertar na caixa 5', () => {
    let c = registrar(undefined, false, '2026-03-01');
    const datas = ['2026-03-02', '2026-03-05', '2026-03-12', '2026-03-27'];
    for (const d of datas) { c = registrar(c, true, d); expect(c.dominada).toBe(false); }
    expect(c.caixa).toBe(5);
    c = registrar(c, true, '2026-04-26');
    expect(c).toMatchObject({ caixa: 5, dominada: true, jaErrou: true });
  });
  it('errar de novo tira o domínio', () => {
    const c = registrar({ caixa: 5, proxima: 'x', ultimaErrou: false, jaErrou: true, dominada: true }, false, '2026-03-05');
    expect(c).toMatchObject({ caixa: 1, dominada: false, jaErrou: true });
  });
  it('questão só com acertos nunca é marcada como dominada', () => {
    expect(registrar({ caixa: 5, proxima: 'x', ultimaErrou: false, jaErrou: false, dominada: false }, true, '2026-03-05').dominada).toBe(false);
  });
});

describe('revisao: vencidas', () => {
  const hoje = '2026-03-10';
  const cartoes = {
    e1: { caixa: 1, proxima: '2026-03-09', ultimaErrou: true },
    e2: { caixa: 1, proxima: '2026-03-05', ultimaErrou: true },
    efut: { caixa: 1, proxima: '2026-03-11', ultimaErrou: true },
    a2: { caixa: 2, proxima: '2026-03-01', ultimaErrou: false },
    a3: { caixa: 3, proxima: '2026-03-08', ultimaErrou: false },
    a4: { caixa: 4, proxima: '2026-03-02', ultimaErrou: false },
  };
  it('sem incluirAcertos só entram erradas, mais atrasadas primeiro', () => {
    expect(vencidas(cartoes, hoje, {}).map((c) => c.id)).toEqual(['e2', 'e1']);
  });
  it('com incluirAcertos entram acertos da caixa 3+, depois das erradas', () => {
    expect(vencidas(cartoes, hoje, { incluirAcertos: true }).map((c) => c.id)).toEqual(['e2', 'e1', 'a4', 'a3']);
  });
  it('vence no próprio dia', () => {
    expect(vencidas({ x: { caixa: 1, proxima: hoje, ultimaErrou: true } }, hoje, {})).toHaveLength(1);
  });
});

describe('revisao: questão já errada continua na fila', () => {
  const hoje = '2026-03-10';
  const cartoes = {
    acertouDepois: { caixa: 2, proxima: '2026-03-09', ultimaErrou: false, jaErrou: true, dominada: false },
    dominada: { caixa: 5, proxima: '2026-03-01', ultimaErrou: false, jaErrou: true, dominada: true },
    soAcertos: { caixa: 4, proxima: '2026-03-01', ultimaErrou: false, jaErrou: false, dominada: false },
    errou: { caixa: 1, proxima: '2026-03-09', ultimaErrou: true, jaErrou: true, dominada: false },
  };
  it('já errada e acertada uma vez continua vencendo', () => {
    expect(vencidas(cartoes, hoje, {}).map((c) => c.id)).toEqual(['errou', 'acertouDepois']);
  });
  it('dominada e só-acertos só voltam com incluirAcertos', () => {
    expect(vencidas(cartoes, hoje, { incluirAcertos: true }).map((c) => c.id))
      .toEqual(['errou', 'acertouDepois', 'dominada', 'soAcertos']);
  });
  it('emRevisao: já errada e não dominada', () => {
    expect(Object.entries(cartoes).filter(([, c]) => emRevisao(c)).map(([id]) => id)).toEqual(['acertouDepois', 'errou']);
  });
  it('cartão antigo (só ultimaErrou) conta como errado', () => {
    expect(emRevisao({ caixa: 1, proxima: 'x', ultimaErrou: true })).toBe(true);
  });
});

describe('revisao: aplicarResposta', () => {
  it('grava a resposta e atualiza o cartão', async () => {
    const { aplicarResposta } = await import('../../js/lib/revisao.js');
    const estado = { respostas: [], cartoes: {} };
    aplicarResposta(estado, { questao: 'q1', escolhida: 2, acertou: true, tempo: 12, contexto: 'missao', data: '2026-03-05' });
    expect(estado.respostas).toEqual([{ questao: 'q1', data: '2026-03-05', escolhida: 2, acertou: true, tempo: 12, contexto: 'missao' }]);
    expect(estado.cartoes.q1).toMatchObject({ caixa: 2, proxima: '2026-03-08', ultimaErrou: false });
    aplicarResposta(estado, { questao: 'q1', escolhida: 0, acertou: false, tempo: 5, contexto: 'revisao', data: '2026-03-08' });
    expect(estado.cartoes.q1).toMatchObject({ caixa: 1, proxima: '2026-03-09', ultimaErrou: true });
    expect(estado.respostas).toHaveLength(2);
  });
});
