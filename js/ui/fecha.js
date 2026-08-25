// Fechas del viaje. Todo se compara en HORA LOCAL y a día completo: "hoy" es un día del
// itinerario, no un instante. Comparar con Date.now() en UTC hace que a las 23:30 en España
// la app ya enseñe el día siguiente, que es justo lo contrario de lo que se quiere.

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function hoyISO(ahora = new Date()) {
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function aFecha(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function bonita(iso) {
  const f = aFecha(iso);
  return `${DIAS[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]}`;
}

export function esDomingo(iso) {
  return aFecha(iso).getDay() === 0;
}

export function diasHasta(iso, desde = hoyISO()) {
  return Math.round((aFecha(iso) - aFecha(desde)) / 86400000);
}
