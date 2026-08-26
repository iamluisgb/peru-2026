// Orquestador. Router de hash, cinco pantallas, sin framework.
import { cargar, diaDe, paradaDe, nivelAltitud, avisosDe, culturaDe } from './datos.js';
import { esc, enlazar } from './ui/escape.js';
import { hoyISO, bonita, diasHasta } from './ui/fecha.js';
import { icono } from './ui/icons.js';
import { activarZoom } from './ui/zoom.js';
import { montarSatelite, haySatelite } from './ui/satelite.js';

const app = document.getElementById('app');
let datos = null;

const RUTAS = { hoy: verHoy, dias: verDias, guia: verGuia, altura: verAltura, emergencias: verEmergencias, mochila: verMochila, mapa: verMapa };

const MOCHILA_CLAVE = 'peru_mochila_mp';

// La mochila no está en la nav: se llega desde el aviso del día 8, que es cuando importa.
const NAV = [
  ['hoy', 'Hoy'], ['dias', 'Días'], ['guia', 'Guía'], ['mapa', 'Mapa'], ['altura', 'Altura'], ['emergencias', 'SOS'],
];

function pintarNav() {
  document.querySelector('.navbar').innerHTML = NAV.map(([r, etiqueta]) =>
    `<a href="#/${r}" data-ruta="${r}">${icono(r === 'emergencias' ? 'sos' : r)}<span>${etiqueta}</span></a>`
  ).join('');
}

function ruta() {
  const [, nombre = 'hoy', arg] = location.hash.split('/');
  return { nombre: RUTAS[nombre] ? nombre : 'hoy', arg };
}

function pintar(html) { app.innerHTML = html; window.scrollTo(0, 0); }

function marcarNav(nombre) {
  document.querySelectorAll('.navbar a').forEach(a => {
    if (a.dataset.ruta === nombre) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

// Trozos reutilizables ----

// Separador de miles para etiquetas de la gráfica: 2500 → "2.500".
function mil(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

// Una marca por nivel, no un icono decorativo: de un vistazo se distingue "dato útil" de
// "esto te puede costar el vuelo" sin leer (DESIGN.md — tres niveles y sólo tres).
const MARCA = { info: 'i', ojo: '!', serio: '!!' };

function htmlAvisos(lista, sinRuta) {
  const items = (lista || []).filter(Boolean);
  if (!items.length) return '';
  return `<div class="avisos">${items.map(a => `
    <div class="aviso aviso--${esc(a.nivel)}">
      <span class="marca" aria-hidden="true">${MARCA[a.nivel] || 'i'}</span>
      <div>
        <h4>${esc(a.titulo)}</h4>
        <p>${esc(a.texto)}</p>
        ${a.ruta && !sinRuta ? `<p class="aviso-enlace"><a href="${esc(a.ruta)}">${esc(a.ruta_etiqueta || 'Abrir checklist')} →</a></p>` : ''}
      </div>
    </div>`).join('')}</div>`;
}

function chipAltitud(m) {
  return `<span class="chip chip--alt" data-nivel="${nivelAltitud(m)}">${icono('pico', 13)}${mil(m)} m</span>`;
}

function htmlDia(d, { esHoy = false } = {}) {
  const parada = paradaDe(datos.itinerario, d.parada);
  const alt = parada ? chipAltitud(parada.altitud_m) : '';
  const comidas = (d.comidas || []).map(c => `<span class="chip">${icono('plato', 13)}${esc(c)}</span>`).join('');
  const libre = (d.libre || []).map(l => `<span class="chip chip--libre">${icono('libre', 13)}${esc(l)}</span>`).join('');
  const fichas = (d.actividades || []).filter(a => datos.fichas[a]);
  return `
    <article class="tarjeta dia${esHoy ? ' dia--hoy' : ''}">
      <div class="dia-num" aria-hidden="true">${d.n}</div>
      <div>
        <p class="dia-fecha">${esc(bonita(d.fecha))}</p>
        <h2>${esc(d.titulo)}</h2>
        <p>${esc(d.resumen)}</p>
        <div class="chips">${alt}${comidas}${libre}</div>
        ${htmlAvisos(avisosDe(datos, d))}
        ${fichas.length ? `<h3>Qué vais a ver</h3><div class="indice">${fichas.map(id => htmlEnlaceFicha(datos.fichas[id])).join('')}</div>` : ''}
      </div>
    </article>`;
}

function htmlEnlaceFicha(f) {
  return `<a href="#/guia/${esc(f.id)}">
    <span class="nom">${esc(f.nombre)}</span>
  </a>`;
}

// ---- Pantallas ----

function verHoy() {
  const iso = hoyISO();
  const d = diaDe(datos.itinerario, iso);

  // En viaje NO hay hero: repetía los cuatro datos de la tarjeta que va 60 px debajo y se
  // comía un tercio del pliegue, con lo que "Qué vais a ver" caía fuera de pantalla. DESIGN.md
  // ya lo avisaba: "Hoy no es un hero, es el día que toca". Lo único que el hero aportaba de
  // verdad —cuántos días de doce llevas— cabe en una línea.
  if (d) {
    return pintar(`
      <p class="hoy-marca">Hoy · Día ${d.n} de ${datos.itinerario.dias.length - 1}</p>
      ${htmlDia(d, { esHoy: true })}`);
  }

  const faltan = diasHasta(datos.itinerario.viaje.inicio, iso);
  if (faltan > 0) {
    return pintar(`
      <section class="hero">
        <p class="kicker">Perú Mágico</p>
        <h1 class="cuenta"><span>${faltan}</span> ${faltan === 1 ? 'día' : 'días'}</h1>
        <p class="fecha">Salís el ${esc(bonita(datos.itinerario.viaje.inicio))}</p>
      </section>
      ${htmlDia(datos.itinerario.dias[0])}
      <p class="seccion-titulo">Lo que viene</p>
      ${datos.itinerario.dias.slice(1, 3).map(x => htmlDia(x)).join('')}`);
  }

  pintar(`
    <section class="hero">
      <p class="kicker">Perú Mágico</p>
      <h1>Viaje terminado</h1>
      <p class="fecha">Del 30 de agosto al 10 de septiembre de 2026</p>
    </section>
    <div class="tarjeta"><p>Los 12 días siguen aquí. <a href="#/dias">Repasarlos →</a></p></div>`);
}

function verDias() {
  const iso = hoyISO();
  pintar(`
    <header class="cabecera">
      <p class="eyebrow">${icono('dias', 14)} Itinerario</p>
      <h1>Los 12 días</h1>
      <p class="sub">Del 30 de agosto al 10 de septiembre de 2026</p>
    </header>
    ${datos.itinerario.dias.map(d => htmlDia(d, { esHoy: d.fecha === iso })).join('')}`);
}

function verGuia(id) {
  if (!id) return verIndiceGuia();

  const f = datos.fichas[id];
  // Un callejón sin salida no es un estado vacío, es una pantalla rota con buenos modales:
  // aquí sólo se llega desde un enlace de un día, así que la salida es volver a la guía.
  if (!f) return pintar(`<div class="vacio">
    <p>Esa ficha aún no está escrita.</p>
    <a class="vacio-salida" href="#/guia">${icono('guia', 16)} Ver el índice de la guía</a>
  </div>`);

  const p = f.de_pie.practico || {};
  const sofa = f.de_sofa || {};
  const haySofa = sofa.contexto || sofa.dato || (sofa.conexion || []).length;
  // Los dos plegados de la ficha tenían el mismo peso, y no esconden lo mismo: uno es la
  // mejor prosa del proyecto y el otro una lista de URLs. El minutaje sale del texto y no de
  // una cifra a ojo, porque decir "3 min" sobre la ficha más corta sería mentir. 150 palabras
  // por minuto y no 250: esto es prosa densa y desconocida, leída a 3.400 m. Da de 1 a 3 min,
  // que es el rango real de las 39 fichas.
  const minutos = Math.max(1, Math.round(`${sofa.contexto || ''} ${sofa.dato || ''}`.trim().split(/\s+/).length / 150));

  pintar(`
    <a class="volver" href="#/guia">${icono('atras', 16)} Guía</a>
    <header class="cabecera">
      <p class="eyebrow">${f.tipo === 'transversal'
        ? 'Para entender lo que ves'
        : `${esc(f.lugar)} · Día ${f.dia}`}</p>
      <h1>${esc(f.nombre)}</h1>
    </header>
    <article class="tarjeta ficha">
      ${htmlAvisos((f.avisos || []).map(a => datos.avisos[a]).filter(Boolean))}
      <p class="gancho">${esc(f.de_pie.gancho)}</p>
      <h3>Mira esto</h3>
      <ol class="mira">${f.de_pie.mira.map(m => `<li>${esc(m)}</li>`).join('')}</ol>
      <div class="chips">
        ${p.duracion ? `<span class="chip">${icono('reloj', 13)}${esc(p.duracion)}</span>` : ''}
        ${typeof f.altitud_m === 'number' ? chipAltitud(f.altitud_m) : ''}
        ${p.incluido ? '<span class="chip chip--acento">incluido</span>' : ''}
        ${p.fotos ? `<span class="chip">fotos: ${esc(p.fotos)}</span>` : ''}
      </div>
      ${(p.notas || []).length ? `<ul class="preguntas">${p.notas.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}

      ${haySofa ? `<details class="sofa">
        <summary>
          ${icono('reloj', 18)}
          <span class="sofa-titulo">Leer con calma</span>
          <span class="sofa-min">${minutos} min</span>
        </summary>
        <div class="de-sofa">
          ${sofa.contexto ? `<p>${esc(sofa.contexto)}</p>` : ''}
          ${sofa.dato ? `<p class="dato"><strong>El dato:</strong> ${esc(sofa.dato)}</p>` : ''}
          ${(sofa.conexion || []).length ? `<div class="chips">${sofa.conexion.map(c =>
            `<span class="chip">${icono('guia', 13)}${esc(c.recurso)} — ${esc(c.donde)}</span>`).join('')}</div>` : ''}
        </div>
      </details>` : ''}

      ${(f.relacionadas || []).length ? `<h3>Para entender esto</h3>
        <div class="chips">${f.relacionadas.map(r => datos.fichas[r]).filter(Boolean).map(t =>
          `<a class="chip chip--acento" href="#/guia/${esc(t.id)}">${icono('guia', 13)}${esc(t.nombre)}</a>`).join('')}</div>` : ''}

      ${(f.preguntas || []).length ? `<h3>Para preguntarle al guía</h3>
        <ul class="preguntas">${f.preguntas.map(q => `<li>${esc(q)}</li>`).join('')}</ul>` : ''}

      ${(f.fuentes || []).length ? `<details>
        <summary>Fuentes</summary>
        <ul class="fuentes">${f.fuentes.map(x => `<li>${enlazar(x)}</li>`).join('')}</ul>
      </details>` : ''}
    </article>`);
}

// El índice se agrupa por día y no alfabéticamente: la pregunta real no es "¿dónde está
// Raqchi?" sino "¿qué toca mañana?".
function verIndiceGuia() {
  const todas = Object.values(datos.fichas);
  const transversales = todas.filter(f => f.tipo === 'transversal');
  const porDia = new Map();
  for (const f of todas) {
    if (f.tipo === 'transversal') continue;
    if (!porDia.has(f.dia)) porDia.set(f.dia, []);
    porDia.get(f.dia).push(f);
  }
  // El día de hoy sube al principio: entre 33 fichas, el grupo que importa el 90 % del tiempo
  // es el de hoy, y buscarlo con el pulgar es el buscador que CLAUDE.md descarta con razón.
  // Anclarlo no añade UI: es el mismo dato que ya usa Hoy.
  const hoy = datos.itinerario.dias.find(x => x.fecha === hoyISO());
  const dias = [...porDia.keys()].sort((a, b) => a - b);
  const orden = hoy && porDia.has(hoy.n) ? [hoy.n, ...dias.filter(n => n !== hoy.n)] : dias;

  const grupo = n => {
    const d = datos.itinerario.dias.find(x => x.n === n);
    const esHoy = Boolean(hoy) && n === hoy.n;
    return `<div class="indice-grupo${esHoy ? ' indice-grupo--hoy' : ''}">${
      esHoy ? 'Hoy · ' : ''}Día ${n} · ${d ? esc(d.titulo) : ''}</div>` +
      porDia.get(n).map(htmlEnlaceFicha).join('');
  };

  pintar(`
    <header class="cabecera">
      <p class="eyebrow">${icono('guia', 14)} Guía</p>
      <h1>Qué estás viendo</h1>
      <p class="sub">${todas.length - transversales.length} sitios, agrupados por el día que tocan.</p>
    </header>
    <div class="indice">
      ${orden.map(grupo).join('')}
      ${transversales.length ? `<div class="indice-grupo">Para entender lo que ves</div>` +
        transversales.map(htmlEnlaceFicha).join('') : ''}
    </div>`);
}

// El perfil se dibuja como un perfil —una línea de ascenso— y no como barras: lo que hay
// que entender de un vistazo es la PENDIENTE, que es lo que castiga al cuerpo, no el valor
// absoluto de cada parada. Las barras ordenaban por altura y escondían justo eso.
// Pero la gráfica va la ÚLTIMA. Nadie entra aquí a las 2 de la mañana en Puno a mirar un
// perfil de elevación: entra porque no puede dormir y le falta el aire. Con la gráfica y la
// tabla delante, "cuándo hay que bajar" quedaba a 1.150 px de scroll — que es exactamente lo
// que prohíbe el principio 3 de DESIGN.md.
function verAltura() {
  const paradas = datos.itinerario.paradas;
  const W = 340, H = 150, PAD_X = 10, PAD_Y = 26, SUELO = H - 34;
  const max = Math.max(...paradas.map(p => p.altitud_m));
  const x = i => PAD_X + (i * (W - PAD_X * 2)) / (paradas.length - 1);
  const y = m => PAD_Y + (1 - m / max) * (SUELO - PAD_Y);

  const puntos = paradas.map((p, i) => [x(i), y(p.altitud_m)]);
  const linea = puntos.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
  const area = `${linea} L${x(paradas.length - 1).toFixed(1)} ${SUELO} L${PAD_X} ${SUELO} Z`;

  pintar(`
    <header class="cabecera">
      <p class="eyebrow">${icono('altura', 14)} El ascenso</p>
      <h1>Altura</h1>
      <p class="sub">Del nivel del mar a ${mil(max)} m en cinco días.</p>
    </header>

    <div class="tarjeta">
      ${htmlAvisos([datos.avisos.soroche, datos.avisos['patapampa-4900'], datos.avisos['altura-empieza']].filter(Boolean))}
    </div>

    <p class="seccion-titulo">Parada a parada</p>
    <div class="indice">
      ${paradas.map(p => `<a href="#/dias">
        <span class="nom">${esc(p.nombre)}</span>
        <span class="chip chip--alt" data-nivel="${nivelAltitud(p.altitud_m)}">${p.altitud_m} m</span>
      </a>`).join('')}
    </div>

    <p class="seccion-titulo">El ascenso, de un vistazo</p>
    <div class="tarjeta">
      <svg class="perfil" viewBox="0 0 ${W} ${H}" role="img"
           aria-label="Perfil de altitud del viaje, de Lima a Machu Picchu">
        <path class="area" d="${area}"/>
        <path class="linea" d="${linea}"/>
        <line class="eje" x1="${PAD_X}" y1="${SUELO}" x2="${W - PAD_X}" y2="${SUELO}"/>
        ${paradas.map((p, i) => {
          const [px, py] = puntos[i];
          const impar = i % 2 === 1;
          return `<circle class="punto" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.5"/>
            <text class="valor" x="${px.toFixed(1)}" y="${(py - 8).toFixed(1)}" text-anchor="middle">${(p.altitud_m / 1000).toFixed(1)}k</text>
            <text x="${px.toFixed(1)}" y="${SUELO + (impar ? 24 : 13)}" text-anchor="middle">${esc(p.corto || p.nombre)}</text>`;
        }).join('')}
      </svg>
    </div>`);
}

// El mapa: la ruta (9 paradas de data/itinerario.json) y los puntos de las fichas dibujados
// EN SVG PROPIO, con fill/stroke por tokens para que el tema los arrastre solo (mismo truco
// que la silueta del hero). Las teselas de un proveedor no sirven: son imágenes con color
// fijo —no siguen el tema— y además red, que es justo lo que no hay en el Colca ni en el
// Titicaca (BACKLOG v2). Las transversales no están en ningún sitio: no van al mapa.
// El mapa ocupa la pantalla entera y sus controles van DENTRO, superpuestos. Un mapa metido
// en una tarjeta de 460 px, con los filtros arriba y los botones debajo, obliga a mirar en
// tres sitios para hacer una cosa. Aquí el mapa es la pantalla.
// Los tamaños del mapa van en PÍXELES DE PANTALLA, no en unidades del SVG: zoom.js publica
// en `--esc` cuántos píxeles mide una unidad y el CSS divide. Al ver Perú entero en un móvil
// la escala baja a un tercio de la de un portátil, y sin esto los puntos quedaban en 4 px.
const R_PARADA = 9, R_PASO = 5, R_SITIO = 7, R_SITIO_DIA = 10, FS_ETIQUETA = 12;

// Colocación de etiquetas sin solapes, ni entre ellas ni sobre los círculos. Se prueban ocho
// direcciones por dos distancias y se coge la primera libre; si ninguna lo está, no se dibuja.
// Perder una etiqueta es mejor que superponer dos: dos superpuestas no se leen ninguna.
function colocarEtiquetas(paradas, visibles, activo, W, H, esc) {
  // Prioridad: el primero que pide sitio se lo queda. Machu Picchu y Aguas Calientes están
  // pegados y sólo cabe un nombre entre los dos; sin esto ganaba Aguas Calientes por ir antes
  // en el itinerario, y el mapa del viaje se quedaba sin el nombre del sitio al que va.
  const PRIORIDAD = ['machu-picchu', 'lima', 'cusco', 'puno', 'arequipa'];
  const peso = ({ p }) => {
    const i = PRIORIDAD.indexOf(p.id);
    return i === -1 ? PRIORIDAD.length : i;
  };

  // Todo el reparto se hace en unidades del SVG, pero los tamaños son píxeles: `u` traduce.
  // `k` es lo mismo para las distancias que la geometría de abajo daba por supuestas con una
  // etiqueta de 8 unidades.
  const u = (px) => px / esc;
  const k = FS_ETIQUETA / (8 * esc);

  const caja = (c, r) => ({ x1: c.x - r, x2: c.x + r, y1: c.y - r, y2: c.y + r });
  const puestas = [
    ...paradas.map(({ p, c }) => caja(c, u((p.solo_paso ? R_PASO : R_PARADA) + 1))),
    ...visibles.map(({ c }) => caja(c, u((activo === null ? R_SITIO : R_SITIO_DIA) + 1))),
  ];

  const items = [
    ...paradas.filter(({ p }) => !p.solo_paso).sort((a, b) => peso(a) - peso(b))
      .map(({ p, c }) => ({ texto: p.corto || p.nombre, x: c.x, y: c.y })),
    ...(activo === null ? [] : visibles.map(({ c, f }) => ({ texto: f.nombre, x: c.x, y: c.y }))),
  ];

  const solapa = (a, b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
  const salida = [];

  for (const it of items) {
    const ancho = (it.texto.length * 4.1 + 2) * k;
    const candidatos = [];
    for (const d of [1, 1.7]) {
      candidatos.push(
        { dx: 0, dy: 13 * d * k, anclaje: 'middle' },
        { dx: 0, dy: -9 * d * k, anclaje: 'middle' },
        { dx: 8 * d * k, dy: 3 * k, anclaje: 'start' },
        { dx: -8 * d * k, dy: 3 * k, anclaje: 'end' },
        { dx: 7 * d * k, dy: -6 * d * k, anclaje: 'start' },
        { dx: -7 * d * k, dy: -6 * d * k, anclaje: 'end' },
        { dx: 7 * d * k, dy: 10 * d * k, anclaje: 'start' },
        { dx: -7 * d * k, dy: 10 * d * k, anclaje: 'end' },
      );
    }
    for (const c of candidatos) {
      const x = it.x + c.dx, y = it.y + c.dy;
      const izq = c.anclaje === 'middle' ? x - ancho / 2 : c.anclaje === 'start' ? x : x - ancho;
      const cj = { x1: izq, x2: izq + ancho, y1: y - 8 * k, y2: y + 3 * k };
      if (cj.x1 < 2 || cj.x2 > W - 2 || cj.y1 < 2 || cj.y2 > H - 2) continue;
      if (puestas.some(q => solapa(cj, q))) continue;
      puestas.push(cj);
      salida.push({ texto: it.texto, x, y, anclaje: c.anclaje });
      break;
    }
  }
  return salida;
}

// Estado vivo del mapa. Cambiar de día NO repinta la pantalla: si lo hiciera, se perderían
// el zoom y la vista satélite que el atleta tuviera puestos, que es justo lo que estaba
// mirando cuando decidió filtrar.
let mapaVivo = null;

function verMapa(arg) {
  const diasConPuntos = [...new Set(Object.values(datos.fichas)
    .filter(f => f.tipo !== 'transversal')
    .map(f => f.dia))].sort((a, b) => a - b);
  const dia = diasConPuntos.includes(parseInt(arg, 10)) ? parseInt(arg, 10) : null;

  if (mapaVivo) return mapaVivo.filtrar(dia);

  const { ruta, puntos, viewBox, contorno } = datos.mapa;
  const { w: W, h: H } = viewBox;

  const paradas = datos.itinerario.paradas
    .map(p => ({ p, c: ruta[p.id] }))
    .filter(x => x.c);
  const linea = paradas.map((x, i) => `${i ? 'L' : 'M'}${x.c.x} ${x.c.y}`).join(' ');

  const todas = Object.entries(puntos)
    .map(([id, c]) => ({ id, c, f: datos.fichas[id] }))
    .filter(x => x.f && x.f.tipo !== 'transversal');

  const chips = [
    `<button type="button" class="chip" data-dia="">Todo</button>`,
    ...diasConPuntos.map(d => `<button type="button" class="chip" data-dia="${d}">Día ${d}</button>`),
  ].join('');

  pintar(`
    <section class="mapa-pantalla">
      <!-- Los controles van ANTES del SVG en el DOM: con position:absolute se ven donde
           siempre, pero el teclado llega al filtro de día en un Tab y no en treinta y cuatro
           persiguiendo puntos. Lo navegable es contenido, y el contenido va después. -->
      <div class="mapa-capa mapa-capa--arriba"><div class="mapa-filtros">${chips}</div></div>

      <div class="mapa-capa mapa-capa--abajo">
        <div class="mapa-leyenda">
          <span><i class="lg lg--parada"></i>Parada</span>
          <span><i class="lg lg--sitio"></i>Sitio</span>
          <span><i class="lg lg--ruta"></i>Recorrido</span>
        </div>
        <div class="mapa-botones">
          <button type="button" data-sat aria-pressed="false" title="Vista satélite">◎</button>
          <button type="button" data-zoom="mas" aria-label="Acercar">+</button>
          <button type="button" data-zoom="menos" aria-label="Alejar">−</button>
          <button type="button" data-zoom="reset" aria-label="Ver todo">⤢</button>
        </div>
      </div>

      <!-- meet y no slice: con slice el SVG apaisado se recortaba para cubrir un hueco
           casi vertical y en un móvil no se veían ni Lima ni Cusco. El mar ya no es un <rect>
           que obligue a cubrir: lo pinta el fondo de .mapa-pantalla. -->
      <svg class="mapa-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"
           role="img" aria-label="Mapa de la ruta de Lima a Machu Picchu con los sitios de la guía">
        <!-- El marco lo recortaba antes el propio slice. El contorno se dibuja entero (el país
             se sale del encuadre por los cuatro lados, que se encuadró sobre el RECORRIDO y no
             sobre Perú) y hay que seguir recortándolo, o al dejar de recortar el viewport
             aparecía Loreto entera colgando por arriba. -->
        <clipPath id="mapa-marco"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>
        <g clip-path="url(#mapa-marco)">
        ${contorno.map(d => `<path class="mapa-pais" d="${d}"/>`).join('')}
        <path class="mapa-ruta" d="${linea}"/>
        <g class="mapa-sitios">
          ${todas.map(({ id, c, f }) => `
            <g class="mapa-ficha" data-ficha="${esc(id)}" data-dia="${f.dia}"
               role="button" tabindex="0" aria-label="${esc(f.nombre)}">
              <circle cx="${c.x}" cy="${c.y}" r="${R_SITIO}"/>
              <title>${esc(f.nombre)}</title>
            </g>`).join('')}
        </g>
        ${paradas.map(({ p, c }) => `
          <circle class="mapa-parada" cx="${c.x}" cy="${c.y}" r="${p.solo_paso ? R_PASO : R_PARADA}"/>`).join('')}
        <g class="mapa-etiquetas"></g>
        </g>
      </svg>

      <div class="sat-lienzo" hidden></div>

      <p class="mapa-nota" hidden></p>
    </section>

    <dialog class="hoja" aria-label="Detalle del sitio"></dialog>
  `);

  const svg = app.querySelector('.mapa-svg');
  const zoom = activarZoom(svg, { w: W, h: H });
  const capaEtiquetas = svg.querySelector('.mapa-etiquetas');
  const satelite = montarBotonSatelite();

  function visiblesDe(d) {
    return d === null ? todas : todas.filter(x => x.f.dia === d);
  }

  function filtrar(d, { encuadrar = true } = {}) {
    mapaVivo.dia = d;
    // Ocultar por atributo y no rehaciendo el SVG: los nodos siguen siendo los mismos, así
    // que el zoom y el foco no se pierden. El `tabindex` va con la visibilidad: un punto que
    // no está en pantalla tampoco debe recibir el foco del teclado.
    svg.querySelectorAll('.mapa-ficha').forEach(g => {
      const suyo = d === null || Number(g.dataset.dia) === d;
      g.toggleAttribute('hidden', !suyo);
      g.setAttribute('tabindex', suyo ? '0' : '-1');
      g.querySelector('circle').setAttribute('r', d === null ? R_SITIO : R_SITIO_DIA);
    });

    let activo = null;
    app.querySelectorAll('.mapa-filtros .chip').forEach(b => {
      const suyo = (b.dataset.dia === '' && d === null) || Number(b.dataset.dia) === d;
      b.classList.toggle('chip--acento', suyo);
      b.setAttribute('aria-pressed', String(suyo));
      if (suyo) activo = b;
    });
    // Llegando por enlace a #/mapa/8 el chip del día estaba a 444 px en una pantalla de 402:
    // el mapa saltaba a otro encuadre y ningún filtro parecía puesto.
    if (activo) activo.scrollIntoView({ inline: 'center', block: 'nearest' });

    const visibles = visiblesDe(d);
    if (encuadrar) {
      if (d === null) zoom.reiniciar();
      else zoom.encuadrar(caja(visibles.map(v => v.c)));
    }
    // Las etiquetas se reparten DESPUÉS de encuadrar: su tamaño en unidades del SVG depende
    // de la escala final, y repartirlas antes reservaba huecos de otro mapa.
    capaEtiquetas.innerHTML = colocarEtiquetas(paradas, visibles, d, W, H, zoom.escala()).map(e =>
      `<text class="mapa-etiqueta" x="${e.x.toFixed(1)}" y="${e.y.toFixed(1)}"
             text-anchor="${e.anclaje}">${esc(e.texto)}</text>`).join('');

    satelite.encuadrar(visibles, d);
  }

  mapaVivo = { dia: null, filtrar, cerrar: () => { satelite.cerrar(); zoom.destruir(); mapaVivo = null; } };
  filtrar(dia, { encuadrar: dia !== null });

  // Un solo juego de botones para las dos vistas: si el satélite está encendido, mandan sobre
  // él; si no, sobre el SVG. Dos juegos de controles para lo mismo es un control de más.
  app.querySelector('.mapa-botones').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !b.dataset.zoom) return;
    if (satelite.encendido()) satelite.zoom(b.dataset.zoom, mapaVivo.dia);
    else ({ mas: zoom.acercar, menos: zoom.alejar, reset: zoom.reiniciar })[b.dataset.zoom]();
  });

  // El hash cambia para que el día filtrado se pueda compartir y volver atrás funcione, pero
  // quien repinta es `filtrar`, no la ruta.
  app.querySelector('.mapa-filtros').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) location.hash = b.dataset.dia ? `#/mapa/${b.dataset.dia}` : '#/mapa';
  });

  svg.addEventListener('click', (e) => {
    const g = e.target.closest('[data-ficha]');
    if (g) abrirHoja(g.dataset.ficha);
  });
  svg.addEventListener('keydown', (e) => {
    const g = e.target.closest('[data-ficha]');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrirHoja(g.dataset.ficha); }
  });
}

// Caja que contiene unos puntos, en unidades del SVG.
function caja(cs) {
  const xs = cs.map(c => c.x), ys = cs.map(c => c.y);
  return { x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys) };
}


function abrirHoja(id) {
  const f = datos.fichas[id];
  if (!f) return;
  const hoja = app.querySelector('.hoja');
  const p = f.de_pie.practico || {};
  const sofa = f.de_sofa || {};
  // La hoja YA trae aviso, gancho, mira y practico: "Ficha completa →" prometía la misma
  // pantalla otra vez. Lo que de verdad falta aquí es la capa de sofá, y eso es lo que anuncia.
  const haySofa = Boolean(sofa.contexto || sofa.dato || (sofa.conexion || []).length);

  hoja.innerHTML = `
    <button class="hoja-cerrar" type="button" aria-label="Cerrar">✕</button>
    <p class="eyebrow">${esc(f.lugar)} · Día ${f.dia}</p>
    <h2>${esc(f.nombre)}</h2>
    ${htmlAvisos((f.avisos || []).map(a => datos.avisos[a]).filter(Boolean))}
    <p class="gancho">${esc(f.de_pie.gancho)}</p>
    <h3>Mira esto</h3>
    <ol class="mira">${f.de_pie.mira.map(m => `<li>${esc(m)}</li>`).join('')}</ol>
    <div class="chips">
      ${p.duracion ? `<span class="chip">${icono('reloj', 13)}${esc(p.duracion)}</span>` : ''}
      ${typeof f.altitud_m === 'number' ? chipAltitud(f.altitud_m) : ''}
      ${p.incluido ? '<span class="chip chip--acento">incluido</span>' : ''}
    </div>
    <a class="hoja-mas" href="#/guia/${esc(f.id)}">${haySofa ? 'Leer con calma' : 'Ficha completa'} →</a>`;

  hoja.querySelector('.hoja-cerrar').addEventListener('click', () => hoja.close());
  // Clic en el fondo: el <dialog> recibe el clic cuando cae fuera de su contenido.
  hoja.addEventListener('click', (e) => { if (e.target === hoja) hoja.close(); });
  hoja.showModal();
}

function montarBotonSatelite() {
  const boton = app.querySelector('[data-sat]');
  const nota = app.querySelector('.mapa-nota');
  const svg = app.querySelector('.mapa-svg');
  const lienzo = app.querySelector('.sat-lienzo');
  let mapa = null;
  let ultimo = { visibles: [], dia: null };

  const avisar = (texto) => { nota.textContent = texto; nota.hidden = !texto; };

  function apagar() {
    if (mapa) { mapa.remove(); mapa = null; }
    lienzo.replaceChildren();
    lienzo.hidden = true;
    svg.hidden = false;
    boton.setAttribute('aria-pressed', 'false');
  }

  boton.addEventListener('click', async () => {
    if (boton.getAttribute('aria-pressed') === 'true') { apagar(); avisar(''); return; }

    if (!haySatelite()) {
      avisar('El satélite son fotos que se piden por internet y ahora no hay conexión. El mapa funciona sin ella.');
      return;
    }

    boton.disabled = true;
    try {
      lienzo.hidden = false;
      svg.hidden = true;
      mapa = await montarSatelite(lienzo, {
        geo: datos.mapa.geo,
        ruta: datos.itinerario.paradas,
        visibles: ultimo.visibles,
        alPulsar: abrirHoja,
      });
      boton.setAttribute('aria-pressed', 'true');
      avisar('');
    } catch {
      apagar();
      avisar('No se pudo cargar el satélite. Sigues con el mapa de siempre.');
    } finally {
      boton.disabled = false;
    }
  });

  return {
    // Al filtrar por día, el satélite vuela a esos puntos igual que el mapa base. Si no está
    // encendido, se guarda el filtro para cuando lo enciendan.
    encuadrar(visibles, dia) {
      ultimo = { visibles, dia };
      if (mapa) mapa.enfocar(visibles, dia);
    },
    encendido: () => Boolean(mapa),
    zoom(accion, dia) {
      if (!mapa) return;
      if (accion === 'mas') mapa.zoomIn();
      else if (accion === 'menos') mapa.zoomOut();
      else mapa.enfocar(ultimo.visibles, dia ?? null);
    },
    cerrar: apagar,
  };
}


// Es la única pantalla que se usa con adrenalina, así que manda el número y no el rótulo:
// el teléfono en su propia línea y grande, el descriptor debajo. Y el 105 va el primero,
// separado del resto: si alguien se desploma a 4.900 m en Patapampa se marca al 105, no a
// una aseguradora de Madrid, que es una gestión y no una urgencia.
function verEmergencias() {
  const tel = (quien, detalle, numero, { urgente = false } = {}) => `
    <a class="tel${urgente ? ' tel--urgente' : ''}" href="tel:${numero.replace(/\s/g, '')}">
      <span class="tel-num">${esc(numero)}</span>
      <span class="tel-pie"><span class="tel-quien">${esc(quien)}</span> · ${esc(detalle)}</span>
    </a>`;

  pintar(`
    <header class="cabecera">
      <p class="eyebrow">${icono('sos', 14)} Si algo pasa</p>
      <h1>Emergencias</h1>
      <p class="sub">Funciona sin cobertura. Los números están guardados en la app.</p>
    </header>

    ${tel('Emergencias Perú', 'Policía y ambulancias, en todo el país', '105', { urgente: true })}

    <p class="seccion-titulo">Gestiones, no urgencias</p>
    ${tel('Asistencia en viaje', 'Iris Global · seguro, 24 h', '+34 915 72 43 43')}
    ${tel('TUI incidencias', 'también WhatsApp, 24 h', '+34 919 930 612')}
    ${tel('Lima Tours', 'en destino · admite WhatsApp', '+51 997 516 250')}

    <p class="seccion-titulo">Mis datos</p>
    <div class="tarjeta">
      <p>El localizador, los tickets y la póliza se introducen en el móvil y no salen de él:
         este repositorio es público y no los contiene.</p>
      <p><em>Pendiente: el formulario (ver BACKLOG).</em></p>
    </div>`);
}

function mochilaHechos() {
  try { return new Set(JSON.parse(localStorage.getItem(MOCHILA_CLAVE) || '[]')); } catch { return new Set(); }
}

function mochilaGuardar(hechos) {
  try { localStorage.setItem(MOCHILA_CLAVE, JSON.stringify([...hechos])); } catch { /* modo privado: sigue en memoria */ }
}

function verMochila() {
  const aviso = datos.avisos['equipaje-5kg'];
  const checklist = aviso && aviso.checklist;
  const items = (checklist && checklist.items) || [];
  const limite = (checklist && checklist.limite_kg) || 5;
  const hecho = mochilaHechos();
  const porcentaje = items.length ? Math.round((hecho.size / items.length) * 100) : 0;
  // Sólo va el aviso de "esta noche se prepara": el de los 5 kg repetía palabra por palabra
  // el titular de arriba, y así la cifra salía tres veces antes de la primera casilla.
  pintar(`
    <header class="cabecera"><p class="eyebrow">Preparación</p><h1>Mochila de Machu Picchu</h1></header>
    <div class="tarjeta">
      <div class="mochila-peso">
        <span class="mochila-peso-numero">${limite}</span>
        <div class="mochila-peso-texto">
          <strong>kg por persona</strong> en el tren a Machu Picchu. Todo el resto se queda custodiado
          en el hotel de Cusco y os espera al volver del Valle Sagrado.
        </div>
      </div>
      ${htmlAvisos([datos.avisos['equipaje-5kg-preparar']].filter(Boolean), true)}
    </div>
    <div class="tarjeta">
      <div class="mochila-estado">
        <p class="mochila-estado-texto">Dentro de la mochila <strong>${hecho.size}</strong> de ${items.length} cosas</p>
        <div class="progreso" role="progressbar" aria-valuemin="0" aria-valuemax="${items.length}" aria-valuenow="${hecho.size}">
          <span class="progreso-relleno" style="width:${porcentaje}%"></span>
        </div>
      </div>
      ${items.length ? `
        <ul class="mochila-list">
          ${items.map(it => `
            <li class="mochila-item${hecho.has(it.id) ? ' mochila-item--hecho' : ''}">
              <label>
                <input type="checkbox" data-id="${esc(it.id)}"${hecho.has(it.id) ? ' checked' : ''}>
                <span>${esc(it.texto)}</span>
              </label>
            </li>`).join('')}
        </ul>` : '<p>El checklist aún no está en los datos.</p>'}
    </div>`);

  const lista = app.querySelector('.mochila-list');
  if (lista) lista.addEventListener('change', (e) => {
    const input = e.target.closest('input[type=checkbox]');
    if (!input) return;
    const set = mochilaHechos();
    if (input.checked) set.add(input.dataset.id); else set.delete(input.dataset.id);
    mochilaGuardar(set);
    const li = input.closest('li');
    if (li) li.classList.toggle('mochila-item--hecho', input.checked);
    const contador = app.querySelector('.mochila-estado-texto strong');
    if (contador) contador.textContent = set.size;
    const barra = app.querySelector('.progreso');
    if (barra) barra.setAttribute('aria-valuenow', String(set.size));
    const relleno = app.querySelector('.progreso-relleno');
    if (relleno && items.length) relleno.style.width = `${Math.round((set.size / items.length) * 100)}%`;
  });
}

// ---- Arranque ----

// Emergencias es la única pantalla que NO lee `datos`: los cuatro teléfonos están escritos
// aquí arriba. Así que es la única que sigue funcionando si el itinerario no carga — que es
// justo el caso que importa: la caché desalojada por iOS, en Puno y sin cobertura.
const SIN_DATOS = new Set(['emergencias']);

function verSinDatos() {
  pintar(`
    <div class="tarjeta">
      <p>No se pudieron cargar los datos del viaje. Puede ser un despliegue a medias o la
         caché del móvil; los teléfonos de emergencia siguen funcionando igual.</p>
      <p><button type="button" class="chip chip--acento" data-reintentar>Reintentar</button></p>
      <p><a href="#/emergencias">Teléfonos de emergencia →</a></p>
    </div>`);
  app.querySelector('[data-reintentar]').addEventListener('click', async (e) => {
    e.target.disabled = true;
    if (await cargarDatos()) ir(); else verSinDatos();
  });
}

async function cargarDatos() {
  try { datos = await cargar(); return true; } catch (e) { console.error(e); return false; }
}

async function ir() {
  const { nombre, arg } = ruta();
  marcarNav(nombre);
  document.body.classList.toggle('ruta-mapa', nombre === 'mapa' && Boolean(datos));
  if (nombre !== 'mapa' && mapaVivo) mapaVivo.cerrar();
  if (!datos && !SIN_DATOS.has(nombre)) return verSinDatos();
  RUTAS[nombre](arg);
}

async function init() {
  pintarNav();
  // El router se registra ANTES de cargar: si el `await` falla, la barra de abajo tiene que
  // seguir navegando. Antes el `catch` hacía `return` aquí y se llevaba por delante el SOS.
  window.addEventListener('hashchange', ir);
  await cargarDatos();
  ir();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

init();
