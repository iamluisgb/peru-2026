// Descarga las fotos confirmadas, las optimiza y escribe data/fotos.json, que es lo que lee
// la app. Es un paso de PREPARACIÓN, no de despliegue: se corre a mano cuando cambian las
// candidatas, y su salida (img/ y data/fotos.json) se commitea.
//
// Se descargan y se sirven desde el propio repo, no se enlazan a Wikimedia. Enlazar sería
// más barato hoy y estaría roto en el Colca: una foto en el servidor de otro es RED, y esta
// app existe para funcionar sin ella.
//
//   node scripts/descargar-fotos.mjs [--rehacer]
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ANCHO = 1200;      // suficiente para pantalla retina a ancho de columna
const CALIDAD = 78;      // por encima no se nota y el fichero crece un 40 %
const UA = 'peru-2026/1.0 (guia de viaje personal; https://github.com/iamluisgb/peru-2026)';
const ESPERA = 1600;     // Wikimedia devuelve 429 si se le pide más rápido

const rehacer = process.argv.includes('--rehacer');
const dormir = ms => new Promise(r => setTimeout(r, ms));
mkdirSync('img/sitios', { recursive: true });

const veredictos = JSON.parse(readFileSync('data/fotos/veredictos.json', 'utf8')).veredictos;

// Una por ficha: la primera que el revisor visual dio por buena Y útil. El orden de las
// candidatas ya venía de mejor a peor del agente que las buscó.
const elegidas = new Map();
for (const v of veredictos) {
  if (v.veredicto !== 'SI' || v.util !== 'SI') continue;
  if (!elegidas.has(v.id)) elegidas.set(v.id, v);
}

const salida = {};
const fallos = [];

for (const [id, v] of elegidas) {
  const destino = `img/sitios/${id}.webp`;
  if (existsSync(destino) && !rehacer) {
    salida[id] = manifiesto(id, v, destino);
    continue;
  }
  const url = v.url_fichero || v.url;
  process.stdout.write(`${id.padEnd(24)} `);
  try {
    await dormir(ESPERA);
    execFileSync('curl', ['-sL', '--fail', '--max-time', '90', '-A', UA, '-o', '/tmp/foto.bin', url]);
    // cwebp no lee cualquier cosa: se normaliza a JPEG con sips y luego se convierte.
    execFileSync('sips', ['-Z', String(ANCHO), '-s', 'format', 'jpeg', '/tmp/foto.bin', '--out', '/tmp/foto.jpg'], { stdio: 'ignore' });
    execFileSync('cwebp', ['-quiet', '-q', String(CALIDAD), '/tmp/foto.jpg', '-o', destino]);
    console.log(`${Math.round(statSync(destino).size / 1024)} KB`);
    salida[id] = manifiesto(id, v, destino);
  } catch (e) {
    console.log('✗ ' + String(e.message).slice(0, 40));
    fallos.push(id);
  }
}

function manifiesto(id, v, ruta) {
  return {
    src: './' + ruta,
    alt: v.veo || v.por_que || '',            // lo que el revisor VIO, no lo que prometía el título
    autor: v.autor || null,
    licencia: v.licencia || null,
    origen: v.url_pagina || v.url_fichero || null,
  };
}

writeFileSync('data/fotos.json', JSON.stringify({
  _nota: 'GENERADO por scripts/descargar-fotos.mjs a partir de data/fotos/veredictos.json. ' +
         'Sólo entran fotos que un revisor visual confirmó como el sitio Y como útiles.',
  sitios: salida,
}, null, 2) + '\n');

const kb = Object.values(salida).reduce((a, f) => a + Math.round(statSync(f.src.slice(2)).size / 1024), 0);
console.log(`\n${Object.keys(salida).length} fotos · ${kb} KB en total (${(kb / 1024).toFixed(1)} MB)`);
if (fallos.length) console.log('fallaron:', fallos.join(', '));
