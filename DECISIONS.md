# DECISIONS — el porqué

Decisiones de arquitectura y producto. Cada una registra lo que se descartó, que es la parte que
se olvida.

---

## ADR-001 · Compañero de viaje, no planificador
**2026-08-25 · aceptada**

Las referencias del sector se parten en dos. Las "mejores webs de viajes" (Black Tomato y
compañía) son webs de **agencia**: existen para venderte un viaje que aún no has comprado. Y los
planificadores —Wanderlog, TripIt, Polarsteps— resuelven decidir, organizar reservas y registrar a
posteriori.

Ninguno encaja: **TUI ya decidió todo el itinerario**, las reservas son un PDF, y el diario es
secundario. El hueco real es **acompañar**: ninguna de esas apps sabe que la catedral de Lima
cierra los domingos por la mañana, que en el tren a Machu Picchu entran 5 kg, ni que el día 5 se
cruza un puerto a ~4.900 m.

**Descartado:** clonar un planificador. Habría dado una app vacía, porque no hay nada que planificar.

---

## ADR-002 · Repo público, datos personales en localStorage
**2026-08-25 · aceptada**

GitHub Pages desde repo privado exige plan de pago. Se elige repo **público**, y de ahí sale la
regla dura: ningún dato personal en el repo. Localizador, tickets, PIN y póliza se introducen una
vez desde el móvil y viven en `localStorage`. `npm run check:privacidad` lo vigila, y además hay
pre-commit hook.

El itinerario sí va en el repo: fechas, ciudades, hoteles y actividades valen para cualquiera que
haga este circuito y no identifican a nadie.

**Descartado:** repo privado (cuesta dinero), y cifrar los datos en el repo (una contraseña
compartida por WhatsApp no es seguridad, es teatro).

---

## ADR-003 · Contenido estático, nunca generado en runtime
**2026-08-25 · aceptada**

Tentador: un LLM que escriba la ficha del sitio donde estás. Tres razones para no hacerlo, y la
tercera es la que decide.

1. **Sin red no funciona**, y el sitio existe justo para los lugares sin red.
2. Cuesta dinero por consulta.
3. **Miente.** Fechas, alturas, dimensiones: es donde un modelo inventa con más aplomo, y contado
   delante del monumento suena a verdad. Es la misma doctrina que Areté aplica a los números del
   atleta: *la alucinación de este dominio es el número inventado*.

Por eso: todo escrito y verificado antes de desplegar, `fuentes: []` en cada ficha, y
`verificado: false` para lo que aún no se ha contrastado.

---

## ADR-004 · Ficha en dos capas
**2026-08-25 · aceptada**

Nadie lee 800 palabras de pie a 3.400 m. `de_pie` (~30 s, visible) y `de_sofa` (~3 min, plegado).
Spec en [`CONTENIDO.md`](CONTENIDO.md).

El campo `mira` —2 a 4 detalles **localizables**— es lo que separa esto de una audioguía, y es el
criterio de "ficha terminada".

**Descartado:** una sola longitud. Corta se queda en nada; larga no se lee.

---

## ADR-005 · Sin imágenes de terceros
**2026-08-25 · aceptada**

Una PWA offline con ~40 fotos de sitios arqueológicos son decenas de MB de precache, más un
problema de licencias por cada una. La identidad visual es color, tipografía y un mapa SVG propio.
Las fotos propias entran después, en el diario, y no se precachean.

---

## ADR-006 · GitHub Pages con rutas relativas
**2026-08-25 · aceptada**

Repo de proyecto → el sitio vive en `iamluisgb.github.io/peru-2026/`, bajo subdirectorio. **Todas
las rutas son relativas (`./`)**, en HTML, manifest y service worker. Una ruta absoluta
(`/css/main.css`) funciona en `localhost` y rompe el sitio entero en Pages, que es el peor modo de
fallo posible: verde en local, muerto en producción.

---

## ADR-007 · El SW precachea todo, y la lista se vigila con un test
**2026-08-25 · aceptada**

Colca, Titicaca y el tren no tienen cobertura. Precache completo; `networkFirst` para el código
(evita servir una mezcla de dos generaciones tras un despliegue) y `cacheFirst` para
fuentes/iconos/datos.

`ASSETS` se mantiene a mano y **ya se desincronizó en bookreader** (tres módulos en uso sin
precachear). Aquí `tests/sw-precache.test.mjs` recorre `js/`, `css/` y `data/` y falla si algo no
está en la lista.
