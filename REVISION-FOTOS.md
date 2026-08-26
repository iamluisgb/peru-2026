# Revisión de fotos — segunda lectura (mimo-v2.5)

Fecha: 2026-08-26 · 66 fotos revisadas · 32 artículos con foto

---

## 1. Foto ausente

**raqchi** — Raqchi no tiene foto en `data/fotos.json`. Las candidatas (#0 y #1) fallaron la descarga en ambas revisiones (429 de Wikimedia). Hay que buscar una foto nueva que muestre el muro central de adobe de 20 metros o las colcas circulares, que es lo que la ficha manda mirar.

---

## 2. Desacuerdos entre qwen3.6 y mimo-v2.5

En cada caso, qué foto se usa, qué dice el artículo, y qué ve cada modelo.

### santa-catalina — foto usada: courtyard with fountain (JosepMGracia)

| | veredicto | lo que ve |
|---|---|---|
| **qwen** | sitio=SI util=SI | Patio con fuente de piedra, muros de rojo intenso |
| **mimo** | sitio=NO util=NO | Fuente con agua verde en patio de muros rojos |

**El artículo pide:** el primer patio con muros de sillar pintados de «blanco, azul y rojo»; la calle Sevilla; la plaza Zocodover; la lavandería.

**Veredicto propio:** La foto muestra el claustro rojo, que es del convento pero no es el patio de entrada que la ficha describe (que mezcla los tres colores). mimo dice que no es el sitio —eso es incorrecto: es Santa Catalina, dentro del recinto—, pero en lo de util=NO tiene razón parcial: el foto no muestra la paleta de tres colores que es la «tarjeta de visita» del convento. **Gana mimo en util**, gana qwen en sitio. La foto sirve como representante del convento pero no del punto concreto que la ficha destaca.

### andahuaylillas — foto usada: Saint Peter the Apostle (César Pérez)

| | veredicto | lo que ve |
|---|---|---|
| **qwen** | sitio=SI util=SI | Fachada con arco central decorado, cimientos de piedra inca, turistas |
| **mimo** | sitio=SI util=NO | Fachada barroca de piedra, torre blanca con campanas, ventana circular |

**El artículo pide:** el contraste del umbral (adobe sobrio por fuera, pan de oro por dentro), los murales de Luis de Riaño, el altar mayor, y los tramos de muro inca que asoman entre las pinturas.

**Veredicto propio:** La foto es la fachada exterior. qwen ve «cimientos de piedra inca visible en la base» y conecta con el punto de «los tramos de muro inca que asoman». mimo no los distingue. **Gana qwen**: la fachada sí muestra el contraste entre el adobe sobrio y los restos incas en la base, que es el primer punto del mira. mimo describe más grueso y pierde ese detalle.

### chinchero — foto usada: Chinchero, 2023 (Draceane)

| | veredicto | lo que ve |
|---|---|---|
| **qwen** | sitio=SI util=SI | Plaza empedrada, textiles en el suelo, iglesia blanca, muro de piedra inca a la izquierda |
| **mimo** | sitio=SI util=NO | Plaza empedrada, textiles coloridos, iglesia blanca colonial, muro de piedra a la derecha |

**El artículo pide:** el muro inca con hornacinas trapezoidales del tamaño de una persona, los murales pintados del interior, el lienzo de la Virgen de Monserrat, y la demostración de tejido con cochinilla.

**Veredicto propio:** La foto muestra la plaza con textiles y la iglesia, pero el muro inca con las hornacinas trapezoidales —el punto estrella del mira— no se ve con claridad. Los textiles en el suelo conectan con la demostración de tejido, pero no con la cochinilla. **Gana mimo**: la foto no enseña ninguno de los cuatro puntos que el mira destaca de forma clara. Es la plaza correcta, pero no el contenido que el artículo manda mirar.

### machu-picchu — foto usada: Machu Picchu 37 – Temple of the Sun (Nigel Rogers)

| | veredicto | lo que ve |
|---|---|---|
| **qwen** | sitio=SI util=SI | Vista elevada sobre ruinas, estructura circular a la izquierda, edificios rectangulares, terrazas verdes, río al fondo |
| **mimo** | sitio=SI util=NO | Ruinas de piedra inca con muro semicircular (posiblemente Templo del Sol) y terrazas verdes al fondo |

**El artículo pide:** la vista desde la Casa del Guardián (ciudad completa de una pieza), la Puerta del Sol, las terrazas agrícolas del sector sur, y los picos Huayna Picchu y Machu Picchu.

**Veredicto propio:** La foto muestra un primer plano de lo que parece el Templo del Sol (muro semicircular), no la vista panorámica desde la Casa del Guardián que el artículo describe. mimo acierta: la foto no enseña la «ciudad completa de una pieza» ni los picos que el mira destaca. **Gana mimo**. La foto es de Machu Picchu, pero no es la vista que el artículo invita a buscar.

### patapampa — foto usada: Salinas and Aguada Blanca Misti Chachani (Max nr 323)

| | veredicto | lo que ve |
|---|---|---|
| **qwen** | sitio=SI util=SI | Paisaje de puna árida, ichu, volcán Misti a la izquierda, cadena Hualca Hualca–Sabancaya a la derecha |
| **mimo** | sitio=DUDOSO util=NO | Paisaje amplio con vegetación baja dispersa y montañas distantes bajo cielo azul con nubes |

**El artículo pide:** el cartel de altitud, la cadena Ampato–Sabancaya–Hualca Hualca (con vapor del Sabancaya), y el Misti y Chachani a la espalda.

**Veredicto propio:** La foto es un paisaje de puna con volcanes lejanos. A 512 px es difícil identificar volcanes concretos, y mimo no los distingue. Pero el punto central del mira es el **cartel de altitud** —la «foto de rigor del punto más alto del viaje—, y la foto no lo muestra. **Gana mimo** en util: aunque los volcanes estén ahí, la foto no enseña lo que el artículo destaca como principal.

### plaza-armas-arequipa — foto usada: Arequipa, Plaza de Armas, 2023 (Draceane)

| | veredicto | lo que ve |
|---|---|---|
| **qwen** | sitio=SI util=SI | Calle arbolada, iglesia blanca con torre central, volcán Misti al fondo |
| **mimo** | sitio=DUDOSO util=PARCIAL | Plaza ajardinada con palmeras, iglesia colonial con torre central, montaña nevada detrás |

**El artículo pide:** la catedral de sillar con fachada ancha y sin campanario central, los soportales de los otros tres lados, el Misti asomando por el extremo este, y la portada churrigueresca de la Compañía.

**Veredicto propio:** La foto parece más una calle con una iglesia que la plaza propiamente dicha con los soportales y la catedral. qwen ve una «calle arbolada» y mimo una «plaza ajardinada»: ninguno describe la catedral de sillar ni los soportales. **Gana mimo** (PARCIAL): la foto muestra algo del entorno de la plaza pero no los elementos que el mira destaca.

### plaza-armas-cusco — foto usada: Plaza de Armas, Cusco, 2015-07-31, DD 52 (Laslovarga)

| | veredicto | lo que ve |
|---|---|---|
| **qwen** | sitio=SI util=SI | Portal de Panes: edificio colonial con arcadas de piedra y balcones de madera |
| **mimo** | sitio=SI util=NO | Fachada colonial de dos pisos con arcada de piedra y gran balcón de madera continuo |

**El artículo pide:** el Portal de Panes (que tapa el palacio de Pachacútec), la calle Loreto con muros incas, las torres cortas y anchas de la catedral, y la fachada de la Compañía.

**Veredicto propio:** La foto muestra el Portal de Panes, que es el primer punto del mira. Pero solo muestra eso: ni la calle Loreto, ni la catedral, ni la Compañía. **Gana qwen parcialmente**: el Portal de Panes está y se ve bien. Pero la foto es incompleta respecto a lo que el artículo pide mirar en conjunto.

---

## 3. Fotos que ambos revisores coinciden en que no sirven del todo

Ninguna de las 32 fotos usadas fue rechazada por **ambos** revisores como inútil. Las más cuestionadas:

- **catedral-cusco #0**: qwen=SI util=SI, mimo=SI util=NO. La foto muestra la fachada exterior; el artículo manda mirar el techo, la Última Cena de Marcos Zapata y la sillería del coro —todo interior. mimo tiene razón: la foto es del sitio correcto pero no enseña lo que el artículo destaca.
- **machu-picchu #0** (no usada en la app, pero veredictada por ambos como util=NO): muestra una estructura rectangular con puerta, nada que ver con la vista panorámica que el artículo pide.
- **intihuatana #0** (no usada): vista lejana de la ciudadela, no del bloque del Intihuatana. Ambos la descartan.

---

## 4. Autoaviso

mimo describe más grueso que qwen —donde qwen dice «cantería inca con nichos trapezoidales», mimo dice «bloques grises de piedra o hormigón». Esto afecta directamente mis veredictos:

- En **chinchero**, mimo no distingue las hornacinas trapezoidales del muro inca que qwen ve. Pero aquí mimo tiene razón a pesar de su descripción gruesa: el muro no es el protagonista de la foto.
- En **patapampa**, mimo no identifica los volcanes concretos que qwen nombra. Es posible que a 512 px los volcanes sean más difusos de lo que qwen sugiere. Mi veredicto de «gana mimo» se basa en que el **cartel de altitud** —el punto estrella del mira— no aparece, no en la identificación de volcanes.
- En **andahuaylillas**, mimo no ve los «cimientos de piedra inca» que qwen reporta en la base de la fachada. Si existen (y qwen parece fiable aquí), mimo pierde un detalle importante por su descripción más gruesa.
- En **santa-catalina**, mimo dice que la foto «no es el sitio», lo cual es incorrecto: es claramente el interior de Santa Catalina. Este es un error de mimo, no unalimitación de resolución.

---

## Resumen por gravedad

| Prioridad | Sitio | Problema | Acción |
|---|---|---|---|
| 🔴 | **raqchi** | Sin foto | Buscar foto nueva (muro de adobe o colcas circulares) |
| 🟠 | **machu-picchu** | Foto no muestra la vista que el artículo pide | Revisar si hay mejor foto de la Casa del Guardián |
| 🟠 | **chinchero** | Foto no muestra el muro inca con hornacinas | La foto es la plaza correcta pero no el contenido clave |
| 🟠 | **patapampa** | Foto no muestra el cartel de altitud ni los volcanes con claridad | Buscar foto con el cartel o los volcanes en primer plano |
| 🟡 | **santa-catalina** | Foto muestra el claustro rojo, no el patio tri-color de entrada | La foto sirve como representante pero no del punto estrella |
| 🟡 | **plaza-armas-arequipa** | Foto no muestra claramente la catedral ni los soportales | Podría buscarse un ángulo mejor |
| 🟡 | **catedral-cusco** | Foto es la fachada exterior; artículo pide detalles interiores | La fachada es válida pero incompleta |
| 🟢 | **plaza-armas-cusco** | Solo muestra el Portal de Panes | Sirve, pero es parcial |
| 🟢 | **andahuaylillas** | Discrepancia sobre si se ven los cimientos incas | La foto sirve |
