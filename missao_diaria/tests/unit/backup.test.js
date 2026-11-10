import { describe, it, expect } from 'vitest';
import {
  VERSAO_BACKUP, criarBackup, nomeArquivo, lerBackup, resumoBackup, registrarBackup, avisoBackup, dispensarAviso,
} from '../../js/lib/backup.js';
import { estadoPadrao } from '../../js/lib/armazenamento.js';

const AGORA = new Date('2026-11-10T15:00:00Z');
const comRespostas = (n, data = '2026-10-01') => {
  const e = estadoPadrao();
  for (let i = 0; i < n; i++) e.respostas.push({ questao: `q${i}`, data, escolhida: 0, acertou: true, tempo: 5, contexto: 'missao' });
  return e;
};

describe('backup: arquivo', () => {
  it('nome com a data de São Paulo', () => {
    expect(nomeArquivo(AGORA)).toBe('missao-diaria-backup-2026-11-10.json');
    expect(nomeArquivo(new Date('2026-11-11T02:00:00Z'))).toBe('missao-diaria-backup-2026-11-10.json');
  });
  it('envelope com app, versão, data e estado', () => {
    const e = comRespostas(2);
    const b = criarBackup(e, AGORA);
    expect(b).toEqual({ app: 'missao_diaria', versao: VERSAO_BACKUP, exportadoEm: '2026-11-10T15:00:00.000Z', estado: e });
  });
  it('registrar marca ultimoBackup antes de exportar', () => {
    const e = comRespostas(1);
    registrarBackup(e, AGORA);
    expect(e.ultimoBackup).toBe('2026-11-10');
    expect(criarBackup(e, AGORA).estado.ultimoBackup).toBe('2026-11-10');
  });
});

describe('backup: leitura e validação', () => {
  const ok = () => JSON.stringify(criarBackup(comRespostas(3), AGORA));
  it('aceita um backup válido e resume', () => {
    const r = lerBackup(ok());
    expect(r.ok).toBe(true);
    expect(resumoBackup(r.estado)).toEqual({ respostas: 3, desde: '2026-10-01', simulados: 0 });
  });
  it('JSON inválido', () => {
    expect(lerBackup('{quebrado')).toEqual({ ok: false, erro: 'O arquivo não é um JSON válido.' });
  });
  it('arquivo de outro app', () => {
    expect(lerBackup(JSON.stringify({ app: 'outro', versao: 1, estado: {} })).erro).toMatch(/não é um backup do Missão Diária/);
    expect(lerBackup('[]').erro).toMatch(/não é um backup do Missão Diária/);
  });
  it('versão ausente ou mais nova que a suportada', () => {
    const b = JSON.parse(ok());
    expect(lerBackup(JSON.stringify({ ...b, versao: undefined })).erro).toMatch(/versão/);
    expect(lerBackup(JSON.stringify({ ...b, versao: VERSAO_BACKUP + 1 })).erro).toMatch(/mais nova/);
  });
  it('estrutura inválida', () => {
    const b = JSON.parse(ok());
    for (const mut of [
      (x) => { x.estado = null; },
      (x) => { x.estado.respostas = {}; },
      (x) => { x.estado.cartoes = []; },
      (x) => { x.estado.perfil = 'oi'; },
      (x) => { x.estado.respostas[0] = { questao: 5 }; },
      (x) => { x.estado.simulados = 'x'; },
    ]) {
      const c = structuredClone(b);
      mut(c);
      const r = lerBackup(JSON.stringify(c));
      expect(r.ok).toBe(false);
      expect(r.erro).toMatch(/estrutura|dados/i);
    }
  });
  it('resumo de backup vazio usa a data de início do perfil', () => {
    const e = estadoPadrao();
    expect(resumoBackup(e).respostas).toBe(0);
    expect(resumoBackup(e).desde).toBe(e.perfil.inicio);
  });
});

describe('backup: aviso na tela Hoje', () => {
  it('nunca fez backup e tem 20+ respostas', () => {
    expect(avisoBackup(comRespostas(20), '2026-11-10')).toBe('nunca');
    expect(avisoBackup(comRespostas(19), '2026-11-10')).toBeNull();
  });
  it('último backup há mais de 7 dias', () => {
    const e = comRespostas(5);
    e.ultimoBackup = '2026-11-02';
    expect(avisoBackup(e, '2026-11-10')).toBe('antigo');
    e.ultimoBackup = '2026-11-03';
    expect(avisoBackup(e, '2026-11-10')).toBeNull();
  });
  it('dispensar esconde por 7 dias', () => {
    const e = comRespostas(25);
    dispensarAviso(e, '2026-11-10');
    expect(avisoBackup(e, '2026-11-16')).toBeNull();
    expect(avisoBackup(e, '2026-11-17')).toBe('nunca');
  });
});

describe('backup: validação profunda', () => {
  const ler = (mut) => {
    const e = comRespostas(1);
    mut(e);
    return lerBackup(JSON.stringify(criarBackup(e, AGORA)));
  };
  const cartao = { caixa: 2, proxima: '2026-11-12', ultimaErrou: false };

  it('aceita cartões válidos', () => {
    expect(ler((e) => { e.cartoes.q0 = cartao; }).ok).toBe(true);
  });
  it.each([
    ['caixa 0', { ...cartao, caixa: 0 }],
    ['caixa 6', { ...cartao, caixa: 6 }],
    ['caixa fracionária', { ...cartao, caixa: 1.5 }],
    ['caixa texto', { ...cartao, caixa: '2' }],
    ['proxima mal formada', { ...cartao, proxima: '12/11/2026' }],
    ['proxima ausente', { caixa: 2 }],
    ['cartão não objeto', 'x'],
  ])('rejeita cartão com %s', (_, c) => {
    const r = ler((e) => { e.cartoes.q0 = c; });
    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(/estrutura inválida/);
  });
  it.each([
    ['tipo desconhecido', { tipo: 'horas', valor: 10 }],
    ['valor texto', { tipo: 'minutos', valor: '10' }],
    ['valor NaN', { tipo: 'questoes', valor: null }],
    ['meta ausente', undefined],
  ])('rejeita perfil.meta com %s', (_, meta) => {
    expect(ler((e) => { e.perfil.meta = meta; }).ok).toBe(false);
  });
  it('simuladoAtual inválido é descartado, o resto é importado', () => {
    const r = ler((e) => { e.simuladoAtual = { ids: 'q1', inicio: 1 }; });
    expect(r.ok).toBe(true);
    expect(r.estado.simuladoAtual).toBeUndefined();
    expect(r.estado.respostas).toHaveLength(1);
  });
  it('simuladoAtual válido é mantido', () => {
    const sim = { inicio: 1, marca: 2, minutos: 30, ids: ['a', 'b'], atual: 0, respostas: { a: 1 }, tempos: { a: 3 } };
    expect(ler((e) => { e.simuladoAtual = sim; }).estado.simuladoAtual).toEqual(sim);
  });
  it.each([
    ['ids com número', { ids: ['a', 1] }],
    ['atual fora', { atual: 5 }],
    ['minutos 0', { minutos: 0 }],
    ['respostas array', { respostas: [] }],
    ['resposta não inteira', { respostas: { a: 'x' } }],
    ['tempos negativo', { tempos: { a: -1 } }],
  ])('descarta simuladoAtual com %s', (_, parte) => {
    const sim = { inicio: 1, marca: 2, minutos: 30, ids: ['a', 'b'], atual: 0, respostas: {}, tempos: {}, ...parte };
    expect(ler((e) => { e.simuladoAtual = sim; }).estado.simuladoAtual).toBeUndefined();
  });
});
