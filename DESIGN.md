# DESIGN — Lenguaje visual de Perú 2026

Hereda el sistema de bookreader (superficies tonales, tarjetas redondeadas, un solo acento, mucho
aire) con un cambio de acento y una prioridad distinta: aquí **casi todo se lee de pie, con una
mano, con sol y a veces con frío**. El lector de bookreader es sofá; esto es calle.

## Principios

1. **El contenido manda.** Cromo mínimo. Ni una barra que no haga falta.
2. **De pie, con una mano.** Targets ≥ 44 px, tipografía grande, contraste alto. Nada crítico
   detrás de un hover: en un móvil el hover no existe.
3. **Lo urgente arriba.** Un aviso (altura, equipaje, cierre) va antes que la prosa bonita.
4. **Progresivo.** La capa `de_sofa` está plegada por defecto. Ver CONTENIDO.md.
5. **Cero imágenes de terceros.** Peso, licencias y precache. La identidad es color, tipografía y
   un mapa SVG propio.
6. **Nada de barras de acento laterales.** El estado se señala con fondo, color de texto y peso —
   nunca con un `border-left` o un `box-shadow inset` de acento pegado al borde.

## Tokens

Mismo esqueleto que `bookreader/app/css/themes.css`: radios `--r-*`, espaciado `--s-1..8` en base
4, tipografía `--fs-*`, motion `--ease*`, superficies `--surface-0..3`, texto `--text/-soft/-faint`,
`--border`, `--shadow-1..3`.

**Acento: terracota `#c2562f`.** Emerald es bookreader y no debe confundirse con él. El terracota
sale de la cerámica y el adobe andinos, aguanta bien sobre blanco y sobre carbón, y deja el verde
libre para el estado "hecho" en los checklists.

Semánticos propios de este proyecto, porque se usan en muchos sitios y no deben improvisarse:

```
--altitud-baja / --altitud-media / --altitud-alta   perfil de altitud y badges de cada parada
--aviso-info / --aviso-ojo / --aviso-serio          los tres niveles de aviso, y sólo tres
```

Tres niveles de aviso y no más: `info` (dato útil), `ojo` (te va a fastidiar el día si lo ignoras:
5 kg en el tren) y `serio` (salud o perder un vuelo: soroche, hora de aeropuerto). Si todo es
urgente, nada lo es.

## Temas

Claro, oscuro y **por sistema** (el defecto). Los tokens se definen **enteros** en `:root`; el
bloque `@media (prefers-color-scheme: dark)` y `[data-theme="dark"]` sólo los **redefinen**. Ningún
color puede tener su única definición dentro de un bloque de tema.

Hay un tercer modo pendiente de decidir: **alto contraste para sol directo**. A 4.000 m al mediodía
una pantalla normal no se lee. Está en el BACKLOG.

## Pantallas

- **Hoy** — la portada. No es un hero: es el día que toca. Antes del 30 de agosto, cuenta atrás y
  checklist de preparación.
- **Días** — los 12, con tiempo libre marcado explícitamente. Es donde se decide algo.
- **Guía** — las fichas, alcanzables desde el día y desde un índice.
- **Altura** — el perfil del ascenso y qué hacer cada noche.
- **Emergencias** — teléfonos, seguro y reservas. Legible sin cobertura y sin pensar.

## Tipografía

`--font-ui` Inter (system-ui de fallback) para todo el cromo. `--font-lectura` serif para el cuerpo
de las fichas `de_sofa`, que es el único texto largo del sitio. Fuentes **autoalojadas** en
`fonts/`, nunca desde CDN: sin red no cargarían, y este sitio se usa sin red.
