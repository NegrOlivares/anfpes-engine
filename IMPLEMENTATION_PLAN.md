# Plan de Implementación

## Fase 0 · Preparativos

1. Configurar repo mono (p. ej. Turborepo/Vite) con workspaces `engine`, `app`, `cli`.
2. Integrar herramientas base: TypeScript, ESLint, Vitest/Jest, Prettier, Husky.
3. Documentar scripts (`pnpm dev`, `pnpm test`, `pnpm build:data`).

## Fase 1 · Ingesta y Normalización

1. Crear módulo `packages/data-ingest` con parsers para:
   - `tabla 0` desde XLSX (SheetJS/u openpyxl wrapper via CLI export a JSON intermedio).
   - `ML.txt` (ya tab-delimited).
   - Placeholder para estadísticas futuras.
2. Definir tipos compartidos (`RawPlayer`, `ShopTag`, `StatExtras`).
3. Implementar validaciones (IDs duplicados, encoding) y pruebas unitarias sobre muestras reales.
4. Automatizar exportación con `npm run export:table0 -- <archivo>` que escribe `data/processed/table0.json` y `table0.meta.json`.

### Requerimientos de la tubería de exportación `tabla 0`

1. **Entrada confiable**: recibir archivos XLSX originales nombrados con versión/fecha y almacenarlos en `data/raw/`.
2. **Normalización reproducible**: comando `npm run export:table0 -- <archivo>` que:
   - Verifique la presencia de la hoja `0`.
   - Exporte a JSON ordenado (`data/processed/table0.json`) usando cabeceras oficiales.
   - Registre metadatos (hash, fecha, número de filas) en `data/processed/meta.json`.
3. **Validación automática**: el comando falla si:
   - Falta alguna columna crítica.
   - Se detectan IDs duplicados o valores fuera de rango.
4. **Salida versionada**: los artefactos procesados se commitean y se referencian por `dataVersion` para que la UI pueda detectar actualizaciones.

## Fase 2 · Motor de Cálculo

1. Traducir fórmulas de la fila 2 a funciones puras dentro de `packages/engine`.
2. Añadir utilidades para emular BUSCARV/INDICE/SI/AGREGAR, etc.
3. Construir suite de regresión: exportar filas de Excel y comparar resultado 1:1.
4. Exponer API pública (`computeDerivedPlayer`, `computeAllPlayers`).

## Fase 3 · Generación de Caché

1. Implementar CLI `pnpm run build:data` (paquete `apps/cache-builder`) que:
   - Ejecuta ingesta.
   - Usa el motor para generar `players.json`, `clubs.json`, `meta.json`, `indices/*.json`.
2. Añadir control de versiones y metadatos de build.
3. Generar `schema.json` y validarlo via `ajv`.

## Fase 4 · Front-end Modular

1. Crear app React + Vite (`apps/ui`) con routing por módulo.
2. Implementar store global (Zustand/TanStack) para datos y preselecciones.
3. Desarrollar módulos prioritarios (buscador, preselección, perfil, similares, comparador) consumiendo la caché.
4. Construir componentes reutilizables (tablas dinámicas, KPIs, radar charts).

## Fase 5 · Empaquetado Desktop/Móvil

1. Integrar Tauri para desktop:
   - Cargar caché local.
   - APIs para filesystem y modo fullscreen.
2. Integrar Capacitor para móvil:
   - Reutilizar el bundle web.
   - Configurar storage persistente y ocultar barras del sistema.

## Fase 6 · Actualizaciones y Estadísticas Extra

1. Implementar pipeline de actualización (script + documentación) para las releases semestrales.
2. Consumir la nueva DB de estadísticas cuando esté disponible y extender el motor/caché.
3. Añadir pruebas end-to-end (Playwright) para flujos críticos.

## Fase 7 · Observabilidad y Distribución

1. Automatizar builds y empaquetado con CI (GitHub Actions).
2. Generar instaladores firmados (MSIX, DMG, APK/AAB).
3. Registrar changelog y métricas básicas (opcionalmente telemetría offline/anónima).

## Entregables Continuos

- `ARCHITECTURE.md` (este documento complementario).
- `IMPLEMENTATION_PLAN.md` (este documento).
- `LOG.md` para registrar cada paso ejecutado.
