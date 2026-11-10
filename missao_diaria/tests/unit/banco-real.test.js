import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { validarBanco } from '../../js/lib/banco.js';

const raiz = join(import.meta.dirname, '../../dados');
const edital = JSON.parse(readFileSync(join(raiz, 'edital.json'), 'utf8'));
const indice = JSON.parse(readFileSync(join(raiz, 'questoes/indice.json'), 'utf8'));
const carregar = (arq) => JSON.parse(readFileSync(join(raiz, 'questoes', arq), 'utf8'));

describe('banco de questões real', () => {
  it('índice lista exatamente os arquivos da pasta', () => {
    const naPasta = readdirSync(join(raiz, 'questoes')).filter((f) => f.endsWith('.json') && f !== 'indice.json');
    expect([...indice.arquivos].sort()).toEqual(naPasta.sort());
  });

  it('todas as questões passam no validador e os ids são únicos', () => {
    const todas = indice.arquivos.flatMap(carregar);
    expect(todas.length).toBeGreaterThan(0);
    expect(validarBanco(todas, edital)).toEqual([]);
  });

  it('a alternativa correta não fica concentrada numa letra só', () => {
    const todas = indice.arquivos.flatMap(carregar);
    const cont = [0, 0, 0, 0, 0];
    todas.forEach((q) => cont[q.correta]++);
    const max = Math.max(...cont) / todas.length;
    expect(max).toBeLessThan(0.35);
  });
});
