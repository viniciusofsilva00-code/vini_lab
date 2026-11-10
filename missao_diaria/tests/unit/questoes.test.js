import { describe, it, expect, beforeEach } from 'vitest';
import { carregarBanco, limparCache } from '../../js/lib/questoes.js';

const dados = {
  'dados/questoes/indice.json': { arquivos: ['a.json', 'b.json'] },
  'dados/questoes/a.json': [{ id: 'por-0001' }],
  'dados/questoes/b.json': [{ id: 'mat-0001' }, { id: 'mat-0002' }],
  'dados/edital.json': { materias: [] },
};

describe('questoes: carregarBanco', () => {
  let chamadas;
  const fake = async (url) => {
    chamadas.push(String(url));
    const chave = Object.keys(dados).find((k) => String(url).endsWith(k));
    return { ok: !!chave, json: async () => dados[chave] };
  };
  beforeEach(() => { chamadas = []; limparCache(); });

  it('junta os arquivos do índice e o edital', async () => {
    const b = await carregarBanco(fake);
    expect(b.questoes.map((q) => q.id)).toEqual(['por-0001', 'mat-0001', 'mat-0002']);
    expect(b.edital).toEqual({ materias: [] });
  });
  it('usa cache em memória', async () => {
    await carregarBanco(fake);
    const n = chamadas.length;
    await carregarBanco(fake);
    expect(chamadas.length).toBe(n);
  });
  it('falha com mensagem clara se um arquivo não carregar', async () => {
    await expect(carregarBanco(async () => ({ ok: false }))).rejects.toThrow(/carregar/);
  });
});
