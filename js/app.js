// Orquestador. Router de hash, cinco pantallas, sin framework.
import { cargar, diaDe, paradaDe, nivelAltitud, avisosDe, culturaDe } from './datos.js';
import { esc } from './ui/escape.js';
import { hoyISO, bonita, diasHasta } from './ui/fecha.js';

const app = document.getElementById('app');
let datos = null;

const RUTAS = { hoy: verHoy, dias: verDias, guia: verGuia, altura: verAltura, emergencias: verEmergencias, mochila: verMochila };

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

function htmlAvisos(lista, sinRuta) {
  return (lista || []).map(a => (a ? `
    <div class="aviso aviso--${esc(a.nivel)}">
      <h4>${esc(a.titulo)}</h4>
      <p>${esc(a.texto)}</p>
      ${a.ruta && !sinRuta ? `<p class="aviso-enlace"><a href="${esc(a.ruta)}">${esc(a.ruta_etiqueta || 'Abrir checklist')} →</a></p>` : ''}
    </div>` : '')).join('');
}

function htmlDia(d) {
  const parada = paradaDe(datos.itinerario, d.parada);
  const alt = parada
    ? `<span class="chip"><span class="altitud-badge" data-nivel="${nivelAltitud(parada.altitud_m)}">${parada.altitud_m} m</span></span>`
    : '';
  const comidas = (d.comidas || []).map(c => `<span class="chip">${esc(c)}</span>`).join('');
  const libre = (d.libre || []).map(l => `<span class="chip chip--libre">${esc(l)}</span>`).join('');
  return `
    <article class="tarjeta">
      <p class="chip">Día ${d.n} · ${esc(bonita(d.fecha))}</p>
      <h2>${esc(d.titulo)}</h2>
      <p>${esc(d.resumen)}</p>
      <div class="practico">${alt}${comidas}${libre}</div>
      ${htmlAvisos(avisosDe(datos, d))}
    </article>`;
}

// ---- Pantallas ----

function verHoy() {
  const iso = hoyISO();
  const d = diaDe(datos.itinerario, iso);
  if (d) return pintar(`<header class="cabecera"><p class="eyebrow">Hoy</p><h1>${esc(d.titulo)}</h1></header>${htmlDia(d)}`);

  const faltan = diasHasta(datos.itinerario.viaje.inicio, iso);
  if (faltan > 0) {
    return pintar(`
      <header class="cabecera"><p class="eyebrow">Perú Mágico</p><h1>Faltan ${faltan} días</h1></header>
      <div class="tarjeta">
        <p>Salís el ${esc(bonita(datos.itinerario.viaje.inicio))}.</p>
        <p><a href="#/dias">Ver los 12 días →</a></p>
      </div>`);
  }
  pintar(`<header class="cabecera"><h1>Viaje terminado</h1></header>
    <div class="tarjeta"><p>Ya está. <a href="#/dias">Repasar los días →</a></p></div>`);
}

function verDias() {
  pintar(`<header class="cabecera"><p class="eyebrow">Itinerario</p><h1>Los 12 días</h1></header>
    ${datos.itinerario.dias.map(htmlDia).join('')}`);
}

function verGuia(id) {
  const fichas = Object.values(datos.fichas);
  if (!id) {
    return pintar(`<header class="cabecera"><p class="eyebrow">Guía</p><h1>Qué estás viendo</h1></header>
      ${fichas.map(f => `<article class="tarjeta">
        <a href="#/guia/${esc(f.id)}"><h3>${esc(f.nombre)}</h3></a>
        <p class="chip">${esc(f.lugar)} · día ${f.dia}</p>
      </article>`).join('')}`);
  }

  const f = datos.fichas[id];
  if (!f) return pintar(`<div class="tarjeta"><p>Esa ficha aún no está escrita.</p></div>`);

  const p = f.de_pie.practico || {};
  const sofa = f.de_sofa || {};
  const haySofa = sofa.contexto || sofa.dato;
  pintar(`
    <header class="cabecera"><p class="eyebrow">${esc(f.lugar)} · día ${f.dia}</p><h1>${esc(f.nombre)}</h1></header>
    <article class="tarjeta ficha">
      ${htmlAvisos((f.avisos || []).map(a => datos.avisos[a]).filter(Boolean))}
      <p class="gancho">${esc(f.de_pie.gancho)}</p>
      <h3>Mira esto</h3>
      <ul class="mira">${f.de_pie.mira.map(m => `<li>${esc(m)}</li>`).join('')}</ul>
      <div class="practico">
        ${p.duracion ? `<span class="chip">${esc(p.duracion)}</span>` : ''}
        <span class="chip"><span class="altitud-badge" data-nivel="${nivelAltitud(f.altitud_m)}">${f.altitud_m} m</span></span>
        ${p.incluido ? '<span class="chip chip--acento">incluido</span>' : ''}
        ${p.fotos ? `<span class="chip">fotos: ${esc(p.fotos)}</span>` : ''}
      </div>
      ${haySofa ? `<details><summary>Leer con calma</summary>
        <div class="de-sofa">
          ${sofa.contexto ? `<p>${esc(sofa.contexto)}</p>` : ''}
          ${sofa.dato ? `<p><strong>El dato:</strong> ${esc(sofa.dato)}</p>` : ''}
          ${(sofa.conexion || []).map(c => `<p class="chip">${esc(c.recurso)} — ${esc(c.donde)}</p>`).join('')}
        </div></details>` : ''}
      ${(f.preguntas || []).length ? `<h3>Para preguntarle al guía</h3>
        <ul>${f.preguntas.map(q => `<li>${esc(q)}</li>`).join('')}</ul>` : ''}
    </article>`);
}

function verAltura() {
  const paradas = datos.itinerario.paradas;
  const porId = new Map(paradas.map(p => [p.id, p]));
  // Perfil día a día: la altitud de la parada de cada día de viaje (1..11).
  const perfil = datos.itinerario.dias
    .filter(d => d.n >= 1 && d.n <= 11 && porId.has(d.parada))
    .map(d => ({ ...d, parada: porId.get(d.parada) }));

  // Gráfica SVG a mano, sin librerías. Eje de 0 (mar) a 5.200 m: todo el viaje cabe.
  const MAX = 5200;
  const W = 372, H = 232, L = 40, T = 14, B = 28, R = 40;
  const plotW = W - L - R;
  const plotH = H - T - B;
  const x = i => L + (i / (perfil.length - 1)) * plotW;
  const y = a => T + (1 - a / MAX) * plotH;

  // Las tres zonas de nivel, con los tokens de altitud del tema.
  const NIVELES = [['baja', 0, 2500], ['media', 2500, 3500], ['alta', 3500, 5200]];
  const zonas = NIVELES.map(([n, de, a]) =>
    `<rect class="grafico-zona grafico-zona--${n}" x="${L}" y="${y(a)}" width="${plotW}" height="${y(de) - y(a)}"></rect>`).join('');
  const grids = [2500, 3500].map(m => `
    <line class="grafico-grid" x1="${L}" y1="${y(m)}" x2="${L + plotW}" y2="${y(m)}"></line>
    <text class="grafico-valor" x="${L + plotW + 4}" y="${y(m) + 3}">${mil(m)} m</text>`).join('');
  const zonasTexto = NIVELES.map(([n, de, a]) =>
    `<text class="grafico-zona-label" x="${L - 6}" y="${(y(de) + y(a)) / 2 + 3}" text-anchor="end">${n}</text>`).join('');

  // La línea del viaje: cada tramo se tiñe del nivel al que llega.
  const segmentos = [];
  for (let i = 1; i < perfil.length; i++) {
    const de = perfil[i - 1].parada.altitud_m;
    const a = perfil[i].parada.altitud_m;
    segmentos.push(`<line class="grafico-linea grafico-linea--${nivelAltitud(a)}" x1="${x(i - 1)}" y1="${y(de)}" x2="${x(i)}" y2="${y(a)}"></line>`);
  }
  const eje = `<line class="grafico-eje" x1="${L}" y1="${y(0)}" x2="${L + plotW}" y2="${y(0)}"></line>`;
  const puntos = perfil.map((d, i) =>
    `<circle class="grafico-punto" data-nivel="${nivelAltitud(d.parada.altitud_m)}" cx="${x(i)}" cy="${y(d.parada.altitud_m)}" r="3.5"></circle>`).join('');
  const dias = perfil.map((d, i) =>
    `<text class="grafico-dia" x="${x(i)}" y="${H - 8}" text-anchor="middle">${d.n}</text>`).join('');

  // Picos: Patapampa (solo se cruza, día del aviso patapampa-4900), Puno y Cusco (noches).
  const PICOS = ['patapampa', 'puno', 'cusco'];
  const picoDia = p => p.solo_paso
    ? perfil.find(d => (d.avisos || []).includes('patapampa-4900'))
    : perfil.find(d => d.parada.id === p.id);
  const picos = paradas.filter(p => PICOS.includes(p.id))
    .map(p => ({ p, dia: picoDia(p) }))
    .filter(x => x.dia);
  const picosMarca = picos.map(({ p, dia }) => {
    const i = perfil.indexOf(dia);
    return p.solo_paso
      ? `
      <line class="grafico-pico-vara" x1="${x(i)}" y1="${y(dia.parada.altitud_m)}" x2="${x(i)}" y2="${y(p.altitud_m)}"></line>
      <circle class="grafico-pico" cx="${x(i)}" cy="${y(p.altitud_m)}" r="5"></circle>`
      : `<circle class="grafico-pico" cx="${x(i)}" cy="${y(p.altitud_m)}" r="5"></circle>`;
  }).join('');
  const picoTexto = picos.map(({ p }) => `
    <span class="pico">
      <span class="altitud-badge" data-nivel="${nivelAltitud(p.altitud_m)}">▲ ${p.altitud_m} m</span>
      <strong>${esc(p.nombre)}</strong>
      <span class="chip">${p.solo_paso ? 'solo se cruza' : 'se duerme'}</span>
    </span>`).join('');

  // Noches y qué hacer: cada hotel del circuito, con los avisos marcados con `noche` en data.
  const avisosDeNoche = n => Object.values(datos.avisos).filter(a =>
    a.noche === n.parada.id && (a.noche_dia === undefined || n.dias.includes(a.noche_dia)));
  const diasPorFecha = Object.fromEntries(datos.itinerario.dias.map(d => [d.fecha, d.n]));
  const noches = datos.itinerario.hoteles.map(h => {
    const [yy, mm, dd] = h.desde.split('-').map(Number);
    const base = new Date(yy, mm - 1, dd);
    const nums = [];
    for (let i = 0; i < h.noches; i++) {
      const f = new Date(base);
      f.setDate(base.getDate() + i);
      const iso = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
      if (diasPorFecha[iso] !== undefined) nums.push(diasPorFecha[iso]);
    }
    return { parada: porId.get(h.parada), hotel: h.nombre, noches: h.noches, dias: nums };
  }).map(n => ({ ...n, avisos: avisosDeNoche(n) }));
  const nochesHtml = noches.map(n => `
    <article class="tarjeta noche">
      <div class="noche-cab">
        <h3>${esc(n.parada.nombre)}</h3>
        <span class="chip"><span class="altitud-badge" data-nivel="${nivelAltitud(n.parada.altitud_m)}">${n.parada.altitud_m} m</span></span>
      </div>
      <p class="noche-meta">${esc(n.hotel)} · ${n.noches > 1 ? 'Noches' : 'Noche'} de los días ${n.dias.join(' y ')}</p>
      ${htmlAvisos(n.avisos)}
    </article>`).join('');

  pintar(`
    <header class="cabecera"><p class="eyebrow">El ascenso</p><h1>Altura</h1></header>
    <div class="tarjeta">
      <div class="grafico">
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Perfil del ascenso día a día: la altitud de cada día del viaje">
          ${zonas}${grids}${zonasTexto}${eje}${segmentos.join('')}${puntos}${picosMarca}${dias}
        </svg>
      </div>
      <div class="picos">${picoTexto}</div>
      <p class="chip">Altitudes pendientes de verificar — ver BACKLOG</p>
    </div>
    <div class="tarjeta">
      ${htmlAvisos([datos.avisos.soroche].filter(Boolean))}
    </div>
    <h2 class="seccion-titulo">Las noches y qué hacer</h2>
    ${nochesHtml}`);
}

function verEmergencias() {
  pintar(`
    <header class="cabecera"><p class="eyebrow">Si algo pasa</p><h1>Emergencias</h1></header>
    <div class="tarjeta">
      <h3>Asistencia en viaje (seguro)</h3>
      <p><a href="tel:+34915724343">+34 915 72 43 43</a> · Iris Global, 24 h</p>
    </div>
    <div class="tarjeta">
      <h3>TUI incidencias 24 h</h3>
      <p><a href="tel:+34919930612">+34 919 930 612</a> · también WhatsApp</p>
    </div>
    <div class="tarjeta">
      <h3>Lima Tours (en destino)</h3>
      <p><a href="tel:+51997516250">+51 997 516 250</a> · admite WhatsApp</p>
    </div>
    <div class="tarjeta">
      <h3>Mis datos</h3>
      <p>Localizador, tickets y póliza se introducen en el móvil y no salen de él.
         Pendiente: el formulario (ver BACKLOG).</p>
    </div>`);
}

// ---- Mochila de Machu Picchu ----

// Checklist persistido: los ítems marcados viven en localStorage bajo el prefijo peru_.
const MOCHILA_CLAVE = 'peru_mochila_mp';

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
  RUTAS[nombre](arg);
}

async function init() {
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
