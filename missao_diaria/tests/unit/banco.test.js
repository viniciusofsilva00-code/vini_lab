import { describe, it, expect } from 'vitest';
import { validarQuestao, validarBanco } from '../../js/lib/banco.js';

const edital = {
  materias: [
    { id: 'portugues', assuntos: ['Crase'] },
    { id: 'administracao_publica', assuntos: ['CF: Segurança Pública (art. 144)'] },
  ],
};

function questao(extra = {}) {
  return {
    id: 'por-0001',
    materia: 'portugues',
    assunto: 'Crase',
    dificuldade: 1,
    enunciado: 'Assinale a alternativa em que o acento grave está correto.',
    alternativas: ['Vou à praia.', 'Vou à pé.', 'Refiro-me à você.', 'Comecei à estudar.', 'Fui à Roma.'],
    correta: 0,
    explicacao: {
      passos: ['Crase = preposição a + artigo a.'],
      porQueErradas: { 1: 'Pé é masculino.', 2: 'Pronome de tratamento.', 3: 'Antes de verbo.', 4: 'Roma sem determinante.' },
      pegadinha: 'Cidades sem determinante não admitem artigo.',
      fonte: 'Gramática normativa: regra geral da crase.',
    },
    origem: 'gerada',
    ...extra,
  };
}

describe('validarQuestao', () => {
  it('aceita questão completa', () => {
    expect(validarQuestao(questao(), edital)).toEqual([]);
  });

  it('exige id no formato abc-0000', () => {
    expect(validarQuestao(questao({ id: 'x1' }), edital).join()).toMatch(/id/);
  });

  it('exige matéria e assunto do edital', () => {
    expect(validarQuestao(questao({ materia: 'quimica' }), edital).join()).toMatch(/matéria/);
    expect(validarQuestao(questao({ assunto: 'Vírgula' }), edital).join()).toMatch(/assunto/);
  });

  it('exige 5 alternativas distintas e não vazias', () => {
    expect(validarQuestao(questao({ alternativas: ['a', 'b', 'c', 'd'] }), edital).join()).toMatch(/alternativas/);
    expect(validarQuestao(questao({ alternativas: ['a', 'a', 'c', 'd', 'e'] }), edital).join()).toMatch(/repetidas/);
    expect(validarQuestao(questao({ alternativas: ['a', '', 'c', 'd', 'e'] }), edital).join()).toMatch(/vazia/);
  });

  it('exige correta entre 0 e 4', () => {
    expect(validarQuestao(questao({ correta: 5 }), edital).join()).toMatch(/correta/);
  });

  it('exige dificuldade 1, 2 ou 3', () => {
    expect(validarQuestao(questao({ dificuldade: 4 }), edital).join()).toMatch(/dificuldade/);
  });

  it('exige explicação de cada alternativa errada e nenhuma da correta', () => {
    const q = questao();
    delete q.explicacao.porQueErradas[2];
    expect(validarQuestao(q, edital).join()).toMatch(/porQueErradas/);
    const q2 = questao();
    q2.explicacao.porQueErradas[0] = 'x';
    expect(validarQuestao(q2, edital).join()).toMatch(/porQueErradas/);
  });

  it('exige passos, pegadinha e fonte', () => {
    const q = questao();
    q.explicacao.passos = [];
    q.explicacao.fonte = '';
    q.explicacao.pegadinha = '';
    const erros = validarQuestao(q, edital).join();
    expect(erros).toMatch(/passos/);
    expect(erros).toMatch(/fonte/);
    expect(erros).toMatch(/pegadinha/);
  });

  it('em Administração Pública a fonte cita artigo', () => {
    const base = {
      id: 'adm-0001',
      materia: 'administracao_publica',
      assunto: 'CF: Segurança Pública (art. 144)',
    };
    const q = questao(base);
    q.explicacao.fonte = 'Constituição Federal';
    expect(validarQuestao(q, edital).join()).toMatch(/artigo/);
    q.explicacao.fonte = 'CF/88, art. 144, § 5º';
    expect(validarQuestao(q, edital)).toEqual([]);
  });

  it('origem é gerada ou prova', () => {
    expect(validarQuestao(questao({ origem: 'outra' }), edital).join()).toMatch(/origem/);
  });
});

describe('validarBanco', () => {
  it('acusa ids repetidos', () => {
    const erros = validarBanco([questao(), questao()], edital);
    expect(erros.join()).toMatch(/repetido/);
  });

  it('prefixa os erros com o id', () => {
    const erros = validarBanco([questao({ correta: 9 })], edital);
    expect(erros[0]).toMatch(/^por-0001:/);
  });
});
