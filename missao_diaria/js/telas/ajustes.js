import { carregar, salvar, migrar } from '../lib/armazenamento.js';
import { formatarData } from '../lib/datas.js';
import { criarBackup, nomeArquivo, registrarBackup, lerBackup, resumoBackup } from '../lib/backup.js';
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
    secaoBackup());
  atualizarDica();

  function secaoBackup() {
    const msg = el('p', { class: 'tela__texto', role: 'status', id: 'status-backup' });
    const erroImp = el('p', { class: 'erro', role: 'alert', id: 'erro-backup' });
    const confirmacao = el('div', { id: 'confirma-import' });
    const ultimo = el('p', { class: 'tela__texto', id: 'ultimo-backup' },
      estado.ultimoBackup ? `Último backup: ${formatarData(estado.ultimoBackup)}.` : 'Você ainda não fez backup.');

    function exportar() {
      erroImp.textContent = '';
      registrarBackup(estado);
      salvar(estado);
      const blob = new Blob([JSON.stringify(criarBackup(estado), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = el('a', { href: url, download: nomeArquivo() });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      ultimo.textContent = `Último backup: ${formatarData(estado.ultimoBackup)}.`;
      msg.textContent = `Backup salvo no arquivo ${nomeArquivo()}.`;
    }

    async function escolher(ev) {
      const arquivo = ev.target.files[0];
      msg.textContent = '';
      erroImp.textContent = '';
      confirmacao.replaceChildren();
      if (!arquivo) return;
      const r = lerBackup(await arquivo.text());
      ev.target.value = '';
      if (!r.ok) { erroImp.textContent = r.erro; return; }
      const res = resumoBackup(r.estado);
      confirmacao.replaceChildren(el('div', { class: 'aviso', role: 'group', 'aria-labelledby': 'confirma-titulo' },
        el('p', { id: 'confirma-titulo' }, el('strong', {}, 'Substituir seu progresso atual por este backup?')),
        el('p', {}, `O backup tem ${res.respostas} ${res.respostas === 1 ? 'resposta' : 'respostas'} e ${res.simulados} ${res.simulados === 1 ? 'simulado' : 'simulados'}, desde ${formatarData(res.desde)}. `
          + `Seu progresso atual (${estado.respostas.length} respostas) será apagado.`),
        el('button', { type: 'button', class: 'btn btn--primario', 'data-acao': 'confirmar-import', onclick: () => {
          salvar(migrar(r.estado));
          render(raiz);
          raiz.querySelector('#status-backup').textContent = `Progresso restaurado: ${res.respostas} respostas.`;
        } }, 'Substituir progresso'),
        el('button', { type: 'button', class: 'btn', onclick: () => { confirmacao.replaceChildren(); msg.textContent = 'Importação cancelada.'; } }, 'Cancelar')));
      confirmacao.querySelector('button').focus();
    }

    return el('section', { class: 'bloco', 'aria-labelledby': 'h-backup' }, el('h2', { id: 'h-backup' }, 'Backup'),
      el('p', { class: 'tela__texto' }, 'Seu progresso fica só neste aparelho. Exporte um arquivo para guardar ou levar para outro aparelho.'),
      ultimo,
      el('button', { type: 'button', class: 'btn btn--primario', 'data-acao': 'exportar', onclick: exportar }, 'Exportar backup'),
      el('label', { for: 'arquivo-backup', class: 'rotulo' }, 'Importar backup (arquivo .json)'),
      el('input', { id: 'arquivo-backup', class: 'campo', type: 'file', accept: 'application/json,.json', onchange: escolher, 'aria-describedby': 'erro-backup' }),
      erroImp, confirmacao, msg);
  }
}
