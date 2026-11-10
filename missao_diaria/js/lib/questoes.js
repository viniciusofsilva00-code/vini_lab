// Carrega o banco de questões (índice + arquivos) e o edital, com cache em memória.
let cache = null;

export function limparCache() { cache = null; }

export function carregarBanco(buscar = (...a) => fetch(...a)) {
  cache ??= leitura(buscar).catch((e) => { cache = null; throw e; });
  return cache;
}

async function leitura(buscar) {
  const ler = async (caminho) => {
    const r = await buscar(new URL(`../../dados/${caminho}`, import.meta.url));
    if (!r.ok) throw new Error(`Não foi possível carregar ${caminho}`);
    return r.json();
  };
  const [edital, indice] = await Promise.all([ler('edital.json'), ler('questoes/indice.json')]);
  const lotes = await Promise.all(indice.arquivos.map((a) => ler(`questoes/${a}`)));
  return { edital, questoes: lotes.flat() };
}
