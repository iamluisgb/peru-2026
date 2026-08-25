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

- [ ] Diario: foto + texto por día, localStorage, exportable a JSON. Sin backend.
- [ ] Mapa SVG de la ruta con las 7 paradas. Estático: interactivo cuesta datos y dependencias.
- [ ] Gastos soles/euros, con los pagos en destino ya conocidos (0,5 $ del bus Puno–Cusco, TUUA de
      12 $ si la conexión en Lima pasa de 24 h).
- [ ] Tema **alto contraste para sol directo**. A 4.000 m al mediodía una pantalla normal no se lee.

## Decidido y cerrado

- Repo público, datos personales fuera → ADR-002.
- Sin fotos de terceros → ADR-005.
- Contenido estático, nada en runtime → ADR-003.
- Diario fuera de v1: el viaje es en cinco días y primero tiene que funcionar lo que se usa de pie.
