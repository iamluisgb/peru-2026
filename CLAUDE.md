# CLAUDE.md — Perú 2026

Guía de viaje **offline** para un itinerario ya cerrado: *Perú Mágico* (TUI), **30 ago – 10 sep
2026**, dos viajeros. 100% frontend, vanilla JS con módulos ES, **sin build step**: lo que hay en
el repo es lo que se sirve. Mismo esquema que `bookreader` y `arete`, y por las mismas razones.

## Qué es esto, y sobre todo qué no es

TUI ya decidió cada día, cada hotel y cada visita. **No hay nada que planificar**, así que esto no
es un planificador (Wanderlog), ni un organizador de reservas (TripIt), ni un diario a posteriori
(Polarsteps). Es un **compañero de viaje**: responde tres preguntas y sólo tres.

1. **¿Qué toca ahora?** — el día de hoy, sus horas, su hotel, sus comidas incluidas.
2. **¿Qué necesito saber antes de que pase?** — altura, equipaje, cierres, avisos.
3. **¿Por qué esto importa?** — la capa de guía, que es lo que ninguna app tiene.

Lo que **no** lleva, y no es un olvido: buscador, reservas, comparador de precios, mega-menú,
hero de vídeo, blog, formulario de contacto. Todo eso pertenece a una web de agencia, que vende
un viaje que aún no has comprado. Éste ya está pagado.

## La regla que no se negocia: el repo es público, los datos personales no

El sitio se publica en GitHub Pages desde un repo **público**, porque Pages desde repo privado
exige plan de pago. De ahí se sigue lo único importante:

> **Ningún dato personal entra en el repo.** Ni localizadores, ni números de ticket, ni PIN de
> Booking, ni el número de póliza, ni nombres completos de los pasajeros.

Esos datos se introducen **una vez desde el móvil** y viven en `localStorage` bajo el prefijo
`peru_`. Es exactamente el mismo trato que Areté le da a la API key del atleta. Lo que sí va en
el repo es el itinerario (fechas, ciudades, hoteles, actividades) y la guía: información que sería
igual de válida para cualquiera que hiciera este circuito, y que no identifica a nadie.

Antes de commitear datos nuevos: `npm run check:privacidad`. Busca los patrones conocidos
(localizador, tickets, póliza, PIN) en `data/` y falla si aparecen. Está también como pre-commit
hook — no lo desactives.

## Los datos son datos, no HTML

Todo el contenido vive en `data/` como JSON y la UI lo renderiza. Añadir una parada, corregir una
hora o escribir una ficha nueva **nunca** debe obligar a tocar el markup. Si para meter un dato hay
que abrir un `.html`, el modelo de datos está mal y se arregla el modelo, no el HTML.

- `data/itinerario.json` — los 12 días. Fuente de verdad de fechas, rutas, hoteles y comidas.
- `data/guia/<bloque>.json` — las fichas de guía, un fichero por bloque geográfico.
- `data/cultura.json` — los 30 libros/películas/documentales/música, con sus tags.
- `data/avisos.json` — reglas de aviso (cierres por día de semana, equipaje, altura).

Los tres se validan contra su forma en `npm test`. Un JSON malformado o una ficha sin los campos
obligatorios rompe la build, no la app en mitad del Titicaca.

## La ficha de guía: dos capas, y la larga está plegada

Nadie lee 800 palabras de pie, a 3.400 m, con el grupo esperando. Cada punto se escribe **dos
veces**, con longitudes deliberadas (spec completa en [`CONTENIDO.md`](CONTENIDO.md)):

- **`de_pie`** (~30 s): `gancho` (una frase), `mira` (2-4 detalles **localizables** — "la esquina
  de la izquierda según entras", no "arquitectura notable") y `practico` (duración, altitud,
  incluido, fotos).
- **`de_sofa`** (~3 min, plegado): `contexto`, `dato`, y `conexion` hacia `data/cultura.json`.

`mira` es lo que separa a un guía de una audioguía. Si una ficha no tiene detalles localizables,
no está terminada.

## No inventamos cifras

Una fecha de construcción, una altura, un número de piedras: es justo donde un modelo se inventa
cosas con total aplomo, y contadas delante del sitio suenan a verdad. Es la misma doctrina que
Areté aplica a los números del atleta.

- **Todo el contenido es estático, escrito y verificado antes de desplegar.** Nada generado en
  runtime: sin red no funcionaría, costaría dinero y mentiría.
- Cada ficha lleva `fuentes: []`. **Lo que no tiene fuente, no se publica** — sale la ficha sin
  ese dato y ya está.
- Los datos aún sin comprobar llevan `"verificado": false` y `npm run check:datos` los lista. Nada
  con `verificado: false` debe llegar a producción.

Los libros que ya están en casa (MacQuarrie, Cieza de León, Garcilaso) son mejores fuentes que
cualquier web de viajes, y además conectan con lo que se está leyendo en bookreader.

## Offline es el requisito, no una mejora

En el cañón del Colca, en el Titicaca y en el tren a Machu Picchu **no hay cobertura**. Una web
que necesita red allí es una web que no existe justo cuando hace falta.

- PWA instalable, precache completo en [`sw.js`](sw.js), `networkFirst` para el código y
  `cacheFirst` para fuentes/iconos/datos.
- **Al tocar cualquier fichero precacheado hay que subir `CACHE_NAME` y añadirlo a `ASSETS`**, o
  los móviles ya instalados seguirán con la versión vieja. `tests/sw-precache.test.mjs` vigila que
  la lista no se quede corta; en bookreader ya se desincronizó una vez.
- Cero imágenes de terceros. Peso, licencias, y 40 fotos de sitios arqueológicos son decenas de MB
  de precache. La identidad es color, tipografía y un mapa SVG propio.

**La única excepción es la vista satélite** ([`js/ui/satelite.js`](js/ui/satelite.js)), y está
acotada a propósito. Son fotos aéreas de Esri: sin red no pueden existir, así que ahí el trabajo
no es que funcione offline sino que **falle bien** — avisa y devuelve al mapa base. MapLibre está
vendorizado en `vendor/` y **no entra en `ASSETS`**: son 784 KB para una vista que sin cobertura
no funcionaría igualmente. Se carga sólo al pulsar el botón. La atribución de Esri es obligatoria
por sus condiciones y se pinta en pantalla.

El mapa base sigue siendo el SVG: es el que se ve en el Colca, y el que tiene tema.

## Desarrollo

```
python3 -m http.server    # y abrir index.html — los módulos ES y el SW no van con file://
npm test                  # node:test — valida datos, avisos y la lista de precache
npm run check:privacidad  # patrones personales en data/ (también como pre-commit)
npm run check:datos       # lista lo que sigue con verificado:false
npm run lint / format
```

**Al iterar en el navegador el service worker sirve la versión cacheada** y tus cambios en `js/`
no aparecen. Desregístralo desde DevTools o abre desde otro puerto.

## Despliegue

**GitHub Actions → GitHub Pages**, en `.github/workflows/deploy.yml`. Push a `main` despliega.
No hay build: el workflow sube el repo tal cual, menos lo que excluye `.pagesignore`.

La URL es **`https://luisgonzalezbernal.com/peru-2026/`**, y eso no es lo que parece: la cuenta
tiene un dominio propio configurado a nivel de usuario en `iamluisgb.github.io`, así que **todos
los repos de proyecto heredan ese dominio**. `iamluisgb.github.io/peru-2026/` existe y redirige.

Es un repo de proyecto, así que todo va bajo **subdirectorio**: las rutas del HTML, del manifest y
del service worker son **relativas** (`./`), nunca absolutas (`/css/...`), o el sitio se rompe
entero en Pages aunque funcione en local (ADR-006).

**Ojo con el origen: `luisgonzalezbernal.com` es el mismo del que Areté acaba de retirarse.** La
raíz sirve `gh-pages` de arete —una redirección y un `sw.js` de retirada—, pero ese service worker
tiene alcance `/` y esta app vive en `/peru-2026/`, con el suyo propio. Conviven, pero es el tipo
de vecindad que hay que vigilar si algún día la PWA se comporta raro. **Decide el dominio antes de
que nadie instale la app**: mover el origen después obliga a la misma pantomima de migración de
localStorage que hubo que escribir para Areté.

## Estilo visual

Hereda el sistema de tokens de bookreader (superficies tonales, tarjetas redondeadas, un solo
acento, mucho aire). Detalle en [`DESIGN.md`](DESIGN.md). Dos reglas heredadas que aplican igual:

1. **Nada de barras de acento laterales.** El estado se señala con fondo, color y peso — nunca con
   un `border-left` o un `box-shadow inset` pegado al borde.
2. **Tema claro, oscuro y por sistema.** Los tokens se definen enteros en `:root`; el bloque de
   oscuro sólo los redefine.

## Documentación

- [`CONTENIDO.md`](CONTENIDO.md) — spec de la ficha de guía y el inventario de las ~39 fichas.
- [`DESIGN.md`](DESIGN.md) — lenguaje visual (principios + tokens).
- [`DECISIONS.md`](DECISIONS.md) — las decisiones y su porqué (ADR).
- [`BACKLOG.md`](BACKLOG.md) — lo pendiente, única fuente.
