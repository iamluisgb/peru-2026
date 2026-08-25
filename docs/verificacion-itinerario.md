# Verificación de datos críticos — data/itinerario.json

Tarea: verificar altitudes de las 9 paradas y añadir dirección/teléfono reales a los 7 hoteles,
sin inventar ningún dato y sin tocar datos personales. `npm test` en verde (11/11) + check:privacidad ✓.

## 1. Altitudes (9 paradas → todas verificado:true)

| Parada | Valor | Fuente | Estado |
|---|---|---|---|
| lima | 154 m | Wikipedia ES (centro histórico ≈154 m); Britannica ~500 ft | ✔ verificado |
| arequipa | 2335 m | Wikipedia ES infobox (2335) | ✔ verificado |
| colca (Chivay) | 3635 m | Wikipedia ES «Chivay… 3.635 m s.n.m.» | ✔ verificado |
| patapampa | 4910 m | Múltiples guías del mirador (4.910 m) | ✔ verificado |
| puno | 3830 m | Wikipedia EN infobox elevation_m=3830 | ✔ verificado |
| cusco | 3400 m | Wikipedia ES infobox (3400) | ✔ verificado |
| ollantaytambo | 2790 m | Wikipedia (≈2790 m; infobox 2792) | ✔ verificado |
| aguas-calientes | 2040 m | Wikipedia (2040 m) | ✔ verificado |
| machu-picchu | 2430 m | Wikipedia ES «a 2.430 metros sobre el nivel del mar» | ✔ verificado |

Cada parada lleva ahora `"verificado": true` y un array `fuentes` con la referencia usada.

## 2. Hoteles (dirección + teléfono verificados)

| Hotel | Dirección | Teléfono | Fuente | Estado |
|---|---|---|---|---|
| Britania Miraflores Hotel (Lima) | Calle Independencia 211, Miraflores, Lima 15074, Perú | +51 961 359 381 | Listados OTA (Google/Booking) | ✔ |
| Hotel Corregidor (Arequipa) | Calle San Pedro 139, Arequipa 04001, Perú | +51 54 288081 | Sitio oficial cassana.pe | ✔ |
| Hotel Pozo del Cielo (Chivay) | Calle Huáscar Mz. E Lote 3-6, Chivay, Arequipa, Perú | (vacío) | Listados OTA | ✔ dirección / teléfono sin confirmar |
| Casa Andina Standard Puno | Jirón Independencia 143, Puno 21001, Perú | +51 51 367803 | Listados OTA (Google/Hoteles) | ✔ |
| Agustos Cusco Hotel | Av. Hipólito Unánue 155, Wanchaq, Cusco 08002, Perú | +51 84 222712 | Listados OTA | ✔ |
| Casa Andina Standard Machu Picchu | Prolongación Imperio de los Incas, Aguas Calientes, Machu Picchu 08681, Perú | +51 84 211017 | Listados OTA | ✔ |
| Agustos Cusco Hotel (noche 9) | idem | idem | — | ✔ |

### Notas / decisiones
- **No se inventó nada**: cada campo se rellenó solo cuando una o más fuentes fiables (sitio oficial
  del hotel o listados de reserva/OTA cruzados) coincidían.
- **Hotel Pozo del Cielo — teléfono quedó vacío**: aparecieron dos números distintos
  (+51 944 359 572 y +51 941 779 815) sin poder confirmar cuál es el del hotel; se deja `null`
  por la regla «no inventar». La dirección «Calle Huáscar Mz. E Lote 3-6, Chivay» es la más
  reiterada en los listados OTA.
- **Casa Andina Standard Machu Picchu — dirección**: la calle «Prolongación Imperio de los Incas»
  es la reiterada; el número/lote aparece como 626 / E-34 / Mz 5 según fuente, por lo que se deja
  sin número para no publicar un dato erróneo.
- No se añadió ningún dato personal (sin localizadores, tickets ni nombres); `check:privacidad` pasa.
- Cada hotel lleva un array `fuentes` documentando el origen.
- `npm test` (11/11) y `check:datos` no reportan pendientes para paradas ni hoteles. Los 7
  pendientes que quedan son fichas de guía de Cusco (koricancha, plaza-armas, catedral, san-blas),
  ajenas a esta tarea.
- El fichero `data/itinerario.json` mantiene su estilo manual de objetos en una línea (ya no era
  prettier-clean antes de la edición); no se ha ejecutado `prettier --write` para no reformatear
  todo el fichero.

## 3. Pendiente / recomendación para antes del viaje
- Confirmar teléfono y número exacto de la dirección de **Hotel Pozo del Cielo** y el lote exacto
  de **Casa Andina Standard Machu Picchu** (los números 626/E-34/Mz 5 difieren según fuente).
- Revisar en las 4 fichas de guía Cusco que `check:datos` sigue marcando (fuera del alcance de esta
  tarea).
