// Zoom y arrastre sobre un SVG, moviendo su viewBox.
//
// Se mueve el viewBox y no un `transform`, porque el viewBox es lo que las etiquetas y los
// puntos usan para decidir su tamaño en pantalla: sabiendo la escala se puede COMPENSAR y
// que nada crezca al acercarse. Con un transform, el texto escalaría con todo lo demás y a
// zoom 4x las etiquetas taparían el mapa.
//
// Sin dependencias y con Pointer Events: el mismo código sirve para rueda, dedo y trackpad.
//
// El encuadre base NO es el viewBox del dato: es ese rectángulo ESTIRADO hasta la proporción
// del contenedor. En un móvil (402×790) la caja de Perú es apaisada y el hueco casi vertical,
// así que sin estirar sobraría la mitad de la pantalla o —lo que hacía antes— habría que
// recortar el país por los lados. Estirando, a z=1 se ve Perú entero en cualquier pantalla y
// `encuadrar` aprovecha el alto real del móvil en vez de dejar bandas de mar.

const MIN = 1, MAX = 6;

export function activarZoom(svg, { w, h }) {
  let z = 1, cx = w / 2, cy = h / 2;      // escala y centro, en unidades del viewBox
  let escala = 1;                          // píxeles de pantalla por unidad de usuario

  // Rectángulo base: contiene w×h y tiene la proporción del contenedor.
  function base() {
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return { bw: w, bh: h };
    const prop = r.width / r.height;
    return prop > w / h ? { bw: h * prop, bh: h } : { bw: w, bh: w / prop };
  }

  // Si la caja no cabe en el eje (el mapa es más estrecho que el encuadre), se centra.
  const dentro = (v, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));

  function aplicar() {
    z = Math.min(MAX, Math.max(MIN, z));
    const { bw, bh } = base();
    const vw = bw / z, vh = bh / z;
    // El centro se limita para que el mapa nunca se salga del marco: a zoom 1 queda clavado.
    cx = dentro(cx, vw / 2, w - vw / 2);
    cy = dentro(cy, vh / 2, h - vh / 2);
    svg.setAttribute('viewBox', `${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}`);
    // Compensación de tamaños: `--esc` son los píxeles que mide una unidad del SVG, así que
    // `calc(16px / var(--esc))` es un punto de 16 px reales en cualquier zoom y en cualquier
    // pantalla. Sin esto, ver Perú entero en un móvil dejaba los puntos en 4 px.
    escala = (svg.getBoundingClientRect().width || vw) / vw;
    svg.style.setProperty('--esc', String(escala));
    svg.dataset.zoom = z.toFixed(2);
  }

  function haciaPunto(factor, px, py) {
    // Zoom sobre el puntero: el punto bajo el dedo se queda donde está.
    const { bw, bh } = base();
    const vw = bw / z, vh = bh / z;
    const ux = cx - vw / 2 + px * vw;
    const uy = cy - vh / 2 + py * vh;
    z = Math.min(MAX, Math.max(MIN, z * factor));
    cx = ux - (px - 0.5) * (bw / z);
    cy = uy - (py - 0.5) * (bh / z);
    aplicar();
  }

  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = svg.getBoundingClientRect();
    haciaPunto(Math.exp(-e.deltaY * 0.0016), (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  }, { passive: false });

  // Arrastre y pellizco con el mismo registro de punteros activos.
  const activos = new Map();
  let previaDist = 0;

  svg.addEventListener('pointerdown', (e) => {
    activos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    svg.setPointerCapture(e.pointerId);
  });

  svg.addEventListener('pointermove', (e) => {
    const p = activos.get(e.pointerId);
    if (!p) return;
    const r = svg.getBoundingClientRect();
    const { bw, bh } = base();

    if (activos.size === 1) {
      // Un dedo: arrastrar. El desplazamiento en píxeles se traduce a unidades del viewBox.
      cx -= ((e.clientX - p.x) / r.width) * (bw / z);
      cy -= ((e.clientY - p.y) / r.height) * (bh / z);
      aplicar();
    }
    activos.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activos.size === 2) {
      const [a, b] = [...activos.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (previaDist) {
        const medioX = ((a.x + b.x) / 2 - r.left) / r.width;
        const medioY = ((a.y + b.y) / 2 - r.top) / r.height;
        haciaPunto(dist / previaDist, medioX, medioY);
      }
      previaDist = dist;
    }
  });

  function soltar(e) {
    activos.delete(e.pointerId);
    if (activos.size < 2) previaDist = 0;
  }
  svg.addEventListener('pointerup', soltar);
  svg.addEventListener('pointercancel', soltar);

  // Encuadrar una caja: lo que hace falta al filtrar por día. Con un solo punto no hay caja
  // que ajustar, así que se usa un zoom fijo y se centra — si no, la escala saldría infinita.
  function encuadrar(caja, margen = 26) {
    const { bw, bh } = base();
    const anchoCaja = Math.max(caja.x2 - caja.x1, 1);
    const altoCaja = Math.max(caja.y2 - caja.y1, 1);
    const soloUno = anchoCaja <= 1 && altoCaja <= 1;
    z = soloUno ? 4 : Math.min(MAX, Math.min(bw / (anchoCaja + margen * 2), bh / (altoCaja + margen * 2)));
    cx = (caja.x1 + caja.x2) / 2;
    cy = (caja.y1 + caja.y2) / 2;
    aplicar();
  }

  // Girar el móvil cambia la proporción del contenedor, y con ella el encuadre base.
  const alRedimensionar = () => aplicar();
  window.addEventListener('resize', alRedimensionar);

  aplicar();
  return {
    acercar: () => haciaPunto(1.5, 0.5, 0.5),
    alejar: () => haciaPunto(1 / 1.5, 0.5, 0.5),
    reiniciar: () => { z = 1; cx = w / 2; cy = h / 2; aplicar(); },
    encuadrar,
    escala: () => escala,
    destruir: () => window.removeEventListener('resize', alRedimensionar),
  };
}
