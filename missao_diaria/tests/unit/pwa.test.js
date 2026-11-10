import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const raiz = new URL('../../', import.meta.url);
const ler = (p) => readFileSync(new URL(p, raiz), 'utf8');

describe('PWA', () => {
  const m = JSON.parse(ler('manifest.webmanifest'));
  it('manifest com nome, caminhos relativos e modo standalone', () => {
    expect(m).toMatchObject({ name: 'Missão Diária', short_name: 'Missão', display: 'standalone', start_url: './', scope: './' });
  });
  it('ícones 192, 512 e maskable existem', () => {
    const tamanhos = m.icons.map((i) => `${i.sizes}:${i.purpose}`);
    expect(tamanhos).toEqual(expect.arrayContaining(['192x192:any', '512x512:any', '512x512:maskable']));
    for (const i of m.icons) expect(existsSync(new URL(i.src, raiz))).toBe(true);
  });
  it('sw.js lista só arquivos que existem, com caminhos relativos, e cobre o app', () => {
    const lista = JSON.parse(ler('sw.js').match(/const ARQUIVOS = (\[[\s\S]*?\]);/)[1]);
    expect(lista).toEqual(expect.arrayContaining(['index.html', 'js/app.js', 'css/app.css', 'manifest.webmanifest', 'dados/edital.json', 'dados/questoes/indice.json']));
    for (const a of lista) {
      expect(a.startsWith('/')).toBe(false);
      expect(existsSync(new URL(a, raiz)), a).toBe(true);
    }
    expect(ler('sw.js')).toMatch(/const VERSAO = 'missao-diaria-[0-9a-f]{10}'/);
  });
});
