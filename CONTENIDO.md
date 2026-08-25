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
  *Hoy* propone leerlo la víspera. El viaje tiene tiempos muertos: hay que usarlos.

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
    "mira": [
      "Un detalle LOCALIZABLE, con su sitio.",
      "Otro. Entre 2 y 4."
    ],
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
    "conexion": [{ "recurso": "Los últimos días de los incas", "donde": "cap. del saqueo del Cusco" }]
  },

  "preguntas": ["Dos o tres preguntas buenas para el guía."],
  "fuentes": ["Autor, obra, página o URL"]
}
```

### Campos y sus reglas

| Campo | Obligatorio | Regla |
|---|---|---|
| `id` | sí | kebab-case, único en todo `data/guia/`. Es la URL (`#/guia/koricancha`). |
| `dia` | sí | Debe existir en `data/itinerario.json`. El test lo comprueba. |
| `altitud_m` | sí | Entero. Alimenta el perfil de altitud. |
| `verificado` | sí | `false` mientras las cifras no estén contrastadas. No se despliega en `false`. |
| `gancho` | sí | **Una** frase. Si son dos, sobra una. |
| `mira` | sí | 2 a 4. **Localizables**: "la esquina de la izquierda según entras", no "arquitectura notable". Sin esto la ficha no está terminada. |
| `practico` | sí | Lo que se pregunta de pie: cuánto dura, si está incluido, si se puede fotografiar. |
| `contexto` | no | Si no hay nada que contar, mejor vacío que relleno. |
| `dato` | no | Uno. El mejor. No una lista de curiosidades. |
| `conexion` | no | Apunta a `data/cultura.json` por título exacto. |
| `preguntas` | no | Lo que convierte una visita guiada en una conversación. |
| `fuentes` | sí si hay cifras | **Cifra sin fuente = la cifra no se publica.** Ver CLAUDE.md. |

## La guía que no es un sitio

Tres cosas que un guía humano cuenta y que ninguna guía escrita cubre. Pesan mucho en este viaje.

**Los trayectos** (`data/guia/trayectos.json`). Colca→Puno, y sobre todo Puno→Cusco, son horas de
bus. Son el 15% del viaje y no están en ninguna guía porque no son "un sitio". Ahí caben las piezas
largas: qué es el altiplano que se está cruzando, por qué La Raya es la divisoria de aguas, qué se
ve por la ventana. Público cautivo y sin cobertura: es exactamente el hueco de una PWA offline.

**Cómo leer lo que se ve** (`data/guia/transversales.json`). Fichas que se enlazan desde muchos
sitios: distinguir un muro inca imperial de uno provincial, por qué los topónimos acaban en
*-tambo* o *-marca*, quién fue Pachacútec, qué es un *apu*. Se leen una vez y sirven doce días.

Una transversal **no pertenece a un día**, así que lleva `"tipo": "transversal"` y **no lleva
`dia` ni `altitud_m`**. Las fichas de sitio la enlazan con `relacionadas: ["muro-inca"]`, y ahí
aparece al pie, bajo *"Para entender esto"* — que es donde se lee de verdad, delante de la piedra.
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

| Bloque | Fichero | Fichas |
|---|---|---|
| Lima — Plaza de Armas, catedral, Huaca Pucllana, Miraflores/Parque del Amor | `lima.json` | 4 |
| Arequipa — Santa Catalina, Yanahuara, Carmen Alto, plaza | `arequipa.json` | 4 |
| Colca — Pampas Cañahuas, Patapampa, Cruz del Cóndor, Maca, Yanque | `colca.json` | 5 |
| Titicaca — Uros, Taquile | `titicaca.json` | 2 |
| Ruta Puno–Cusco — Pucará, La Raya, Raqchi, Andahuaylillas | `trayectos.json` | 4 |
| Cusco — Koricancha, catedral, plaza, San Blas | `cusco.json` | 4 |
| Valle Sagrado — Chinchero, Yucay, Ollantaytambo, el tren | `valle-sagrado.json` | 4 |
| Machu Picchu — el sitio + Intihuatana, Templo del Sol, Tres Ventanas… | `machu-picchu.json` | 6 |
| Transversales — muros, quechua, personajes, altura, comida | `transversales.json` | 6 |

**Orden de escritura**: Cusco y Machu Picchu primero. Es el corazón del viaje y donde antes se nota
si el tono funciona. Se revisa ahí, y sólo entonces se propagan las otras 29.
