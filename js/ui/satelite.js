// Vista satélite. Es la ÚNICA parte de la app que necesita red, y por eso vive aparte:
// se carga sólo si el atleta la pide, nunca en el arranque, y nunca entra en el precache.
//
// Sin cobertura no hay satélite posible —son fotos aéreas que se piden al servidor según te
// mueves—, así que aquí el trabajo no es que funcione offline, sino que FALLE BIEN: se avisa
// y se vuelve al mapa base, que sí funciona siempre.

const MAPLIBRE_JS = './vendor/maplibre-gl-4.7.1.min.js';
const MAPLIBRE_CSS = './vendor/maplibre-gl-4.7.1.css';

// Esri World Imagery. La atribución es obligatoria por sus condiciones de uso y se pinta
// siempre en pantalla, no en un comentario del código.
const TESELAS = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ATRIBUCION = '© Esri, Maxar, Earthstar Geographics';

let cargando = null;

function cargarMapLibre() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (cargando) return cargando;
  cargando = new Promise((resolver, rechazar) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = MAPLIBRE_CSS;
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = MAPLIBRE_JS;
    js.onload = () => resolver(window.maplibregl);
    js.onerror = () => { cargando = null; rechazar(new Error('no se pudo cargar maplibre')); };
    document.head.appendChild(js);
  });
  return cargando;
}

export function haySatelite() {
  return navigator.onLine !== false;
}

export async function montarSatelite(contenedor, { geo, ruta, visibles, alPulsar }) {
  const maplibregl = await cargarMapLibre();

  const coordsRuta = ruta.map(r => geo.paradas[r.id]).filter(Boolean).map(([la, lo]) => [lo, la]);

  const mapa = new maplibregl.Map({
    container: contenedor,
    style: {
      version: 8,
      sources: {
        satelite: { type: 'raster', tiles: [TESELAS], tileSize: 256, maxzoom: 19, attribution: ATRIBUCION },
      },
      layers: [{ id: 'satelite', type: 'raster', source: 'satelite' }],
    },
    bounds: coordsRuta.reduce(
      (b, c) => b.extend(c),
      new maplibregl.LngLatBounds(coordsRuta[0], coordsRuta[0]),
    ),
    fitBoundsOptions: { padding: 36 },
    attributionControl: { compact: false },
  });

  mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  mapa.addControl(new maplibregl.ScaleControl({ maxWidth: 90, unit: 'metric' }));

  mapa.on('load', () => {
    mapa.addSource('ruta', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coordsRuta } },
    });
    mapa.addLayer({
      id: 'ruta', type: 'line', source: 'ruta',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#ff8a5c', 'line-width': 2.5, 'line-dasharray': [2, 1.6] },
    });
  });

  // Los marcadores son DOM, no una capa: así heredan los estilos de la app y son pulsables
  // con el teclado sin reinventar el foco.
  for (const { id, f } of visibles) {
    const c = geo.puntos[id];
    if (!c) continue;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'sat-punto';
    el.title = f.nombre;
    el.setAttribute('aria-label', f.nombre);
    el.addEventListener('click', () => alPulsar(id));
    new maplibregl.Marker({ element: el }).setLngLat([c[1], c[0]]).addTo(mapa);
  }

  return mapa;
}
