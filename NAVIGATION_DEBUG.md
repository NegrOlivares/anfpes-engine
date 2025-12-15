# ANÁLISIS DE NAVEGACIÓN - DEBUG

## Escenario: Usuario navega de Search → Profile (Nesta) → Profile (Hierro)

### Estado Inicial

```
activeModuleId: 'search'
history: []
currentIndex: -1
```

---

### PASO 1: Usuario hace clic en "Abrir Perfil" de Nesta desde Search

**Código ejecutado: `setActiveModuleId('profile', false)`**

1. `activeModuleId = 'search'` (actual)
2. `fromNavigation = false`
3. **Captura snapshot de 'search'**: `captureModuleSnapshot('search')` → `{}`
4. **Push al historial**: `push('search', {})`
   - `newHistory = [].slice(0, -1 + 1) = []`
   - `newHistory.push({moduleId: 'search', snapshot: {}})`
   - `newHistory = [{moduleId: 'search', snapshot: {}}]`
   - `newIndex = 0`
   - `currentIndex = 0`
5. `activeModuleId !== 'profile'` → cambia a `'profile'`

**Estado después:**

```
activeModuleId: 'profile'
history: [{moduleId: 'search', snapshot: {}}]
currentIndex: 0
```

**PROBLEMA DETECTADO**: Se guardó 'search' pero NO se guardó el perfil de Nesta que se acaba de abrir!

---

### PASO 2: Usuario hace clic en "Abrir Perfil" de Hierro desde Profile (Nesta)

**Código ejecutado: `setActiveModuleId('profile', false)`**

1. `activeModuleId = 'profile'` (actual)
2. `fromNavigation = false`
3. **Captura snapshot de 'profile'**: `captureModuleSnapshot('profile')` → `{selectedPlayerId: 'Nesta', formById: {...}}`
4. **Push al historial**: `push('profile', {selectedPlayerId: 'Nesta', ...})`
   - `newHistory = history.slice(0, 0 + 1) = [{moduleId: 'search', snapshot: {}}]`
   - `newHistory.push({moduleId: 'profile', snapshot: {selectedPlayerId: 'Nesta'}})`
   - `newHistory = [{moduleId: 'search', ...}, {moduleId: 'profile', snapshot: {Nesta}}]`
   - `newIndex = 1`
   - `currentIndex = 1`
5. `activeModuleId === 'profile'` → NO cambia módulo (pero ya se guardó en historial)

**Estado después:**

```
activeModuleId: 'profile' (mostrando Hierro, pero NO guardado)
history: [
  {moduleId: 'search', snapshot: {}},
  {moduleId: 'profile', snapshot: {selectedPlayerId: 'Nesta'}}
]
currentIndex: 1
```

**PROBLEMA DETECTADO**: El perfil de Hierro que estás viendo NO ESTÁ EN EL HISTORIAL!

---

### PASO 3: Usuario hace clic en botón "Atrás"

**Código ejecutado: `navigateBack()`**

1. `activeModuleId = 'profile'` (mostrando Hierro)
2. **Captura snapshot actual**: `captureModuleSnapshot('profile')` → `{selectedPlayerId: 'Hierro', ...}`
3. **updateCurrent**: `history[1] = {moduleId: 'profile', snapshot: {Hierro}}`
4. **goBack()**:
   - `currentIndex = 1`
   - `newIndex = 0`
   - Retorna `history[0] = {moduleId: 'search', snapshot: {}}`
5. **Restaura**: `restoreModuleSnapshot('search', {})`
6. `activeModuleId = 'search'`

**Estado después:**

```
activeModuleId: 'search'
history: [
  {moduleId: 'search', snapshot: {}},
  {moduleId: 'profile', snapshot: {selectedPlayerId: 'Hierro'}} ← ACTUALIZADO!
]
currentIndex: 0
```

**RESULTADO**: ✅ Vuelve a 'search' (correcto)
**PERO**: El perfil de Nesta se PERDIÓ, fue sobreescrito por Hierro en el paso 3.3

---

### PASO 4: Usuario hace clic en botón "Adelante"

**Código ejecutado: `navigateForward()`**

1. `activeModuleId = 'search'`
2. **Captura snapshot actual**: `captureModuleSnapshot('search')` → `{}`
3. **updateCurrent**: `history[0] = {moduleId: 'search', snapshot: {}}`
4. **goForward()**:
   - `currentIndex = 0`
   - `newIndex = 1`
   - Retorna `history[1] = {moduleId: 'profile', snapshot: {Hierro}}`
5. **Restaura**: `restoreModuleSnapshot('profile', {Hierro})`
6. `activeModuleId = 'profile'`

**Estado después:**

```
activeModuleId: 'profile' (mostrando Hierro)
history: [
  {moduleId: 'search', snapshot: {}},
  {moduleId: 'profile', snapshot: {selectedPlayerId: 'Hierro'}}
]
currentIndex: 1
```

**RESULTADO**: ✅ Vuelve a 'profile' con Hierro
**PERO**: Nunca podrás volver a ver Nesta, se perdió

---

## DIAGNÓSTICO DEL PROBLEMA

### Problema Raíz #1: Push ocurre ANTES del cambio de módulo

Cuando haces `setActiveModuleId('profile')`:

1. Se captura el snapshot del módulo ACTUAL (search/profile)
2. Se guarda en el historial
3. Se cambia de módulo

**Esto significa que el NUEVO estado no se guarda nunca!**

### Problema Raíz #2: updateCurrent en navegación sobreescribe entradas

Cuando navegas atrás desde Profile(Hierro):

1. Se captura Profile(Hierro)
2. Se actualiza `history[currentIndex]` que es Profile(Nesta)
3. ¡Profile(Nesta) desaparece!

---

## SOLUCIÓN CORRECTA

El historial debería verse así después de navegar Search → Profile(Nesta) → Profile(Hierro):

```
history: [
  {moduleId: 'search', snapshot: {}},
  {moduleId: 'profile', snapshot: {Nesta}},
  {moduleId: 'profile', snapshot: {Hierro}}  ← Actual
]
currentIndex: 2
```

Para lograr esto, necesitamos:

1. **NO hacer push en setActiveModuleId** - El push debe ocurrir DESPUÉS de que el nuevo estado esté configurado
2. **Agregar un método `captureAndPushCurrent()`** que capture el estado actual y lo agregue al historial
3. **Llamar ese método DESPUÉS de que el nuevo estado esté establecido**

### Implementación correcta:

```typescript
setActiveModuleId: (id, fromNavigation = false) => {
  const { activeModuleId } = get();

  // Si estamos navegando (back/forward), no tocar el historial
  if (fromNavigation) {
    if (activeModuleId !== id) {
      set({ activeModuleId: id });
    }
    return;
  }

  // Si el módulo cambió, solo cambiar
  if (activeModuleId !== id) {
    set({ activeModuleId: id });
  }

  // DESPUÉS de cambiar, el componente del módulo debe capturar su estado
  // cuando esté listo y llamar a un método para agregarlo al historial
},
```

Pero esto requiere que cada módulo llame manualmente a "pushCurrentState" cuando esté listo.

**ALTERNATIVA MEJOR**: Usar un efecto en App.tsx que detecte cambios en activeModuleId y capture el estado ANTERIOR antes del cambio.
