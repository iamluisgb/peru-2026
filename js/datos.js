// Carga y consulta de data/. Lógica PURA: sin DOM, para que los tests la puedan probar en node.

// Un bloque escrito que no esté aquí NO se carga: el fichero se sirve, se precachea y no lo
// pide nadie. Ya pasó con cinco bloques enteros. tests/datos.test.mjs lo vigila.
const BLOQUES_GUIA = ['lima', 'arequipa', 'colca', 'titicaca', 'trayectos', 'cusco', 'valle-sagrado', 'machu-picchu', 'transversales'];

let cache = null;

async function json(ruta) {
  const res = await fetch(ruta);
  if (!res.ok) throw new Error(`no se pudo cargar ${ruta}`);
  return res.json();
}

export async function cargar() {
  if (cache) return cache;
  const [itinerario, avisos, cultura, fotos, mapa, ...guias] = await Promise.all([
    json('./data/itinerario.json'),
    json('./data/avisos.json'),
    json('./data/cultura.json'),
    json('./data/fotos.json'),
    json('./data/mapa.json'),
    ...BLOQUES_GUIA.map(b => json(`./data/guia/${b}.json`)),
  ]);
  cache = {
    itinerario,
    avisos: Object.fromEntries(avisos.avisos.map(a => [a.id, a])),
    cultura: cultura.recursos,
    fotos: fotos.sitios,
    mapa: {
      ruta: Object.fromEntries(mapa.ruta.map(r => [r.id, r])),
      puntos: mapa.puntos,
      viewBox: mapa.viewBox,
      contorno: mapa.contorno,
      geo: mapa.geo,          // grados: lo que necesita la vista satélite
    },
    fichas: Object.fromEntries(guias.flatMap(g => g.fichas.map(f => [f.id, f]))),
  };
  return cache;
}

// El día "de hoy" es el del itinerario que coincide con la fecha local. Antes de salir devuelve
// null y la UI enseña la cuenta atrás — no el día 1, que aún no ha pasado.
export function diaDe(itinerario, iso) {
  return itinerario.dias.find(d => d.fecha === iso) || null;
}

export function paradaDe(itinerario, id) {
  return itinerario.paradas.find(p => p.id === id) || null;
}

// Tres tramos, no una escala continua: lo que importa de pie es si hoy hay que tomárselo en
// serio, no el número exacto.
export function nivelAltitud(metros) {
  if (metros < 2500) return 'baja';
  if (metros < 3500) return 'media';
  return 'alta';
}

export function avisosDe(datos, dia) {
  return (dia.avisos || []).map(id => datos.avisos[id]).filter(Boolean);
}

// Recursos culturales cuyo tag coincide con la parada del día. Es la conexión barata entre
// data/cultura.json y el itinerario, sin tener que anotar cada día a mano.
export function culturaDe(datos, parada) {
  if (!parada) return [];
  return datos.cultura.filter(r => r.tags.includes(parada));
}
