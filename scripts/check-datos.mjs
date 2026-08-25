// Lista lo que sigue sin verificar. Nada con verificado:false debe llegar a producción
// (CLAUDE.md — "No inventamos cifras").
import { readFileSync, readdirSync } from 'node:fs';

const raiz = new URL('../', import.meta.url);
const leer = (p) => JSON.parse(readFileSync(new URL(p, raiz), 'utf8'));

const pendientes = [];

for (const p of leer('data/itinerario.json').paradas)
  if (p.verificado === false) pendientes.push(`parada ${p.id} — altitud ${p.altitud_m} m`);

for (const h of leer('data/itinerario.json').hoteles)
  if (!h.direccion) pendientes.push(`hotel ${h.nombre} — sin dirección`);

for (const f of readdirSync(new URL('data/guia/', raiz)).filter(f => f.endsWith('.json')))
  for (const ficha of leer(`data/guia/${f}`).fichas) {
    if (ficha.verificado === false) pendientes.push(`ficha ${ficha.id} — sin verificar`);
    if (ficha.de_pie.mira.some(m => m.includes('PENDIENTE'))) pendientes.push(`ficha ${ficha.id} — "mira" sin escribir`);
  }

if (!pendientes.length) { console.log('✓ todo verificado'); process.exit(0); }
console.log(`${pendientes.length} pendientes:\n`);
for (const p of pendientes) console.log(`  · ${p}`);
