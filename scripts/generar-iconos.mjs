// Genera los iconos PWA a partir del diseño de icons/icon.svg. Sin dependencias de red:
// rasteriza con trucos matemáticos simples y escribe PNGs locales reales.
//
//   node scripts/generar-iconos.mjs
//
// Reproduce fielmente el SVG: fondo carbón #16130f, montaña terracota #c2562f, sol #e8bc63.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

function crc32(buf) {
  let c, crc = 0xffffffff;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(tipo, datos) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(datos.length, 0);
  const tipoBuf = Buffer.from(tipo, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([tipoBuf, datos])), 0);
  return Buffer.concat([len, tipoBuf, datos, crcBuf]);
}

function escribirPng(pxArr, w, h, ruta) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;
    for (let x = 0; x < w * 4; x++) raw[y * (1 + w * 4) + 1 + x] = pxArr[y * w * 4 + x];
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(ruta, png);
  console.log('✓', ruta.replace(raiz + '/', ''), `${w}x${h}`);
}

const NEGRO = [0x16, 0x13, 0x0f, 255];     // #16130f
const TERRACOTA = [0xc2, 0x56, 0x2f, 255]; // #c2562f
const ORO = [0xe8, 0xbc, 0x63, 255];       // #e8bc63

// Rectángulo redondeado 512 con radio 112 (igual que el SVG).
function dentroRectRedondeado(nx, ny, radio) {
  const x0 = radio, x1 = 512 - radio, y0 = radio, y1 = 512 - radio;
  if (nx >= x0 && nx <= x1) return true;
  if (ny >= y0 && ny <= y1) return true;
  const cx = nx < x0 ? x0 : x1;
  const cy = ny < y0 ? y0 : y1;
  const dx = nx - cx, dy = ny - cy;
  return dx * dx + dy * dy <= radio * radio;
}

// La montaña: polígono cerrado del SVG (point-in-polygon por ray casting, soporta cóncavo).
const CUMBRES = [[96, 352], [200, 176], [272, 288], [320, 216], [416, 352]];
function dentroMontana(x, y) {
  let dentro = false;
  for (let i = 0, j = CUMBRES.length - 1; i < CUMBRES.length; j = i++) {
    const xi = CUMBRES[i][0], yi = CUMBRES[i][1];
    const xj = CUMBRES[j][0], yj = CUMBRES[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

function dentroSol(x, y) {
  const dx = x - 368, dy = y - 136;
  return dx * dx + dy * dy <= 36 * 36;
}

function generar(tam, aSangre) {
  const pxArr = new Uint8Array(tam * tam * 4);
  const radio = 112 * (tam / 512);
  const factor = 512 / tam;
  for (let y = 0; y < tam; y++) {
    for (let x = 0; x < tam; x++) {
      const nx = x * factor;
      const ny = y * factor;
      const i = (y * tam + x) * 4;
      const dentro = aSangre || dentroRectRedondeado(nx, ny, radio);
      if (dentro) {
        pxArr[i] = NEGRO[0]; pxArr[i + 1] = NEGRO[1]; pxArr[i + 2] = NEGRO[2]; pxArr[i + 3] = 255;
      }
      if (pxArr[i + 3] !== 255) continue;
      if (dentroSol(nx, ny)) {
        pxArr[i] = ORO[0]; pxArr[i + 1] = ORO[1]; pxArr[i + 2] = ORO[2];
      } else if (dentroMontana(nx, ny)) {
        pxArr[i] = TERRACOTA[0]; pxArr[i + 1] = TERRACOTA[1]; pxArr[i + 2] = TERRACOTA[2];
      }
    }
  }
  return pxArr;
}

mkdirSync(join(raiz, 'icons'), { recursive: true });

for (const t of [192, 512]) {
  escribirPng(generar(t, false), t, t, join(raiz, 'icons', `icon-${t}.png`));
}
// maskable: fondo A SANGRE (sin esquinas) para que el sistema lo recorte bien.
escribirPng(generar(512, true), 512, 512, join(raiz, 'icons', 'maskable-512.png'));
// apple-touch-icon: 180px.
escribirPng(generar(180, false), 180, 180, join(raiz, 'icons', 'apple-touch-icon.png'));
