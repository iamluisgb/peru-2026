// Saca las coordenadas REALES de cada sitio y las escribe en data/coordenadas.json.
//
// Antes se derivaban: cada sitio se ponía en un abanico alrededor de su parada. Servía para
// un mapa esquemático, pero en satélite es mentira — Koricancha aparecía en un tejado
// cualquiera del Cusco. Con zoom de verdad, una coordenada inventada se ve.
//
// Nominatim (OpenStreetMap), 1 petición por segundo como pide su política de uso. Cada
// resultado se VALIDA contra la parada MÁS CERCANA del itinerario: si cae a más de 60 km de
// todas, se descarta y se marca para revisión a mano. Un geocodificador acierta casi siempre
// y falla espectacularmente, así que sin ese cerco acabas con Machu Picchu en Bolivia.
//
// Y contra el TRAZADO, no contra los vértices: Puno-Cusco son casi 400 km de carretera, y
// Pucará o Raqchi están legítimamente a 100 km de cualquier parada aunque estén justo encima
// de la ruta. El invariante correcto no es "cerca de una parada" sino "cerca del recorrido".
//
//   node scripts/geocodificar.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const UA = 'peru-2026/1.0 (guia de viaje personal; https://github.com/iamluisgb/peru-2026)';
const TOPE_KM = 60;

// La consulta de cada sitio. A mano y no `${nombre}, Perú`: "Plaza de Armas" hay en cada
// pueblo del país, y "Catedral" ni te cuento.
const CONSULTAS = {
  'plaza-armas-lima': 'Plaza Mayor de Lima, Lima, Peru',
  'catedral-lima': 'Basílica Catedral de Lima, Lima, Peru',
  'huaca-pucllana': 'Huaca Pucllana, Miraflores, Lima, Peru',
  'parque-del-amor': 'Parque del Amor, Miraflores, Lima, Peru',
  'santa-catalina': 'Monasterio de Santa Catalina, Arequipa, Peru',
  'yanahuara': 'Mirador de Yanahuara, Arequipa, Peru',
  'carmen-alto': 'Mirador de Carmen Alto, Arequipa, Peru',
  'plaza-armas-arequipa': 'Plaza de Armas de Arequipa, Peru',
  'pampas-canahuas': 'Pampa Cañahuas, Arequipa, Peru',
  'patapampa': 'Patapampa, Caylloma, Arequipa, Peru',
  'cruz-del-condor': 'Cruz del Cóndor, Cabanaconde, Peru',
  'maca': 'Maca, Caylloma, Arequipa, Peru',
  'yanque': 'Yanque, Caylloma, Arequipa, Peru',
  'uros': 'Islas Uros, Puno, Peru',
  'taquile': 'Isla Taquile, Puno, Peru',
  'pucara': 'Pucará, Lampa, Puno, Peru',
  'la-raya': 'Abra La Raya, Peru',
  'raqchi': 'Raqchi, San Pedro, Canchis, Cusco, Peru',
  'andahuaylillas': 'Andahuaylillas, Quispicanchi, Cusco, Peru',
  'koricancha': 'Qorikancha, Cusco, Peru',
  'plaza-armas-cusco': 'Plaza de Armas, Cusco, Peru',
  'catedral-cusco': 'Catedral del Cusco, Peru',
  'san-blas': 'San Blas, Cusco, Peru',
  'chinchero': 'Chinchero, Urubamba, Cusco, Peru',
  'yucay': 'Yucay, Urubamba, Cusco, Peru',
  'ollantaytambo': 'Ollantaytambo, Urubamba, Cusco, Peru',
  'tren-valle': 'Estación de Ollantaytambo, Peru',
  'machu-picchu': 'Machu Picchu, Peru',
  'intihuatana': 'Intihuatana, Machu Picchu, Peru',
};

// Los recintos de dentro de Machu Picchu no existen en OSM como puntos propios, y un
// buscador confundido devuelve cualquier cosa a kilómetros. Se declaran a mano sobre la
// ciudadela, marcados como aproximados: dentro del recinto la diferencia entre uno y otro
// son decenas de metros, y decir "aquí, aproximadamente" es más honesto que fingir un GPS.
const A_MANO = {
  'ciudadela-machu-picchu': [-13.16340, -72.54540],
  'intihuatana':            [-13.16327, -72.54556],
  'templo-del-sol':         [-13.16365, -72.54566],
  'tres-ventanas':          [-13.16330, -72.54540],
  'templo-del-condor':      [-13.16389, -72.54509],
};

const km = (a, b) => {
  const R = 6371, r = Math.PI / 180;
  const dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Distancia de un punto al segmento A-B. En grados y plano, con corrección por coseno: a
// estas latitudes y para un cerco de 60 km, la curvatura no cambia la decisión.
function kmASegmento(pt, a, b) {
  const kx = Math.cos(pt[0] * Math.PI / 180);
  const P = [(pt[1] - a[1]) * kx, pt[0] - a[0]];
  const V = [(b[1] - a[1]) * kx, b[0] - a[0]];
  const largo2 = V[0] ** 2 + V[1] ** 2;
  const t = largo2 ? Math.max(0, Math.min(1, (P[0] * V[0] + P[1] * V[1]) / largo2)) : 0;
  const cerca = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  return km(pt, cerca);
}

const mapa = JSON.parse(readFileSync('data/mapa.json', 'utf8'));
const itinerario = JSON.parse(readFileSync('data/itinerario.json', 'utf8'));
const paradaDeDia = Object.fromEntries(itinerario.dias.map(d => [d.n, d.parada]));
const ORDEN = itinerario.paradas.map(p => p.id);

const fichas = {};
for (const f of ['lima', 'arequipa', 'colca', 'titicaca', 'trayectos', 'cusco', 'valle-sagrado', 'machu-picchu'])
  for (const x of JSON.parse(readFileSync(`data/guia/${f}.json`, 'utf8')).fichas)
    if (x.tipo !== 'transversal') fichas[x.id] = x;

const previo = existsSync('data/coordenadas.json')
  ? JSON.parse(readFileSync('data/coordenadas.json', 'utf8')) : { sitios: {} };

const salida = { ...previo.sitios };
const dudosos = [];

for (const [id, consulta] of Object.entries(CONSULTAS)) {
  if (!fichas[id]) { console.warn(`· ${id}: no existe esa ficha, se ignora`); continue; }
  if (salida[id] && !process.env.REHACER) { continue; }

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(consulta)}`;
  await new Promise(r => setTimeout(r, 1100));           // política de uso: 1 req/s
  let res;
  try {
    res = await (await fetch(url, { headers: { 'User-Agent': UA } })).json();
  } catch (e) { dudosos.push(`${id}: la petición falló (${e.message})`); continue; }

  if (!res.length) { dudosos.push(`${id}: sin resultado para "${consulta}"`); continue; }

  const lat = +(+res[0].lat).toFixed(5), lon = +(+res[0].lon).toFixed(5);
  let d = Infinity, cerca = null;
  for (let i = 0; i < ORDEN.length - 1; i++) {
    const a = mapa.geo.paradas[ORDEN[i]], b = mapa.geo.paradas[ORDEN[i + 1]];
    if (!a || !b) continue;
    const k = kmASegmento([lat, lon], a, b);
    if (k < d) { d = k; cerca = `${ORDEN[i]}→${ORDEN[i + 1]}`; }
  }

  if (d > TOPE_KM) {
    dudosos.push(`${id}: a ${d.toFixed(0)} km del recorrido — "${res[0].display_name}"`);
    continue;
  }
  salida[id] = { lat, lon, km_a_ruta: +d.toFixed(1), tramo: cerca, fuente: res[0].display_name };
  console.log(`✓ ${id.padEnd(24)} ${lat}, ${lon}  (${d.toFixed(1)} km)`);
}

for (const [id, [lat, lon]] of Object.entries(A_MANO)) {
  if (!fichas[id]) continue;
  salida[id] = { lat, lon, aproximado: true, cerca: 'machu-picchu',
    fuente: 'Situado a mano dentro de la ciudadela: OSM no tiene estos recintos como puntos propios.' };
  console.log(`~ ${id.padEnd(24)} ${lat}, ${lon}  (a mano)`);
}

writeFileSync('data/coordenadas.json', JSON.stringify({
  _nota: 'GENERADO por scripts/geocodificar.mjs desde Nominatim (OpenStreetMap, ODbL). ' +
         'Cada punto validado a menos de 60 km de su parada.',
  sitios: salida,
}, null, 2) + '\n');

console.log(`\n${Object.keys(salida).length}/${Object.keys(fichas).length} sitios con coordenada.`);
if (dudosos.length) {
  console.log(`\n${dudosos.length} PENDIENTES DE MANO:`);
  for (const d of dudosos) console.log(`  ✗ ${d}`);
}
