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

// Modelo de elevación de AWS Terrain Tiles (Mapzen), el mismo que usa el mapa del Anillo de
// Picos. Codificación `terrarium`: la altura va empaquetada en el RGB de un PNG.
const DEM = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png';
const ATRIBUCION_DEM = 'Terreno: AWS / Mapzen';

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
        // El DEM se declara desde el principio aunque el 3D esté apagado: añadir una fuente
        // con el mapa ya montado obliga a recargar el estilo entero y se ve el parpadeo.
        relieve: { type: 'raster-dem', tiles: [DEM], encoding: 'terrarium', tileSize: 256, maxzoom: 14, attribution: ATRIBUCION_DEM },
      },
      layers: [
        { id: 'satelite', type: 'raster', source: 'satelite' },
        // Sombreado suave SIEMPRE, también en plano: da idea del relieve andino sin inclinar
        // la cámara, que es lo que se quiere al mirar el mapa de un vistazo.
        { id: 'sombreado', type: 'hillshade', source: 'relieve',
          paint: { 'hillshade-exaggeration': 0.18, 'hillshade-shadow-color': '#1a2530' } },
      ],
    },
    bounds: coordsRuta.reduce(
      (b, c) => b.extend(c),
      new maplibregl.LngLatBounds(coordsRuta[0], coordsRuta[0]),
    ),
    fitBoundsOptions: { padding: 36 },
    attributionControl: { compact: false },
  });

  // Sin los controles de MapLibre: la app ya tiene los suyos, y los de la librería caían
  // justo encima de la fila de filtros. Los botones propios mandan sobre las dos vistas.
  mapa.addControl(new maplibregl.ScaleControl({ maxWidth: 90, unit: 'metric' }), 'bottom-left');

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
  // con el teclado sin reinventar el foco. Se guardan para poder rehacerlos al filtrar.
  let marcadores = [];

  function pintarMarcadores(lista) {
    for (const m of marcadores) m.remove();
    marcadores = lista.map(({ id, f }) => {
      const c = geo.puntos[id];
      if (!c) return null;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'sat-punto';
      el.title = f.nombre;
      el.setAttribute('aria-label', f.nombre);
      el.addEventListener('click', () => alPulsar(id));
      return new maplibregl.Marker({ element: el }).setLngLat([c[1], c[0]]).addTo(mapa);
    }).filter(Boolean);
  }

  pintarMarcadores(visibles);

  // Volar a los puntos del día. Con uno solo no hay caja que ajustar y `fitBounds` daría un
  // zoom absurdo, así que se centra con un zoom fijo que enseñe el sitio y su entorno.
  // 3D: inclina la cámara y levanta el terreno. Sólo tiene sentido con satélite, porque el
  // relieve son teselas de elevación —más red— y sin fotos encima es un bulto gris.
  //
  // La exageración es 1.5 y no 1: a escala de país los Andes ya son enormes, pero el ojo
  // espera montaña de postal. Con 1.0 el Colca parece una arruga.
  let en3D = false;
  mapa.tres_d = (activar) => {
    en3D = activar ?? !en3D;
    mapa.setTerrain(en3D ? { source: 'relieve', exaggeration: 1.5 } : null);
    mapa.easeTo({ pitch: en3D ? 62 : 0, bearing: en3D ? -18 : 0, duration: 900 });
    return en3D;
  };
  mapa.esta3D = () => en3D;

  mapa.enfocar = (lista, dia) => {
    pintarMarcadores(lista);
    const cs = lista.map(({ id }) => geo.puntos[id]).filter(Boolean).map(([la, lo]) => [lo, la]);
    if (!cs.length) return;
    if (dia === null) {
      mapa.fitBounds(coordsRuta.reduce((b, c) => b.extend(c),
        new maplibregl.LngLatBounds(coordsRuta[0], coordsRuta[0])), { padding: 36, duration: 800 });
      return;
    }
    // `fitBounds` endereza la cámara: si estamos en 3D hay que devolverle el pitch, o filtrar
    // por día apagaría el 3D de facto sin que nadie lo haya pedido.
    const pitch = en3D ? 62 : 0;
    if (cs.length === 1) { mapa.easeTo({ center: cs[0], zoom: 14, pitch, duration: 800 }); return; }
    const caja = cs.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(cs[0], cs[0]));
    mapa.fitBounds(caja, { padding: 60, maxZoom: 15, pitch, duration: 800 });
  };

  return mapa;
}
