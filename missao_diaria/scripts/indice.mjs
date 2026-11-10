// Gera dados/questoes/indice.json com a lista dos arquivos de questões.
import { readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pasta = join(dirname(fileURLToPath(import.meta.url)), '../dados/questoes');
const arquivos = readdirSync(pasta).filter((f) => f.endsWith('.json') && f !== 'indice.json').sort();
writeFileSync(join(pasta, 'indice.json'), `${JSON.stringify({ arquivos }, null, 2)}\n`);
console.log(`indice.json: ${arquivos.length} arquivo(s)`);
