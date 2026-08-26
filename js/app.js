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
  const parada = d && paradaDe(datos.itinerario, d.parada);

  if (d) {
    return pintar(`
      <section class="hero">
        <p class="kicker">Día ${d.n} de ${datos.itinerario.dias.length - 1}</p>
        <h1>${esc(d.titulo)}</h1>
        <p class="fecha">${esc(bonita(d.fecha))}${parada ? ` · ${parada.altitud_m} m` : ''}</p>
      </section>
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
  if (!f) return pintar('<p class="vacio">Esa ficha aún no está escrita.</p>');

  const p = f.de_pie.practico || {};
  const sofa = f.de_sofa || {};
  const haySofa = sofa.contexto || sofa.dato || (sofa.conexion || []).length;

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

      ${haySofa ? `<details>
        <summary>Leer con calma</summary>
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
  const dias = [...porDia.keys()].sort((a, b) => a - b);

  pintar(`
    <header class="cabecera">
      <p class="eyebrow">${icono('guia', 14)} Guía</p>
      <h1>Qué estás viendo</h1>
      <p class="sub">${todas.length - transversales.length} sitios, agrupados por el día que tocan.</p>
    </header>
    <div class="indice">
      ${dias.map(n => {
        const d = datos.itinerario.dias.find(x => x.n === n);
        return `<div class="indice-grupo">Día ${n} · ${d ? esc(d.titulo) : ''}</div>` +
          porDia.get(n).map(htmlEnlaceFicha).join('');
      }).join('')}
      ${transversales.length ? `<div class="indice-grupo">Para entender lo que ves</div>` +
        transversales.map(htmlEnlaceFicha).join('') : ''}
    </div>`);
}

// El perfil se dibuja como un perfil —una línea de ascenso— y no como barras: lo que hay
// que entender de un vistazo es la PENDIENTE, que es lo que castiga al cuerpo, no el valor
// absoluto de cada parada. Las barras ordenaban por altura y escondían justo eso.
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
    </div>

    <p class="seccion-titulo">Parada a parada</p>
    <div class="indice">
      ${paradas.map(p => `<a href="#/dias">
        <span class="nom">${esc(p.nombre)}</span>
        <span class="chip chip--alt" data-nivel="${nivelAltitud(p.altitud_m)}">${p.altitud_m} m</span>
      </a>`).join('')}
    </div>

    <p class="seccion-titulo">Lo que hay que saber</p>
    <div class="tarjeta">
      ${htmlAvisos([datos.avisos.soroche, datos.avisos['patapampa-4900'], datos.avisos['altura-empieza']].filter(Boolean))}
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
// Colocación de etiquetas sin solapes, ni entre ellas ni sobre los círculos. Se prueban ocho
// direcciones por dos distancias y se coge la primera libre; si ninguna lo está, no se dibuja.
// Perder una etiqueta es mejor que superponer dos: dos superpuestas no se leen ninguna.
function colocarEtiquetas(paradas, visibles, activo, W, H) {
  // Prioridad: el primero que pide sitio se lo queda. Machu Picchu y Aguas Calientes están
  // pegados y sólo cabe un nombre entre los dos; sin esto ganaba Aguas Calientes por ir antes
  // en el itinerario, y el mapa del viaje se quedaba sin el nombre del sitio al que va.
  const PRIORIDAD = ['machu-picchu', 'lima', 'cusco', 'puno', 'arequipa'];
  const peso = ({ p }) => {
    const i = PRIORIDAD.indexOf(p.id);
    return i === -1 ? PRIORIDAD.length : i;
  };

  const caja = (c, r) => ({ x1: c.x - r, x2: c.x + r, y1: c.y - r, y2: c.y + r });
  const puestas = [
    ...paradas.map(({ p, c }) => caja(c, p.solo_paso ? 3.6 : 6)),
    ...visibles.map(({ c }) => caja(c, activo === null ? 2.8 : 4.8)),
  ];

  const items = [
    ...paradas.filter(({ p }) => !p.solo_paso).sort((a, b) => peso(a) - peso(b))
      .map(({ p, c }) => ({ texto: p.corto || p.nombre, x: c.x, y: c.y })),
    ...(activo === null ? [] : visibles.map(({ c, f }) => ({ texto: f.nombre, x: c.x, y: c.y }))),
  ];

  const solapa = (a, b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
  const salida = [];

  for (const it of items) {
    const ancho = it.texto.length * 4.1 + 2;
    const candidatos = [];
    for (const d of [1, 1.7]) {
      candidatos.push(
        { dx: 0, dy: 13 * d, anclaje: 'middle' },
        { dx: 0, dy: -9 * d, anclaje: 'middle' },
        { dx: 8 * d, dy: 3, anclaje: 'start' },
        { dx: -8 * d, dy: 3, anclaje: 'end' },
        { dx: 7 * d, dy: -6 * d, anclaje: 'start' },
        { dx: -7 * d, dy: -6 * d, anclaje: 'end' },
        { dx: 7 * d, dy: 10 * d, anclaje: 'start' },
        { dx: -7 * d, dy: 10 * d, anclaje: 'end' },
      );
    }
    for (const c of candidatos) {
      const x = it.x + c.dx, y = it.y + c.dy;
      const izq = c.anclaje === 'middle' ? x - ancho / 2 : c.anclaje === 'start' ? x : x - ancho;
      const cj = { x1: izq, x2: izq + ancho, y1: y - 8, y2: y + 3 };
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
      <svg class="mapa-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"
           role="img" aria-label="Mapa de la ruta de Lima a Machu Picchu con los sitios de la guía">
        <rect class="mapa-mar" x="0" y="0" width="${W}" height="${H}"/>
        ${contorno.map(d => `<path class="mapa-pais" d="${d}"/>`).join('')}
        <path class="mapa-ruta" d="${linea}"/>
        <g class="mapa-sitios">
          ${todas.map(({ id, c, f }) => `
            <g class="mapa-ficha" data-ficha="${esc(id)}" data-dia="${f.dia}"
               role="button" tabindex="0" aria-label="${esc(f.nombre)}">
              <circle cx="${c.x}" cy="${c.y}" r="2.8"/>
              <title>${esc(f.nombre)}</title>
            </g>`).join('')}
        </g>
        ${paradas.map(({ p, c }) => `
          <circle class="mapa-parada" cx="${c.x}" cy="${c.y}" r="${p.solo_paso ? 3 : 5.5}"/>`).join('')}
        <g class="mapa-etiquetas"></g>
      </svg>

      <div class="sat-lienzo" hidden></div>

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
    // que el zoom y el foco no se pierden.
    svg.querySelectorAll('.mapa-ficha').forEach(g => {
      const suyo = d === null || Number(g.dataset.dia) === d;
      g.toggleAttribute('hidden', !suyo);
      g.querySelector('circle').setAttribute('r', d === null ? 2.8 : 4.2);
    });

    app.querySelectorAll('.mapa-filtros .chip').forEach(b => {
      const activo = (b.dataset.dia === '' && d === null) || Number(b.dataset.dia) === d;
      b.classList.toggle('chip--acento', activo);
      b.setAttribute('aria-pressed', String(activo));
    });

    const visibles = visiblesDe(d);
    capaEtiquetas.innerHTML = colocarEtiquetas(paradas, visibles, d, W, H).map(e =>
      `<text class="mapa-etiqueta" x="${e.x.toFixed(1)}" y="${e.y.toFixed(1)}"
             text-anchor="${e.anclaje}">${esc(e.texto)}</text>`).join('');

    if (encuadrar) {
      if (d === null) zoom.reiniciar();
      else zoom.encuadrar(caja(visibles.map(v => v.c)));
    }
    satelite.encuadrar(visibles, d);
  }

  mapaVivo = { dia: null, filtrar, cerrar: () => { satelite.cerrar(); mapaVivo = null; } };
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
    <a class="hoja-mas" href="#/guia/${esc(f.id)}">Ficha completa →</a>`;

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


function verEmergencias() {
  const tel = (quien, detalle, numero) => `
    <a class="tel" href="tel:${numero.replace(/\s/g, '')}">
      <span>
        <span class="quien">${esc(quien)}</span><br>
        <span class="num">${esc(numero)} · ${esc(detalle)}</span>
      </span>
      <span class="accion" aria-hidden="true">${icono('sos', 18)}</span>
    </a>`;

  pintar(`
    <header class="cabecera">
      <p class="eyebrow">${icono('sos', 14)} Si algo pasa</p>
      <h1>Emergencias</h1>
      <p class="sub">Funciona sin cobertura. Los números están guardados en la app.</p>
    </header>

    ${tel('Asistencia en viaje', 'Iris Global · seguro, 24 h', '+34 915 72 43 43')}
    ${tel('TUI incidencias', 'también WhatsApp, 24 h', '+34 919 930 612')}
    ${tel('Lima Tours', 'en destino · admite WhatsApp', '+51 997 516 250')}
    ${tel('Emergencias Perú', 'policía y sanitarias', '105')}

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
      ${htmlAvisos([aviso, datos.avisos['equipaje-5kg-preparar']].filter(Boolean), true)}
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

async function ir() {
  const { nombre, arg } = ruta();
  marcarNav(nombre);
  document.body.classList.toggle('ruta-mapa', nombre === 'mapa');
  if (nombre !== 'mapa' && mapaVivo) mapaVivo.cerrar();
  RUTAS[nombre](arg);
}

async function init() {
  pintarNav();
  try {
    datos = await cargar();
  } catch (e) {
    app.innerHTML = '<div class="tarjeta"><p>No se pudieron cargar los datos del viaje.</p></div>';
    console.error(e);
    return;
  }
  window.addEventListener('hashchange', ir);
  ir();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

init();
