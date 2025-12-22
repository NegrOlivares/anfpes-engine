# 📊 Diseño de Profundidad de Plantilla

## Vista General

La vista de profundidad de plantilla muestra hasta 5 jugadores por posición en una disposición vertical apilada.

## Diseño Visual - Opción A (Expandida Vertical)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VISTA PROFUNDIDAD DE PLANTILLA - 4-4-2                   │
│                                                                              │
│  [← Volver a Táctica]  Formación: 4-4-2 ▼   [💾 Guardar Profundidad]       │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────── CAMPO DE JUEGO ──────────────────────────────────┐
│                                                                              │
│                         🥅 PORTERÍA RIVAL                                    │
│                                                                              │
│                                                                              │
│         EI                    DC₁                 DC₂                ED      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  │ Neymar   [EI] 87 │  │ Piqué    [DC] 89 │  │ Ramos    [DC] 88 │  │ Messi    [ED] 90 │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│  │ Hazard   [EI] 84 │  │ Varane   [DC] 86 │  │ Chiellini[DC] 85 │  │ Salah    [ED] 86 │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│  │ Sané     [EI] 82 │  │ + Agregar        │  │ + Agregar        │  │ Bale     [ED] 83 │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│  │ + Agregar        │  │ + Agregar        │  │ + Agregar        │  │ + Agregar        │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│  │ + Agregar        │  │ + Agregar        │  │ + Agregar        │  │ + Agregar        │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
│                                                                              │
│                                                                              │
│         MI                    MC₁                 MC₂                MD      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  │ Iniesta  [MI] 85 │  │ Modric   [MC] 88 │  │ Kroos    [MC] 87 │  │ De Bruyne[MD] 89 │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│  │ Coutinho [MI] 82 │  │ Vidal    [MC] 85 │  │ Pogba    [MC] 84 │  │ Özil     [MD] 83 │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│  │ + Agregar        │  │ Thiago   [MC] 83 │  │ + Agregar        │  │ + Agregar        │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│  │ + Agregar        │  │ + Agregar        │  │ + Agregar        │  │ + Agregar        │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│  │ + Agregar        │  │ + Agregar        │  │ + Agregar        │  │ + Agregar        │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
│                                                                              │
│                                                                              │
│         LI                    CT₁                 CT₂                LD      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  │ Marcelo  [LI] 84 │  │ Van Dijk [CT] 89 │  │ Bonucci  [CT] 86 │  │ Carvajal [LD] 85 │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│  │ Alba     [LI] 83 │  │ Hummels  [CT] 85 │  │ Godín    [CT] 84 │  │ Alves    [LD] 82 │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│  │ + Agregar        │  │ Lenglet  [CT] 82 │  │ Koulibaly[CT] 83 │  │ + Agregar        │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│  │ + Agregar        │  │ + Agregar        │  │ + Agregar        │  │ + Agregar        │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│  │ + Agregar        │  │ + Agregar        │  │ + Agregar        │  │ + Agregar        │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
│                                                                              │
│                                                                              │
│                                    PT                                        │
│                          ┌──────────────────┐                               │
│                          │ Neuer    [PT] 89 │                               │
│                          ├──────────────────┤                               │
│                          │ Oblak    [PT] 86 │                               │
│                          ├──────────────────┤                               │
│                          │ + Agregar        │                               │
│                          ├──────────────────┤                               │
│                          │ + Agregar        │                               │
│                          ├──────────────────┤                               │
│                          │ + Agregar        │                               │
│                          └──────────────────┘                               │
│                                                                              │
│                         🥅 MI PORTERÍA                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Tamaño de Cada Tarjeta de Jugador

### Versión Ultra Compacta (Implementada)

```
┌─────────────────────────────────────────┐
│  Cristiano Ronaldo    [DC]  89          │  ← Nombre | Badge Posición | Promedio
└─────────────────────────────────────────┘
   Altura: ~32px
   Ancho: 100% del contenedor

   Layout horizontal:
   - Nombre: flex-grow (máx 150px, truncate)
   - Badge: tamaño fijo (~40px)
   - Promedio: tamaño fijo (~35px)
```

### Estructura HTML/CSS

```tsx
<div className="depth-slot">
  <span className="player-name">Cristiano Ronaldo</span>
  <span className="position-badge">DC</span>
  <span className="position-avg">89</span>
</div>
```

### Detalles del Diseño

**Profundidad 1 (Titular)**

- Borde izquierdo: 3px sólido #4CAF50
- Fondo: rgba(76, 175, 80, 0.12)
- Nombre: font-weight: 600
- Badge: background #4CAF50, color white
- Promedio: font-weight: bold, color según valor

**Profundidad 2-3 (Suplentes importantes)**

- Borde izquierdo: 2px sólido #2196F3
- Fondo: rgba(33, 150, 243, 0.08)
- Nombre: font-weight: 500
- Badge: background #2196F3, color white
- Promedio: font-weight: 600, color según valor

**Profundidad 4-5 (Reservas)**

- Borde izquierdo: 2px sólido #757575
- Fondo: rgba(255, 255, 255, 0.03)
- Nombre: font-weight: 400
- Badge: background #757575, color white
- Promedio: font-weight: 500, color según valor

**Slot Vacío (+ Agregar)**

- Borde: 1px punteado rgba(255, 255, 255, 0.2)
- Fondo: rgba(255, 255, 255, 0.02)
- Contenido: "+ Agregar jugador" centrado
- Cursor: pointer
- Hover: rgba(255, 255, 255, 0.08)

### CSS Detallado

```css
.depth-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  height: 32px;
  transition: all 0.2s ease;
}

.depth-slot:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.player-name {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.position-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: bold;
  min-width: 35px;
  text-align: center;
}

.position-avg {
  font-size: 14px;
  min-width: 30px;
  text-align: right;
}
```

## Interacciones

### Al Hacer Click en Slot Vacío

```
┌─────────────────────────────────────────┐
│  Seleccionar Jugador para DC (Opción 3) │
├─────────────────────────────────────────┤
│  🔍 Buscar...                            │
├─────────────────────────────────────────┤
│  Filtro: ▣ Solo DC   ▣ Polivalentes     │
├─────────────────────────────────────────┤
│  ┌────────────────────────────────────┐ │
│  │ Sergio Ramos    [DC]  89     ✓     │ │ ← ✓ = Ya titular en otra posición
│  ├────────────────────────────────────┤ │
│  │ Piqué           [DC]  88           │ │
│  ├────────────────────────────────────┤ │
│  │ Varane          [DC]  86     ②     │ │ ← ② = Ya es 2da opción en CT
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Estados de Hover

```
Normal:
┌──────────────────────────────────┐
│ Cristiano Ronaldo  [DC]  89      │
└──────────────────────────────────┘

Hover (con jugador):
┌──────────────────────────────────┐
│ Cristiano Ronaldo  [DC]  89  [×] │ ← Aparece botón eliminar
└──────────────────────────────────┘
  ^ Shift 2px a la derecha + sombra

Hover (slot vacío):
┌──────────────────────────────────┐
│    + Agregar jugador aquí        │
└──────────────────────────────────┘
  ^ Fondo más claro, cursor pointer
```

### Indicadores de Estado

- ⭐ = Titular en esta posición (badge background verde brillante)
- ② ③ ④ ⑤ = Suplente en esta u otra posición (pequeño superíndice al lado del nombre)
- ✓ = Ya es titular en otra posición (color amarillo)
- 🚫 = No puede ser asignado (gris, no clicable)

## Espaciado y Distancias

```
Vertical entre profundidades:  4px (más compacto)
Vertical entre posiciones:     24px
Horizontal entre posiciones:   16px

Altura total por posición (5 slots):
  - 5 tarjetas × 32px = 160px
  - 4 gaps × 4px = 16px
  - Total: ~176px (mucho más compacto que antes)

Ancho por columna de posición:
  - Mínimo: 180px
  - Recomendado: 200px
  - Las tarjetas se adaptan al 100% del contenedor

Layout del campo:
  - 4 posiciones por línea (Delantera, Medio, Defensa)
  - 1 posición centrada (Portero)
  - Ancho total: ~880px (flexible con grid)
  - Altura total: ~900px (4 líneas × 176px + espaciado)
```

## Scroll y Navegación

```
┌──────────────────────────────────────────────────────────────┐
│  ▲ Scroll hacia arriba (Delanteros)                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Zona visible del campo - ~800px altura]                    │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  ▼ Scroll hacia abajo (Defensas/Portero)                     │
└──────────────────────────────────────────────────────────────┘
```

## Panel Lateral de Estadísticas

```
┌─────────────────────────────────────┐
│  📊 Análisis de Profundidad          │
├─────────────────────────────────────┤
│  COBERTURA POR LÍNEA:                │
│                                      │
│  Delantera:     ████████░░ 80%       │
│  Mediocampo:    ██████████ 100%      │
│  Defensa:       ███████░░░ 70%       │
│  Portería:      ████░░░░░░ 40%       │
├─────────────────────────────────────┤
│  ⚠️ POSICIONES DÉBILES:              │
│  • PT: Solo 2 opciones               │
│  • LD: Solo 2 opciones               │
├─────────────────────────────────────┤
│  💡 RECOMENDACIONES:                 │
│  • Buscar portero suplente           │
│  • Considerar lateral derecho joven  │
└─────────────────────────────────────┘
```

## Reglas de Validación Visual

### ✅ Válido

- Los 11 titulares son jugadores diferentes
- Un jugador puede estar en múltiples posiciones con diferentes profundidades
- Ejemplo: Ramos es titular (1) en CT y suplente (3) en LI

### ❌ Inválido (Mostrar Error)

```
┌─────────────────────────────────────┐
│  ⚠️ Error de Profundidad             │
│                                      │
│  No puedes asignar a Sergio Ramos   │
│  como titular (1) y suplente (3)    │
│  en la misma posición (CT).         │
│                                      │
│  [Entendido]                         │
└─────────────────────────────────────┘
```

## Drag & Drop

### Desde Roster Panel

- Arrastrar jugador → Soltar en slot vacío (+)
- Si el slot ya tiene jugador → Intercambiar posiciones

### Entre Slots de la Misma Posición

- Arrastrar de profundidad 3 a profundidad 2
- Automáticamente intercambia posiciones

### Entre Posiciones Diferentes

- Arrastrar de CT₂ a LI₃
- Si el jugador puede jugar ambas posiciones → Permitir
- Si no → Mostrar mensaje "Este jugador no puede jugar en LI"

## Modo Responsive

### Desktop (>1200px)

- 4 columnas por línea
- Todas las posiciones visibles

### Tablet (768px - 1200px)

- 3 columnas por línea
- Scroll horizontal por línea

### Mobile (<768px)

- 2 columnas por línea
- Scroll horizontal por línea
- Tarjetas más pequeñas (60px ancho)

## Botones de Acción

```
┌─────────────────────────────────────────────────────────────┐
│  [← Volver a Táctica]  [💾 Guardar]  [🔄 Resetear]           │
└─────────────────────────────────────────────────────────────┘
```

**Guardar**: Almacena la configuración de profundidad en la táctica
**Resetear**: Limpia todas las profundidades 2-5 (mantiene titulares)
**Volver**: Regresa a la vista de táctica normal

---

## Implementación Técnica Sugerida

### Estructura de Datos

```typescript
interface DepthChartSlot {
  positionId: string; // "CF_1", "CT_1", etc.
  role: string; // "DC", "CT", "MC", etc.
  depth: 1 | 2 | 3 | 4 | 5;
  playerId: string | null;
}

interface DepthChart {
  formation: string;
  slots: DepthChartSlot[];
}
```

### Validación

```typescript
function validateDepthChart(chart: DepthChart): ValidationResult {
  // 1. Los 11 titulares (depth: 1) deben ser únicos
  const starters = chart.slots.filter((s) => s.depth === 1 && s.playerId);
  const starterIds = starters.map((s) => s.playerId);
  const uniqueStarters = new Set(starterIds);

  if (uniqueStarters.size !== starterIds.length) {
    return { valid: false, error: 'Titulares duplicados' };
  }

  // 2. Un jugador no puede repetirse en la misma posición
  const byPosition = groupBy(chart.slots, (s) => s.positionId);
  for (const [pos, slots] of Object.entries(byPosition)) {
    const playerIds = slots.filter((s) => s.playerId).map((s) => s.playerId);
    const unique = new Set(playerIds);

    if (unique.size !== playerIds.length) {
      return {
        valid: false,
        error: `Jugador duplicado en posición ${pos}`,
      };
    }
  }

  return { valid: true };
}
```

---

¿Te gusta este diseño? ¿Quieres que proceda con la implementación o prefieres ajustar algo visualmente?
