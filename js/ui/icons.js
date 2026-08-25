// Iconos SVG inline, trazo de 1.75. Inline y no un sprite ni una fuente de iconos: son
// nueve, pesan nada, y así heredan `currentColor` y el tema sin una capa más.
// Los glifos unicode de antes (◉ ▤ ◈) se veían distintos en cada sistema y ninguno
// significaba lo que decía.

const TRAZOS = {
  hoy:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  dias:  '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  guia:  '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 1 4 20.5z"/>',
  altura:'<path d="M2 19h20"/><path d="M3 19 9 8l3.5 6L15 10l6 9"/>',
  sos:   '<path d="M12 3 4 6v6c0 4.5 3.2 7.9 8 9 4.8-1.1 8-4.5 8-9V6z"/><path d="M12 9v5M9.5 11.5h5"/>',
  reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>',
  pico:  '<path d="M3 19 9.5 7l3.5 6.2L15.5 10 21 19z"/>',
  cama:  '<path d="M3 18v-6h18v6"/><path d="M3 12V7M21 18v-2M3 18v-2"/><circle cx="7.5" cy="9.5" r="1.8"/>',
  plato: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/>',
  libre: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.5 11 15l4.5-5"/>',
  atras: '<path d="M15 5l-7 7 7 7"/>',
  mapa:  '<path d="M9 3.5 3 5.7v14.8l6-2.2 6 2.2 6-2.2V3.5l-6 2.2z"/><path d="M9 3.5v14.8M15 5.7v14.8"/>',
};

export function icono(nombre, tam = 22) {
  const d = TRAZOS[nombre];
  if (!d) return '';
  return `<svg viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="none" stroke="currentColor"
    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}
