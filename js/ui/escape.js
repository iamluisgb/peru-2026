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

// Convierte las URLs de un texto en enlaces, sin abrir un agujero de XSS.
//
// El orden importa y es la única parte delicada: se trocea el texto CRUDO por el patrón de
// URL, y cada trozo —enlace o no— se escapa por separado. Escapar primero y linkificar
// después sería al revés y peligroso: se estarían metiendo etiquetas dentro de algo que ya
// se dio por seguro, y una URL con comillas podría romper el atributo.
//
// Sólo http(s). Un `javascript:` en una fuente no debería existir, pero si existe no se
// convierte en enlace: se queda como texto.
//
// Los paréntesis SÍ entran en la URL, porque Wikipedia los usa
// (…/Iglesia_de_San_Blas_(Cusco)) y excluirlos cortaba el enlace por la mitad. A cambio hay
// que devolver el paréntesis final cuando no está balanceado, que es el caso de una URL
// escrita entre paréntesis: "(ver https://a.b/x)".
const URL_RE = /(https?:\/\/[^\s<>"'\]]+)/g;

function recortarCola(url) {
  let u = url;
  for (;;) {
    const previa = u;
    u = u.replace(/[.,;:!?]+$/, '');
    const abre = (u.match(/\(/g) || []).length;
    const cierra = (u.match(/\)/g) || []).length;
    if (cierra > abre) u = u.replace(/\)+$/, ')'.repeat(Math.max(0, abre)));
    if (u === previa) return u;
  }
}

export function enlazar(texto) {
  return String(texto ?? '')
    .split(URL_RE)
    .map((trozo, i) => {
      // Los índices impares son los grupos capturados por el separador, es decir, las URLs.
      if (i % 2 === 0) return esc(trozo);
      const limpia = recortarCola(trozo);
      const url = esc(limpia);
      const sobra = esc(trozo.slice(limpia.length));
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>${sobra}`;
    })
    .join('');
}
