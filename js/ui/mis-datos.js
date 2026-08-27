// Lo que es de CADA viajero y no del circuito: sus localizadores y sus días propios.
//
// Vive en localStorage y nunca en el repo (ADR-002), y esa decisión es la que permite que la
// misma URL sirva a todo el grupo: cada uno abre la app, mete lo suyo, y nadie ve lo del
// otro. No hay cuentas, ni servidor, ni nada que pueda filtrarse.

import { leer, escribir } from '../almacen.js';

const CLAVE = 'mis_datos';

// Campos libres a propósito: cada agencia numera sus cosas de una forma, y una plantilla
// rígida obliga a dejar huecos o a meter el dato donde no toca.
export const CAMPOS = [
  { id: 'localizador', eti: 'Localizador de la reserva', ph: 'el que te dio la agencia' },
  { id: 'ticket', eti: 'Número(s) de ticket', ph: 'uno por línea', largo: true },
  { id: 'poliza', eti: 'Póliza del seguro', ph: 'y su teléfono si es distinto' },
  { id: 'hotel_previo', eti: 'Reserva de la noche previa', ph: 'hotel, confirmación, PIN', largo: true },
  { id: 'notas', eti: 'Otras notas', ph: 'lo que quieras tener a mano sin cobertura', largo: true },
];

export function misDatos() {
  return leer(CLAVE, {});
}

export function guardarDatos(datos) {
  return escribir(CLAVE, datos);
}

// Días propios: la noche previa en Madrid, un vuelo de enlace, una extensión. No son del
// circuito, así que no pueden estar en itinerario.json — ahí un día ajeno le sale a todo el
// grupo. Se intercalan por fecha con los del viaje.
export function misDias() {
  const d = leer(CLAVE, {}).dias;
  return Array.isArray(d) ? d : [];
}

export function guardarDias(dias) {
  const datos = misDatos();
  datos.dias = dias.filter(d => d.fecha && d.titulo);
  return escribir(CLAVE, datos);
}

// Un día propio tiene la misma forma que uno del itinerario, para que la pantalla de Días no
// tenga que saber de dónde viene: `propio: true` es lo único que los distingue.
export function comoDiaDelViaje(d, n) {
  return {
    n, fecha: d.fecha, titulo: d.titulo, parada: null,
    resumen: d.resumen || '', actividades: [], comidas: [], libre: [], avisos: [],
    propio: true,
  };
}
