# Perú 2026

Guía de viaje offline para *Perú Mágico* (TUI), 30 ago – 10 sep 2026.

PWA sin build step: vanilla JS, módulos ES, service worker. Se sirve en
**https://iamluisgb.github.io/peru-2026/**

```
python3 -m http.server    # local — hace falta servidor, no vale file://
npm test
```

No es un planificador ni un buscador de viajes: el itinerario ya está cerrado. Responde qué toca
hoy, qué hay que saber antes de que pase, y por qué el sitio que tienes delante importa.

Los datos personales (localizadores, tickets, póliza) **no están en este repo**: se introducen en el
móvil y viven en `localStorage`. Ver [`CLAUDE.md`](CLAUDE.md).
