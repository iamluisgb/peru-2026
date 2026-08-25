// `enlazar` mete HTML en la página a partir de texto de los datos. Si se equivoca, es XSS,
// no un enlace feo: por eso tiene tests propios y con casos hostiles.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enlazar } from '../js/ui/escape.js';

test('convierte una URL en enlace', () => {
  const html = enlazar('Ver https://example.com/a para más');
  assert.match(html, /<a href="https:\/\/example\.com\/a" target="_blank" rel="noopener noreferrer">/);
});

test('escapa el texto que rodea al enlace', () => {
  assert.match(enlazar('<script>x</script> https://a.b'), /^&lt;script&gt;x&lt;\/script&gt; /);
});

test('NO enlaza javascript: ni data:', () => {
  for (const malo of ['javascript:alert(1)', 'data:text/html,<script>x</script>']) {
    assert.ok(!enlazar(malo).includes('<a '), `no debe enlazar ${malo}`);
  }
});

test('una URL con comillas no puede romper el atributo href', () => {
  const html = enlazar('https://a.b/"onmouseover="alert(1)');
  assert.ok(!html.includes('onmouseover="alert'), 'el atributo se ha roto');
  assert.ok(html.includes('&quot;'), 'las comillas deben ir escapadas');
});

test('no rompe un texto sin URLs', () => {
  assert.equal(enlazar('Cieza de León, Crónica del Perú, cap. XCII'),
    'Cieza de León, Crónica del Perú, cap. XCII');
});

test('deja fuera el paréntesis de cierre que envuelve a la URL', () => {
  assert.match(enlazar('(ver https://a.b/x)'), /<\/a>\)$/);
});

test('no corta una URL de Wikipedia con paréntesis', () => {
  const html = enlazar('Vía https://es.wikipedia.org/wiki/Iglesia_de_San_Blas_(Cusco)');
  assert.match(html, /href="https:\/\/es\.wikipedia\.org\/wiki\/Iglesia_de_San_Blas_\(Cusco\)"/);
});

test('no se traga la puntuación final de la frase', () => {
  assert.match(enlazar('Ver https://a.b/x.'), /href="https:\/\/a\.b\/x"/);
  assert.match(enlazar('Ver https://a.b/x.'), /<\/a>\.$/);
});
