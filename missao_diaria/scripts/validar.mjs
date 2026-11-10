// Uso: node scripts/validar.mjs dados/questoes/arquivo.json [...]
// Sem argumentos valida todos os arquivos de dados/questoes/.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarBanco } from '../js/lib/banco.js';

const base = join(dirname(fileURLToPath(import.meta.url)), '..');
const edital = JSON.parse(readFileSync(join(base, 'dados/edital.json'), 'utf8'));
const pasta = join(base, 'dados/questoes');
const arquivos = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(pasta).filter((f) => f.endsWith('.json') && f !== 'indice.json').map((f) => join(pasta, f));

let todas = [];
for (const arq of arquivos) {
  try {
    const dados = JSON.parse(readFileSync(arq, 'utf8'));
    if (!Array.isArray(dados)) throw new Error('o arquivo deve conter um array de questões');
    todas = todas.concat(dados);
  } catch (e) {
    console.error(`${arq}: JSON inválido — ${e.message}`);
    process.exit(1);
  }
}
const erros = validarBanco(todas, edital);
const cont = [0, 0, 0, 0, 0];
todas.forEach((q) => { if (q.correta >= 0 && q.correta <= 4) cont[q.correta]++; });
console.log(`${todas.length} questões · corretas por letra A-E: ${cont.join(' / ')}`);
if (erros.length) {
  console.error(erros.join('\n'));
  process.exit(1);
}
console.log('OK');
