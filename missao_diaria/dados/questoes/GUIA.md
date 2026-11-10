# Guia para escrever questões do Missão Diária

Público: candidato à prova de **Soldado PM de 2ª Classe da PM-SP (Fundação VUNESP)**, nível médio. Matérias e assuntos válidos: `dados/edital.json` (o campo `assunto` deve ser **cópia exata** de um item de `assuntos`).

## Formato (cada arquivo é um array JSON)
```json
{
  "id": "por-0001",
  "materia": "portugues",
  "assunto": "Crase",
  "dificuldade": 2,
  "texto": "(opcional) texto-base para interpretação",
  "enunciado": "Assinale a alternativa ...",
  "alternativas": ["...", "...", "...", "...", "..."],
  "correta": 3,
  "explicacao": {
    "passos": ["Passo 1 ...", "Passo 2 ..."],
    "porQueErradas": { "0": "...", "1": "...", "2": "...", "4": "..." },
    "pegadinha": "O que a banca costuma fazer para induzir ao erro.",
    "fonte": "Regra/lei de referência"
  },
  "origem": "gerada"
}
```
- `alternativas`: 5 itens, sem a letra na frente ("A)" é colocado pelo app). `correta` é o índice de 0 a 4.
- `porQueErradas`: chaves = os 4 índices errados (como string), nenhum para a correta.
- `dificuldade`: 1 fácil, 2 média (maioria), 3 difícil. Distribuição alvo ~30/50/20%.
- Distribua a correta de forma equilibrada entre os índices 0–4 (~20% cada). Nunca deixe padrão previsível.

## Estilo VUNESP
- Enunciados objetivos: "Assinale a alternativa que…", "De acordo com o texto…", "É correto afirmar que…".
- Português: textos-base curtos (jornalísticos, crônicas, tirinhas descritas em texto) **escritos por você**, originais. Nunca copie textos ou questões de provas reais nem de terceiros.
- Matemática: situações-problema do cotidiano (inclusive policial: viatura, escala, patrulha), números que fecham na conta. **Confira cada conta duas vezes**; a alternativa correta deve ser a única correta.
- Distratores plausíveis: erros típicos do candidato (sinal trocado, porcentagem sobre a base errada, regra de crase mal aplicada).

## Explicação que ensina
- `passos`: resolução passo a passo, como um professor explicaria em 2–5 passos curtos. Em matemática, mostre as contas.
- `porQueErradas`: uma frase objetiva por alternativa errada.
- `pegadinha`: a armadilha específica daquela questão e como não cair.
- `fonte`: regra gramatical, conceito, ou **lei e artigo** (ex.: "CF/88, art. 144, § 5º"). Em Administração Pública a fonte **sempre** cita artigo e o conteúdo deve ser conferido no texto oficial (planalto.gov.br; al.sp.gov.br para a Constituição Estadual).

## Exatidão
- Nada de fato duvidoso. Se não tiver certeza de uma data, número ou artigo, não use.
- Atualidades: **não gerar** (depende de notícias recentes ao edital).
- Valide antes de entregar: `node scripts/validar.mjs dados/questoes/<seu-arquivo>.json` (rode dentro de `missao_diaria/`).
