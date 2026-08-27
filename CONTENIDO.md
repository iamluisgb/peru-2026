# CONTENIDO — la guía dentro de la app

Spec de la ficha de guía. Si escribes una ficha, esto es lo único que hay que respetar.

## Por qué dos capas

"Guía dentro de la app" degenera casi siempre en Wikipedia pegada. Nadie lee 800 palabras sobre el
virreinato de pie en una plaza a 3.400 m con el grupo esperando. Y lo que sí se lee, si es
genérico, no aporta nada sobre el guía humano de Lima Tours que va al lado.

Lo que hace bueno a un guía de verdad no es saber más: es **decirte dónde mirar**, contarte la cosa
que te ibas a perder, y **callarse a tiempo**. Eso es un problema de formato antes que de contenido.

- **`de_pie`** — lo que lees delante del sitio. ~30 segundos. Es lo que se ve por defecto.
- **`de_sofa`** — lo que lees la noche antes en el hotel. ~3 minutos. Va plegado, y la pantalla de
  _Hoy_ propone leerlo la víspera. El viaje tiene tiempos muertos: hay que usarlos.

## La forma

```json
{
  "id": "koricancha",
  "nombre": "Koricancha",
  "lugar": "Cusco",
  "dia": 8,
  "altitud_m": 3400,
  "verificado": false,

  "de_pie": {
    "gancho": "Una frase. Por qué esto no es una piedra más.",
    "mira": ["Un detalle LOCALIZABLE, con su sitio.", "Otro. Entre 2 y 4."],
    "practico": {
      "duracion": "~1 h",
      "incluido": true,
      "fotos": "sí, trípode no",
      "notas": ["Baños a la entrada."]
    }
  },

  "de_sofa": {
    "contexto": "Qué pasó aquí. 3-6 frases.",
    "dato": "El dato que nadie cuenta.",
    "como_se_sabe": "De dónde sale lo que se afirma. Quién lo excavó, qué dice el C14, qué dicen las crónicas.",
    "la_discusion": "Qué discuten los especialistas, con el nombre de quién sostiene cada postura.",
    "lo_que_ya_no_se_cree": "Qué se creía, por qué cayó y qué lo tumbó.",
    "conexion": [
      { "recurso": "Los últimos días de los Incas", "donde": "cap. 5, «Una sala llena de oro»" }
    ],
    "fuentes": {
      "como_se_sabe": ["Autor, obra, año, página o URL"],
      "la_discusion": ["Autor, obra, año, página o URL"]
    }
  },

  "preguntas": ["Dos o tres preguntas buenas para el guía."],
  "fuentes": ["Autor, obra, página o URL — de lo que afirma `de_pie` y el resto de la ficha"]
}
```

### Campos y sus reglas

| Campo                  | Obligatorio             | Regla                                                                                                                               |
| ---------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | sí                      | kebab-case, único en todo `data/guia/`. Es la URL (`#/guia/koricancha`).                                                            |
| `dia`                  | sí                      | Debe existir en `data/itinerario.json`. El test lo comprueba.                                                                       |
| `altitud_m`            | sí                      | Entero. Alimenta el perfil de altitud.                                                                                              |
| `verificado`           | sí                      | `false` mientras las cifras no estén contrastadas. No se despliega en `false`.                                                      |
| `gancho`               | sí                      | **Una** frase. Si son dos, sobra una.                                                                                               |
| `mira`                 | sí                      | 2 a 4. **Localizables**: "la esquina de la izquierda según entras", no "arquitectura notable". Sin esto la ficha no está terminada. |
| `practico`             | sí                      | Lo que se pregunta de pie: cuánto dura, si está incluido, si se puede fotografiar.                                                  |
| `contexto`             | no                      | Si no hay nada que contar, mejor vacío que relleno.                                                                                 |
| `dato`                 | no                      | Uno. El mejor. No una lista de curiosidades.                                                                                        |
| `como_se_sabe`         | no                      | La cadena de evidencia. 120-180 palabras. Sin fuentes, fuera.                                                                       |
| `la_discusion`         | no                      | Dos posturas **con nombre y apellidos**. Si no puedes nombrar a quién defiende cada una, no la escribas. 120-180 palabras.          |
| `lo_que_ya_no_se_cree` | no                      | Teorías retiradas y qué las tumbó. 120-180 palabras.                                                                                |
| `conexion`             | no                      | Apunta a `data/cultura.json` por título exacto. En `donde`, **el capítulo concreto**, no el libro.                                  |
| `de_sofa.fuentes`      | sí si hay sección nueva | Objeto **por sección**, no lista por ficha. Ver abajo.                                                                              |
| `preguntas`            | no                      | Lo que convierte una visita guiada en una conversación.                                                                             |
| `fuentes`              | sí si hay cifras        | **Cifra sin fuente = la cifra no se publica.** Ver CLAUDE.md.                                                                       |

## La capa de lectura profunda

`de_sofa` prometía calma y entregaba un párrafo: mediana de 139 palabras, 42 segundos de lectura.
Y no traía ninguna **clase** de contenido que no estuviera ya en `de_pie` — era lo mismo, un poco
más largo. Alargar `contexto` no lo arregla: lo convierte en Wikipedia pegada, que es justo lo que
este proyecto lleva rechazando desde el primer día.

Lo que lo arregla son tres secciones que responden a **preguntas distintas**, no a la misma
pregunta durante más rato. `contexto` y `dato` siguen contando _qué pasó_. Estas tres cuentan
_cómo lo sabemos_, _qué no sabemos_ y _qué creíamos y era mentira_.

**`como_se_sabe` — la cadena de evidencia.** No «lo construyó Pachacútec hacia 1450», sino de dónde
sale esa fecha: quién excavó qué, en qué año, con qué método, y qué dice el carbono-14 frente a las
crónicas. Convierte un dato en conocimiento y, de paso, enseña a dudar del dato. Nombra el eslabón
débil cuando lo hay: una copia de un documento perdido, una inferencia en tres pasos, una cifra que
su propio autor dio como suposición.

**`la_discusion` — las preguntas abiertas.** Qué discuten de verdad los especialistas, con las dos
posturas y **el nombre de quién sostiene cada una**. Es el marcador real de «avanzado»: pasar de la
sabiduría recibida a lo que sigue sin resolver. La regla es dura y no admite matices:

> **Si no puedes nombrar a quién defiende cada postura, no es una discusión académica y no se
> escribe.** «Algunos investigadores opinan» es exactamente la frase que hay que no escribir.

Y si una de las dos posturas es la que va a contar el guía, dilo. Sirve para escuchar mejor.

**`lo_que_ya_no_se_cree` — las teorías retiradas.** Qué se creía, por qué se creía y qué lo tumbó.
La «ciudad perdida de los incas» de Bingham. Las «vírgenes del sol», que salieron de un sexado
erróneo de los esqueletos en 1916 y se repitieron cincuenta años. Es la vacuna contra la cháchara
que le van a contar al viajero delante del sitio, y es la sección que más se agradece.

### Longitud

Entre las tres, **300-450 palabras por ficha**. Con `contexto` y `dato`, sale una lectura de 3-4
minutos, que es lo que `de_sofa` prometía. Ni un párrafo de relleno: una sección corta y verdadera
vale más que una larga y rellena, y **una ficha con dos secciones buenas vale más que tres con una
inventada**.

Las tres son opcionales. Ninguna es obligatoria y ninguna se escribe «para completar la ficha».

### `fuentes` va por sección

Aquí es donde un modelo —o una persona con prisa— se inventa cosas con más aplomo: la erudición
plausible se lee igual de bien que la verdadera. Por eso las fuentes dejan de ser una lista al pie
de la ficha y pasan a ser un **objeto dentro de `de_sofa`, con una clave por sección**:

```json
"fuentes": {
  "como_se_sabe": ["Autor, «Obra», editorial/revista, año, páginas — qué sostiene exactamente. URL"],
  "la_discusion": ["…"],
  "lo_que_ya_no_se_cree": ["…"]
}
```

- **Autor, obra, año, y página o URL.** Los cuatro. Una fuente sin año no es una fuente.
- **Toda afirmación con nombre propio, fecha o cifra necesita fuente**, y la fuente va en la clave
  de la sección que hace la afirmación. Si la misma obra sostiene dos secciones, se repite en las
  dos: se lee por secciones, se comprueba por secciones.
- Di **qué sostiene exactamente** esa fuente, no sólo que existe. «Bauer 1998» no vale; «Bauer
  1998:23 — las 328 huacas del listado de Cobo» sí.
- **Nada de citar trabajos cuya existencia no hayas comprobado.** Ni el año de memoria.
- Si una sección no se sostiene con fuentes, **se deja fuera** y se dice por qué en el commit.
- El `fuentes` de nivel de ficha se queda: cubre `de_pie`, `contexto` y `dato`.

Los libros del viaje que ya están en casa —MacQuarrie, Cieza, Garcilaso— son mejores fuentes que
cualquier web, y además permiten el `conexion` bueno: no «MacQuarrie», sino «cap. 17, _Vilcabamba
redescubierta_».

## La guía que no es un sitio

Tres cosas que un guía humano cuenta y que ninguna guía escrita cubre. Pesan mucho en este viaje.

**Los trayectos** (`data/guia/trayectos.json`). Colca→Puno, y sobre todo Puno→Cusco, son horas de
bus. Son el 15% del viaje y no están en ninguna guía porque no son "un sitio". Ahí caben las piezas
largas: qué es el altiplano que se está cruzando, por qué La Raya es la divisoria de aguas, qué se
ve por la ventana. Público cautivo y sin cobertura: es exactamente el hueco de una PWA offline.

**Cómo leer lo que se ve** (`data/guia/transversales.json`). Fichas que se enlazan desde muchos
sitios: distinguir un muro inca imperial de uno provincial, por qué los topónimos acaban en
_-tambo_ o _-marca_, quién fue Pachacútec, qué es un _apu_. Se leen una vez y sirven doce días.

Una transversal **no pertenece a un día**, así que lleva `"tipo": "transversal"` y **no lleva
`dia` ni `altitud_m`**. Las fichas de sitio la enlazan con `relacionadas: ["muro-inca"]`, y ahí
aparece al pie, bajo _"Para entender esto"_ — que es donde se lee de verdad, delante de la piedra.
En el índice tiene su propio grupo al final.

El test de alcanzabilidad las cubre igual: **una transversal que ninguna ficha enlaza es un bug**
y falla la build. El invariante no es "toda ficha está en un día" —eso era falso— sino "toda ficha
es alcanzable"; un sitio lo es desde su día, una transversal desde su `relacionadas`.

Su `practico` sólo lleva `duracion` ("2 min de lectura"): `incluido` y `fotos` son de un sitio
que se visita y en una transversal no significan nada.

El criterio para que algo merezca ser transversal: **que lo pidan tres sitios o más**. Si sólo lo
pide uno, es un párrafo de esa ficha, no una transversal.

**Qué preguntarle al guía.** El campo `preguntas`. El guía de Lima Tours sabe más de lo que va a
contar por defecto; la app no compite con él, le abre la puerta.

## Inventario — 39 fichas

| Bloque                                                                      | Fichero              | Fichas |
| --------------------------------------------------------------------------- | -------------------- | ------ |
| Lima — Plaza de Armas, catedral, Huaca Pucllana, Miraflores/Parque del Amor | `lima.json`          | 4      |
| Arequipa — Santa Catalina, Yanahuara, Carmen Alto, plaza                    | `arequipa.json`      | 4      |
| Colca — Pampas Cañahuas, Patapampa, Cruz del Cóndor, Maca, Yanque           | `colca.json`         | 5      |
| Titicaca — Uros, Taquile                                                    | `titicaca.json`      | 2      |
| Ruta Puno–Cusco — Pucará, La Raya, Raqchi, Andahuaylillas                   | `trayectos.json`     | 4      |
| Cusco — Koricancha, catedral, plaza, San Blas                               | `cusco.json`         | 4      |
| Valle Sagrado — Chinchero, Yucay, Ollantaytambo, el tren                    | `valle-sagrado.json` | 4      |
| Machu Picchu — el sitio + Intihuatana, Templo del Sol, Tres Ventanas…       | `machu-picchu.json`  | 6      |
| Transversales — muros, quechua, personajes, altura, comida                  | `transversales.json` | 6      |

**Orden de escritura**: Cusco y Machu Picchu primero. Es el corazón del viaje y donde antes se nota
si el tono funciona. Se revisa ahí, y sólo entonces se propagan las otras 29.
