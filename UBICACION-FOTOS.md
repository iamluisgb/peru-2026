# UBICACIÓN DE LAS FOTOS — decisión

Auditoría de UX/UI del 26 de agosto de 2026, continuación de [`AUDITORIA-UX.md`](AUDITORIA-UX.md).
Medido a 402×874 con Playwright sobre el sitio servido, maquetando una foto real de prueba
(Koricancha, 1000 px, 160 KB) en cada posición candidata antes de decidir. No se ha tocado ni un
fichero del proyecto para medir.

---

## La decisión, en cinco líneas

**Las fotos van en un solo sitio: la ficha completa, al final de la capa `de_pie`, justo antes de
«Leer con calma».** Ahí no mueven ni un píxel del pliegue de los 10 segundos — medido: `mira` 1
sigue empezando en 548 y los chips de `practico` en 939, exactamente donde están hoy. **No van en
la hoja del mapa, ni en las tarjetas de día, ni en Hoy, ni en el índice**, porque en esas cuatro
pantallas la foto empuja hacia abajo un aviso o multiplica por diez la descarga sin responder a
ninguna pregunta que la pantalla tenga que responder. Caja **3:2 a ancho de tarjeta — 328×219 px
en un móvil de 402 —**, recortada con `object-fit: cover` y un `foco` por foto para los tres
panoramas. **Cuando no hay foto no hay hueco: no se pinta el `<figure>`, y la ficha queda idéntica
a la de hoy** — que es el caso de 13 de las 39 fichas siempre, y de las 39 sin cobertura.

---

## Por qué no puede ir arriba: el pliegue, medido

Pliegue real a 402×874: la navbar tapa los últimos ~64 px, así que hay **810 px útiles**. Koricancha
hoy, con posiciones tomadas del DOM renderizado:

| Elemento | Hoy | Con una foto de 180 px encima del `h1` |
|---|---|---|
| `eyebrow` «CUSCO · DÍA 8» | 77 | 537 |
| `h1` | 103 | 295 |
| aviso `serio` (cierra los domingos) | 194–326 | 386–518 |
| `gancho` | 338–492 | 530–684 |
| `mira` 1 | 548–697 | 740–889 (cortado a la mitad) |
| `mira` 2 | 709–808 (**dentro**) | 901 (**fuera**) |
| `mira` 3 | 820–919 | 1112 |

Una foto de 180 px arriba —y 180 es ya la versión tacaña; a ancho completo en 3:2 son 219— se lleva
por delante el segundo *mira* y deja el primero partido. La ficha existe para contestar «¿qué miro?»
de pie; la auditoría anterior verificó que el pliegue daba gancho + aviso + dos *mira*, y eso es el
producto. **Encima del gancho no va nada.** Debajo del gancho tampoco: partiría la capa `de_pie` en
dos con un objeto de 219 px que sin cobertura no existe, o sea que la ficha tendría una forma con
red y otra sin red justo en el trozo que se lee andando.

---

## Pantalla por pantalla

### 1 · Ficha completa `#/guia/<id>` — **SÍ**

**Dónde exactamente:** dentro de `<article class="tarjeta ficha">`, después de los chips de
`practico` y de sus `notas`, **inmediatamente antes de `<details class="sofa">`** («Leer con
calma»). Si la ficha no tiene capa de sofá, antes de «Para entender esto».

**Qué tamaño:** `<figure>` a ancho de tarjeta. En 402 el interior de la tarjeta mide **328 px**
(402 − 2×`--s-5` − márgenes de página), así que la imagen es **328×219** (`aspect-ratio: 3/2`,
`object-fit: cover`, `border-radius: var(--r-md)` para que anide dentro del `--r-lg` de la
tarjeta). El pie va debajo a `--fs-xs` con `margin-top: var(--s-2)`, en **`--text-soft`, no en
`--text-faint`** — la atribución es una obligación de la licencia CC BY / CC BY-SA, y `--text-faint`
mide 2,61:1 (hallazgo 10 de la auditoría anterior). El pie lleva autor + licencia y, cuando se pueda,
una frase que ate la foto al `mira`: *«El muro exterior, con los nichos (2) y la línea inca/colonial
(3). Foto: Lascar · CC BY 2.0»*. Eso convierte la foto en parte del guiado en vez de en decoración.

**Qué pasa cuando no hay foto:** no se pinta el `<figure>`. Cero px, sin marco, sin gris, sin
«foto no disponible». La ficha queda **byte a byte la de hoy**. Es el caso permanente de 13 de las
39 fichas: las 7 de sitio sin candidato (`carmen-alto`, `san-blas`, `tres-ventanas`,
`templo-del-condor`, `ciudadela-machu-picchu`, `raqchi`, `yucay`) y las 6 transversales, que no son
lugares y no deben llevar foto ni aunque aparezca una.

**Qué pasa sin cobertura (el caso normal en Colca, Titicaca y el tren):** el `<figure>` se pinta
`hidden` y sólo se revela cuando `img.decode()` resuelve; si falla o no llega, se queda oculto y
la ficha es la de hoy. **Nada de reservar los 219 px por CSS antes de que la imagen decodifique**,
o el modo de fallo pasa de «no hay foto» a «hay un agujero gris de 219 px», que es peor que no
tenerla. Y **ningún mensaje**: el satélite explica su fallo porque el usuario pulsó un botón y se
le debe una explicación; aquí nadie ha pedido nada, y el silencio es el fallo correcto.

**El precio, dicho entero:** «Leer con calma» pasa de 1124 a **1401** (+277 px). La auditoría
anterior pedía que esa capa fuera *más* fácil de encontrar, no 277 px más honda. Lo acepto porque
la foto es el único objeto de la ficha que detiene el scroll, y queda pegada justo encima del
`summary`: hace de señal. Si al probarlo resulta que no lo hace, la foto se mueve dentro del
`de_sofa` (medido también: entonces el `summary` no se mueve nada) y se pierde a cambio que 26
fotos verificadas queden detrás de un plegado.

### 2 · Hoja del mapa — **NO**

El `<dialog>` mide 717 px de alto con 887 px de contenido: **ya se desborda hoy**. Añadir la figura
lo lleva a 1137 (+28 % de scroll dentro de un modal). Y el mapa es la pantalla más offline de la
app —es la que se mira en el bus de Puno a Cusco—, así que ahí la foto es, casi siempre, 250 px de
nada. La hoja es una ojeada: responde «¿qué es ese punto?» con el gancho y los *mira*, y remata con
«Leer con calma →», que ahora también significa «y ahí está la foto».

### 3 · Tarjetas de día `#/dias` y `#/hoy` — **NO**

En **Hoy** el pliegue termina hoy en 699, con «Qué vais a ver» asomando, y los dos avisos ocupan
319–667. Cualquier foto de 219 px empuja el aviso `serio` («Koricancha cierra los domingos») fuera
de la pantalla. Es literalmente el principio 3 de DESIGN.md — *«un aviso va antes que la prosa
bonita»* — y una foto es la prosa más bonita que hay.

En **Días** el scroll ya es de **9.542 px** para 13 tarjetas. Además la unidad no encaja: un día
tiene de 0 a 6 fichas, y **4 de los 13 días no tienen ninguna** (0, 1, 11 y 12: vuelos y traslados).
No existe «la foto del día 5»; elegir una de las tres sería una afirmación editorial que los datos
no sostienen, y las otras cuatro tarjetas serían huecos permanentes en la pantalla más larga.

### 4 · Índice `#/guia` — **NO**

33 filas de 58 px, 2.963 px de scroll. Con miniaturas de 56 px las filas pasan a ~76 y el índice
crece a ~3.900 px (**+32 %**) para enseñar los mismos 33 nombres. Peor: **26 filas llevarían imagen
y 7 no**, y ese es exactamente el fallo que hay que evitar — una columna dentada donde la ausencia
de foto parece un error de carga. Sin cobertura las 33 están vacías y el índice entero es una
columna de agujeros. Y aun con la versión barata (miniatura de 200 px = 11,5 KB) son **300 KB**,
el 68 % de todo el precache actual, para una lista que se recorre con el pulgar en dos segundos.
Lo que el índice necesita no es una foto: ya ancla el día de hoy arriba, y con eso basta.

### 5 · Proporción, altura y recorte

**3:2, recortada, `object-fit: cover`.** No es una preferencia estética, sale de las 26 fotos
elegidas: la **mediana de sus proporciones es exactamente 1,50** y **14 de las 26 son 3:2 clavado**.
Con la caja en 3:2:

- 8 fichas pierden algo de alto; la peor es `catedral-cusco` (1,20) con **−20 %**.
- 3 son panoramas y pierden ancho: `uros` (2,16) −31 %, `yanque` (2,14) −30 %, `plaza-armas-cusco`
  (2,09) −28 %. Para esas, y sólo para esas, un campo `foco` en el JSON que se traduzca a
  `object-position`. Si una foto no sobrevive al recorte, no es la foto: se elige otro candidato
  o esa ficha va sin ella. Misma doctrina que `fuentes` y `verificado`.

Caja **fija** para las 26 —nada de respetar la proporción original—, porque una caja variable
convierte la ficha en un objeto de altura impredecible y a la vertical de `santa-catalina` le daría
media pantalla.

**Peso:** un derivado por foto, **1000 px de ancho, JPEG q62 ≈ 160 KB** (medido sobre la foto real
de Koricancha: 200 px→11 KB, 320→19, 600→49, 1000→160, 1200→217). En un móvil DPR 3 la imagen se
escala un 20 %; en una foto eso no se ve, y 1200 px cuesta un 36 % más. **Las fotos no entran en
`ASSETS`**: el precache completo son hoy 42 ficheros y **438 KB**, y 26 fotos son **4,2 MB — diez
veces la app entera**. Es el mismo trato que ya tiene MapLibre en `vendor/`, y es lo que ADR-005
protegía de verdad. Se cargan `loading="lazy"`, una por ficha abierta, desde el propio origen
(rehospedadas en el repo, **nunca enlazadas a `upload.wikimedia.org`**: una foto hotlinkeada no se
puede cachear en runtime y le da a un tercero un log de qué ficha abre quién).

Consecuencia que merece la pena aprovechar: si el service worker las cachea **en runtime**
(`cacheFirst`, caché aparte de la de precache, sin tocar `ASSETS`), la ficha que se lee la noche
antes en el hotel deja su foto guardada para la mañana siguiente en el sitio. Es el único camino
por el que una foto puede llegar a existir en el Colca, y sale gratis.

---

## Lo que NO haría con las fotos

**Un hero.** Foto a sangre bajo el título, en la ficha o en Hoy. Es la maqueta A de arriba: bonita
y le quita a la app su único trabajo. Y es la puerta por la que esto se convierte en la web de
agencia que ADR-001 descartó.

**Una galería, un carrusel o un lightbox.** Hay una foto confirmada por ficha (7 fichas tienen dos
candidatos, no dos fotos). Un carrusel para un elemento es cromo, y un lightbox añade un gesto
—pellizcar, cerrar— a una pantalla que se usa con guantes y con el grupo esperando. Si alguien
quiere ver la foto grande, tiene el sitio delante.

**Texto encima de la foto.** Nombre o eyebrow sobre la imagen con un degradado. Contraste
impredecible foto a foto, ilegible con sol directo, e imposible de medir; y cuando la foto no carga,
el texto se queda sobre un fondo que no existe.

**Miniaturas en el índice o en «Qué vais a ver».** Ver arriba: la lista dentada de 26 sí y 7 no es
el modo de fallo que el encargo pide evitar, y offline son 33 no.

**Un placeholder.** Rectángulo gris, silueta, `alt` estilizado, spinner o «no hay conexión». Cuando
no hay foto no ha pasado nada malo: el 33 % de las fichas no la tendrá nunca y ninguna la tendrá en
el tren. Anunciar una ausencia que es lo normal convierte el estado normal en un error.

**Precacharlas.** 4,2 MB contra 438 KB. Un precache de 4,6 MB tarda, se desaloja antes en iOS —el
escenario del hallazgo 2— y lo que se perdería con él es el itinerario, no las fotos.

**Fotos para las 6 transversales.** «Cómo leer un muro inca» o «Pachacútec» no son sitios. Una foto
ahí sería un ejemplo disfrazado de lugar, y ninguna tiene candidato.

**Dejar que la foto sea la identidad.** ADR-005 queda revocado en su prohibición, pero tenía razón
en lo que protegía: la identidad de esto es color, tipografía y un mapa SVG propio. La foto entra
como **una nota al pie ilustrada al final de la capa de pie**, subordinada al texto, nunca como
portada, nunca en la navegación, nunca por encima de un aviso.
