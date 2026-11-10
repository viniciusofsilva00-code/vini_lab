// Validação do banco de questões (regras do PLANO.md).

const ORIGENS = ['gerada', 'prova'];
const vazio = (s) => typeof s !== 'string' || s.trim() === '';

export function validarQuestao(q, edital) {
  const erros = [];
  if (typeof q.id !== 'string' || !/^[a-z]{3}-\d{4}$/.test(q.id)) erros.push('id fora do formato abc-0000');

  const materia = edital.materias.find((m) => m.id === q.materia);
  if (!materia) erros.push(`matéria desconhecida: ${q.materia}`);
  else if (!materia.assuntos.includes(q.assunto)) erros.push(`assunto fora do edital: ${q.assunto}`);

  if (![1, 2, 3].includes(q.dificuldade)) erros.push('dificuldade deve ser 1, 2 ou 3');
  if (vazio(q.enunciado)) erros.push('enunciado vazio');
  if (q.texto !== undefined && vazio(q.texto)) erros.push('texto-base vazio');

  const alts = q.alternativas;
  if (!Array.isArray(alts) || alts.length !== 5) erros.push('alternativas devem ser 5');
  else {
    if (alts.some(vazio)) erros.push('alternativa vazia');
    if (new Set(alts.map((a) => String(a).trim())).size !== alts.length) erros.push('alternativas repetidas');
  }

  if (!Number.isInteger(q.correta) || q.correta < 0 || q.correta > 4) erros.push('correta deve ser de 0 a 4');

  const ex = q.explicacao || {};
  if (!Array.isArray(ex.passos) || ex.passos.length === 0 || ex.passos.some(vazio)) erros.push('explicação sem passos');
  const pqe = ex.porQueErradas || {};
  const chaves = Object.keys(pqe).map(Number).sort();
  const esperadas = [0, 1, 2, 3, 4].filter((i) => i !== q.correta);
  if (chaves.join() !== esperadas.join() || Object.values(pqe).some(vazio)) {
    erros.push('porQueErradas deve explicar exatamente as 4 alternativas erradas');
  }
  if (vazio(ex.pegadinha)) erros.push('pegadinha vazia');
  if (vazio(ex.fonte)) erros.push('fonte vazia');
  else if (q.materia === 'administracao_publica' && !/\bart(\.|igo)/i.test(ex.fonte)) {
    erros.push('fonte de Administração Pública deve citar artigo');
  }

  if (!ORIGENS.includes(q.origem)) erros.push('origem deve ser gerada ou prova');
  return erros;
}

export function validarBanco(questoes, edital) {
  const erros = [];
  const vistos = new Set();
  for (const q of questoes) {
    if (vistos.has(q.id)) erros.push(`${q.id}: id repetido`);
    vistos.add(q.id);
    for (const e of validarQuestao(q, edital)) erros.push(`${q.id}: ${e}`);
  }
  return erros;
}
