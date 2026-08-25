// Convierte el CSV de recursos culturales a data/cultura.json.
// Se corre UNA vez: a partir de ahí la fuente de verdad es el JSON, no el CSV.
//   node scripts/csv-a-cultura.mjs ~/Downloads/recursos_culturales_peru_2026.csv
import { readFileSync, writeFileSync } from 'node:fs';

function parseCSV(texto) {
  const filas = [];
  let campo = '', fila = [], enComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') enComillas = false;
      else campo += c;
    } else if (c === '"') enComillas = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  return filas;
}

const [, , ruta] = process.argv;
if (!ruta) { console.error('uso: node scripts/csv-a-cultura.mjs <csv>'); process.exit(1); }

const [cabecera, ...filas] = parseCSV(readFileSync(ruta, 'utf8')).filter(f => f.length > 1);
const col = Object.fromEntries(cabecera.map((n, i) => [n.trim(), i]));

const recursos = filas.map(f => ({
  titulo: f[col.Titulo],
  autor: f[col.Autor],
  anio: Number(f[col.Anio]) || null,
  tipo: f[col.Tipo],
  prioridad: f[col.Prioridad],
  porque: f[col.Por_que_es_interesante],
  tags: f[col.Tags].split(';').map(t => t.trim()).filter(Boolean),
}));

writeFileSync('data/cultura.json', JSON.stringify({
  _nota: 'Generado desde recursos_culturales_peru_2026.csv. Las fichas de guía enlazan aquí por `titulo` exacto.',
  recursos,
}, null, 2) + '\n');
console.log(`cultura.json: ${recursos.length} recursos`);
