# vini_lab · central

Página inicial das aplicações da vini_lab. Site estático (HTML, CSS e um JS pequeno), sem framework e sem build. A grade é montada a partir de `apps.json`.

```
apps.json            ← lista de aplicações (o único arquivo que muda no dia a dia)
index.html           ← página
central.css          ← layout da página, só tokens
central.js           ← lê apps.json e monta os chips
icons/               ← glifos em SVG próprios (opcional)
design-system/       ← cópia do pacote de marca vini_lab v1.0 (não editar à mão)
```

## Rodar localmente

O `fetch` de `apps.json` não funciona em `file://`, então abra por um servidor:

```bash
python3 -m http.server 8000
```

E acesse `http://localhost:8000/`.

## Cadastrar um app

Acrescente uma entrada em `apps.json`. Nenhum outro arquivo muda.

```json
{
  "id": "prompt_kit",
  "nome": "prompt_kit",
  "glifo": "PK",
  "descricao": "Biblioteca dos prompts que eu uso no trabalho.",
  "url": "https://usuario.github.io/prompt_kit/",
  "status": "em teste",
  "ordem": 2
}
```

| campo | regra |
|---|---|
| `id` | único, sem espaço |
| `nome` | formato `nome_sufixo`, minúsculo |
| `glifo` | 1–2 caracteres, ou caminho de um SVG em `icons/` (ex.: `icons/prompt_kit.svg`); o SVG vira máscara pintada em neon |
| `descricao` | uma linha |
| `url` | link do app; `null` deixa o chip sem link |
| `status` | `online`, `em teste`, `pausado` ou `em construção` |
| `ordem` | número; menor aparece primeiro |

O status aparece sob o nome quando não é `online` ou quando o app não tem `url`. App sem `url` não é clicável.

## Publicar no GitHub Pages

```bash
gh repo create vini_lab --public --source=. --push
```

Depois, em **Settings → Pages**, escolha *Deploy from a branch*, branch `main`, pasta `/ (root)`. Ou pela CLI:

```bash
gh api -X POST repos/{owner}/vini_lab/pages -f "source[branch]=main" -f "source[path]=/"
```

O site fica em `https://<usuario>.github.io/vini_lab/`. Todos os caminhos são relativos, então funciona na raiz ou em subpasta.

## Design system

`design-system/` é cópia do pacote `vini-lab-brand` v1.0 (tokens, `components/components.css`, README e SVGs). Se o manual mudar, substitua a pasta inteira; não edite valores à mão. Tema claro/escuro é automático por `prefers-color-scheme`; para forçar, use `<html data-theme="light|dark">`.
