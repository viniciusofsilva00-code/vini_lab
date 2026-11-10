// Cria elementos sem innerHTML: todo texto entra via textContent.
export function el(tag, attrs = {}, ...filhos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const f of filhos.flat()) if (f != null && f !== false) e.append(f);
  return e;
}

// Igual a el(), para elementos SVG.
export function svg(tag, attrs = {}, ...filhos) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== false && v != null) e.setAttribute(k, v);
  for (const f of filhos.flat()) if (f != null && f !== false) e.append(f);
  return e;
}

// replaceChildren sem escrever "null"/"false" na tela quando um filho é opcional.
export function trocar(no, ...filhos) {
  no.replaceChildren(...filhos.flat().filter((f) => f != null && f !== false));
}
