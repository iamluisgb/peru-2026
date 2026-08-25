// El repo es PÚBLICO (ADR-002). Ningún dato personal puede entrar en data/ ni en el HTML.
// Corre en npm test, en CI y como pre-commit hook.
import { readFileSync, readdirSync } from 'node:fs';

const raiz = new URL('../', import.meta.url);

// Patrones de lo que NO puede aparecer. Deliberadamente genéricos: es mejor un falso positivo
// que un localizador publicado en GitHub para siempre. Los \b importan: sin ellos
// 'luisgonzalezbernal.com' (un dominio, no un pasajero) disparaba el nombre.
const PROHIBIDO = [
  [/\bTS\d{6}\b/, 'localizador TUI'],
  [/\b6\d{12}\b/, 'número de ticket aéreo'],
  [/\bFK[A-Z0-9]{8}\b/, 'número de póliza'],
  [/\b9\d{18}\b/, 'confirmación Booking'],
  [/\bGONZALEZ ?BERNAL\b/i, 'nombre de pasajero'],
  [/\bNIETO ?ROMERO\b/i, 'nombre de pasajero'],
  [/\b[\w.+-]+@[\w-]+\.[\w.]+\b/, 'correo electrónico'],
];

function ficheros(dir) {
  const salida = [];
  for (const e of readdirSync(new URL(dir, raiz), { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    if (e.isDirectory()) salida.push(...ficheros(`${dir}${e.name}/`));
    else if (/\.(json|html|js|md)$/.test(e.name)) salida.push(`${dir}${e.name}`);
  }
  return salida;
}

let sucio = false;
for (const f of ficheros('')) {
  const texto = readFileSync(new URL(f, raiz), 'utf8');
  for (const [patron, que] of PROHIBIDO) {
    const m = texto.match(patron);
    if (m) { console.error(`✗ ${f}: ${que} → "${m[0]}"`); sucio = true; }
  }
}

if (sucio) {
  console.error('\nDatos personales en el repo. El repo es público: sácalos a localStorage (js/almacen.js).');
  process.exit(1);
}
console.log('✓ sin datos personales en el repo');
