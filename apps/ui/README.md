# ANFPES UI

Aplicacion React + Vite que consume los artefactos generados por `apps/cache-builder`.

## Requisitos previos

1. Ejecutar `npm run build:data -- <tabla0.json> ML.txt data/cache/<entorno> <version>` para tener la cache actualizada. Por defecto consumimos `data/cache/dev`.
2. Instalar dependencias en el monorepo (`npm install` en la raiz).

## Scripts

```bash
# Desarrollo interactivo
npm run dev --workspace @anfpes/ui

# Linter y pruebas
npm run lint --workspace @anfpes/ui
npm run test --workspace @anfpes/ui

# Build estatico (copia automatica de data/cache)
npm run build --workspace @anfpes/ui
npm run preview --workspace @anfpes/ui
```

## Configuracion

- `VITE_CACHE_ENV`: entorno dentro de `data/cache/` (por defecto `dev`).
- `VITE_CACHE_BASE`: ruta base que usara el fetch (`/cache/<env>` si no se define).

Durante `npm run dev` el servidor expone la cache directamente desde `data/cache`. En `npm run build` se copia a `dist/cache` para que los archivos queden disponibles junto al bundle.
