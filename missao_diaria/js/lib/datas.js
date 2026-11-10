// Datas como 'AAAA-MM-DD' no fuso America/Sao_Paulo. Funções puras (Date injetável).
const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function hoje(agora = new Date()) {
  return fmt.format(agora);
}

const DIA_MS = 86400000;
const utc = (d) => Date.parse(`${d}T00:00:00Z`);

export function somarDias(data, n) {
  return new Date(utc(data) + n * DIA_MS).toISOString().slice(0, 10);
}

export function diferencaDias(a, b) {
  return Math.round((utc(b) - utc(a)) / DIA_MS);
}
