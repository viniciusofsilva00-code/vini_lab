import { describe, it, expect } from 'vitest';
import { resumo } from '../../js/lib/notas.js';

describe('notas', () => {
  const materias = { a: 'portugues', b: 'portugues', c: 'matematica' };
  const m = (id) => materias[id];
  it('lista vazia', () => {
    expect(resumo([], m)).toEqual({ total: 0, acertos: 0, percentual: 0, porMateria: {} });
  });
  it('total, % e por matéria', () => {
    const r = resumo([
      { questao: 'a', acertou: true }, { questao: 'b', acertou: false }, { questao: 'c', acertou: true },
    ], m);
    expect(r.total).toBe(3);
    expect(r.acertos).toBe(2);
    expect(r.percentual).toBe(67);
    expect(r.porMateria.portugues).toEqual({ total: 2, acertos: 1, percentual: 50 });
    expect(r.porMateria.matematica).toEqual({ total: 1, acertos: 1, percentual: 100 });
  });
});
