// Resumo de respostas: total, acertos, % e por matéria. materiaDe(idQuestao) → id da matéria.
const pct = (a, t) => (t ? Math.round((a / t) * 100) : 0);

export function resumo(respostas, materiaDe) {
  const porMateria = {};
  let acertos = 0;
  for (const r of respostas) {
    if (r.acertou) acertos++;
    const m = materiaDe(r.questao);
    if (!m) continue;
    const x = (porMateria[m] ??= { total: 0, acertos: 0, percentual: 0 });
    x.total++;
    if (r.acertou) x.acertos++;
  }
  for (const x of Object.values(porMateria)) x.percentual = pct(x.acertos, x.total);
  return { total: respostas.length, acertos, percentual: pct(acertos, respostas.length), porMateria };
}
