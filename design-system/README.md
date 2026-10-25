# vini-lab-brand · v1.0 · 2026-10-24

Pacote de marca da **vini_lab** (marca-mãe do `portal_ia`).

- `manual.html` — manual completo, autocontido (só o Google Fonts vem da rede).
- `tokens/tokens.css` — tokens claro/escuro; `tokens/tokens.json` — formato W3C DTCG (`$extensions.vini_lab.origem` = herdado | novo | evolucao).
- `components/components.css` + `components/index.html` — componentes base (classe `vl-*`), só tokens.
- `logo/` — SVG com texto convertido em path (JetBrains Mono Bold). Cada peça em `light`, `dark`, `mono-black`, `mono-white`.
  - `icon/`, `wordmark/`, `stacked/`, `favicon/` (16 tem desenho próprio; `.ico` e PNGs), `avatar/` (512 SVG+PNG), `endorsement/` (portal_ia · um projeto vini_lab), `signature/` (vini_lab + Vinicius Ferreira), `concepts/` (A `v.`, B `v_` escolhido, C `v▮`).

Uso rápido no HTML:

```html
<link rel="stylesheet" href="tokens/tokens.css">
<link rel="stylesheet" href="components/components.css">
<body class="vl-body"> … </body>
```

Tema: automático por `prefers-color-scheme`; force com `<html data-theme="light|dark">`.
Grafia: sempre `vini_lab`.
