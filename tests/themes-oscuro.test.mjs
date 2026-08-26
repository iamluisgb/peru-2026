// El tema oscuro se escribe DOS veces en themes.css: una para `[data-theme="dark"]` (el usuario
// lo eligió a mano) y otra dentro de `@media (prefers-color-scheme: dark)` (lo eligió su sistema).
// Deduplicarlo de verdad exige `light-dark()`, que es una apuesta sobre el móvil de alguien a
// 4.000 m sin red; así que se acepta la copia y se vigila, igual que `sw-precache.test.mjs` vigila
// la lista de ASSETS. Si las dos copias divergen, la mitad de la gente ve otros colores.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/themes.css', import.meta.url), 'utf8');

/** Devuelve el mapa de declaraciones del bloque que abre en `selector`. */
function tokensDe(selector) {
  const i = css.indexOf(selector);
  assert.notEqual(i, -1, `no encuentro el bloque "${selector}" en themes.css`);
  const abre = css.indexOf('{', i);
  let nivel = 0;
  let j = abre;
  for (; j < css.length; j++) {
    if (css[j] === '{') nivel++;
    else if (css[j] === '}' && --nivel === 0) break;
  }
  const cuerpo = css.slice(abre + 1, j);
  const tokens = {};
  for (const m of cuerpo.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
  return tokens;
}

const raiz = tokensDe(':root {');
const forzado = tokensDe('[data-theme="dark"] {');
const porSistema = tokensDe(':root:not([data-theme="light"]):not([data-theme="dark"])');

test('el oscuro forzado y el oscuro por sistema son idénticos', () => {
  assert.deepEqual(forzado, porSistema);
});

test('ningún token tiene su única definición dentro de un bloque de tema', () => {
  // La norma de DESIGN.md: los tokens se definen ENTEROS en :root y los temas sólo redefinen.
  const huerfanos = Object.keys(forzado).filter((t) => !(t in raiz));
  assert.deepEqual(huerfanos, [], `definidos sólo en el tema oscuro: ${huerfanos.join(', ')}`);
});
