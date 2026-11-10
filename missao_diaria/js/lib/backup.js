// Backup do progresso: exportar/importar o estado como JSON. Funções puras.
import { hoje, diferencaDias } from './datas.js';

export const APP = 'missao_diaria';
export const VERSAO_BACKUP = 1;
const MIN_RESPOSTAS_AVISO = 20;
const DIAS_AVISO = 7;

export function nomeArquivo(agora = new Date()) {
  return `missao-diaria-backup-${hoje(agora)}.json`;
}

export function registrarBackup(estado, agora = new Date()) {
  estado.ultimoBackup = hoje(agora);
}

export function criarBackup(estado, agora = new Date()) {
  return { app: APP, versao: VERSAO_BACKUP, exportadoEm: agora.toISOString(), estado };
}

const objeto = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const ESTRUTURA = 'O arquivo está com dados fora do formato esperado (estrutura inválida).';

function respostaValida(r) {
  return objeto(r) && typeof r.questao === 'string' && typeof r.data === 'string' && typeof r.acertou === 'boolean';
}

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const inteiroNaoNeg = (n) => Number.isInteger(n) && n >= 0;

function cartaoValido(c) {
  return objeto(c) && Number.isInteger(c.caixa) && c.caixa >= 1 && c.caixa <= 5
    && typeof c.proxima === 'string' && DATA_ISO.test(c.proxima);
}

function metaValida(m) {
  return objeto(m) && (m.tipo === 'questoes' || m.tipo === 'minutos') && typeof m.valor === 'number' && Number.isFinite(m.valor);
}

function simuladoAtualValido(s) {
  return objeto(s) && Number.isFinite(s.inicio) && Number.isFinite(s.marca)
    && Number.isFinite(s.minutos) && s.minutos > 0
    && Array.isArray(s.ids) && s.ids.length > 0 && s.ids.every((id) => typeof id === 'string')
    && Number.isInteger(s.atual) && s.atual >= 0 && s.atual < s.ids.length
    && objeto(s.respostas) && Object.values(s.respostas).every(inteiroNaoNeg)
    && objeto(s.tempos) && Object.values(s.tempos).every((t) => Number.isFinite(t) && t >= 0);
}

export function lerBackup(texto) {
  let b;
  try { b = JSON.parse(texto); } catch { return { ok: false, erro: 'O arquivo não é um JSON válido.' }; }
  if (!objeto(b) || b.app !== APP) return { ok: false, erro: 'Este arquivo não é um backup do Missão Diária.' };
  if (!Number.isInteger(b.versao) || b.versao < 1) return { ok: false, erro: 'O backup não informa uma versão válida.' };
  if (b.versao > VERSAO_BACKUP) return { ok: false, erro: 'Este backup é de uma versão mais nova do app. Atualize o app e tente de novo.' };
  const e = b.estado;
  const valido = objeto(e) && objeto(e.perfil) && Array.isArray(e.respostas) && e.respostas.every(respostaValida)
    && metaValida(e.perfil.meta)
    && objeto(e.cartoes) && Object.values(e.cartoes).every(cartaoValido) && objeto(e.missoes) && Array.isArray(e.simulados);
  if (!valido) return { ok: false, erro: ESTRUTURA };
  if (e.simuladoAtual !== undefined && e.simuladoAtual !== null && !simuladoAtualValido(e.simuladoAtual)) delete e.simuladoAtual;
  return { ok: true, estado: e, exportadoEm: b.exportadoEm };
}

export function resumoBackup(estado) {
  const datas = estado.respostas.map((r) => r.data).sort();
  return { respostas: estado.respostas.length, desde: datas[0] ?? estado.perfil.inicio, simulados: estado.simulados.length };
}

// 'nunca' | 'antigo' | null. Dispensar esconde o aviso por 7 dias.
export function avisoBackup(estado, data) {
  if (estado.avisoBackupDispensado && diferencaDias(estado.avisoBackupDispensado, data) <= DIAS_AVISO - 1) return null;
  if (!estado.ultimoBackup) return estado.respostas.length >= MIN_RESPOSTAS_AVISO ? 'nunca' : null;
  return diferencaDias(estado.ultimoBackup, data) > DIAS_AVISO ? 'antigo' : null;
}

export function dispensarAviso(estado, data) {
  estado.avisoBackupDispensado = data;
}
