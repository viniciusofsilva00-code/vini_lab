import { telaDaHash, TELAS } from './lib/rotas.js';

const palco = document.getElementById('tela');
const abas = document.querySelectorAll('.nav a[data-tela]');
let navegacao = 0; // token: só o render mais recente pode pintar

async function mostrar() {
  const meu = ++navegacao;
  const ativo = () => meu === navegacao;
  const nome = telaDaHash(location.hash);
  let modulo;
  try {
    modulo = await import(`./telas/${nome}.js`);
  } catch {
    if (!ativo()) return;
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'btn';
    botao.textContent = 'Tentar de novo';
    botao.addEventListener('click', mostrar);
    const aviso = document.createElement('p');
    aviso.className = 'aviso';
    aviso.setAttribute('role', 'alert');
    aviso.textContent = 'Não consegui carregar esta tela. Confira a conexão e tente de novo.';
    palco.replaceChildren(aviso, botao);
    return;
  }
  if (!ativo()) return;
  await modulo.render(palco, ativo);
  if (!ativo()) return;
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
