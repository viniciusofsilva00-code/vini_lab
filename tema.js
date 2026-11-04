// vini_lab · alterna tema claro/escuro e guarda a escolha neste navegador (chave vl_tema).
// O tema salvo é aplicado antes da pintura por um script inline no <head>.
(function () {
  "use strict";

  var raiz = document.documentElement;
  var btn = document.getElementById("tema-btn");
  if (!btn) return;
  var escuroSistema = window.matchMedia("(prefers-color-scheme: dark)");

  function atual() {
    return raiz.dataset.theme || (escuroSistema.matches ? "dark" : "light");
  }

  function pintar() {
    var escuro = atual() === "dark";
    var rotulo = escuro ? "Usar tema claro" : "Usar tema escuro";
    btn.textContent = escuro ? "☀ claro" : "☾ escuro";
    btn.setAttribute("aria-label", rotulo);
    btn.title = rotulo;
  }

  btn.addEventListener("click", function () {
    var novo = atual() === "dark" ? "light" : "dark";
    raiz.dataset.theme = novo;
    try { localStorage.setItem("vl_tema", novo); } catch (e) {}
    pintar();
  });
  escuroSistema.addEventListener("change", pintar);

  pintar();
  btn.hidden = false;
})();
