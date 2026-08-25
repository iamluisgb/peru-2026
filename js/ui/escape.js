// Escapar SIEMPRE al construir HTML con datos. Los datos vienen de JSON escrito a mano y
// de localStorage: no hay razón para confiar en ninguno de los dos por defecto.
export function esc(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
