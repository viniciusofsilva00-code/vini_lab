// Atualiza a lista de arquivos e a versão do cache em sw.js.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const listar = (dir) => readdirSync(join(raiz, dir), { withFileTypes: true }).flatMap((e) => {
  const rel = `${dir}/${e.name}`;
  return e.isDirectory() ? listar(rel) : [rel];
});

const app = [
  './', 'index.html', 'manifest.webmanifest', ...listar('css'), ...listar('js'), ...listar('icons'),
  'dados/edital.json', '../design-system/tokens/tokens.css', '../design-system/components/components.css',
].sort();
const questoes = existsSync(join(raiz, 'dados/questoes')) ? listar('dados/questoes').filter((f) => f.endsWith('.json')).sort() : [];

const hash = createHash('sha256');
for (const a of app) {
  if (a === './') continue;
  hash.update(a).update(readFileSync(join(raiz, a)));
}
const versao = `missao-diaria-${hash.digest('hex').slice(0, 10)}`;

const caminho = join(raiz, 'sw.js');
const novo = `/* GERADO:INICIO */\nconst VERSAO = '${versao}';\nconst ARQUIVOS = ${JSON.stringify([...app, ...questoes], null, 2)};\n/* GERADO:FIM */`;
const atual = readFileSync(caminho, 'utf8');
const saida = atual.replace(/\/\* GERADO:INICIO \*\/[\s\S]*\/\* GERADO:FIM \*\//, novo);
if (saida !== atual) writeFileSync(caminho, saida);
console.log(`sw.js: ${versao}, ${app.length + questoes.length} arquivos (${relative(raiz, caminho)})`);
