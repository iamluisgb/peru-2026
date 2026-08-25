// Los datos son el producto: si un JSON está mal, la app falla en mitad del Titicaca, que es
// donde no se puede arreglar. Estos tests corren antes de cada despliegue.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const leer = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));

const itinerario = leer('data/itinerario.json');
const avisos = leer('data/avisos.json');
const cultura = leer('data/cultura.json');
const bloques = readdirSync(new URL('../data/guia/', import.meta.url))
  .filter(f => f.endsWith('.json'))
  .map(f => leer(`data/guia/${f}`));
const fichas = bloques.flatMap(b => b.fichas);

test('el itinerario cubre los días sin saltos ni huecos', () => {
  const dias = itinerario.dias;
  for (let i = 1; i < dias.length; i++) {
    assert.equal(dias[i].n, dias[i - 1].n + 1, `salto en el día ${dias[i].n}`);
    const ayer = new Date(dias[i - 1].fecha), hoy = new Date(dias[i].fecha);
    assert.equal((hoy - ayer) / 86400000, 1, `las fechas no son consecutivas en el día ${dias[i].n}`);
  }
});

test('cada día apunta a una parada que existe', () => {
  const ids = new Set([...itinerario.paradas.map(p => p.id), 'madrid']);
  for (const d of itinerario.dias) assert.ok(ids.has(d.parada), `parada desconocida: ${d.parada}`);
});

test('cada aviso referido desde un día existe', () => {
  const ids = new Set(avisos.avisos.map(a => a.id));
  for (const d of itinerario.dias)
    for (const a of d.avisos || []) assert.ok(ids.has(a), `aviso inexistente: ${a} (día ${d.n})`);
});

test('sólo hay tres niveles de aviso', () => {
  for (const a of avisos.avisos)
    assert.ok(['info', 'ojo', 'serio'].includes(a.nivel), `nivel raro en ${a.id}: ${a.nivel}`);
});

test('los hoteles cubren las 10 noches del circuito', () => {
  const noches = itinerario.hoteles.reduce((n, h) => n + h.noches, 0);
  assert.equal(noches, 10, `${noches} noches de hotel, deberían ser 10`);
});

test('los ids de ficha son únicos en todos los bloques', () => {
  const vistos = new Set();
  for (const f of fichas) {
    assert.ok(!vistos.has(f.id), `id duplicado: ${f.id}`);
    vistos.add(f.id);
  }
});

test('cada ficha tiene los campos obligatorios de CONTENIDO.md', () => {
  for (const f of fichas) {
    assert.ok(f.id && f.nombre && f.lugar, `ficha incompleta: ${f.id}`);
    assert.equal(typeof f.altitud_m, 'number', `${f.id}: altitud_m debe ser número`);
    assert.equal(typeof f.verificado, 'boolean', `${f.id}: falta verificado`);
    assert.ok(f.de_pie?.gancho, `${f.id}: falta gancho`);
    const mira = f.de_pie?.mira || [];
    assert.ok(mira.length >= 1 && mira.length <= 4, `${f.id}: mira debe tener 1-4 entradas`);
  }
});

test('el día de cada ficha existe en el itinerario', () => {
  const dias = new Set(itinerario.dias.map(d => d.n));
  for (const f of fichas) assert.ok(dias.has(f.dia), `${f.id}: el día ${f.dia} no existe`);
});

test('las conexiones culturales apuntan a un recurso real', () => {
  const titulos = new Set(cultura.recursos.map(r => r.titulo));
  for (const f of fichas)
    for (const c of f.de_sofa?.conexion || [])
      assert.ok(titulos.has(c.recurso), `${f.id}: recurso desconocido "${c.recurso}"`);
});
