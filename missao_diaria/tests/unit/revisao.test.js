import { describe, it, expect } from 'vitest';
import { INTERVALOS, registrar, vencidas } from '../../js/lib/revisao.js';

describe('revisao: registrar', () => {
  it('intervalos', () => expect(INTERVALOS).toEqual([1, 3, 7, 15, 30]));
  it('errar volta à caixa 1 com próxima em 1 dia', () => {
    const c = registrar({ caixa: 4, proxima: '2026-03-01', ultimaErrou: false }, false, '2026-03-05');
    expect(c).toEqual({ caixa: 1, proxima: '2026-03-06', ultimaErrou: true });
  });
  it('acertar sobe uma caixa e agenda pelo intervalo dela', () => {
    expect(registrar({ caixa: 1, proxima: 'x', ultimaErrou: true }, true, '2026-03-05'))
      .toEqual({ caixa: 2, proxima: '2026-03-08', ultimaErrou: false });
    expect(registrar({ caixa: 4, proxima: 'x', ultimaErrou: false }, true, '2026-03-05').proxima).toBe('2026-04-04');
  });
  it('máximo na caixa 5', () => {
    expect(registrar({ caixa: 5, proxima: 'x', ultimaErrou: false }, true, '2026-03-05').caixa).toBe(5);
  });
  it('primeira vez: acerto cria cartão na caixa 2; erro na caixa 1', () => {
    expect(registrar(undefined, true, '2026-03-05')).toEqual({ caixa: 2, proxima: '2026-03-08', ultimaErrou: false });
    expect(registrar(undefined, false, '2026-03-05')).toEqual({ caixa: 1, proxima: '2026-03-06', ultimaErrou: true });
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

describe('revisao: aplicarResposta', () => {
  it('grava a resposta e atualiza o cartão', async () => {
    const { aplicarResposta } = await import('../../js/lib/revisao.js');
    const estado = { respostas: [], cartoes: {} };
    aplicarResposta(estado, { questao: 'q1', escolhida: 2, acertou: true, tempo: 12, contexto: 'missao', data: '2026-03-05' });
    expect(estado.respostas).toEqual([{ questao: 'q1', data: '2026-03-05', escolhida: 2, acertou: true, tempo: 12, contexto: 'missao' }]);
    expect(estado.cartoes.q1).toEqual({ caixa: 2, proxima: '2026-03-08', ultimaErrou: false });
    aplicarResposta(estado, { questao: 'q1', escolhida: 0, acertou: false, tempo: 5, contexto: 'revisao', data: '2026-03-08' });
    expect(estado.cartoes.q1).toEqual({ caixa: 1, proxima: '2026-03-09', ultimaErrou: true });
    expect(estado.respostas).toHaveLength(2);
  });
});
