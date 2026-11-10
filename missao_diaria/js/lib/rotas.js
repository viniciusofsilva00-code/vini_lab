// Rotas por hash. Função pura: sem acesso a window.
export const TELAS = ['hoje', 'revisao', 'simulado', 'painel', 'ajustes'];

export function telaDaHash(hash) {
  const nome = String(hash ?? '').replace(/^#/, '').toLowerCase();
  return TELAS.includes(nome) ? nome : 'hoje';
}
