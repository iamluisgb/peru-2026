// Zoom y arrastre sobre un SVG, moviendo su viewBox.
//
// Se mueve el viewBox y no un `transform`, porque el viewBox es lo que la etiqueta de texto
// usa para decidir su tamaño en pantalla: sabiendo la escala se puede COMPENSAR el tamaño
// de fuente y que los nombres no crezcan al acercarse. Con un transform, el texto escalaría
// con todo lo demás y a zoom 4x las etiquetas taparían el mapa.
//
// Sin dependencias y con Pointer Events: el mismo código sirve para rueda, dedo y trackpad.

const MIN = 1, MAX = 6;

export function activarZoom(svg, { w, h }) {
  let z = 1, cx = w / 2, cy = h / 2;      // escala y centro, en unidades del viewBox

  function aplicar() {
    z = Math.min(MAX, Math.max(MIN, z));
    const vw = w / z, vh = h / z;
    // El centro se limita para que el mapa nunca se salga del marco: a zoom 1 queda clavado.
    cx = Math.min(w - vw / 2, Math.max(vw / 2, cx));
    cy = Math.min(h - vh / 2, Math.max(vh / 2, cy));
    svg.setAttribute('viewBox', `${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}`);
    // Compensación del texto: a más zoom, fuente más pequeña en unidades de usuario, así
    // que en pantalla se ve siempre igual.
    svg.style.setProperty('--z', String(z));
    svg.dataset.zoom = z.toFixed(2);
  }

  function haciaPunto(factor, px, py) {
    // Zoom sobre el puntero: el punto bajo el dedo se queda donde está.
    const vw = w / z, vh = h / z;
    const ux = cx - vw / 2 + px * vw;
    const uy = cy - vh / 2 + py * vh;
    z *= factor;
    const nvw = w / Math.min(MAX, Math.max(MIN, z)), nvh = h / Math.min(MAX, Math.max(MIN, z));
    cx = ux - (px - 0.5) * nvw;
    cy = uy - (py - 0.5) * nvh;
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

    if (activos.size === 1) {
      // Un dedo: arrastrar. El desplazamiento en píxeles se traduce a unidades del viewBox.
      cx -= ((e.clientX - p.x) / r.width) * (w / z);
      cy -= ((e.clientY - p.y) / r.height) * (h / z);
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

  aplicar();
  return {
    acercar: () => haciaPunto(1.5, 0.5, 0.5),
    alejar: () => haciaPunto(1 / 1.5, 0.5, 0.5),
    reiniciar: () => { z = 1; cx = w / 2; cy = h / 2; aplicar(); },
  };
}
