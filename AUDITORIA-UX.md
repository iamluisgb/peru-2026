# AUDITORÍA UX/UI — Perú 2026

Revisión externa del 26 de agosto de 2026, cuatro días antes de la salida. Diez rutas capturadas
a 402×874 y 1280×900, en claro y oscuro, más medición instrumentada de contraste (compuesto sobre
la pila real de fondos), tamaños de toque, orden de tabulación, texto al 200 % y los modos de
fallo (sin red, datos caídos, ficha inexistente). Nada aquí sale de leer CSS: sale de mirar las
capturas y de medir el DOM renderizado.

---

## Veredicto en cinco líneas

La app hace bien lo difícil: la ficha de dos capas funciona de verdad — a 402 px de ancho el
pliegue te da gancho, aviso y los dos primeros *mira*, que es exactamente el encargo de 10 segundos.
Los tokens, los tres niveles de aviso y el fallo del satélite sin red están resueltos con más
disciplina de la que se ve en producto comercial.

Lo peor son tres cosas concretas y todas medibles. **El mapa no existe en móvil**: `preserveAspectRatio="slice"`
recorta Perú y en un teléfono nunca se ve el país entero, ni siquiera pulsando «encuadrar». **Si
`data/` no carga, la app entera muere**, SOS incluido, aunque los cuatro teléfonos de SOS están
escritos en `app.js` y no necesitan `data/`. Y **el nivel de aviso `ojo` tiene 1,99:1 de contraste**
— el amarillo sobre su propio tinte —, o sea que «5 kg en el tren» y «Empieza la altura» son
justo los dos textos que desaparecen con sol.

---

## Hallazgos priorizados

### 1 · BLOQUEANTE — El mapa nunca muestra Perú en un móvil
**Pantalla:** Mapa · `js/app.js:377`, `css/main.css:350`

El SVG se pinta con `preserveAspectRatio="xMidYMid slice"` (`slice` = *cover*: recorta). El viewBox
es apaisado y el hueco en móvil es 402×790, casi vertical, así que se escala hasta cubrir y se
comen los laterales. Resultado medido a 402×874: en `#/mapa` con el filtro en «Todo» se ven dos
etiquetas (*Aguas C.*, *M. Picchu*), un trozo de océano y **cero** de Lima, Arequipa, Colca, Puno
y Cusco. Los puntos de Lima están en `x = -199`; los de Arequipa en `x = 414`. Fuera de pantalla
por los dos lados a la vez.

Y no hay salida: `zoom.js` fija `MIN = 1`, y `reiniciar()` — el botón ⤢ — devuelve a `z = 1`, que
es precisamente el encuadre recortado. En escritorio (1280×900) el mismo mapa se ve entero y es
bonito, que es lo que hace que el fallo pase desapercibido.

**Por qué importa:** el mapa es lo único que responde a «¿dónde estamos y qué hay cerca?», y la
única pantalla donde importa la geografía. En el bus de Puno a Cusco, con el móvil en la mano, la
app enseña un rectángulo beige.

**Propuesta:** `preserveAspectRatio="xMidYMid meet"` y pintar el mar con el fondo del contenedor
(`.mapa-pantalla` ya tiene `background: var(--mapa-mar)`), en vez de con el `<rect class="mapa-mar">`
que hoy obliga al *slice*. Si se quiere conservar el encuadre lleno en escritorio, calcular el
viewBox inicial con `encuadrar()` sobre la caja de todos los puntos al montar, no dejar `z = 1`.

---

### 2 · BLOQUEANTE — Si `data/` falla, muere la app entera incluido SOS
**Pantalla:** todas · `js/app.js:688-698`

En `init()`, el `catch` pinta «No se pudieron cargar los datos del viaje.» y hace `return` **antes**
de `window.addEventListener('hashchange', ir)`. Comprobado abortando `**/data/**`: pulsas SOS en
la barra, el hash cambia a `#/emergencias`, y `#app` sigue diciendo la misma frase. Los seis
tabs quedan muertos. No hay botón de reintento.

Lo irónico es que `verEmergencias()` no lee `datos`: los cuatro teléfonos (seguro, TUI, Lima Tours,
105) están escritos a mano en `app.js:585-598`. La pantalla que debería sobrevivir al fallo es
justo la que podría sobrevivirlo y no lo hace.

**Por qué importa:** el escenario no es teórico. Es el SW con la caché desalojada por iOS tras
días sin abrir la app, en Puno, sin cobertura. El modo de fallo actual convierte «se perdió el
itinerario» en «se perdieron también los teléfonos de emergencia».

**Propuesta:** registrar `hashchange` antes del `try`, y que `verEmergencias` funcione sin `datos`.
En la pantalla de error, un botón «Reintentar» y un enlace directo a `#/emergencias`.

---

### 3 · SERIO — El nivel de aviso `ojo` mide 1,99:1
**Pantalla:** Días, Altura, Mochila, Hoy · `css/themes.css`

Contraste medido, compuesto sobre el fondo real:

| Texto | Par | Ratio | Mínimo AA |
|---|---|---|---|
| `!` + titular de aviso **ojo** | `#d9a441` sobre `rgba(217,164,65,.16)` → `#f9f0e1` | **1,99** | 4,5 |
| «Preparar la mochila ahora →» (enlace, 14 px) | idem | **1,99** | 4,5 |
| Chip de altitud media («3.400 m») | idem | **1,99** | 4,5 |
| Chip de altitud baja («154 m») | `#6aa84f` sobre `#eaf3e6` | **2,52** | 4,5 |
| Titular de aviso **info** | `#4a7fb5` sobre `#e9f0f6` | **3,65** | 4,5 |
| Titular de aviso **serio** | `#c2453a` sobre `#f8e9e7` | **4,22** | 4,5 |
| Chip `--acento` («incluido») | `#c2562f` sobre `#f8ebe6` | **3,85** | 4,5 |

La causa es una sola y es estructural: **el color semántico se usa como texto sobre su propio tinte
al 12–18 %**. Un par del mismo tono nunca llega a 4,5:1 con esa diferencia de luminancia. Afecta
a los tres niveles de aviso, a las tres bandas de altitud y al chip de acento — o sea a todo el
vocabulario semántico que DESIGN.md declara «no improvisar en el componente».

**Por qué importa:** DESIGN.md fija tres niveles «y no más» porque «si todo es urgente, nada lo
es». Pero hoy el nivel intermedio, el de «te va a fastidiar el día si lo ignoras», es el menos
legible de los tres. A mediodía en el altiplano el aviso de los 5 kg del tren se ve peor que la
prosa gris de al lado. La jerarquía que el diseño defiende con tanto cuidado se invierte al sol.

**Propuesta:** partir cada semántico en dos tokens, uno para relleno y otro para texto:
`--aviso-ojo` (el punto/borde, sigue igual) y `--aviso-ojo-texto`, una versión oscurecida del mismo
tono que alcance ≥ 4,5:1 sobre el `-soft`. Para el amarillo hace falta bajar hasta el entorno de
`#7a5406`. El oscuro va mejor pero también roza (3,97–4,48 en cinco pares) y merece el mismo trato.

---

### 4 · SERIO — «Lo urgente arriba» se incumple justo en Altura
**Pantalla:** Altura

El orden actual es: título, gráfica del ascenso, tabla de diez paradas con su altitud, y **al final**
el bloque «Lo que hay que saber», donde vive el aviso *serio* «Mal de altura»: cuándo los síntomas
dejan de ser normales y hay que bajar en vez de aguantar. En un móvil de 874 px eso son unos
1.150 px de scroll antes de llegar al único texto de la app con consecuencias médicas.

**Por qué importa:** el principio 3 de DESIGN.md dice literalmente «Un aviso (altura, equipaje,
cierre) va antes que la prosa bonita». La gráfica es la prosa bonita: es preciosa y no se consulta
con dolor de cabeza. Nadie entra en `#/altura` a las 2 de la mañana en Puno a mirar un perfil de
elevación; entra porque no puede dormir y le falta el aire.

**Propuesta:** invertir. Aviso «Mal de altura» primero, luego «Parada a parada», y la gráfica al
final como resumen visual. No hace falta modelo de datos nuevo: es reordenar `verAltura()`.

---

### 5 · SERIO — Emergencias entierra el número y ordena mal las llamadas
**Pantalla:** Emergencias · `js/app.js:585-598`

Tres problemas en la misma tarjeta:

1. **El número no es lo más visible.** `.quien` va en `--text` a 16/600 y el teléfono en `.num`,
   gris `--text-soft` 16/400, pegado con un `·` al descriptor: «+34 915 72 43 43 · Iris Global ·
   seguro, 24 h». El único dato accionable de la tarjeta tiene el peso tipográfico más bajo de
   la tarjeta.
2. **Cuatro escudos idénticos.** El `.accion` es el mismo icono `sos` en un círculo terracota
   sólido, repetido cuatro veces. Es el elemento con más peso visual de la pantalla y no
   distingue nada: es cromo puro, contra el principio 1.
3. **El orden está invertido para el peor caso.** «Emergencias Perú · 105 · policía y sanitarias»
   es el cuarto. Si alguien se desploma a 4.900 m en Patapampa, se marca 105, no la aseguradora
   de Madrid.

**Por qué importa:** es la única pantalla que se usa con adrenalina. Todo lo que obligue a leer
una línea entera para extraer nueve dígitos es tiempo.

**Propuesta:** número en su propia línea, ≥ 22 px, peso 600, cifras tabulares; el descriptor
debajo en `--fs-sm`. Quitar el escudo o sustituirlo por un glifo de teléfono discreto y hueco. Y
105 arriba del todo, quizá visualmente separado del bloque de gestiones (seguro / TUI / Lima Tours),
que son otra categoría de urgencia.

---

### 6 · SERIO — `#/mapa/8` deja el filtro activo fuera de pantalla
**Pantalla:** Mapa · `js/app.js:438-441`

Medido: en `#/mapa/8` a 402 px de ancho, el chip «Día 8» está en `left: 444,5` con `scrollLeft: 0`.
Está fuera. La tira de filtros no hace scroll al chip activo cuando el estado viene de la URL. El
usuario llega desde un enlace de día, ve el mapa saltar a un encuadre distinto, y ningún chip
marcado: no hay forma de saber qué filtro está puesto ni cómo quitarlo sin arrastrar la tira a
ciegas.

**Propuesta:** en `filtrar()`, tras marcar el chip, `activo.scrollIntoView({inline:'center', block:'nearest'})`.

---

### 7 · SERIO — Tamaños de toque por debajo de 44 px en los controles que más se usan con guantes
**Pantalla:** Mapa, Guía, Mochila

Medido en el DOM renderizado:

| Control | Tamaño | Dónde |
|---|---|---|
| Chips de día del mapa | 53×**34** | `.mapa-filtros .chip` — el control principal del mapa |
| Chips «Para entender esto» | var×**32** | `.chip--acento`, enlaces a transversales |
| Puntos de ficha en el mapa | **19×19** (28×28 al filtrar por día) | `.mapa-ficha circle` |
| Enlace «Preparar la mochila ahora →» | 189×**17** | dentro del aviso, en Hoy y Días |
| Enlaces de `fuentes` | var×**15** | pie de cada ficha |

El comentario de `css/main.css:331` es honesto — *«targets ≥ 44 px reclama esto cerca del mapa»* —
pero la regla que hay debajo pone 36 px, y esa clase (`.filtro`) ni siquiera se usa ya: el JS pinta
`.mapa-filtros .chip`, que son 34.

**Por qué importa:** los 19 px de los puntos del mapa son el peor caso, porque compiten con el
arrastre: un dedo con guante sobre un objetivo de 19 px que además está en una superficie
arrastrable produce paneos accidentales, no aperturas. Los 34 px del chip de día no son un desastre
pero son el control que se toca más veces por sesión en la pantalla más nueva.

**Propuesta:** chips a 44 px de alto (`padding` vertical, no `min-height`, para que el texto no
flote). Para los puntos del mapa, un `<circle>` transparente de r=22 encima del visible, con el
`pointer-events` en el hitbox — el punto sigue viéndose pequeño y se toca grande. Los enlaces de
`fuentes` no necesitan 44 px (nadie los pulsa de pie), pero «Preparar la mochila ahora →» sí: es
la entrada a una pantalla entera y hoy mide 17 px de alto.

---

### 8 · SERIO — En el mapa, el teclado pasa por 33 puntos invisibles antes de llegar a nada
**Pantalla:** Mapa

Tabulando desde cero en `#/mapa`, los doce primeros focos son puntos de ficha, todos de 19×19, y
**todos fuera del viewport** (`left: -199`, `left: 414`): son las víctimas del recorte del hallazgo
1. Hay 33. Antes de alcanzar el filtro de día, el zoom o la leyenda hay que pulsar Tab 34 veces
persiguiendo un anillo de foco que no está en pantalla.

Se arregla en gran parte solo si se arregla el hallazgo 1, pero el orden sigue siendo el equivocado:
los controles deberían ir antes que el contenido navegable.

**Propuesta:** mover `.mapa-capa--arriba` y `--abajo` antes del `<svg>` en el DOM (con
`position: absolute` el orden visual no cambia), y añadir un `<a class="saltar">` que salte al
primer punto visible.

---

### 9 · SERIO — La app ignora por completo el tamaño de texto del navegador
**Pantalla:** todas · `css/themes.css`, `css/main.css`

Toda la escala tipográfica está en px: `--fs-xs: 12px … --fs-4xl: 42px`, más un `font-size: 10px`
suelto en `.navbar a`. Hay exactamente **una** aparición de `rem` en las 683 líneas de CSS y ninguna
en `themes.css`. Verificado: con `html { font-size: 32px }` (200 %) las capturas de Hoy, la ficha,
Emergencias y Mapa son **idénticas** píxel a píxel a las de 100 %.

Justo es decir que el zoom de página sí funciona — el `<meta viewport>` no lleva `user-scalable=no`
y `initial-scale=1` no lo impide —, así que el usuario tiene una salida. Pero la preferencia del
sistema, que es la que se configura una vez y no se toca, no hace nada. Es un incumplimiento de
WCAG 1.4.4.

**Propuesta:** convertir la escala `--fs-*` a `rem` en `themes.css` (12px → 0.75rem, etc.) y matar
el `10px` literal de la navbar. Son doce líneas y no toca ningún componente.

---

### 10 · MENOR — La navbar, única navegación, va en 10 px y a 2,61:1
**Pantalla:** todas · `css/main.css:304-310`

Las etiquetas inactivas son `--text-faint` (`#9aa1ab`) sobre el fondo translúcido de la barra:
**2,61:1** en claro, 4,19 en oscuro, a 10 px y peso 500. Es el texto más pequeño de la app y es
la navegación. El icono ayuda, pero seis iconos de línea a 10 px de etiqueta, con sol y con el
brazo estirado, se distinguen mal entre *Días* y *Guía*.

El mismo `--text-faint` a 2,61:1 aparece en `.seccion-titulo` («Lo que viene», «Parada a parada»,
«Mis datos») y en la lista de `fuentes`. En los dos primeros casos son los rótulos que organizan
la página.

**Propuesta:** etiquetas a 11–12 px con `--text-soft` (`#6b7280`, 4,83:1). `--text-faint` reservado
para lo que de verdad es prescindible: las fuentes al pie.

---

### 11 · MENOR — «Leer con calma» pesa lo mismo que «Fuentes»
**Pantalla:** Guía · ficha

Los dos `<details>` de la ficha son visualmente idénticos: mismo `+`, mismo terracota, mismo 14 px,
misma altura (45,7 px medidos). Pero uno esconde tres minutos de la mejor prosa del proyecto y el
otro esconde una lista de URLs de Wikipedia. Y el de la prosa está enterrado: en Koricancha aparece
tras el aviso, el gancho, cuatro *mira*, cuatro chips de `practico` y una nota — a unos 1.500 px
de scroll.

El plegado en sí **funciona**: el `+` se entiende y el `–` al abrir también. Lo que no comunica es
que ahí abajo hay una lectura, no una nota al pie.

**Por qué importa:** CONTENIDO.md dice que la capa `de_sofa` se lee «la noche antes en el hotel» y
que «el viaje tiene tiempos muertos: hay que usarlos». Ahora mismo esa capa depende de que alguien
llegue al fondo de la ficha y decida que ese `+` concreto vale la pena.

**Propuesta:** que la de `de_sofa` no sea un `summary` con `+` sino una fila con su propio peso —
«Leer con calma · 3 min» con el reloj —, y que la de `Fuentes` se quede como está, discreta. Con
eso los dos `+` dejan de ser el mismo objeto. Y el enlace desde Hoy la víspera, que ya está en la
spec, cierra el círculo.

---

### 12 · MENOR — El chip terracota significa tres cosas distintas
**Pantalla:** Guía, Mapa · `js/app.js:170, 187, 440`

`.chip.chip--acento` se usa para:
- un **estado estático**: «incluido» en `practico`;
- un **enlace**: las transversales de «Para entender esto»;
- un **filtro seleccionado**: el chip de día activo en el mapa.

Tres gramáticas —esto es así / pulsa aquí / esto está activo— con la misma píldora terracota. En
la ficha de Koricancha conviven a diez líneas de distancia: «incluido» (no pulsable) y «Cómo leer
un muro inca» (pulsable), idénticos.

**Propuesta:** el terracota sólido para lo pulsable y lo seleccionado; «incluido» como chip neutro
con el icono de check que ya usan «desayuno» y «Noche en Miraflores».

---

### 13 · MENOR — Los estados vacíos y de error no tienen salida
**Pantalla:** Guía (ficha inexistente), arranque sin datos

«Esa ficha aún no está escrita.» es una frase gris centrada en una pantalla en blanco, sin enlace
al índice ni al día. Igual la de datos caídos. Nada roto, pero son callejones sin salida donde
sólo funciona el gesto de atrás del sistema.

**Propuesta:** una línea de acción bajo cada una. En la ficha vacía, «← Ver la guía del día 8»
sería mejor todavía, porque el argumento por el que se llegó ahí casi siempre viene de un día.

---

### 14 · MENOR — El índice de Guía no marca el día de hoy
**Pantalla:** Guía

33 filas agrupadas por día, todas del mismo peso, con los rótulos de grupo en 4,21:1. El agrupado
por día es la decisión correcta —es la clave real de este viaje—, pero el grupo que importa el
90 % del tiempo no está marcado ni se sube arriba ni se le hace scroll.

Sobre el buscador: CLAUDE.md descarta el buscador y tiene razón en el argumento —un buscador es
cromo de web de agencia—, pero ese argumento va contra buscar *productos*, no contra encontrar una
ficha entre 33 estando de pie. Aun así no hace falta añadir un campo de texto: basta con anclar el
día de hoy. Es el mismo dato que ya usa Hoy.

**Propuesta:** el grupo del día actual arriba del todo, con su rótulo en acento, y el resto debajo
en orden. Cero UI nueva.

---

### 15 · MENOR — El bloque de tema oscuro está duplicado literalmente
**Pantalla:** n/a · `css/themes.css:88-171`

Las 44 declaraciones de `[data-theme="dark"]` se repiten palabra por palabra dentro de
`@media (prefers-color-scheme: dark)`. La norma de DESIGN.md se cumple (todo se define entero en
`:root` y los bloques de tema sólo redefinen) — esto no es una infracción, es una trampa de
mantenimiento: cualquier ajuste al oscuro hay que hacerlo dos veces y la primera vez que se olvide,
los usuarios en «por sistema» y los que eligieron oscuro a mano verán colores distintos.

**Propuesta:** una lista de selectores, `[data-theme="dark"], :root:not([data-theme="light"]):not([data-theme="dark"]) { … }`
dentro del `@media`, más el bloque plano para el forzado. O aceptar la duplicación y añadir un test
que compare los dos bloques, que encaja mejor con la cultura del proyecto (`sw-precache.test.mjs`
existe por exactamente esta razón).

---

## Lo que quitaría

**El hero de Hoy.** Es el candidato número uno y el propio DESIGN.md lo avisa: *«Hoy — la portada.
No es un hero: es el día que toca»*. Pues hay un hero, ocupa 285 de los 874 px del pliegue móvil —
un tercio — y **repite entero lo que dice la tarjeta inmediatamente debajo**: «DÍA 8 DE 12 / Cusco
/ domingo 6 de septiembre · 3400 m» arriba, y a 60 px «8 / Domingo 6 de septiembre / Cusco / 3.400 m»
abajo. Cuatro datos, dos veces, uno bajo el otro, en la pantalla que se mira cada mañana. Quitándolo,
«Qué vais a ver» y sus cuatro enlaces a fichas suben al pliegue, que es donde tienen que estar.
(Antes de salir el hero sí gana el sitio: la cuenta atrás no está en ningún otro lado.)

**Los cuatro escudos de Emergencias.** Ver hallazgo 5. El icono más grande y saturado de la
pantalla, repetido cuatro veces, sin distinguir nada.

**Uno de los dos avisos `ojo` de Mochila.** La pantalla abre con «5 kg por persona en el tren a
Machu Picchu», y debajo van dos avisos: «5 kg de mano en el tren a Machu Picchu» y «Esta noche se
prepara la mochila de Machu Picchu», que vuelven a decir «Sólo van 5 kg al tren». Tres veces la
misma cifra antes de llegar a la primera casilla. El primero es el que sobra: es el mismo texto
que el titular, y la pantalla ya se llama Mochila.

**El `<rect class="mapa-mar">`.** Es lo que fuerza el `slice` del hallazgo 1. El contenedor ya
tiene el mismo color de fondo.

**La regla `.filtro .chip`** de `css/main.css:331`. Está muerta: ningún `verX()` pinta esa clase.
Su comentario, además, documenta un incumplimiento de la propia norma de 44 px.

**«Ficha completa →» de la hoja del mapa**, o mejor: repensarla. La hoja ya trae aviso, gancho,
*mira* y `practico` — es prácticamente la ficha. El enlace lleva a la misma cosa con `de_sofa`,
`preguntas` y `fuentes` añadidos, en una segunda maquetación del mismo contenido. Yo pondría en la
hoja el pliegue de la ficha y en el enlace lo que de verdad falta: «Leer con calma →».

---

## Lo que NO tocaría

**La arquitectura de tokens de `themes.css`.** Está mejor resuelta que la mayoría de sistemas de
producción. Los tres estados de tema (claro / oscuro / por sistema) con el guardado
`:root:not([data-theme="light"]):not([data-theme="dark"])` son correctos, y verificado por grep:
**ningún color tiene su única definición dentro de un bloque de tema**. La duplicación del hallazgo
15 es un problema de mantenimiento, no de arquitectura, y no cambiaría el enfoque para arreglarla.

**La prohibición de barras de acento laterales, cumplida al pie de la letra.** `grep -n
"border-left\|border-inline-start"` sobre los tres CSS devuelve cero resultados. Los estados de
aviso se señalan con fondo, color y peso, exactamente como manda DESIGN.md. Es raro ver una regla
de diseño escrita y además obedecida.

**El fallo del satélite sin cobertura.** Es el mejor detalle de la app. Comprobado poniendo el
contexto offline y pulsando el botón: aparece «El satélite son fotos que se piden por internet y
ahora no hay conexión. El mapa funciona sin ella.» y se queda en el mapa base. El mensaje explica
*qué* pasó, *por qué*, y *que no has perdido nada* — tres cosas en una frase, sin jerga y sin
disculpas. CLAUDE.md dice que ahí el trabajo no es funcionar sino «fallar bien», y falla bien.

**El `<dialog>` de la hoja de detalle.** Es un `<dialog>` de verdad (`:modal` confirmado), no un
div: trae Esc, foco atrapado y fondo inerte gratis. Comprobé además si se quedaba abierto al
cambiar de ruta o al pulsar atrás — sospechaba una fuga — y no: se limpia en los dos casos.

**El `mira` numerado.** Los círculos 1/2/3 no son decoración: son un orden de mirada. «El muro
curvo del exterior» → «los nichos trapezoidales» es una secuencia física, y numerarla es lo que
convierte una lista en un guía. Con la ficha de Koricancha abierta a 402 px, el pliegue te deja
gancho + aviso + los dos primeros *mira*. El encargo de los 10 segundos está cumplido.

**Los avisos no dependen del color.** Cada uno lleva su marca textual `i` / `!` / `!!`, así que
la distinción sobrevive al daltonismo y a una pantalla lavada por el sol. El problema del hallazgo
3 es de contraste, no de codificación: el sistema de tres niveles es correcto y no lo tocaría.

**La ausencia de un buscador global.** El argumento de CLAUDE.md se sostiene. Doce días cerrados
no se buscan, se recorren. Lo que pido en el hallazgo 14 es un ancla al día de hoy, no un campo
de texto.

**El gancho en serif.** Contradice literalmente a DESIGN.md, que reserva `--font-lectura` para el
cuerpo `de_sofa` — «el único texto largo del sitio». Pero visualmente funciona: el serif a 18 px
separa la voz del guía del cromo sans de alrededor, y el gancho es lo único de la capa `de_pie`
que es prosa y no dato. Yo actualizaría el DESIGN.md antes que el CSS.

**La tarjeta entera de Emergencias como `tel:`.** El objetivo es el `<a>` completo, no el escudo.
Bien: el escudo sobra (hallazgo 5) pero el área de toque ya es correcta y no necesita nada.

---

## Apéndice — cómo se midió

- Capturas: Playwright/Chromium, `deviceScaleFactor: 2`, `serviceWorkers: 'block'`, a 402×874 y
  1280×900, en `colorScheme` claro y oscuro, sobre `python3 -m http.server 8250`.
- Contraste: recorrido de nodos de texto con `TreeWalker`, composición alfa de la pila completa de
  `background-color` hasta el primer fondo opaco, y ratio WCAG 2.1 con umbral 3,0 para texto grande
  (≥ 24 px, o ≥ 18,66 px con peso ≥ 700) y 4,5 para el resto. Los cuatro «fallos» del hero se
  descartaron a mano: el fondo es un `background-image` en degradado que el compositor no lee.
- Toques y foco: `getBoundingClientRect()` sobre todo lo enfocable; orden de tabulación por
  `keyboard.press('Tab')` encadenado leyendo `document.activeElement`.
- Texto al 200 %: `addStyleTag` con `html { font-size: 32px !important }` y comparación de capturas.
- Fallos: `page.route('**/data/**', abort)` para los datos, `context.setOffline(true)` para el
  satélite, y rutas inventadas para los vacíos.
- Estado en viaje: `Date` parcheado a 2026-09-06 para ver Hoy en el día 8, que es el caso real.
