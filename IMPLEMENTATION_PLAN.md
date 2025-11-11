# Plan de Implementacion

## Fase 0 · Preparativos

1. Configurar repo mono (p. ej. Turborepo/Vite) con workspaces `engine`, `app`, `cli`.
2. Integrar herramientas base: TypeScript, ESLint, Vitest/Jest, Prettier, Husky.
3. Documentar scripts (`pnpm dev`, `pnpm test`, `pnpm build:data`).

## Fase 1 · Ingesta y Normalizacion

1. Crear modulo `packages/data-ingest` con parsers para:
   - `tabla 0` desde XLSX (SheetJS u openpyxl wrapper via CLI export a JSON intermedio).
   - `ML.txt` (ya tab-delimited).
   - Placeholder para estadisticas futuras.
2. Definir tipos compartidos (`RawPlayer`, `ShopTag`, `StatExtras`).
3. Implementar validaciones (IDs duplicados, encoding) y pruebas unitarias sobre muestras reales.
4. Automatizar exportacion con `npm run export:table0 -- <archivo>` que escribe `data/processed/table0.json` y `table0.meta.json`.

### Requerimientos de la tuberia de exportacion `tabla 0`

1. **Entrada confiable**: recibir archivos XLSX originales nombrados con version/fecha y almacenarlos en `data/raw/`.
2. **Normalizacion reproducible**: comando `npm run export:table0 -- <archivo>` que:
   - Verifique la presencia de la hoja `0`.
   - Exporte a JSON ordenado (`data/processed/table0.json`) usando cabeceras oficiales.
   - Registre metadatos (hash, fecha, numero de filas) en `data/processed/meta.json`.
3. **Validacion automatica**: el comando falla si:
   - Falta alguna columna critica.
   - Se detectan IDs duplicados o valores fuera de rango.
4. **Salida versionada**: los artefactos procesados se commitean y se referencian por `dataVersion` para que la UI pueda detectar actualizaciones.

## Fase 2 · Motor de Calculo

1. Traducir formulas de la fila 2 a funciones puras dentro de `packages/engine`, definiendo tipos (`DerivedPlayer`, `ColumnDefinition`) y registro de columnas.
2. Anadir utilidades para emular BUSCARV/INDICE/SI/AGREGAR, etc. (primer lote listo: `ifError`, `vlookup`, `match`, `average`).
3. Iterar columnas en bloques (datos basicos, stats, ratings, metricas) validando contra Excel.
4. Construir suite de regresion: exportar filas de Excel y comparar resultado 1:1.
5. Exponer API publica (`computeDerivedPlayer`, `computeDerivedPlayers`) para cache builder y UI.

## Fase 3 · Generacion de Cache

1. Implementar CLI `pnpm run build:data` (paquete `apps/cache-builder`) que:
   - Ejecuta ingesta.
   - Usa el motor para generar `players.json`, `clubs.json`, `meta.json`, `indices/*.json`.
2. Anadir control de versiones y metadatos de build.
3. Generar `schema.json` y validarlo via `ajv`.

## Fase 4 · Front-end Modular

1. Crear app React + Vite (`apps/ui`) con routing por modulo.
2. Implementar store global (Zustand/TanStack) para datos y preselecciones.
3. Desarrollar modulos prioritarios (buscador, preseleccion, perfil, similares, comparador) consumiendo la cache.
4. Construir componentes reutilizables (tablas dinamicas, KPIs, radar charts).

## Fase 5 · Empaquetado Desktop/Movil

1. Integrar Tauri para desktop:
   - Cargar cache local.
   - APIs para filesystem y modo fullscreen.
2. Integrar Capacitor para movil:
   - Reutilizar el bundle web.
   - Configurar storage persistente y ocultar barras del sistema.

## Fase 6 · Actualizaciones y Estadisticas Extra

1. Implementar pipeline de actualizacion (script + documentacion) para las releases semestrales.
2. Consumir la nueva DB de estadisticas cuando este disponible y extender el motor/cache.
3. Anadir pruebas end-to-end (Playwright) para flujos criticos.

## Fase 7 · Observabilidad y Distribucion

1. Automatizar builds y empaquetado con CI (GitHub Actions).
2. Generar instaladores firmados (MSIX, DMG, APK/AAB).
3. Registrar changelog y metricas basicas (opcionalmente telemetria offline/anonima).

## Entregables Continuos

- `ARCHITECTURE.md` (este documento complementario).
- `IMPLEMENTATION_PLAN.md` (este documento).
- `LOG.md` para registrar cada paso ejecutado.

## Estado al 2025-11-11

- **Fases 0-2 completadas**: repo configurado, ingesta (`table0.json`) reproducible y motor alineado con Hoja 1 (excepto los casos Shop/ML, donde priorizamos los tags propios).
- **Referencias actualizadas**: `data/reference/1.json` refleja los cambios recientes (`CLUB`, `TOLERANCIA LESIONES`), y el comparador `npm run compare:derived` queda como prueba de regresi�n.
- **Pr�ximo foco (Fase 3)**: formalizar la generaci�n de cache en `apps/cache-builder`, versionar los artefactos (`players.json`, `clubs.json`, `meta.json`, �ndices) y preparar los datos para la futura UI modular.
