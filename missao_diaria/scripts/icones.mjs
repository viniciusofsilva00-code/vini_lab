// Gera os ícones PNG do app (estrela em areia sobre oliva), sem dependências.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pasta = join(dirname(fileURLToPath(import.meta.url)), '../icons');
const OLIVA = [70, 83, 31];
const AREIA = [236, 230, 211];
const CAQUI = [201, 181, 122];

const tabela = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = tabela[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function bloco(tipo, dados) {
  const t = Buffer.from(tipo);
  const len = Buffer.alloc(4); len.writeUInt32BE(dados.length);
  const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(Buffer.concat([t, dados])));
  return Buffer.concat([len, t, dados, sum]);
}
function png(tam, pixel) {
  const linhas = Buffer.alloc((tam * 4 + 1) * tam);
  for (let y = 0; y < tam; y++) {
    linhas[y * (tam * 4 + 1)] = 0;
    for (let x = 0; x < tam; x++) {
      const [r, g, b, a] = pixel(x, y);
      linhas.set([r, g, b, a], y * (tam * 4 + 1) + 1 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tam, 0); ihdr.writeUInt32BE(tam, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloco('IHDR', ihdr), bloco('IDAT', deflateSync(linhas)), bloco('IEND', Buffer.alloc(0))]);
}

function estrela(R) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? R : R * 0.4;
    pts.push([Math.cos(ang) * r, Math.sin(ang) * r]);
  }
  return pts;
}
function dentro(pts, x, y) {
  let d = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]; const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
}

// maskable: fundo sangrando até a borda e desenho na zona segura (80%).
function icone(tam, { maskable }) {
  const c = tam / 2;
  const pts = estrela(tam * (maskable ? 0.27 : 0.3));
  const anel = [tam * (maskable ? 0.36 : 0.4), tam * (maskable ? 0.38 : 0.425)];
  const raioCanto = tam * 0.18;
  const SS = 3;
  return png(tam, (px, py) => {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const x = px + (sx + 0.5) / SS; const y = py + (sy + 0.5) / SS;
      const dx = x - c; const dy = y - c;
      const d = Math.hypot(dx, dy);
      let cor = null;
      const nCanto = Math.max(Math.abs(dx) - (c - raioCanto), 0); const nCantoY = Math.max(Math.abs(dy) - (c - raioCanto), 0);
      if (maskable || Math.hypot(nCanto, nCantoY) <= raioCanto) cor = OLIVA;
      if (cor && d >= anel[0] && d <= anel[1]) cor = CAQUI;
      if (cor && dentro(pts, dx, dy + tam * 0.01)) cor = AREIA;
      if (cor) { r += cor[0]; g += cor[1]; b += cor[2]; a += 255; }
    }
    const n = SS * SS;
    return a ? [Math.round(r / (a / 255)), Math.round(g / (a / 255)), Math.round(b / (a / 255)), Math.round(a / n)] : [0, 0, 0, 0];
  });
}

writeFileSync(join(pasta, 'icone-192.png'), icone(192, { maskable: false }));
writeFileSync(join(pasta, 'icone-512.png'), icone(512, { maskable: false }));
writeFileSync(join(pasta, 'icone-maskable-512.png'), icone(512, { maskable: true }));
console.log('ícones gerados em icons/');
