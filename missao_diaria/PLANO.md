# missao_diaria
> slug ai-memory: `missao-diaria` · workspace: `default` · pasta: `vini_lab/missao_diaria/`

## Objetivo
Preparar para a prova de **Soldado PM de 2ª Classe da PM-SP** (estilo Vunesp) com uma "missão" diária curta: poucas questões por dia, correção na hora e explicação que ensina. O ritmo é de cada um e o painel mostra a evolução.

## Usuários
Amigos do Vinicius que recebem o link, começando por um. Sem login, sem venda: quem tem o link usa, e cada aparelho guarda o próprio progresso. O uso principal é no celular.

## MVP: dentro do escopo
- **Ajustes de ritmo:** meta diária em questões (5–40) ou em minutos, **modo leve** (metade da meta) e opção "incluir acertos na revisão". Pode mudar a qualquer momento.
- **Missão do dia:** mistura de revisões vencidas (primeiro as erradas) e questões novas. As novas têm mais peso nas matérias que mais caem no edital e nas que a pessoa mais erra. Dia perdido não acumula pilha.
- **Correção imediata:** depois de cada resposta aparecem certo ou errado, o passo a passo da resolução, por que cada alternativa errada está errada, a pegadinha da banca e a fonte (artigo de lei, regra gramatical).
- **Resumo do dia:** nota geral e por matéria, mais o que revisar amanhã.
- **Revisão espaçada de todas as questões:** as erradas voltam sempre, em intervalos curtos. As acertadas voltam só se a opção estiver ligada, em intervalos longos. Também tem revisão livre por matéria, por erradas ou por acertadas.
- **Simulado cronometrado:** número de questões e tempo ajustáveis, com padrão igual à prova real. Correção no fim, como na prova, com resultado por matéria e tempo médio por questão.
- **Painel de evolução (prioridade):** % de acerto por semana, por matéria comparando o início com agora, sequência de dias, total respondido e a frase "você melhorou X pontos em Y desde o início".
- **Backup do progresso (prioridade):** exportar e importar um arquivo, com aviso periódico para fazer backup.
- **Banco de questões:** começa com ~100 questões cobrindo todas as matérias e cresce em lotes até ~500.

## Fora do escopo / Depois
Questões de provas anteriores · ranking entre amigos · sincronização entre aparelhos (login/Supabase) · outros concursos.

## Stack
- HTML + CSS + JavaScript puro (ES modules), sem framework e sem build, no mesmo padrão do vini_lab. Publicado pelo GitHub Pages do vini_lab em `/missao_diaria/`.
- Visual: `design-system/` do vini_lab com **tema militar próprio**, sem rosa. O neon é trocado por verde-oliva, cáqui e areia, com preto e verde-escuro. Claro e escuro, mantendo o contraste AA.
- Dados do usuário em `localStorage` (esquema versionado). Banco de questões em JSON por matéria (`dados/questoes/*.json`).
- PWA (manifest + service worker): instala no celular e funciona offline.
- Ferramentas de dev em `missao_diaria/package.json` (o app não depende delas): Vitest, ESLint, Playwright + axe-core.

## Modelo de dados (entidades principais)
- **Questao**: id, matéria, assunto, dificuldade, enunciado, alternativas, correta, explicação {passos, porQueErradas, pegadinha, fonte}, origem (`gerada` | `prova`).
- **Perfil**: tipo e valor da meta, modo leve, incluir acertos na revisão, data de início.
- **Resposta**: questão, data, alternativa escolhida, acertou, tempo, contexto (`missao` | `revisao` | `simulado`).
- **CartaoRevisao**: questão, caixa (nível) e próxima data.
- **Missao**: data, ids das questões, concluída.
- **Simulado**: data, questões, respostas, duração e nota por matéria.
- **Backup**: versão do esquema, data, Perfil, Respostas, Cartões, Missões, Simulados.

## Regras importantes
- **Intervalos da revisão:** caixas com 1, 3, 7, 15 e 30 dias. Errou → volta para a caixa 1. Acertou → sobe uma caixa. Acertos só entram se a opção estiver ligada, e a partir da caixa 3.
- **Missão:** até ~40% de revisão, com as erradas primeiro, e o resto de questões novas. Se houver mais revisões vencidas do que cabem, o excedente passa para os próximos dias, sem estourar a meta.
- O "dia" segue o fuso America/Sao_Paulo. A missão é gerada uma vez por dia e fica fixa.
- **Conteúdo jurídico** (CF, legislação estadual, Direitos Humanos etc.) sempre com artigo e lei, conferido em fonte oficial (planalto.gov.br, al.sp.gov.br). Questão sem fonte não entra no banco.
- **Importação de backup:** valida a versão e a estrutura e pede confirmação antes de substituir o progresso atual.
- **Privacidade:** nenhum dado sai do aparelho, sem analytics e sem cookies de terceiros.

## Qualidade e critério de pronto
- **TDD na lógica** (`js/lib/`: sorteio da missão, revisão espaçada, notas, estatísticas do painel, backup e datas) com Vitest.
- Teste que valida o banco inteiro: uma correta por questão, alternativas completas, explicação e fonte presentes, ids únicos.
- Playwright em viewport de celular (pt-BR, TZ São Paulo) nos fluxos principais, mais axe-core sem violações.
- Cada etapa só está pronta com `npm run lint`, `npm test` e `npm run test:e2e` limpos e a passagem do `revisor`.

## Etapas
- [x] 1. **Esqueleto e tema militar:** pasta, `index.html`, tema oliva sobre o design system, navegação (Hoje · Revisão · Simulado · Painel · Ajustes), ferramentas de dev e entrada em `apps.json` como "em construção". Pronto: abre local e o axe passa limpo.
- [x] 2. **Edital e formato da questão:** matérias e pesos conferidos no edital PM-SP mais recente, formato do JSON, validador do banco e lote piloto de 20 questões. Pronto: validador verde e você aprova o estilo das questões.
- [x] 3. **Motor local:** armazenamento versionado, perfil/meta e sorteio da missão (TDD). Pronto: testes de sorteio cobrindo meta, modo leve e pesos.
- [x] 4. **Tela da missão:** responder, correção imediata, explicação e resumo do dia. Pronto: e2e de uma missão completa.
- [x] 5. **Revisão espaçada** (TDD) e tela de revisão (erradas, acertadas opcional, filtro por matéria). Pronto: testes das caixas e e2e.
- [ ] 6. **Banco lote 1:** ~100 questões em todas as matérias. Pronto: validador verde e amostra revisada.
- [x] 7. **Painel de evolução.** Pronto: estatísticas testadas e o painel mostra a melhora com dados de exemplo.
- [x] 8. **Backup** exportar/importar (TDD) e aviso de backup. Pronto: exporta, importa em outro navegador e o progresso continua igual.
- [x] 9. **Simulado cronometrado.** Pronto: e2e com tempo curto, correção no fim e resultado no painel.
- [x] 10. **PWA e publicação:** instalável e offline, merge na main, `apps.json` como "online" e teste com o amigo. Pronto: ele usa pelo link no celular.
- [x] 11. **Banco lotes 2 a 5** (100 por lote, até ~500), ajustados pelo uso dele.

## Decisões tomadas
- App estático, sem login: o público é pequeno e o custo é zero. Login fica para quando houver sincronização.
- Questões geradas em lote pelo Claude e conferidas: o app não tem custo de API, e as explicações já vêm completas.
- Correção imediata na missão e correção no fim do simulado: aprender no dia a dia, treinar a prova no simulado.
- Revisão espaçada em caixas: simples de entender e testar, e prioriza os erros.
- Fica dentro do vini_lab, não em repositório próprio: pedido do Vinicius, mesmo padrão do nfs_wiki e do quarto_bebe.
- Sem `docs/dev/` do método padrão: o app é pequeno e estático, então PLANO.md + CLAUDE.md bastam.
- Banco começa com ~100 questões para validar com o amigo; a meta é ~500 (pedido do Vinicius).

## Dúvidas em aberto
- Resolvido na etapa 2 (edital DP-2/321/25): 60 questões, 5 alternativas, Português 20, Matemática 15, Conhecimentos Gerais 15, Informática 5, Adm. Pública 5; 5h com redação; mínimo 30. Atualidades fica fora do banco (depende de notícias recentes). Edital 2026 (DP-3/321/26) deve manter a estrutura: conferir quando sair o PDF.
- Nome que aparece no app: "Missão Diária" (o id no vini_lab é `missao_diaria`).
