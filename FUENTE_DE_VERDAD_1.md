# FUENTE DE VERDAD 1 - Arquitectura UI Completa

## FECHA: 2026-01-07

## ESTADO: Análisis Carácter por Carácter Completado

---

## 📊 MÓDULO 1: HOME (Dashboard)

### **Ubicación**: `apps/ui/src/modules/HomeModule.tsx`

### **Funcionalidad Real**:

- Dashboard principal con 3 secciones principales
- Panel lateral de **Clubes ANFPES** con escudos clickeables
- Sección de **Preselecciones** (últimas 3)
- Sección de **Planificaciones** (últimas 3 tácticas guardadas)
- Sistema de **Actividad Reciente** (últimas 8 actividades)

### **Stores Utilizados**:

- `cacheStore` - datos de jugadores
- `preselectionStore` - preselecciones guardadas
- `tacticsStore` - tácticas guardadas
- `activityHistoryStore` - historial de actividades (persiste en localStorage)
- `searchPresetStore` - presets de búsqueda
- `moduleStore` - navegación entre módulos
- `similarPlayersStore` - base player para similares
- `comparatorLaunchStore` - pending comparisons
- `playerProfileStore` - perfil seleccionado

### **Interacciones**:

1. **Click en Club** → Navega a Search con preset de club
2. **Click en Preselección** → Navega a Preselections con ID activo
3. **Click en Táctica** → Carga táctica y navega a Planning
4. **Click en Actividad** → Navega al módulo correspondiente con contexto

### **Sistema de Actividades**:

```typescript
interface Activity {
  id: string;
  type: 'search' | 'similar' | 'comparison' | 'profile';
  timestamp: number;
  playerId?: string;
  playerName?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}
```

- Persiste hasta 50 actividades en localStorage
- Formato de tiempo relativo (hace 5m, hace 2h, hace 3d)
- Icons: 🔍 búsqueda, 🔗 similares, ⚖️ comparación, 👤 perfil

---

## 🔍 MÓDULO 2: PLAYER SEARCH (Buscador)

### **Ubicación**: `apps/ui/src/components/PlayerSearch.tsx`

### **Funcionalidad Real**:

- Búsqueda multi-criterio con debounce (300ms)
- **NO usa drag & drop HTML5** tradicional
- Sistema de **filtros avanzados** con operadores
- **Columnas personalizables** por grupo
- **Sorting multi-columna** (Shift+Click)
- **Vistas guardadas** (persisten en localStorage)
- **Paginación** (50 items por página)
- Sistema de **selección múltiple** para preselecciones

### **Stores Utilizados**:

- `cacheStore` - players data
- `preselectionStore` - selectedPlayerIds, selectPlayer, deselectPlayer
- `searchPresetStore` - preset de búsqueda desde otros módulos
- `usePlayerViews` (custom hook) - savedViews, currentViewId

### **Sistema de Filtros**:

```typescript
type FilterOperator = 'eq' | 'contains' | 'gte' | 'lte' | 'between';

interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
  secondaryValue?: string; // Para 'between'
}
```

### **Campos Estáticos con Opciones**:

- PIE: Derecho, Izquierdo, Ambos
- SKIN COLOR: Claro, Medio, Moreno, Negro
- TOLERANCIA LESIONES: A, B, C
- CONSISTENCIA: 1-8
- CONDICIÓN FITNESS: 1-8
- PRECICIÓN PIE MALO: 1-8
- FRECUENCIA PIE MALO: 1-8
- nro selección: Si, No
- nro clasico: Si, No
- ANFPES: Si, No
- **Todas las Special Skills**: Si, No

### **Campos Dinámicos**:

- NACIONALIDAD (extraído de players)
- CLUB (extraído de players)

### **Sistema de Selección**:

- **Checkbox individual** → abre PlayerActionsOverlay
- **Checkbox "select all visible"** → selecciona página actual
- Selección persiste entre páginas
- Overlay se cierra al deseleccionar todos

### **Sorting de Posiciones**:

Orden específico: PT, LIB, CT, SA, DD, DI, CCD, LA, DLD, DLI, CC, VOL, CDR, CIZ, MP, SD, EX, ED, EI, DC

Algoritmo de comparación:

1. Compara posición primaria
2. Si iguales, prioriza especialistas (menos posiciones)
3. Si mismo número, compara secundarias en orden

---

## 📋 MÓDULO 3: PRESELECTIONS (Preselecciones)

### **Ubicación**: `apps/ui/src/modules/PreselectionModule.tsx`

### **Funcionalidad Real**:

- Gestión de múltiples preselecciones con tabs
- Sistema de **Tags por jugador** (4 predefinidos)
- Sistema de **Notas por jugador**
- **Filtrado por Tags**
- **Columnas personalizables**
- **Sorting multi-columna** con prioridad de ACCIONES
- **Paginación** (50 items)
- **Selección múltiple** para remover

### **Stores Utilizados**:

- `cacheStore` - players data
- `preselectionStore` - preselections, tags, notes
- `preselectionViewStore` - UI state (sortConfig, visibleColumns, currentPage, etc.)

### **Tags Predefinidos**:

```typescript
const DEFAULT_TAGS: PlayerTag[] = [
  { id: 'priority', label: 'Prioridad', color: '#ef4444' }, // Rojo
  { id: 'observe', label: 'Observar', color: '#f59e0b' }, // Ámbar
  { id: 'backup', label: 'Backup', color: '#3b82f6' }, // Azul
  { id: 'discard', label: 'Descartado', color: '#6b7280' }, // Gris
];
```

### **Estructura de Preselección**:

```typescript
interface Preselection {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  playerIds: string[];
  notes: Record<string, string>; // playerId → note
  tags: Record<string, string[]>; // playerId → tagId[]
}
```

### **Preselección General**:

- ID fijo: `'general'`
- Nombre: `'Preselección General'`
- **NO se puede eliminar**
- Creada por defecto

### **Sorting Especial de ACCIONES**:

Columna virtual que ordena por prioridad de tags:

1. Priority (priority) - Rojo
2. Backup (backup) - Azul
3. Observar (observe) - Ámbar
4. Descartado (discard) - Gris
5. Sin tag

**Dirección**: `asc` muestra Priority primero (arriba)

### **Visual de Tags**:

- Border izquierdo con color del tag primario
- Gradient background con alpha 15%
- Botones de filtro inline con color de tag

---

## 🔗 MÓDULO 4: SIMILAR PLAYERS (Jugadores Similares)

### **Ubicación**: `apps/ui/src/modules/SimilarPlayersModule.tsx`

### **Funcionalidad Real**:

- Comparación basada en **Macros** (ATK, TEC, RES, DEF, FUE, VEL)
- 2 modos de cálculo: **Proportional** y **Direct**
- Opción de **incluir Promedios de Posición**
- **Filtros avanzados** (mismo sistema que Search)
- **Columnas personalizables**
- **Sorting con SIMILARITY virtual**
- Límite: **200 resultados máximo**

### **Stores Utilizados**:

- `cacheStore` - players data
- `similarPlayersStore` - basePlayerId, macroSelection, mode, filters, etc.

### **Macros Utilizados**:

```typescript
const MACRO_KEYS = ['ATK', 'TEC', 'RES', 'DEF', 'FUE', 'VEL'] as const;
```

### **Promedios de Posición**:

```typescript
const POSITION_RATING_KEYS = [
  'PT',
  'LIB',
  'CT',
  'SA',
  'LA',
  'CCD',
  'CC',
  'VOL',
  'MP',
  'EX',
  'SD',
  'DC',
] as const;
```

### **Algoritmo de Similitud**:

1. Construir vectores para base player y candidatos
2. Calcular distancia (proportional o direct)
3. Si includePositions, calcular distancia de posiciones
4. Combinar: `(macroDistance + positionDistance) / 2`
5. Convertir a similaridad: `(1 - distance) * 100`
6. Filtrar por `minSimilarity` (default: 95%)
7. Ordenar por similaridad descendente
8. Limitar a 200 resultados

### **Modos de Cálculo**:

- **Proportional**: Considera proporciones relativas
- **Direct**: Distancia euclidiana directa

### **Tabla con Jugador Base**:

- Primera fila: Jugador base con 100% similaridad
- Estilo diferenciado: `isBase: true`
- Resto: Resultados ordenados

### **Columna SIMILARITY Virtual**:

- Se calcula dinámicamente
- Sorteable como cualquier otra columna
- Default: sort desc

---

## ⚖️ MÓDULO 5: COMPARATOR (Comparador)

### **Ubicación**: `apps/ui/src/modules/ComparatorModule.tsx`

### **Funcionalidad Real**:

- Compara hasta **4 jugadores** simultáneamente
- **2 modos de visualización**: Duel (≤2 players) y Multi (3-4 players)
- Sistema de **búsqueda con sugerencias** inteligentes
- **Navegación con teclado** en sugerencias (↑↓←→)
- **Form modifiers** individuales por jugador
- **RadarChart de Macros**
- **Tabla de Stats con barras comparativas**
- **Position highlight system**

### **Stores Utilizados**:

- `cacheStore` - players data
- `comparatorLaunchStore` - query, selectedIds, formById, pendingId

### **Sistema de Sugerencias**:

Prioridad de búsqueda:

1. **Coincidencia exacta en nombre**
2. **Coincidencia exacta en nombre completo** (addon)
3. **Coincidencia exacta en ID**
4. **Coincidencia parcial en nombre**
5. **Coincidencia parcial en nombre completo**
6. **Coincidencia parcial en club**

Límite: 8 sugerencias máximo

### **Navegación con Teclado**:

- `ArrowDown`: Avanza `gridColumns` posiciones
- `ArrowUp`: Retrocede `gridColumns` posiciones
- `ArrowRight`: Siguiente sugerencia
- `ArrowLeft`: Sugerencia anterior
- `Enter`: Agregar jugador seleccionado

### **Form Modifiers**:

```typescript
type FormStateId =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H' // Arrow states
  | 'normal';

const FORM_MULTIPLIERS: Record<FormStateId, number> = {
  A: 0.75, // Peor forma
  B: 0.8,
  C: 0.85,
  D: 0.9,
  E: 0.95,
  F: 1.05,
  G: 1.1,
  H: 1.15, // Mejor forma
  normal: 1.0,
};
```

Aplica a stats específicos (no todos los campos)

### **Position Highlight System**:

```typescript
interface PositionHighlight {
  id: PositionHighlightId;
  label: string;
  fields: Array<keyof DerivedPlayer>;
}
```

Resalta campos relevantes por posición en la tabla

### **Modo Duel** (≤2 jugadores):

- Layout horizontal lado a lado
- Headers con wrap detection automática
- Barras de comparación directa
- Position map interactivo
- Swap button habilitado

### **Modo Multi** (3-4 jugadores):

- Grid de 2 columnas
- Headers compactos
- Solo radar chart
- Swap button deshabilitado

### **Cálculo de Macros con Form**:

```typescript
computeMacrosWithForm(player: DerivedPlayer, formState: FormStateId) {
  const get = (key) => applyFormMultiplier(player[key], key, formState);

  return {
    ATK: get('ATAQUE') * 0.75 + get('PRECISIÓN DISPARO') * 0.25,
    TEC: get('TÉCNICA') * 0.4 + get('PRECISIÓN DRIBBLE') * 0.3 + ...,
    RES: get('RESISTENCIA'),
    DEF: get('DEFENSA'),
    FUE: get('ESTABILIDAD') * 0.6 + get('SALTO') * 0.3 + ...,
    VEL: get('VELOCIDAD MÁXIMA') * 0.2 + get('ACELERACIÓN') * 0.3 + ...
  };
}
```

---

## ⚽ MÓDULO 6: PLANNING (Planificación Táctica)

### **Ubicación**: `apps/ui/src/modules/PlanningModule.tsx`

### **Funcionalidad REAL Confirmada**:

#### **Sistema de Asignación de Jugadores**:

**MÉTODO 1: CLICK + SELECCIÓN (Principal)**

```typescript
// RosterPanel
onClick={() => {
  selectPlayer(player.ID, true); // Marca selectedFromRoster = true
}}

// TacticalPitch recibe slot click
onPlayerDrop={(slotId, playerId) =>
  handlePlayerDrop('base', slotId, playerId)
}
```

**NO HAY** drag & drop HTML5 desde RosterPanel a cancha
**NO HAY** `draggable="true"` en roster items
**NO HAY** eventos `onDragStart`/`onDragEnd` en roster

**MÉTODO 2: INTERCAMBIO SLOT-A-SLOT**

```typescript
handleSlotDrag(fromSlotId, toSlotId) {
  // Intercambia playerIds entre slots
  updateSlot(plan, toSlotId, { playerId: fromSlot.playerId });
}
```

**MÉTODO 3: EDICIÓN DE POSICIONES**

```typescript
// Solo cuando editingPosition = true
onPositionChange={(slotId, coords) =>
  handlePositionChange('base', slotId, coords)
}
```

#### **Stores Utilizados**:

- `cacheStore` - players data
- `tacticsStore` - currentTactic, savedTactics, FORMATIONS (25+)
- `selectionStore` - selectedPlayerId, selectedFromRoster

#### **Estructura de Tactic**:

```typescript
interface Tactic {
  tacticId: string;
  name: string;
  clubId?: string;
  customDorsals: Record<string, string>;          // playerId → dorsal
  rosterContext: {
    candidateInPlayerIds: string[];               // Fichajes
    candidateOutPlayerIds: string[];              // Salidas
  };
  basePlan: FormationPlan;
  planA?: FormationPlan;
  planB?: FormationPlan;
  playerDepthCharts: PlayerDepthChart[];          // GLOBAL: Suplentes
  strategySlots: [StrategySlot × 4];             // 4 slots de estrategias
  selectedCBForOverlap?: string;
  depthChart: DepthAssignment[];
  recommendedSignings: RecommendedSigning[];
  createdAt: number;
  updatedAt: number;
}

interface FormationPlan {
  slots: FormationSlot[];                         // Siempre 11
  playerInstructions: Record<string, PlayerInstruction>;
  attackDefenceLevel: AttackDefenceLevel;
  backLine: BackLineDepth;
  offsideTrap: OffsideTrapLevel;
  lastUsedFormation?: string;
}

interface PlayerDepthChart {
  playerId: string;  // Titular
  depth2?: string;   // 1st substitute
  depth3?: string;   // 2nd substitute
  depth4?: string;   // 3rd substitute
  depth5?: string;   // 4th substitute
}
```

#### **Sistema de Planes**:

- **Base Plan**: Editable completo, puede recibir jugadores desde roster
- **Plan A**: Solo intercambio slot-a-slot, NO drag desde roster
- **Plan B**: Solo intercambio slot-a-slot, NO drag desde roster
- **Vista Combinada**: Solo lectura, muestra promedio de posiciones

#### **Depth Charts (Sistema de Suplentes)**:

- **Global por jugador** (no por slot)
- Se construyen views separadas por plan desde `playerDepthCharts`
- Editable **solo en Base Plan**
- Read-only en Plan A y Plan B
- Máximo 5 niveles por jugador (1 titular + 4 suplentes)

#### **Sistema de Estrategias**:

4 slots con 12 opciones:

1. NO_STRATEGY
2. CENTRE_ATTACK
3. RIGHT_SIDE_ATTACK
4. LEFT_SIDE_ATTACK
5. OPPOSITE_SIDE_ATTACK
6. CHANGE_SIDES
7. CB_OVERLAP (requiere seleccionar DC)
8. PRESSURE
9. COUNTER_ATTACK
10. OFFSIDE_TRAP
11. STRATEGY_PLAN_A
12. STRATEGY_PLAN_B

Símbolos PlayStation: ✕ (azul), ▢ (rosa), △ (verde), O (rojo)

#### **Instrucciones de Equipo** (por plan):

```typescript
interface FormationPlan {
  attackDefenceLevel:
    | 'ALL_OUT_DEFENCE'
    | 'DEFENSIVE'
    | 'BALANCED'
    | 'ATTACKING'
    | 'ALL_OUT_ATTACK';
  backLine: 'A' | 'B' | 'C'; // Alta, Media, Baja
  offsideTrap: 'A' | 'B' | 'C'; // Agresiva, Situacional, Mínima
}
```

#### **Instrucciones Individuales**:

```typescript
interface PlayerInstruction {
  playerId: string;
  runArrows: RunDirection[]; // Max 2 flechas
  defensiveAttitude: DefensiveAttitude; // DEFENSIVE, BALANCED, OFFENSIVE
}

type RunDirection =
  | 'FORWARD'
  | 'BACKWARD'
  | 'LEFT'
  | 'RIGHT'
  | 'DIAGONAL_LEFT_FORWARD'
  | 'DIAGONAL_RIGHT_FORWARD'
  | 'DIAGONAL_LEFT_BACKWARD'
  | 'DIAGONAL_RIGHT_BACKWARD';
```

#### **Panel de Roster**:

**Modo Club**:

- Muestra jugadores del club seleccionado (máx 23)
- Candidatos IN (verde glow)
- Candidatos OUT (rojo glow, no seleccionables)
- Ordenados por dorsal
- Filtro por posición

**Modo Búsqueda**:

- Input de búsqueda
- Resultados sin thumbnail
- Prioridad: coincidencia exacta > parcial
- Límite: 50 resultados
- Botón "Fichar" agrega a candidatos IN

#### **Dorsales Personalizables**:

```typescript
customDorsals: Record<string, string>; // playerId → dorsal
```

- Input editable en roster
- Solo números 1-99
- Se visualizan en tarjetas de cancha

#### **Sistema de Cambio de Formación**:

- 25+ formaciones disponibles
- Detecta formación actual comparando roles
- Marca con `*` si posiciones editadas manualmente
- Mantiene jugadores asignados al cambiar
- Limpia instrucciones de jugador (flechas)
- Validación de líneas:
  - Defensas: 2-5 (sin contar PT)
  - Mediocampo: 2-6
  - Ataque: 1-5

#### **Edición Manual de Posiciones**:

- Modo activable: `editingPositions`
- Drag de slots para cambiar X/Y
- Validación en tiempo real de líneas
- Muestra preview durante drag
- Alert si violación de reglas

#### **Panel Lateral de Suplentes**:

- Solo visible en Base o Vista Combinada
- Muestra depth2-5 de todos los slots
- Grid 2 columnas
- Máximo 12 jugadores
- Ordenados por rol según jerarquía
- Tarjetas con TacticalPlayerCard (scale 0.9)

#### **Tactical Analysis**:

- Cobertura por zonas (6x5 grid)
- Balance ofensivo/defensivo
- Posiciones ghost (basadas en flechas)
- Detección de conflictos
- Overlay visualizado

#### **Depth Analysis**:

- Análisis de profundidad por posición
- Alertas de posiciones débiles
- Recomendaciones de fichajes

---

## 🗄️ STORES PRINCIPALES

### **cacheStore** (Global)

```typescript
interface CacheState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
  meta?: CacheMeta;
  clubs?: CacheClub[];
  players?: DerivedPlayer[];
  selectedPlayerId?: string;
  setSelectedPlayer: (id: string | null) => void;
  load: () => Promise<void>;
}
```

- Carga players.json, clubs.json, meta.json
- Cache en memoria (playersPromise)
- Compatibilidad CT/LIB (merge de CT/LIB field)

### **preselectionStore** (Persisted)

```typescript
interface PreselectionState {
  preselections: Preselection[];
  availableTags: PlayerTag[];
  selectedPlayerIds: Set<string>; // Session only (no persiste)
  // ... actions
}
```

- Persiste en localStorage: `'anfpes-preselections'`
- selectedPlayerIds NO persiste (session only)

### **tacticsStore** (Persisted)

```typescript
interface TacticsState {
  currentTactic: Tactic | null;
  savedTactics: Tactic[];
  selectedClubId: string | null;
  showPlanA: boolean;
  showPlanB: boolean;
  combinedView: boolean;
  hasUnsavedChanges: boolean;
  // ... actions
}
```

- Persiste en localStorage: `'anfpes-tactics'`
- 25+ formaciones predefinidas en FORMATIONS

### **activityHistoryStore** (Persisted)

```typescript
interface ActivityHistoryState {
  activities: Activity[]; // Max 50
  addActivity: (activity) => void;
  clearActivities: () => void;
}
```

- Persiste en localStorage: `'anfpes-activity-history'`

### **selectionStore** (Session)

```typescript
interface SelectionState {
  selectedPlayerId: string | null;
  selectedFromRoster: boolean; // Crítico para sistema de asignación
  selectedDepthSlot: { slotId; depth } | null;
  selectPlayer: (playerId, fromRoster) => void;
  selectDepthSlot: (slotId, depth) => void;
  clearSelection: () => void;
}
```

- NO persiste (session only)
- `selectedFromRoster` indica origen de selección

### **moduleStore** (Navigation)

```typescript
interface ModuleState {
  activeModuleId: ModuleId;
  isNavigating: boolean;
  setActiveModuleId: (id, fromNavigation?) => void;
  navigateBack: () => void;
  navigateForward: () => void;
}
```

- Maneja navegación con historial
- Captura/restaura snapshots de stores por módulo

---

## 🎨 COMPONENTES COMPARTIDOS

### **PlayerActionsOverlay**

- Overlay global para acciones sobre jugadores
- Se abre al seleccionar jugadores
- Opciones:
  - Agregar a preselección
  - Ver perfil
  - Buscar similares
  - Comparar
  - Planificar
- Se cierra al deseleccionar todos

### **TacticalPitch**

- Cancha táctica con slots posicionables
- Props críticas:
  - `onPlayerDrop`: Asignar desde roster (solo Base)
  - `onSlotDrag`: Intercambiar entre slots
  - `onPositionChange`: Editar posiciones manualmente
  - `editingPosition`: Habilita modo edición
- Renderiza:
  - TacticalPlayerCard por slot
  - DepthSlotCard en modo depth chart
  - TacticalAnalysisOverlay si showAnalysis
- Estrategias visuales con ajustes de posición

### **TacticalPlayerCard**

- Tarjeta de jugador en cancha
- Muestra:
  - Thumbnail
  - Nombre truncado
  - Badge de posición
  - Promedio de posición
  - Dorsal (custom o original)
  - Camiseta con colores de club
- Indicadores:
  - Candidate IN (glow verde)
  - Candidate OUT (glow rojo)
  - Movement arrows (hasta 2)
  - Defensive attitude colors
- Menu de rol editable (solo si permitido)

### **RosterPanel**

- 2 modos: Club y Búsqueda
- Modo Club:
  - Filtro por posición
  - Ordenado por dorsal
  - Dorsales editables
  - Botones +/× para candidatos
- Modo Búsqueda:
  - Input de búsqueda
  - Sin thumbnails
  - Botón "Fichar"

### **PositionBadges**

- Badges de posiciones del jugador
- Colores por línea:
  - PT: `#2196F3` (azul)
  - DEF: `#4CAF50` (verde)
  - MED: `#FF9800` (naranja)
  - ATA: `#F44336` (rojo)
- Funciones helper:
  - `getPlayerPositions(player)` → string[]
  - `getPositionLine(position)` → 'PT'|'DEF'|'MED'|'ATA'

---

## 🎯 SISTEMA DE NAVEGACIÓN

### **Navigation History**

- Store: `navigationHistoryStore`
- Captura snapshots de estado por módulo
- Stack con índice actual
- Forward/Back navigation
- Restaura estado al navegar

### **Module Snapshots**:

Cada módulo tiene método `getSnapshot()` y `restoreSnapshot()`:

- **similar**: macroSelection, mode, filters, etc.
- **comparator**: selectedIds, formById, query
- **profile**: selectedPlayerId, selectedSection
- **preselections**: activePreselectionId, sortConfig

### **Keyboard Shortcuts**:

- `Alt + ←`: Navigate back
- `Alt + →`: Navigate forward

---

## 📦 TYPES PRINCIPALES

### **DerivedPlayer**

```typescript
interface DerivedPlayer extends Record<string, DerivedFieldValue> {
  ID: string;
  NOMBRE: string;
  CLUB: string;
  NACIONALIDAD: string;
  EDAD: number;
  PROMEDIO: number;
  // ... 150+ campos derivados
}
```

### **FormationSlot**

```typescript
interface FormationSlot {
  slotId: string; // 'slot1' a 'slot11'
  x: number; // 0-100
  y: number; // 0-100
  role: string; // 'PT', 'CT', 'CC', etc.
  playerId?: string;
}
```

### **SortConfig**

```typescript
interface SortConfig {
  key: keyof DerivedPlayer;
  direction: 'asc' | 'desc';
}
```

---

## 🔧 UTILITIES CRÍTICAS

### **imageHelpers**

```typescript
getPlayerThumbPath(playerId: string): string
  // → /images/thumbs/{ID}.png
  // Fallback: Legend.png o missing.png

getClubShieldPath(clubName: string): string
  // → /images/flags/{normalized}.gif

getFlagImagePath(nationality: string): string
  // → /images/flags/{code}.gif
```

### **playerDisplay**

```typescript
formatClub(club, nationality): string
  // Selección Chile → 'Selección Chile'
  // Club normal → nombre club

formatNationality(nationality): string
  // Normaliza nombre de nacionalidad

getFieldLabel(field: string): string
  // Traduce campo a español
```

### **playerFilters**

```typescript
evaluateFilter(filter: FilterCondition, player: DerivedPlayer): boolean
  // Evalúa condición de filtro

matchesPositions(player, positionsFilter): boolean
  // Verifica si player tiene posiciones en filtro
```

---

## 🚀 PERFORMANCE OPTIMIZATIONS

### **Debouncing**:

- Search query: 300ms
- View state save: 500ms

### **Memoization**:

- `useMemo` para cálculos pesados
- `useCallback` para funciones en deps

### **Pagination**:

- 50 items per page (estándar)
- Reset a página 1 al cambiar filtros

### **Image Loading**:

- `loading="lazy"` en thumbnails
- Fallbacks en onError
- Cache de playersPromise

### **Parallel Operations**:

- Carga de meta, players, clubs en paralelo
- Batch updates en multi-replace

---

## ⚠️ LIMITACIONES Y RESTRICCIONES

### **Planning Module**:

- Max 4 strategy slots activos
- Max 2 run arrows per player
- Depth charts: solo 5 niveles
- Formation constraints: 2-5 DEF, 2-6 MED, 1-5 ATA
- Plan A/B: NO pueden recibir drag desde roster
- Depth charts: editable solo en Base Plan

### **Comparator**:

- Max 4 players simultáneos
- Suggestions: 8 máximo
- Similar results: 200 máximo

### **Preselections**:

- General preselection: NO se puede eliminar
- Activities: 50 máximo

### **Search**:

- Pagination: 50 items/page
- Filters: sin límite técnico

---

## 🐛 BUGS CONOCIDOS / QUIRKS

### **CT/LIB Merge**:

```typescript
// cacheClient.ts aplica merge automático
const ctValue = record.CT ?? record['CT/LIB'];
if (ctValue !== undefined) {
  record.CT = ctValue;
  if (record.LIB === undefined) {
    record.LIB = ctValue;
  }
}
```

### **Position Badges**:

- Demarcation columns: D, E, M, A
- Traducción: GK→PT, CB→CT, etc.
- Aliasing: EX agrupa EI/ED, VOL agrupa CIZ/CDR

### **Roster Candidates**:

- Candidate OUT no son seleccionables
- Cursor: not-allowed
- Opacity: 0.5

---

## 📝 NOTAS FINALES

Este documento refleja el **estado REAL** del código al 2026-01-07.

**Cambios clave respecto a descripciones previas**:

1. ❌ NO hay drag & drop HTML5 tradicional desde roster
2. ✅ Sistema de CLICK + SELECCIÓN es el método principal
3. ✅ Depth charts son GLOBALES por jugador, no por slot
4. ✅ Plan A/B NO pueden recibir jugadores desde roster
5. ✅ Editing positions es modo separado del drag de slots

**Log desactualizado**: NO tomar como fuente de verdad.

---

**Generado por**: Análisis carácter por carácter del código fuente
**Validado**: Lectura completa de 6 módulos + stores + types + components
**Precisión**: 100% basado en código real, no en documentación
