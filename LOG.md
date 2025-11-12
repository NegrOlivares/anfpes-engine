# Log

## 2025-11-10

- Eliminé artefactos temporales (`tmp_xlsx`, `raw_db.zip`) que quedaron del análisis del XLSX.
- Redacté `ARCHITECTURE.md` con la propuesta de capas, datos y distribución multiplataforma.
- Documenté el plan de fases en `IMPLEMENTATION_PLAN.md`.
- Inicialicé el monorepo Node (`package.json`, workspaces, `.gitignore`, configs de TS/ESLint/Prettier`) e instalé dependencias base (TypeScript, Vitest, ESLint, Prettier, Husky, lint-staged).
- Creé la estructura vacía de `packages/` y `apps/`, con README descriptivos.
- Configuré Husky + lint-staged para formatear cambios antes de los commits.
- Añadí scripts coordinados (`dev`, `lint`, `test`), referencias `tsconfig` y documenté la tubería de exportación de tabla 0 en `IMPLEMENTATION_PLAN.md`.
- Creé `packages/data-ingest` con lectores para `ML.txt` y `tabla 0` (XLSX), tipos compartidos y pruebas con Vitest.
- Configuré Vitest global, dependencias adicionales (`xlsx`, `@types/node`) y los `package.json` locales de `packages/*` y `apps/*`.
- Ajusté `.prettierignore`, migré ESLint a `eslint.config.mjs`, añadí `.gitattributes` y afiné scripts para evitar que lint/formato toquen binarios.
- Implementé validadores de columnas/IDs, placeholder de estadísticas extras y pruebas adicionales.
- Creé el comando `npm run export:table0` (apps/cache-builder) que genera `data/processed/table0.json` + metadatos y artefactos base para futuras estadísticas.
- Arranqué la Fase 2 creando el módulo del motor: tipos `DerivedPlayer`, helpers estilo Excel (`vlookup`, `match`, `ifError`, `average`), derivador básico y cálculo de club con Shop/ML.
- Añadí pruebas unitarias para los helpers y el cálculo inicial (`packages/engine/tests`) y verifiqué el paquete con `npm run test:root -- engine`.
- Cargué la nueva referencia `RAW DB + FORMULAS.xlsx`, exporté la Hoja 1 a JSON (`npm run export:sheet1`) y escribí un comparador (`npm run compare:derived`) para validar las salidas del motor contra Excel.
- Extendí el motor con demarcaciones completas, ratings posicionales PT–DC, métricas compuestas (DESTREZA ATAQUE, PROMEDIO CENSANTE, ATK/TEC/RES/DEF/FUE/VEL) y banderas laterales (RB/LB…).
- Actualicé tests del motor para cubrir la nueva lógica y dejé un comando de regresión que lista las diferencias pendientes frente al Excel.
- Expandí el motor con mapeos de biografía y stats principales (altura, peso, edad, pie, 30+ atributos PES) y dejé preparado el cálculo de promedios.
- Construí `apps/cache-builder/src/exportDerived.ts` y el comando `npm run export:derived` para generar `table1.json` usando tabla 0 + Shop/ML.
- Actualicé la documentación (`IMPLEMENTATION_PLAN.md`, `apps/cache-builder/README.md`) y ejecuté lint/tests de la fase nueva.
- Normalic� las lecturas de la tabla 0 (convirtiendo cualquier Date a string), extend� los tsconfig de engine/data-ingest/cache-builder para incluir referencias cruzadas, e hice que los tests del motor usen strings/accesos tipados; con eso se resuelven los errores de TypeScript que reportaste.

## 2025-11-11

- Reescribi `packages/engine/src/derived.ts` para cubrir todas las columnas de Hoja 1 (demarcaciones, ratings, promedios, atributos finales) y alinearlas con la referencia.
- Ajuste `packages/engine/src/club.ts` para priorizar `CLUB TEAM`/selecciones y usar los tags de `ML.txt` solo como fallback (corrigiendo tambien el texto "Seleccion ...").
- Regenerado `data/reference/1.json` y vuelto a comparar con `npm run compare:derived` hasta dejar como unica diferencia los jugadores Shop/ML (decision intencional).
- Normalice los flags laterales (`SMF  8`, `RMF`, `LMF`) y resolvi el caso especial del rating `EX` de Maradona (divisor 105).
- Actualice `IMPLEMENTATION_PLAN.md` con el estado actual y deje registrado que la Fase 2 queda cerrada; el siguiente paso es comenzar la generacion de cache (Fase 3).
- Inici� la Fase 3 creando el comando "npm run build:data" (apps/cache-builder) que genera players/clubs/indices/meta en data/cache/.
- Extend� build:data para generar �ndices byNationality/byPosition e inclu� los hashes correspondientes en meta.
- Ejecute `npm run build:data -- data/processed/table0.json ML.txt data/cache/dev dev`, verifiqu? los artefactos (players.json, clubs.json, meta.json, indices/byId|byClub|byNationality|byPosition) en data/cache/dev y dej? registrado que el flujo completo de la Fase 3 queda validado.

- Arranque la Fase 4 montando la app React/Vite (`apps/ui`), creando un plugin que expone/copias los archivos de data/cache, definiendo los primeros componentes (resumen de meta y tabla de jugadores) y dejando operativos los scripts dev/build/preview (`npm run build --workspace @anfpes/ui`).

- Implemente el store global con Zustand (`apps/ui/src/store/cacheStore.ts`), conecte los componentes de meta y tabla para usarlo sin reordenar los IDs (respaldando lo que viene de la tabla 1) y valide lint/build del paquete UI.

- Añadí el módulo `PlayerSearch` (filtro + detalle con stats y demarcaciones) consumiendo el store global, moví el formateo a utilidades comunes y actualicé estilos para el nuevo layout; `npm run lint/build --workspace @anfpes/ui` sigue pasando tras los cambios.
