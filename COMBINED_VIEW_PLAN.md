# Plan de Implementación: Vista Combinada

## Objetivo

Implementar una vista que muestre la posición promedio de cada jugador cuando se usan todos los planes disponibles (Base, Plan A, Plan B), con transiciones animadas.

## Concepto

En PES 6, durante un partido puedes cambiar entre planes tácticos. La Vista Combinada debe mostrar dónde quedaría posicionado cada jugador si se considera el promedio de todas sus posiciones en los planes activos.

### Ejemplo

- **Base**: DC en posición (50, 75)
- **Plan A**: CCD en posición (50, 50)
- **Plan B**: LIB en posición (50, 80)
- **Vista Combinada**: Promedio en (50, 68.3)

## Arquitectura

### 1. Función de Cálculo de Posición Combinada

```typescript
// En TacticalPitch.tsx o utils
function calculateCombinedPosition(
  baseSlot: FormationSlot,
  planASlot?: FormationSlot,
  planBSlot?: FormationSlot,
): { x: number; y: number } {
  const positions = [baseSlot];
  if (planASlot) positions.push(planASlot);
  if (planBSlot) positions.push(planBSlot);

  const avgX = positions.reduce((sum, s) => sum + s.x, 0) / positions.length;
  const avgY = positions.reduce((sum, s) => sum + s.y, 0) / positions.length;

  return { x: avgX, y: avgY };
}
```

### 2. Modificar TacticalPitch

Agregar prop `useCombinedPositions?: boolean`

Cuando `useCombinedPositions` es true:

- Calcular posición promedio de cada slot entre base/planA/planB
- Aplicar esa posición en lugar de slot.x/slot.y
- La transición CSS ya existente manejará la animación suave

### 3. Estado en PlanningModule

```typescript
const [showCombinedView, setShowCombinedView] = useState(false);
```

Cuando `combinedView` está activo:

- Mostrar solo UN TacticalPitch con posiciones combinadas
- Ocultar los pitches individuales (Base, Plan A, Plan B)
- El pitch combinado debe mostrar:
  - Jugadores en posición promedio
  - Instrucciones individuales del plan Base (por defecto)
  - Instrucciones de equipo del plan Base
  - **NO** aplicar estrategias (o tal vez mostrar todas activas?)

### 4. Flujo de Usuario

1. Usuario crea Plan Base, Plan A, Plan B con formaciones diferentes
2. Usuario activa checkbox "Vista Combinada"
3. Se ocultan los 3 pitches individuales
4. Se muestra UN solo pitch con posiciones promediadas
5. Los jugadores se animan desde su última posición hacia la posición combinada (transición CSS)

## Consideraciones de Diseño

### ¿Qué mostrar en Vista Combinada?

- **Posiciones**: Promedio matemático ✅
- **Roles**: ¿Mostrar rol del Base, o "MIXTO"? → Mostrar rol de Base
- **Flechas de movimiento**: Solo del Base
- **Actitud defensiva**: Solo del Base
- **Estrategias activas**: NO mostrar (o mostrar pero sin efecto?)
- **Instrucciones de equipo**: Del Base

### Identificación de Slots entre Planes

Los slots tienen `slotId` único. Para calcular promedio:

1. Iterar sobre `basePlan.slots`
2. Para cada slot, buscar mismo `slotId` en `planA.slots` y `planB.slots`
3. Promediar posiciones X e Y
4. Mantener el `playerId` y otras propiedades del slot Base

### Edge Cases

- **Plan A o B no existe**: Solo promediar con los que existen
- **Jugador diferente en cada plan**: Mostrar el del Base (el playerId está en el slot)
- **Formaciones muy diferentes**: Las posiciones se verán raras pero funcionará (feature, not bug)

## Implementación por Pasos

### Paso 1: Crear función de cálculo

```typescript
// En apps/ui/src/utils/tacticsHelpers.ts (crear si no existe)
export function calculateCombinedSlots(
  baseSlots: FormationSlot[],
  planASlots?: FormationSlot[],
  planBSlots?: FormationSlot[],
): FormationSlot[] {
  return baseSlots.map((baseSlot) => {
    const planASlot = planASlots?.find((s) => s.slotId === baseSlot.slotId);
    const planBSlot = planBSlots?.find((s) => s.slotId === baseSlot.slotId);

    const positions = [{ x: baseSlot.x, y: baseSlot.y }];
    if (planASlot) positions.push({ x: planASlot.x, y: planASlot.y });
    if (planBSlot) positions.push({ x: planBSlot.x, y: planBSlot.y });

    const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
    const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;

    return {
      ...baseSlot,
      x: Math.round(avgX * 10) / 10, // Round to 1 decimal
      y: Math.round(avgY * 10) / 10,
    };
  });
}
```

### Paso 2: Modificar PlanningModule

```typescript
// Calcular slots combinados cuando combinedView está activo
const combinedSlots = useMemo(() => {
  if (!currentTactic || !combinedView) return null;
  return calculateCombinedSlots(
    currentTactic.basePlan.slots,
    currentTactic.planA?.slots,
    currentTactic.planB?.slots
  );
}, [currentTactic, combinedView]);

// En el render:
{combinedView && combinedSlots ? (
  <TacticalPitch
    slots={combinedSlots}
    players={players}
    planLabel="Vista Combinada (Promedio)"
    // ... resto de props del Base
  />
) : (
  <>
    {/* Los 3 pitches normales */}
  </>
)}
```

### Paso 3: Mejorar visualmente

- Agregar indicador visual en la Vista Combinada (borde diferente, label especial)
- Tal vez mostrar "fantasmas" de las posiciones originales?
- Agregar tooltip explicando que es el promedio

### Paso 4: Testing

- Crear 3 planes con formaciones muy diferentes (ej: 4-4-2, 3-5-2, 5-3-2)
- Verificar que las posiciones promedio sean razonables
- Verificar que la transición sea suave al activar/desactivar
- Verificar edge case: solo Base existe (debe mostrar Base normal)

## Preguntas para el Usuario

1. ¿Debe mostrar estrategias activas en Vista Combinada? (recomiendo NO)
2. ¿Roles mixtos o solo mostrar rol del Base?
3. ¿Mostrar fantasmas/indicadores de las posiciones originales?
4. ¿Permitir drag & drop en Vista Combinada o solo lectura?

## Estimación de Complejidad

- **Simple**: 30 minutos (solo cálculo promedio y mostrar)
- **Completo**: 1-2 horas (con indicadores visuales, fantasmas, polish)

## Beneficio

Permite al usuario visualizar rápidamente qué tan "móvil" es cada jugador entre planes, y encontrar la "posición central" de su sistema táctico.
