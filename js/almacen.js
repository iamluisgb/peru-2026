// localStorage con prefijo `peru_`.
//
// Aquí y SÓLO aquí viven los datos personales: localizadores, tickets, PIN, póliza y las horas
// de recogida que el guía da cada noche. El repo es público (ADR-002), así que nada de esto
// puede acabar en un fichero versionado.
const P = 'peru_';

export function leer(clave, porDefecto = null) {
  try {
    const crudo = localStorage.getItem(P + clave);
    return crudo === null ? porDefecto : JSON.parse(crudo);
  } catch {
    return porDefecto;
  }
}

export function escribir(clave, valor) {
  try {
    localStorage.setItem(P + clave, JSON.stringify(valor));
    return true;
  } catch {
    // Modo privado, cuota llena. Que falle no debe tumbar la pantalla.
    return false;
  }
}

export function borrar(clave) {
  try { localStorage.removeItem(P + clave); } catch { /* nada que hacer */ }
}
