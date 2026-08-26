// Genera data/mapa.json: el contorno REAL de Perú proyectado, y los puntos colocados por
// coordenadas geográficas de verdad.
//
// Antes el mapa eran x/y puestos a mano: los puntos caían más o menos donde tocaba, pero no
// había país debajo, así que se leía como un diagrama de dispersión sobre unas montañas
// decorativas. Un mapa necesita geografía, y la geografía no se dibuja a ojo.
//
// El contorno se descarga UNA vez y se commitea ya proyectado: la app no puede depender de
// la red (se usa en el Colca y en el Titicaca, donde no hay).
//
//   node scripts/generar-mapa.mjs <peru.geojson>
import { readFileSync, writeFileSync } from 'node:fs';

const W = 340, H = 240, PAD = 0;

// Las paradas, en grados. Precisión de ~1 km, que a escala de país es menos de un píxel.
const PARADAS = {
  'lima':            [-12.046, -77.043],
  'arequipa':        [-16.409, -71.537],
  'colca':           [-15.638, -71.601],   // Chivay
  'patapampa':       [-15.807, -71.617],
  'puno':            [-15.840, -70.022],
  'cusco':           [-13.532, -71.967],
  'ollantaytambo':   [-13.259, -72.263],
  'aguas-calientes': [-13.155, -72.525],
  'machu-picchu':    [-13.163, -72.545],
};

const [, , ruta] = process.argv;
if (!ruta) { console.error('uso: node scripts/generar-mapa.mjs <peru.geojson>'); process.exit(1); }

const gj = JSON.parse(readFileSync(ruta, 'utf8'));
const anillos = [];
for (const f of gj.features || [gj]) {
  const g = f.geometry || f;
  const polis = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
  for (const p of polis) anillos.push(p[0]);          // sólo el anillo exterior
}
anillos.sort((a, b) => b.length - a.length);

// Se encuadra sobre EL RECORRIDO, no sobre el país entero. Con el país completo, la mitad
// norte quedaba vacía y las nueve paradas apretadas en una esquina: el mapa gastaba su
// espacio en enseñar Loreto, por donde no se pasa. El contorno sigue dibujándose entero y
// se recorta al marco, así que no se pierde el "esto es Perú".
const MARGEN = 1.35;   // grados alrededor de la ruta
const lats = Object.values(PARADAS).map(([la]) => la);
const lons = Object.values(PARADAS).map(([, lo]) => lo);
let minLon = Math.min(...lons) - MARGEN, maxLon = Math.max(...lons) + MARGEN;
let minLat = Math.min(...lats) - MARGEN, maxLat = Math.max(...lats) + MARGEN;
// Equirectangular con corrección por coseno de la latitud media: sin ella Perú sale
// estirado a lo ancho, porque un grado de longitud aquí mide ~107 km y uno de latitud 111.
const latMedia = ((minLat + maxLat) / 2) * Math.PI / 180;
const kx = Math.cos(latMedia);
const anchoGeo = (maxLon - minLon) * kx, altoGeo = maxLat - minLat;
const escala = Math.min((W - PAD * 2) / anchoGeo, (H - PAD * 2) / altoGeo);
const offX = (W - anchoGeo * escala) / 2, offY = (H - altoGeo * escala) / 2;

const proyectar = (lon, lat) => [
  offX + (lon - minLon) * kx * escala,
  offY + (maxLat - lat) * escala,          // la latitud crece hacia arriba, la y hacia abajo
];

// Douglas-Peucker: 1.502 puntos de contorno son 40 KB de path para un dibujo de 340 px.
function simplificar(puntos, tol) {
  if (puntos.length < 3) return puntos;
  let maxD = 0, idx = 0;
  const [ax, ay] = puntos[0], [bx, by] = puntos[puntos.length - 1];
  for (let i = 1; i < puntos.length - 1; i++) {
    const [px, py] = puntos[i];
    const dx = bx - ax, dy = by - ay;
    const largo = Math.hypot(dx, dy) || 1;
    const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / largo;
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= tol) return [puntos[0], puntos[puntos.length - 1]];
  return [
    ...simplificar(puntos.slice(0, idx + 1), tol).slice(0, -1),
    ...simplificar(puntos.slice(idx), tol),
  ];
}

// Un anillo es CERRADO: su primer punto y el último son el mismo. Douglas-Peucker mide la
// distancia a la recta que une los extremos, y con los extremos coincidentes esa recta es un
// punto: todas las distancias salen 0 y el contorno entero colapsa a dos vértices. Por eso
// se parte el anillo por la mitad y se simplifica cada tramo por separado.
function simplificarAnillo(puntos, tol) {
  const abierto = puntos.slice(0, -1);
  const mitad = Math.floor(abierto.length / 2);
  const a = simplificar(abierto.slice(0, mitad + 1), tol);
  const b = simplificar([...abierto.slice(mitad), abierto[0]], tol);
  return [...a.slice(0, -1), ...b];
}

const contornos = anillos
  .slice(0, 3)                                    // continente + las dos islas mayores
  .map(anillo => simplificarAnillo(anillo.map(([lon, lat]) => proyectar(lon, lat)), 0.35))
  .filter(p => p.length > 6)
  .map(p => 'M' + p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z');

const rutaPuntos = Object.entries(PARADAS).map(([id, [lat, lon]]) => {
  const [x, y] = proyectar(lon, lat);
  return { id, x: +x.toFixed(1), y: +y.toFixed(1) };
});

// Los sitios se colocan a partir de su parada, no a ojo. A escala de país, Koricancha y la
// catedral del Cusco distan menos de un píxel: fingir su posición exacta sería precisión
// falsa. Se abren en abanico alrededor de su parada para que se puedan pinchar.
//
// Excepción: los del día 7 son paradas de carretera entre Puno y Cusco, así que se reparten
// A LO LARGO de ese tramo, que es donde están de verdad.
const itinerario = JSON.parse(readFileSync('data/itinerario.json', 'utf8'));
const paradaDeDia = Object.fromEntries(itinerario.dias.map(d => [d.n, d.parada]));
const porId = Object.fromEntries(rutaPuntos.map(r => [r.id, r]));

const fichasPorDia = {};
for (const f of ['lima', 'arequipa', 'colca', 'titicaca', 'trayectos', 'cusco', 'valle-sagrado', 'machu-picchu']) {
  for (const x of JSON.parse(readFileSync(`data/guia/${f}.json`, 'utf8')).fichas) {
    if (x.tipo === 'transversal') continue;
    (fichasPorDia[x.dia] ||= []).push(x.id);
  }
}

// El satélite (MapLibre) trabaja en GRADOS, no en el sistema del SVG. Se emiten las dos
// cosas desde la MISMA fuente para que las dos vistas no puedan discrepar.
const geo = { paradas: {}, puntos: {} };
for (const [id, [lat, lon]] of Object.entries(PARADAS)) geo.paradas[id] = [+lat.toFixed(4), +lon.toFixed(4)];

const puntos = {};
for (const [dia, ids] of Object.entries(fichasPorDia)) {
  const base = porId[paradaDeDia[dia]];
  if (!base) continue;

  if (Number(dia) === 7 && porId.puno && porId.cusco) {
    const [laP, loP] = PARADAS.puno, [laC, loC] = PARADAS.cusco;
    ids.forEach((id, i) => {
      const t = (i + 1) / (ids.length + 1);
      puntos[id] = {
        x: +(porId.puno.x + (porId.cusco.x - porId.puno.x) * t).toFixed(1),
        y: +(porId.puno.y + (porId.cusco.y - porId.puno.y) * t).toFixed(1),
      };
      geo.puntos[id] = [+(laP + (laC - laP) * t).toFixed(4), +(loP + (loC - loP) * t).toFixed(4)];
    });
    continue;
  }

  const radio = ids.length > 4 ? 11 : 8.5;
  const [laB, loB] = PARADAS[paradaDeDia[dia]];
  // En satélite el abanico es mucho más pequeño: allí sí se distingue una manzana, así que
  // separarlos un grado sería mandarlos a otra provincia. 0,012° ≈ 1,3 km.
  const radioGeo = 0.012;
  ids.forEach((id, i) => {
    const ang = (i / ids.length) * Math.PI * 2 - Math.PI / 2;
    puntos[id] = {
      x: +(base.x + Math.cos(ang) * radio).toFixed(1),
      y: +(base.y + Math.sin(ang) * radio * 0.85).toFixed(1),
    };
    geo.puntos[id] = [
      +(laB + Math.sin(ang) * radioGeo).toFixed(4),
      +(loB + Math.cos(ang) * radioGeo).toFixed(4),
    ];
  });
}

writeFileSync('data/mapa.json', JSON.stringify({
  _nota: 'GENERADO por scripts/generar-mapa.mjs. No editar a mano. Contorno de Perú de ' +
         'georgique/world-geojson (dominio público, Natural Earth), simplificado y proyectado.',
  viewBox: { w: W, h: H },
  contorno: contornos,
  ruta: rutaPuntos,
  puntos,
  geo,
}, null, 2) + '\n');

console.log(`contorno: ${contornos.length} anillos, ${contornos.join('').length} caracteres`);
console.log(`paradas: ${rutaPuntos.length} · sitios: ${Object.keys(puntos).length}`);
