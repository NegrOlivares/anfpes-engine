# Arquitectura Propuesta

## Objetivos
- Centralizar el cálculo de la Tabla 1 fuera de Excel, manteniendo paridad absoluta con las fórmulas originales.
- Producir una caché de datos autocontenida que abastezca múltiples módulos UI y facilite actualizaciones semestrales de la DB.
- Ofrecer apps instalables (PC/móvil) con la misma base de código, modo offline y posibilidad de pantalla completa sin navegador visible.
- Permitir la incorporación ágil de nuevos módulos funcionales y nuevas fuentes de datos (p. ej. estadísticas históricas).

## Capas Principales
1. **Ingesta y Normalización**
   - Adaptadores para cada tabla fuente (`tabla 0`, `Shop/ML`, futuras estadísticas).
   - Conversión a estructuras tipadas (`RawPlayer`, `ShopTag`, `PlayerStatsExtras`).
   - Validaciones de integridad (IDs únicos, referencias válidas, encoding consistente).

2. **Motor de Cálculo**
   - Librería TypeScript pura (`engine/`) con funciones deterministas:
     - `computeDerivedPlayer(rawPlayer, shopIndex, statsExtras)` reproduce hoja 1.
     - Modules auxiliares para traducir BUSCARV/INDICE/SI/etc.
   - Tests de regresión contra muestras exportadas del Excel para garantizar paridad.

3. **Generación de Caché**
   - Pipeline CLI (`pnpm run build:data`) que:
     1. Ejecuta la ingesta.
     2. Calcula todos los `DerivedPlayer`.
     3. Deriva agregados por club, rankings, metadatos.
     4. Serializa artefactos versionados (`/cache/players.json`, `clubs.json`, `meta.json`).
   - Incluye `schema.json` para documentar formatos y permitir validación en cliente.

4. **API Local Ligera (opcional)**
   - Módulo Node/Elysia/Fastify embebible que sirve los JSON o ejecuta consultas en memoria.
   - Permite habilitar búsqueda avanzada sin leer todo el archivo en el cliente, manteniendo modo offline.

5. **Clientes**
   - **Front-end común** (React + Zustand/TanStack Query) estructurado por módulos:
     - Buscador, Preselección global, Perfil, Similares, Comparador, Clubes, Plantel, DT, Comparador de equipos.
   - **Distribución Desktop**: Tauri (Rust) empaqueta el front-end, expone APIs para filesystem local y controla fullscreen.
   - **Distribución Móvil**: Capacitor reutiliza el mismo bundle web dentro de WebViews nativas (Android/iOS), con sync opcional de caché.
   - Preselección y estado compartido se persisten en storage local criptografiado (per user/device).

6. **Actualización de Datos**
   - Script `pnpm run update-db --source <path>` que refresca la caché cuando lleguen los nuevos Excel (2 veces/año).
   - Versionado semántico (`dataVersion`) embebido en los JSON y consumido por la UI para avisar de nuevas releases.

## Extensibilidad
- Nuevos módulos UI solo requieren consumir el store central y, si aplica, extender la caché con nuevos índices.
- Fuentes de datos adicionales se conectan mediante nuevos adaptadores en Ingesta sin tocar el motor existente.
- El motor se desarrolla con cobertura completa, facilitando refactors sin romper paridad con Excel.

## Seguridad y Distribución
- Todo el procesamiento se hace local; no hay dependencia de nube para operar la app.
- Firmas de integridad (hash SHA) para archivos de caché garantizan que la UI carga datos coherentes.
- El empaquetado Tauri/Capacitor permite instaladores pequeños, auto-actualizables y sin navegador visible en pantalla.

