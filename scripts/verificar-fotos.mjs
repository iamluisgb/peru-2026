// Mira cada foto candidata y decide si es DE VERDAD lo que dice ser.
//
// Es el paso que ningún buscador puede dar: los agentes encontraron las candidatas leyendo
// títulos y categorías, y en Commons hay mucha foto mal etiquetada. Una plaza colonial
// cualquiera rotulada "Arequipa" nos deja mintiendo en la app, delante del sitio.
//
// Va como script y no como agente a propósito: los agentes ya declararon "curl -sI: HTTP 200,
// URL verificada" sobre cuatro URLs que dan 404. Una comprobación mecánica se programa.
//
//   node scripts/verificar-fotos.mjs [--solo <ficha>]
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const MODELO = 'qwen3.6';               // el único de nan con visión real (probado)
const UA = 'peru-2026/1.0 (guia de viaje personal; https://github.com/iamluisgb/peru-2026)';
const ESPERA = 1600;                     // ms entre descargas: Wikimedia corta a 429 sin esto

const clave = execFileSync('pi', ['auth', 'print-api-key', '--provider', 'nan']).toString().trim();
const tmp = mkdtempSync(join(tmpdir(), 'fotos-'));
const dormir = ms => new Promise(r => setTimeout(r, ms));

const fichas = {};
for (const f of ['lima', 'arequipa', 'colca', 'titicaca', 'trayectos', 'cusco', 'valle-sagrado', 'machu-picchu'])
  for (const x of JSON.parse(readFileSync(`data/guia/${f}.json`, 'utf8')).fichas)
    if (x.tipo !== 'transversal') fichas[x.id] = x;

const candidatas = [];
for (const lote of ['lote-costa-sur', 'lote-andes']) {
  const j = JSON.parse(readFileSync(`data/fotos/${lote}.json`, 'utf8'));
  for (const [id, lista] of Object.entries(j))
    (lista || []).forEach((c, i) => candidatas.push({ id, i, ...c }));
}

const soloIdx = process.argv.indexOf('--solo');
const solo = soloIdx > -1 ? process.argv[soloIdx + 1] : null;
const trabajo = solo ? candidatas.filter(c => c.id === solo) : candidatas;

async function preguntar(rutaJpg, ficha) {
  const b64 = execFileSync('base64', ['-i', rutaJpg]).toString().replace(/\n/g, '');
  // Se le da el nombre y lo que la ficha manda mirar, y se le pide que DESCRIBA antes de
  // juzgar: pedir un sí/no a secas invita a decir que sí.
  const pregunta = `Vas a juzgar si una foto sirve para una guía de viaje.
SITIO: ${ficha.nombre} (${ficha.lugar || 'Perú'}).
LO QUE EL VIAJERO DEBE MIRAR ALLÍ:
${(ficha.de_pie.mira || []).map(m => '- ' + m).join('\n')}

Responde EXACTAMENTE en tres líneas:
VEO: <describe en una frase lo que se ve en la foto, sin suponer>
ES_EL_SITIO: <SI, NO o DUDOSO>
UTIL: <SI o NO — si enseña algo de la lista de arriba>`;

  const r = await fetch('https://api.nan.builders/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // 2.500 y no 300: qwen3.6 razona antes de escribir, y con una foto de verdad gasta
      // ~600-1.000 tokens pensando. Con el presupuesto corto devolvía `finish: length` y
      // contenido VACÍO — 33 de 59 fotos quedaron sin veredicto por esto, y parecían malas
      // cuando en realidad nadie las había mirado.
      model: MODELO, max_tokens: 2500,
      messages: [{ role: 'user', content: [
        { type: 'text', text: pregunta },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
      ] }],
    }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || 'error del modelo');
  return (j.choices?.[0]?.message?.content || '').trim();
}

const salida = [];
for (const [n, c] of trabajo.entries()) {
  const ficha = fichas[c.id];
  const url = c.url_fichero || c.url;
  process.stdout.write(`[${n + 1}/${trabajo.length}] ${c.id} #${c.i} … `);
  if (!ficha || !url) { console.log('sin ficha o sin url'); continue; }

  const bruto = join(tmp, `${c.id}-${c.i}.bin`), jpg = join(tmp, `${c.id}-${c.i}.jpg`);
  try {
    await dormir(ESPERA);
    execFileSync('curl', ['-sL', '--max-time', '60', '-A', UA, '-o', bruto, url]);
    // Se reduce a 768 px antes de mandarla: el original son 6 MB y en base64 casi 8, que es
    // pedirle al modelo que lea un libro para mirar una foto.
    // 512 px: suficiente para reconocer un muro o una plaza, y un tercio del envío que 768.
    execFileSync('sips', ['-Z', '512', '-s', 'format', 'jpeg', bruto, '--out', jpg], { stdio: 'ignore' });
  } catch {
    console.log('✗ no se pudo descargar/convertir');
    salida.push({ ...c, veredicto: 'DESCARGA_FALLIDA' });
    continue;
  }

  try {
    // El modelo devuelve vacío de vez en cuando. Un reintento basta, y sin él esas fotos
    // quedarían marcadas como no verificadas sin haberlo estado.
    let resp = await preguntar(jpg, ficha);
    if (!resp) { await dormir(1200); resp = await preguntar(jpg, ficha); }
    if (process.env.CRUDO) console.log('\n--- respuesta cruda ---\n' + resp + '\n---');
    const es = (resp.match(/ES_EL_SITIO:\s*(\w+)/i) || [])[1] || '?';
    const util = (resp.match(/UTIL:\s*(\w+)/i) || [])[1] || '?';
    const veo = (resp.match(/VEO:\s*(.+)/i) || [])[1] || '';
    console.log(`sitio=${es} util=${util}`);
    salida.push({ ...c, veredicto: es.toUpperCase(), util: util.toUpperCase(), veo: veo.trim() });
  } catch (e) {
    console.log('✗ ' + e.message.slice(0, 50));
    salida.push({ ...c, veredicto: 'MODELO_FALLO' });
  }
}

writeFileSync('data/fotos/veredictos.json', JSON.stringify({
  _nota: `Revisión visual con ${MODELO}. Cada foto se descargó, se redujo a 768 px y se miró.`,
  fecha: new Date().toISOString().slice(0, 10),
  veredictos: salida,
}, null, 2) + '\n');

const buenas = salida.filter(x => x.veredicto === 'SI');
console.log(`\n${buenas.length} de ${salida.length} confirmadas como el sitio.`);
