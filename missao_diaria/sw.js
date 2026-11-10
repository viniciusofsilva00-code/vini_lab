// Service worker: app offline. A lista e a versão entre os marcadores são geradas por scripts/sw.mjs.
/* GERADO:INICIO */
const VERSAO = 'missao-diaria-c67942066b';
const ARQUIVOS = [
  "../design-system/components/components.css",
  "../design-system/tokens/tokens.css",
  "./",
  "css/app.css",
  "css/tema.css",
  "dados/edital.json",
  "icons/icone-192.png",
  "icons/icone-512.png",
  "icons/icone-maskable-512.png",
  "index.html",
  "js/app.js",
  "js/lib/armazenamento.js",
  "js/lib/backup.js",
  "js/lib/banco.js",
  "js/lib/datas.js",
  "js/lib/estatisticas.js",
  "js/lib/missao.js",
  "js/lib/notas.js",
  "js/lib/perfil.js",
  "js/lib/questoes.js",
  "js/lib/revisao.js",
  "js/lib/rotas.js",
  "js/lib/simulado.js",
  "js/telas/ajustes.js",
  "js/telas/componentes/dom.js",
  "js/telas/componentes/questao.js",
  "js/telas/componentes/salvar.js",
  "js/telas/hoje.js",
  "js/telas/painel.js",
  "js/telas/revisao.js",
  "js/telas/simulado.js",
  "manifest.webmanifest",
  "dados/questoes/adm-1.json",
  "dados/questoes/adm-2.json",
  "dados/questoes/adm-3.json",
  "dados/questoes/cge-g1.json",
  "dados/questoes/cge-g2.json",
  "dados/questoes/cge-g3.json",
  "dados/questoes/cge-h1.json",
  "dados/questoes/cge-h2.json",
  "dados/questoes/cge-h3.json",
  "dados/questoes/indice.json",
  "dados/questoes/inf-1.json",
  "dados/questoes/inf-2.json",
  "dados/questoes/inf-3.json",
  "dados/questoes/mat-a1.json",
  "dados/questoes/mat-a2.json",
  "dados/questoes/mat-a3.json",
  "dados/questoes/mat-b1.json",
  "dados/questoes/mat-b2.json",
  "dados/questoes/mat-b3.json",
  "dados/questoes/por-a1.json",
  "dados/questoes/por-a2.json",
  "dados/questoes/por-a3.json",
  "dados/questoes/por-a4.json",
  "dados/questoes/por-b1.json",
  "dados/questoes/por-b2.json",
  "dados/questoes/por-b3.json",
  "dados/questoes/por-b4.json"
];
/* GERADO:FIM */

const base = self.registration.scope;
const url = (a) => new URL(a, base).href;

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS.map((a) => new Request(url(a), { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(caches.keys()
    .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()));
});

async function redeDepois(req) {
  const cache = await caches.open(VERSAO);
  try {
    const r = await fetch(req);
    if (r.ok) cache.put(req, r.clone());
    return r;
  } catch (e) {
    const guardada = await cache.match(req);
    if (guardada) return guardada;
    throw e;
  }
}

async function cacheDepois(req) {
  const cache = await caches.open(VERSAO);
  const guardada = await cache.match(req, { ignoreSearch: true });
  if (guardada) return guardada;
  const r = await fetch(req);
  if (r.ok) cache.put(req, r.clone());
  return r;
}

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== location.origin) return;
  if (u.pathname.includes('/dados/questoes/')) ev.respondWith(redeDepois(req));
  else if (req.mode === 'navigate') ev.respondWith(cacheDepois(new Request(url('index.html'))).catch(() => fetch(req)));
  else ev.respondWith(cacheDepois(req));
});
