import { carregar, salvar } from '../lib/armazenamento.js';
import { validarMeta, metaEfetiva } from '../lib/perfil.js';
import { el } from './componentes/dom.js';

export function render(raiz) {
  const estado = carregar();
  const p = estado.perfil;
  const status = el('p', { class: 'tela__texto', role: 'status', id: 'status-ajustes' });
  const erro = el('p', { class: 'erro', role: 'alert', id: 'erro-meta' });
  const valor = el('input', {
    id: 'meta-valor', class: 'campo', type: 'number', inputmode: 'numeric', value: String(p.meta.valor),
    'aria-describedby': 'erro-meta dica-meta',
  });
  const dica = el('p', { class: 'tela__texto', id: 'dica-meta' });
  const radio = (v, rotulo) => el('label', { class: 'opcao' },
    el('input', { type: 'radio', name: 'tipo', value: v, checked: p.meta.tipo === v, onchange: atualizarDica }), ` ${rotulo}`);
  const leve = el('input', { type: 'checkbox', id: 'modo-leve', checked: p.modoLeve });
  const acertos = el('input', { type: 'checkbox', id: 'incluir-acertos', checked: p.incluirAcertosRevisao });
  const tipo = () => raiz.querySelector('input[name="tipo"]:checked').value;

  function atualizarDica() {
    const t = tipo();
    dica.textContent = t === 'questoes' ? 'De 5 a 40 questões por dia.' : 'De 10 a 120 minutos por dia (estimamos 2 minutos por questão).';
  }

  function salvarAjustes(ev) {
    ev.preventDefault();
    status.textContent = '';
    const v = validarMeta(tipo(), valor.value);
    if (!v.ok) {
      erro.textContent = v.erro;
      valor.setAttribute('aria-invalid', 'true');
      valor.focus();
      return;
    }
    erro.textContent = '';
    valor.removeAttribute('aria-invalid');
    estado.perfil = { ...estado.perfil, meta: v.meta, modoLeve: leve.checked, incluirAcertosRevisao: acertos.checked };
    salvar(estado);
    status.textContent = `Ajustes salvos. Sua missão terá ${metaEfetiva(estado.perfil)} questões a partir da próxima missão (a de hoje não muda).`;
  }

  raiz.replaceChildren(
    el('h1', { class: 'vl-h1 tela__titulo' }, 'Ajustes'),
    el('form', { class: 'form', onsubmit: salvarAjustes, novalidate: true },
      el('fieldset', {}, el('legend', {}, 'Meta diária'),
        radio('questoes', 'Em questões'), radio('minutos', 'Em minutos'),
        el('label', { for: 'meta-valor', class: 'rotulo' }, 'Quantidade'), valor, dica, erro),
      el('label', { class: 'opcao' }, leve, ' Modo leve (metade da meta, no mínimo 3 questões)'),
      el('label', { class: 'opcao' }, acertos, ' Incluir acertos na revisão (voltam em intervalos longos)'),
      el('button', { type: 'submit', class: 'btn btn--primario' }, 'Salvar'),
      status),
    el('section', { class: 'bloco' }, el('h2', {}, 'Backup'),
      el('p', { class: 'tela__texto' }, 'Em breve: exportar e importar seu progresso.')));
  atualizarDica();
}
