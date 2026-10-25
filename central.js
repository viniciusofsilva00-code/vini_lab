// vini_lab · central · lê apps.json e monta a grade de chips.
(function () {
  "use strict";

  var lista = document.getElementById("apps");
  var msg = document.getElementById("apps-msg");
  var STATUS_OFF = ["pausado", "em construção"];

  function el(tag, cls, texto) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (texto != null) n.textContent = texto;
    return n;
  }

  function mostrarMsg(meta, html) {
    var card = el("div", "vl-card");
    card.appendChild(el("span", "vl-card__meta", meta));
    var p = el("p");
    p.innerHTML = html;
    card.appendChild(p);
    msg.replaceChildren(card);
    msg.hidden = false;
  }

  function ehSvg(glifo) {
    return /\.svg$/i.test(glifo);
  }

  function chip(app) {
    var c = el("span", "app__chip");
    c.setAttribute("aria-hidden", "true");
    var glifo = String(app.glifo || app.nome.charAt(0));
    if (ehSvg(glifo)) {
      var g = el("span", "app__glifo-svg");
      g.style.setProperty("--glifo", 'url("' + glifo.replace(/"/g, "%22") + '")');
      c.appendChild(g);
    } else {
      if (glifo.length > 2) console.warn("[central] glifo com mais de 2 caracteres:", app.id);
      c.textContent = glifo.slice(0, 2);
    }
    return c;
  }

  function item(app) {
    var temUrl = typeof app.url === "string" && app.url.trim() !== "";
    var status = app.status || (temUrl ? "online" : "em construção");
    var descId = "desc-" + app.id;
    var no = el(temUrl ? "a" : "div", "app" + (temUrl ? "" : " is-off"));

    if (temUrl) {
      no.href = app.url;
      if (new URL(app.url, location.href).origin !== location.origin) no.rel = "noopener";
      no.setAttribute("aria-label", "abrir " + app.nome);
      no.setAttribute("aria-describedby", descId);
    }

    no.appendChild(chip(app));
    no.appendChild(el("span", "app__nome", app.nome));
    if (!temUrl || status !== "online") {
      var st = el("span", "vl-status" + (STATUS_OFF.indexOf(status) > -1 ? " vl-status--off" : ""));
      st.appendChild(el("span", "sr-only", "status: "));
      st.appendChild(document.createTextNode(status));
      no.appendChild(st);
    }
    var d = el("span", "app__desc", app.descricao || "");
    d.id = descId;
    no.appendChild(d);

    var li = el("li");
    li.appendChild(no);
    return li;
  }

  function render(apps) {
    if (!Array.isArray(apps)) throw new Error("apps.json precisa ser uma lista");
    var validos = apps.filter(function (a) {
      var ok = a && a.id && a.nome;
      if (!ok) console.warn("[central] entrada ignorada, falta id ou nome:", a);
      return ok;
    });
    if (!validos.length) {
      mostrarMsg("status: vazio", "Nenhuma aplicação cadastrada ainda. A primeira entra em <code>apps.json</code>.");
      return;
    }
    validos.sort(function (a, b) { return (a.ordem ?? Infinity) - (b.ordem ?? Infinity); });
    lista.replaceChildren.apply(lista, validos.map(item));
  }

  fetch("apps.json", { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(render)
    .catch(function (e) {
      console.error("[central]", e);
      mostrarMsg("status: quebrou", "Não consegui ler <code>apps.json</code>. Confira se o JSON é válido e se a página está num servidor, não em <code>file://</code>.");
    });
})();
