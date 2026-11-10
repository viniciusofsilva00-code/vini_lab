import { telaDaHash, TELAS } from './lib/rotas.js';

const palco = document.getElementById('tela');
const abas = document.querySelectorAll('.nav a[data-tela]');

async function mostrar() {
  const nome = telaDaHash(location.hash);
  const { render } = await import(`./telas/${nome}.js`);
  render(palco);
  for (const a of abas) {
    if (a.dataset.tela === nome) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  document.title = `${nome[0].toUpperCase()}${nome.slice(1)} · Missão Diária`;
  palco.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

if (!TELAS.includes(location.hash.slice(1))) history.replaceState(null, '', '#hoje');
window.addEventListener('hashchange', mostrar);
mostrar();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
