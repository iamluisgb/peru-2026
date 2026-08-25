// Service worker — Perú 2026.
//
// Offline es EL requisito, no una mejora: en el Colca, el Titicaca y el tren no hay cobertura
// (ADR-007). Por eso se precachea todo, datos incluidos.
//
// Al tocar cualquier fichero de ASSETS hay que SUBIR CACHE_NAME, o los móviles ya instalados
// se quedan con la versión vieja. tests/sw-precache.test.mjs vigila que la lista no se quede
// corta: en bookreader ya se desincronizó una vez.
const CACHE_NAME = 'peru-v3';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/themes.css',
  './css/main.css',
  './js/app.js',
  './js/datos.js',
  './js/almacen.js',
  './js/ui/escape.js',
  './js/ui/fecha.js',
  './data/itinerario.json',
  './data/avisos.json',
  './data/cultura.json',
  './data/guia/cusco.json',
  './data/guia/machu-picchu.json',
  './data/guia/lima.json',
  './data/guia/arequipa.json',
  './data/guia/colca.json',
  './data/guia/trayectos.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
];

// Uno a uno, no addAll. addAll es ATÓMICO: un solo recurso que falle (un icono que aún no
// existe, un 404 puntual) aborta el precache ENTERO y deja al viajero sin NADA offline.
// Aquí un fallo cuesta ese recurso y ya; lo que faltó se avisa en consola.
async function precache(cache, urls) {
  const fallidos = [];
  await Promise.all(urls.map(async (url) => {
    try { await cache.add(url); } catch { fallidos.push(url); }
  }));
  if (fallidos.length) console.warn('[sw] no se pudieron precachear:', fallidos);
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => precache(c, ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// CÓDIGO (navegaciones, HTML/JS/CSS): network-first. Con stale-while-revalidate un despliegue
// puede servir una MEZCLA de dos generaciones de módulos y dejar la app medio rota.
// DATOS, FUENTES E ICONOS: cache-first — arranque instantáneo, y offline de verdad.
function esInmutable(pathname) {
  return /\/(?:fonts|icons)\//.test(pathname) || /\.(?:woff2?|png|svg|json)$/.test(pathname);
}

async function networkFirst(req, cache) {
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || (req.mode === 'navigate'
      ? (await cache.match('./index.html')) || (await cache.match('./'))
      : undefined) || Response.error();
  }
}

async function cacheFirst(req, cache) {
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  let url;
  try { url = new URL(req.url); } catch { return; }
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  const p = url.pathname;
  const esCodigo = !esInmutable(p) &&
    (req.mode === 'navigate' || p.endsWith('/') || /\.(?:html|js|css)$/.test(p));

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => esCodigo ? networkFirst(req, cache) : cacheFirst(req, cache))
  );
});
