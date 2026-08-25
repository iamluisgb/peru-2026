# BACKLOG — Perú 2026

Única fuente de lo pendiente. Salida: **30 de agosto de 2026**.

## Bloqueantes antes del viaje

- [ ] **Verificar las altitudes** de las 7 paradas y del puerto de Patapampa. Ahora mismo están en
      `data/itinerario.json` con `"verificado": false` y **no deben desplegarse así**. El PDF de TUI
      sólo dice "el itinerario incluye zonas de 4.000 m".
- [ ] **Direcciones y teléfonos de los 7 hoteles.** El PDF trae sólo los nombres. Un hotel sin
      dirección, sin cobertura, en un taxi de Puno a las 22 h, es un problema real.
- [ ] **Guía: bloque Cusco + Machu Picchu** (10 fichas). Se revisa el tono ahí antes de escribir las
      otras 29. Ver [`CONTENIDO.md`](CONTENIDO.md).
- [ ] **Pantalla de emergencias** con seguro, TUI 24 h y Lima Tours, más el formulario de datos
      personales a localStorage.
- [ ] **Perfil de altitud** con la gráfica del ascenso y qué hacer cada noche.
- [ ] **Checklist de la mochila de Machu Picchu** (5 kg), generado desde `data/avisos.json`.
- [ ] **Iconos PWA** (192, 512, maskable, apple-touch). Sin ellos no es instalable de verdad.
- [ ] **Fuentes autoalojadas** en `fonts/`. Hoy el CSS cae al system-ui de fallback.

## Datos que sólo existen en destino

- [ ] **Horas de recogida diarias.** No existen hasta que el guía las da la noche anterior. Necesita
      campo editable por día, persistido en localStorage. Es lo único que se rellena en viaje.

## Guía — resto de bloques

- [ ] Lima (4) · Arequipa (4) · Colca (5) · Titicaca (2) · Trayectos (4) · Valle Sagrado (4) ·
      Transversales (6). Orden por fecha una vez validado el tono.

## v2

- [x] **Mapa con los puntos de interés, filtrable por día.** Las 33 fichas sobre el mapa, y un
      filtro que deje ver sólo las de un día. Requisitos:
      - **Tema claro y oscuro**, como el resto de la app. Esto descarta de entrada las teselas
        de un proveedor: son imágenes con su propio color, no siguen el tema y además son
        red — que es justo lo que no hay en el Colca ni en el Titicaca.
      - Por eso el camino es **SVG propio**: la ruta y los puntos dibujados, con `fill`/`stroke`
        por tokens para que el tema los arrastre solo (mismo truco que la silueta del hero).
      - Cada punto enlaza a su ficha. El filtro por día reutiliza `dia` de la ficha, que ya
        está en los datos: no hace falta modelo nuevo.
      - Las transversales no van en el mapa: no están en ningún sitio.
- [ ] Diario: foto + texto por día, localStorage, exportable a JSON. Sin backend.
- [ ] Gastos soles/euros, con los pagos en destino ya conocidos (0,5 $ del bus Puno–Cusco, TUUA de
      12 $ si la conexión en Lima pasa de 24 h).
- [ ] Tema **alto contraste para sol directo**. A 4.000 m al mediodía una pantalla normal no se lee.

## Decidido y cerrado

- Repo público, datos personales fuera → ADR-002.
- Sin fotos de terceros → ADR-005.
- Contenido estático, nada en runtime → ADR-003.
- Diario fuera de v1: el viaje es en cinco días y primero tiene que funcionar lo que se usa de pie.

## Dominio — decidir pronto

- [ ] **El sitio ha salido en `luisgonzalezbernal.com/peru-2026/`**, no en `iamluisgb.github.io`:
      la cuenta tiene dominio propio a nivel de usuario y todos los repos de proyecto lo heredan.
      Es además el origen del que Areté acaba de retirarse. Decidir si se queda ahí o se mueve a un
      subdominio propio **antes de que nadie instale la PWA** — después obliga a migrar localStorage.
