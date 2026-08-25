// La lista ASSETS del service worker se mantiene A MANO, y en bookreader ya se desincronizó
// (tres módulos en uso sin precachear). Sin red, un fichero que falta es una pantalla en blanco.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const raiz = new URL('../', import.meta.url);
const sw = readFileSync(new URL('sw.js', raiz), 'utf8');

function ficherosDe(dir, ext) {
  const salida = [];
  for (const e of readdirSync(new URL(dir, raiz), { withFileTypes: true })) {
    if (e.isDirectory()) salida.push(...ficherosDe(`${dir}${e.name}/`, ext));
    else if (e.name.endsWith(ext)) salida.push(`${dir}${e.name}`);
  }
  return salida;
}

test('todo el js, css y data está en ASSETS', () => {
  const esperados = [
    ...ficherosDe('js/', '.js'),
    ...ficherosDe('css/', '.css'),
    ...ficherosDe('data/', '.json'),
  ];
  const faltan = esperados.filter(f => !sw.includes(`'./${f}'`));
  assert.deepEqual(faltan, [], `sin precachear: ${faltan.join(', ')}`);
});

test('CACHE_NAME está versionado', () => {
  assert.match(sw, /const CACHE_NAME = 'peru-v\d+'/);
});
