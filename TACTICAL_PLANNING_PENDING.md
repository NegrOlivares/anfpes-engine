# Funcionalidades Pendientes - Módulo de Planificación Táctica

## ✅ Implementado (Completo)

### Core Funcional

- ✅ Selector de formaciones (5 formaciones: 4-4-2, 4-3-3, 4-5-1, 3-5-2, 5-3-2)
- ✅ Drag & drop de jugadores (roster → cancha y slot → slot)
- ✅ Sistema de 3 planes tácticos (Base, Plan A, Plan B)
- ✅ Gestión de candidatos (fichajes entrantes y salidas)
- ✅ Indicadores visuales de candidatos (glow verde/rojo)
- ✅ Panel de roster optimizado (2 modos: Club y Búsqueda)
- ✅ Visualización de camisetas con colores de club
- ✅ Miniaturas de jugadores en overlay
- ✅ Cambio de formación con reubicación inteligente de jugadores
- ✅ Badges de posición estandarizados (PositionBadges)
- ✅ Promedio de posición con código de color
- ✅ Guardado/carga de tácticas

### Visualización

- ✅ Cancha estilo position-map (verde con líneas SVG)
- ✅ Orientación correcta (portero abajo, delanteros arriba)
- ✅ Tamaño optimizado (320px)
- ✅ Display de nombre y dorsal en cada slot

---

## ⚠️ Pendientes de Implementación

### 1. Estrategias Manuales (Manual Strategies)

**Prioridad: ALTA**

Implementar UI para las 4 posiciones de estrategias manuales disponibles en PES6:

- [ ] **Panel de Estrategias**: 4 slots de botones para asignar estrategias
- [ ] **Dropdown de Opciones**: 12 estrategias disponibles por slot:
  1. Contraataque
  2. Long Ball
  3. Posesión
  4. Wing Attack (Ataque por Bandas)
  5. Wing Rotation (Rotación de Bandas)
  6. Center Attack (Ataque Central)
  7. Counter Target (Objetivo de Contraataque)
  8. Wide Defense (Defensa Amplia)
  9. Defensive (Defensivo)
  10. Pressing (Presión Alta)
  11. Offside Trap (Trampa del Fuera de Juego)
  12. (Por identificar: revisar PES6 manual)

**Detalles Técnicos:**

- Tipo: `ManualStrategiesMapping` con 4 posiciones (1-4)
- Cada posición puede tener una estrategia de tipo `ManualStrategy`
- Debe integrarse en `tacticsStore.ts` con action `setManualStrategy(position, strategy)`
- UI en forma de 4 botones con dropdown

**Ubicación UI:** Panel lateral o sección debajo del selector de formación

---

### 2. Instrucciones Individuales de Jugadores

**Prioridad: ALTA**

Sistema completo de instrucciones por jugador (Player Instructions):

#### a) Flechas de Movimiento (Run Arrows)

- [ ] **UI de Flechas**: Permitir añadir hasta 2 flechas por jugador
- [ ] **Direcciones**: 8 direcciones posibles (N, NE, E, SE, S, SW, W, NW)
- [ ] **Control Visual**: Clicks en un círculo direccional alrededor del slot
- [ ] **Indicador Visual**: Mostrar flechas directamente en la cancha sobre cada jugador

**Implementación:**

- Componente `PlayerArrowsControl` con 8 botones direccionales
- Estado en `playerInstructions[playerId].runArrows: ArrowDirection[]`
- Máximo 2 flechas por jugador
- Renderizar flechas SVG sobre los slots en la cancha

#### b) Actitud Defensiva

- [ ] **Toggle de Actitud**: 3 estados (Defensive, Balanced, Offensive)
- [ ] **UI**: Radio buttons o selector visual
- [ ] **Indicador Visual**: Badge o color en el slot del jugador

**Estado Actual:**

- Ya existe `playerInstructions[playerId].defensiveAttitude` en store
- Falta UI para modificarlo

---

### 3. Sistema de Depth Chart (Profundidad de Plantilla)

**Prioridad: MEDIA**

Gestión de suplentes y jerarquía de posiciones:

- [ ] **Vista Depth Chart**: Tabla mostrando cada posición con 2-3 jugadores ordenados
- [ ] **Drag & Drop de Suplentes**: Asignar backups a cada posición
- [ ] **Auto-sugerencias**: Sistema que sugiera los mejores backups según promedio de posición
- [ ] **Indicador de Cobertura**: Visual que muestre qué posiciones tienen backup y cuáles no

**Estructura:**

```typescript
interface DepthChartEntry {
  position: string; // 'PT', 'CT', 'CC', etc.
  players: string[]; // IDs ordenados por prioridad [titular, suplente1, suplente2]
}
```

**UI Propuesta:**

- Tabla con filas por posición
- 3 columnas: Titular | Suplente 1 | Suplente 2
- Drag & drop desde roster panel

---

### 4. Biblioteca de Tácticas Guardadas

**Prioridad: MEDIA**

Interfaz para gestionar múltiples tácticas guardadas:

- [ ] **Lista de Tácticas**: Sidebar o modal mostrando todas las tácticas guardadas
- [ ] **Búsqueda/Filtro**: Por nombre o club
- [ ] **Acciones por Táctica**:
  - Cargar (reemplazar táctica actual)
  - Duplicar (crear copia)
  - Eliminar
  - Renombrar
- [ ] **Vista Previa**: Miniatura de la formación al hover

**Estado Actual:**

- `savedTactics: Record<string, Tactic>` ya existe en store
- Falta UI completa de gestión

---

### 5. Vista Combinada (Combined View)

**Prioridad: BAJA**

Visualización simultánea de múltiples planes:

- [ ] **Overlay de Planes**: Superponer Base + Plan A + Plan B en una sola cancha
- [ ] **Diferenciación Visual**: Colores diferentes por plan (ej: Base gris, A azul, B rojo)
- [ ] **Toggle de Visibilidad**: Checkboxes para mostrar/ocultar cada plan
- [ ] **Análisis de Movimiento**: Líneas mostrando cómo se mueven los jugadores entre planes

**Objetivo:**
Permitir al usuario ver de un vistazo cómo cambia el posicionamiento entre planes para identificar patrones de movimiento táctico.

---

### 6. Funcionalidad de Toggles Plan A/B

**Prioridad: BAJA**

Actualmente existen checkboxes pero no funcionan completamente:

- [ ] **Wiring Completo**: Conectar los toggles al estado del store
- [ ] **Efecto Visual**: Mostrar/ocultar planes visualmente en la cancha
- [ ] **Integración con Combined View**: Los toggles deben funcionar en la vista combinada

**Estado Actual:**

- Checkboxes existen en UI
- Falta conectar al state y lógica de renderizado

---

### 7. Panel de Instrucciones de Equipo (Team Instructions)

**Prioridad: BAJA**

Completar el wiring de todos los controles:

- [ ] **Verificar Conexión**: Todos los sliders/dropdowns deben modificar `teamInstructions` en store
- [ ] **Validación**: Asegurar que los valores se guardan correctamente
- [ ] **Reset a Default**: Botón para restaurar valores por defecto

**Estado Actual:**

- UI básica existe
- Algunos controles pueden no estar completamente conectados

---

### 8. Editor de Posiciones en Formación

**Prioridad: BAJA - EXPERIMENTAL**

Permitir customización de coordenadas (x, y) de cada slot:

- [ ] **Modo Edición**: Toggle para entrar en modo de edición de formación
- [ ] **Drag Slots**: Arrastrar cada slot para cambiar su posición en la cancha
- [ ] **Grid Snapping**: Opcional para alinear posiciones a una cuadrícula
- [ ] **Guardar Formación Custom**: Permitir guardar formaciones personalizadas

**Nota:**
Esto es más avanzado y puede ser opcional. Las 5 formaciones base suelen ser suficientes.

---

### 9. Comparación de Tácticas

**Prioridad: BAJA**

Vista lado a lado de dos tácticas:

- [ ] **Selector de Tácticas**: Dropdown para elegir 2 tácticas de la biblioteca
- [ ] **Vista Dual**: Dos canchas lado a lado
- [ ] **Comparación de Stats**: Tabla mostrando diferencias en promedios, cobertura, etc.

---

### 10. Exportar/Importar Tácticas

**Prioridad: MEDIA**

Compartir tácticas entre usuarios:

- [ ] **Exportar JSON**: Botón para descargar táctica como archivo JSON
- [ ] **Importar JSON**: Drag & drop o selector de archivo para importar
- [ ] **Validación**: Verificar que el JSON importado tenga estructura válida
- [ ] **Preview antes de Importar**: Mostrar resumen de la táctica antes de confirmar

---

## 📊 Resumen de Prioridades

### 🔴 Alta Prioridad (Impacto en Gameplay)

1. **Estrategias Manuales** - Core de la experiencia táctica de PES6
2. **Instrucciones Individuales** - Flechas y actitud defensiva

### 🟡 Media Prioridad (Mejora UX)

3. **Depth Chart** - Gestión de suplentes
4. **Biblioteca de Tácticas** - Gestión de múltiples tácticas
5. **Exportar/Importar** - Compartir tácticas

### 🟢 Baja Prioridad (Nice to Have)

5. **Vista Combinada** - Análisis visual avanzado
6. **Toggles Plan A/B** - Mejora visual menor
7. **Team Instructions Wiring** - Verificación/pulido
8. **Editor de Formaciones** - Experimental
9. **Comparación de Tácticas** - Feature avanzado

---

## 🎯 Recomendación de Orden de Implementación

1. **Fase 1 - Core Táctico:**
   - Estrategias Manuales (4 slots)
   - Instrucciones Individuales (flechas + actitud)

2. **Fase 2 - Gestión:**
   - Biblioteca de Tácticas UI completa
   - Depth Chart básico

3. **Fase 3 - Polish:**
   - Exportar/Importar
   - Vista Combinada
   - Editor de Formaciones (opcional)

---

## 📝 Notas Adicionales

### Arquitectura Actual

- **Store:** `tacticsStore.ts` con Zustand + persist
- **Tipos:** Completos en `types/tactics.ts`
- **Componentes:** `PlanningModule.tsx`, `TacticalPlayerCard.tsx`, `RosterPanel.tsx`

### Consideraciones Técnicas

- Todas las estructuras de datos ya están definidas en los tipos
- El store tiene la mayoría de las actions necesarias
- Principal trabajo es UI/UX de las funcionalidades pendientes
- Performance está optimizada (roster panel con 2 modos)

### Testing Recomendado

- Probar cambios de formación con jugadores asignados
- Verificar que el drag & drop funcione en todos los escenarios
- Validar que los cambios se guarden correctamente en localStorage
- Probar con múltiples clubes y tácticas
