# missao_diaria

App de estudo para a prova de Soldado PM-SP: missão diária curta de questões, correção imediata com explicação, revisão espaçada, simulado e painel de evolução.

- **Stack:** HTML + CSS + JS puro (ES modules), sem build. Dados do usuário em `localStorage`. Questões em `dados/questoes/*.json`. Publicado pelo GitHub Pages do vini_lab em `/missao_diaria/`.
- **Visual:** `../design-system/` com o tema militar de `css/tema.css` (oliva/cáqui/areia). Não usar o rosa/neon do vini_lab.
- **Comandos** (dentro de `missao_diaria/`):
  - `npm run dev`: servidor local em http://localhost:8010/missao_diaria/ (serve a raiz do vini_lab)
  - `npm run lint` · `npm test` (Vitest) · `npm run test:e2e` (Playwright + axe)
- **Convenções:** interface em pt-BR; lógica pura em `js/lib/` com teste antes do código (TDD); telas em `js/telas/`; texto 16px+, foco visível, contraste AA, `prefers-reduced-motion`; nenhum dado sai do aparelho.
- **Conteúdo jurídico:** toda questão cita artigo e lei conferidos em fonte oficial.
- Plano em `PLANO.md`; memória no ai-memory, projeto `missao-diaria`.
