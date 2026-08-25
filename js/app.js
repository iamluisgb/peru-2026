// Orquestador. Router de hash, cinco pantallas, sin framework.
import { cargar, diaDe, paradaDe, nivelAltitud, avisosDe, culturaDe } from './datos.js';
import { esc } from './ui/escape.js';
import { hoyISO, bonita, diasHasta } from './ui/fecha.js';
import { leer, escribir } from './almacen.js';

// Datos personales de emergencias. Viven SOLO en localStorage bajo el prefijo `peru_`
// (ADR-002): el repo es público y nada de esto puede acabar versionado.
const CLAVE_DATOS = 'datos';

const app = document.getElementById('app');
let datos = null;

const RUTAS = { hoy: verHoy, dias: verDias, guia: verGuia, altura: verAltura, emergencias: verEmergencias };

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

// ---- Trozos reutilizables ----

function htmlAvisos(lista) {
  return lista.map(a => `
    <div class="aviso aviso--${esc(a.nivel)}">
      <h4>${esc(a.titulo)}</h4>
      <p>${esc(a.texto)}</p>
    </div>`).join('');
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
  const max = Math.max(...paradas.map(p => p.altitud_m));
  pintar(`
    <header class="cabecera"><p class="eyebrow">El ascenso</p><h1>Altura</h1></header>
    <div class="tarjeta">
      ${paradas.map(p => `
        <div style="display:flex;align-items:center;gap:var(--s-3);margin-bottom:var(--s-2)">
          <span style="flex:0 0 9rem">${esc(p.nombre)}</span>
          <span style="flex:1;height:8px;border-radius:var(--r-pill);background:var(--surface-3)">
            <span style="display:block;height:100%;border-radius:var(--r-pill);width:${Math.round(p.altitud_m / max * 100)}%;background:var(--altitud-${nivelAltitud(p.altitud_m)})"></span>
          </span>
          <span class="altitud-badge" data-nivel="${nivelAltitud(p.altitud_m)}">${p.altitud_m}</span>
        </div>`).join('')}
      <p class="chip">Altitudes pendientes de verificar — ver BACKLOG</p>
    </div>
    ${htmlAvisos([datos.avisos.soroche, datos.avisos['patapampa-4900']].filter(Boolean))}`);
}

function verEmergencias() {
  const guardado = leer(CLAVE_DATOS, null) || {};
  const haySeguro = Boolean(guardado.poliza);
  const valor = (k) => esc(guardado[k] || '');

  pintar(`
    <header class="cabecera"><p class="eyebrow">Si algo pasa</p><h1>Emergencias</h1></header>

    <div class="tarjeta tarjeta--punto">
      <h3>Seguro de viaje</h3>
      ${haySeguro
        ? `<p class="seguro-guardado"><span class="chip chip--acento">Póliza guardada</span><strong>${valor('poliza')}</strong></p>`
        : `<p>Anota abajo el número de póliza para tenerlo a mano sin cobertura.</p>`}
    </div>

    <div class="tarjeta">
      <h3>Asistencia en viaje (seguro)</h3>
      <p><a class="tel" href="tel:+34915724343">+34 915 72 43 43</a> · Iris Global, 24 h</p>
    </div>
    <div class="tarjeta">
      <h3>TUI incidencias 24 h</h3>
      <p><a class="tel" href="tel:+34919930612">+34 919 930 612</a> · también WhatsApp</p>
    </div>
    <div class="tarjeta">
      <h3>Lima Tours (en destino)</h3>
      <p><a class="tel" href="tel:+51997516250">+51 997 516 250</a> · admite WhatsApp</p>
    </div>

    <div class="tarjeta">
      <h3>Mis datos</h3>
      <form class="form-datos" id="form-datos" novalidate>
        <label for="fd-nombre">Nombre</label>
        <input id="fd-nombre" name="nombre" value="${valor('nombre')}" autocomplete="name" placeholder="Vuestros nombres">
        <label for="fd-contacto">Contacto de emergencia</label>
        <input id="fd-contacto" name="contacto" value="${valor('contacto')}" autocomplete="tel" inputmode="tel" placeholder="Alguien en casa">
        <label for="fd-poliza">Seguro / póliza</label>
        <input id="fd-poliza" name="poliza" value="${valor('poliza')}" autocomplete="off" placeholder="Número de póliza">
        <label for="fd-alergias">Alergias / medicación</label>
        <textarea id="fd-alergias" name="alergias" placeholder="Lo que deba saber un médico">${valor('alergias')}</textarea>
        <button class="boton boton--primario" type="submit">Guardar</button>
        <p class="aviso-privado">Se guarda sólo en este móvil (localStorage) y no sale de él.</p>
      </form>
    </div>`);

  const form = document.getElementById('form-datos');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const datos = {
      nombre: (fd.get('nombre') || '').trim(),
      contacto: (fd.get('contacto') || '').trim(),
      poliza: (fd.get('poliza') || '').trim(),
      alergias: (fd.get('alergias') || '').trim(),
    };
    escribir(CLAVE_DATOS, datos);
    verEmergencias(); // re-render para reflejar lo guardado en la tarjeta de seguro
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
