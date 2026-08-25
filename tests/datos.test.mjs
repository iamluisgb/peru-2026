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
    assert.ok(f.id && f.nombre, `ficha incompleta: ${f.id}`);
    assert.equal(typeof f.verificado, 'boolean', `${f.id}: falta verificado`);
    assert.ok(f.de_pie?.gancho, `${f.id}: falta gancho`);
    const mira = f.de_pie?.mira || [];
    assert.ok(mira.length >= 1 && mira.length <= 4, `${f.id}: mira debe tener 1-4 entradas`);
  }
});

// `lugar` y `altitud_m` son de un SITIO. Una transversal no está en ningún sitio y no tiene
// altitud: pedírselos era exigir que mintiera para pasar el test.
test('cada ficha de sitio tiene lugar y altitud', () => {
  for (const f of fichas.filter(f => !esTransversal(f))) {
    assert.ok(f.lugar, `${f.id}: falta lugar`);
    assert.equal(typeof f.altitud_m, 'number', `${f.id}: altitud_m debe ser número`);
  }
});

// Una transversal —cómo leer un muro inca, qué es un apu— no pertenece a un día: se lee
// una vez y sirve los doce. Por eso no lleva `dia` y estos tests la tratan aparte.
const esTransversal = f => f.tipo === 'transversal';

test('el día de cada ficha de sitio existe en el itinerario', () => {
  const dias = new Set(itinerario.dias.map(d => d.n));
  for (const f of fichas.filter(f => !esTransversal(f)))
    assert.ok(dias.has(f.dia), `${f.id}: el día ${f.dia} no existe`);
});

test('una transversal no lleva día', () => {
  for (const f of fichas.filter(esTransversal))
    assert.equal(f.dia, undefined, `${f.id}: una transversal no pertenece a un día`);
});

test('las conexiones culturales apuntan a un recurso real', () => {
  const titulos = new Set(cultura.recursos.map(r => r.titulo));
  for (const f of fichas)
    for (const c of f.de_sofa?.conexion || [])
      assert.ok(titulos.has(c.recurso), `${f.id}: recurso desconocido "${c.recurso}"`);
});

// ---------------------------------------------------------------------------
// Los dos invariantes que faltaban, y que costaron 23 fichas invisibles en
// producción: el contenido escrito tiene que estar REGISTRADO y ALCANZABLE.
// Los tests de arriba comprobaban que la ficha apunta a un día que existe,
// pero nadie comprobaba el camino contrario.
// ---------------------------------------------------------------------------

// Bloques del itinerario que todavía no tienen ficha escrita. Cuando se escriba una,
// se borra de aquí. Es una lista explícita a propósito: obliga a decidir si el id que
// no resuelve es "aún no escrito" o "id mal tecleado", que es lo que de verdad rompe.
const SIN_FICHA_TODAVIA = new Set([]);

test('cada actividad del itinerario resuelve a una ficha (o está declarada pendiente)', () => {
  const ids = new Set(fichas.map(f => f.id));
  const rotas = [];
  for (const d of itinerario.dias)
    for (const a of d.actividades || [])
      if (!ids.has(a) && !SIN_FICHA_TODAVIA.has(a)) rotas.push(`día ${d.n}: ${a}`);
  assert.deepEqual(rotas, [], `actividades que no resuelven a ninguna ficha: ${rotas.join(', ')}`);
});

// El invariante NO es "toda ficha está en un día" —eso era falso para las transversales—
// sino "toda ficha es ALCANZABLE". Un sitio lo es desde su día; una transversal, desde el
// `relacionadas` de al menos una ficha. Así el guardarraíl sigue vivo: una transversal que
// nadie enlaza sigue siendo un bug, y se caza igual.
test('toda ficha es alcanzable', () => {
  const desdeDias = new Set(itinerario.dias.flatMap(d => d.actividades || []));
  const desdeFichas = new Set(fichas.flatMap(f => f.relacionadas || []));
  const inalcanzables = fichas
    .filter(f => !(esTransversal(f) ? desdeFichas.has(f.id) : desdeDias.has(f.id)))
    .map(f => `${f.id} (${f.tipo || 'sitio'})`);
  assert.deepEqual(inalcanzables, [],
    `fichas a las que no se puede llegar: ${inalcanzables.join(', ')}`);
});

test('`relacionadas` sólo apunta a transversales que existen', () => {
  const trans = new Set(fichas.filter(esTransversal).map(f => f.id));
  const rotas = [];
  for (const f of fichas)
    for (const r of f.relacionadas || [])
      if (!trans.has(r)) rotas.push(`${f.id} → ${r}`);
  assert.deepEqual(rotas, [], `relacionadas que no resuelven a una transversal: ${rotas.join(', ')}`);
});

test('todo bloque de data/guia está registrado en BLOQUES_GUIA', () => {
  const datos = readFileSync(new URL('../js/datos.js', import.meta.url), 'utf8');
  const registrados = new Set(
    (datos.match(/const BLOQUES_GUIA = \[([^\]]*)\]/)?.[1] || '')
      .split(',').map(s => s.trim().replace(/^'|'$/g, '')).filter(Boolean)
  );
  const enDisco = readdirSync(new URL('../data/guia/', import.meta.url))
    .filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
  const sinCargar = enDisco.filter(b => !registrados.has(b));
  assert.deepEqual(sinCargar, [],
    `bloques escritos que la app NO carga: ${sinCargar.join(', ')}`);
});

// El mapa SVG propio dibuja la ruta y las fichas desde data/mapa.json. Si una ficha de sitio
// se queda sin punto (o un punto no apunta a una ficha de sitio), el mapa enseña una mentira
// o un punto muerto — y es justo lo que no se arregla de pie, sin cobertura.
const mapa = leer('data/mapa.json');

function coordsDentro(c) {
  const { w, h } = mapa.viewBox;
  return typeof c.x === 'number' && typeof c.y === 'number' &&
    Number.isFinite(c.x) && Number.isFinite(c.y) && c.x >= 0 && c.x <= w && c.y >= 0 && c.y <= h;
}

test('cada parada tiene su coordenada en el mapa y viceversa', () => {
  const pids = new Set(itinerario.paradas.map(p => p.id));
  const rids = mapa.ruta.map(r => r.id);
  assert.deepEqual([...rids].sort(), [...pids].sort(),
    `la ruta del mapa no cubre exactamente las paradas: ${rids.join(', ')}`);
  for (const r of mapa.ruta) assert.ok(coordsDentro(r), `coordenada fuera del viewBox: ${r.id}`);
});

test('cada ficha de sitio tiene un punto en el mapa (sin transversales ni huérfanos)', () => {
  const sitios = fichas.filter(f => !esTransversal(f)).map(f => f.id);
  const idsPuntos = Object.keys(mapa.puntos);
  const faltan = sitios.filter(s => !idsPuntos.includes(s));
  const puntosTransversales = idsPuntos.filter(id => esTransversal(fichas.find(f => f.id === id)));
  const huerfanos = idsPuntos.filter(id => !sitios.includes(id));
  assert.deepEqual(faltan, [], `fichas de sitio sin punto en el mapa: ${faltan.join(', ')}`);
  assert.deepEqual(huerfanos, [], `puntos del mapa que no apuntan a una ficha de sitio: ${huerfanos.join(', ')}`);
  assert.deepEqual(puntosTransversales, [], `las transversales NO van al mapa: ${puntosTransversales.join(', ')}`);
});

test('todas las coordenadas del mapa están dentro del viewBox', () => {
  const todos = [...mapa.ruta, ...Object.values(mapa.puntos)];
  for (const c of todos) assert.ok(coordsDentro(c), `coordenada fuera del viewBox: ${JSON.stringify(c)}`);
});
