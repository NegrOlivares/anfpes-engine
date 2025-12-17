# Análisis del Glosario - Comparativa Excel vs UI Actual

**Fecha de Análisis:** 2024
**Fuente Legacy:** `data/raw/Glosario.xlsx` (90 términos)
**Fuente UI Actual:** `apps/ui/src/utils/playerDisplay.ts` (FIELD_LABEL_OVERRIDES)

---

## 📊 RESUMEN EJECUTIVO

### Términos en el Glosario Excel Original

- **Total:** 90 términos
- **Stats Básicos:** 31 términos (ítems 1-31)
- **Habilidades Especiales (★):** 24 términos (ítems 32-54)
- **Stats Derivados/Modernos:** 11 términos (ítems 55-65)
- **Abreviaturas de Stats:** 7 términos (ítems 66-72)
- **Posiciones:** 17 términos (ítems 73-88)
- **Otros:** 2 términos (ítems 89-90)

### Cambios de Nombres en la UI Actual

La UI actual ha renombrado varios términos para mayor claridad. Ver mapping completo en `FIELD_LABEL_OVERRIDES`.

---

## ✅ TÉRMINOS LEGACY CON EQUIVALENTE EN UI

### Stats Básicos

| #   | Término Excel         | Nombre en UI Actual       | Estado                              |
| --- | --------------------- | ------------------------- | ----------------------------------- |
| 1   | ATAQUE                | Ataque                    | ✅ Sin cambio                       |
| 2   | DEFENSA               | Defensa                   | ✅ Sin cambio                       |
| 3   | ESTABILIDAD           | Estabilidad               | ✅ Sin cambio                       |
| 4   | RESISTENCIA           | Resistencia               | ✅ Sin cambio                       |
| 5   | VELOCIDAD MÁXIMA      | Velocidad Máxima          | ✅ Mapeado en FIELD_LABEL_OVERRIDES |
| 6   | ACELERACIÓN           | Aceleración               | ✅ Mapeado                          |
| 7   | REPUESTA              | Respuesta                 | ✅ Mapeado como "Respuesta"         |
| 8   | AGILIDAD              | Agilidad                  | ✅ Sin cambio                       |
| 9   | PRECISIÓN DRIBBLE     | Precisión de Conducción   | ✅ Renombrado                       |
| 10  | VELOCIDAD DRIBBLE     | Velocidad de Conducción   | ✅ Renombrado                       |
| 11  | PRECISIÓN PASE CORTO  | Precisión de Pase Corto   | ✅ Renombrado                       |
| 12  | VELOCIDAD PASE CORTO  | Velocidad de Pase Corto   | ✅ Renombrado                       |
| 13  | PRECISIÓN PASE LARGO  | Precisión de Pase Largo   | ✅ Renombrado                       |
| 14  | VELOCIDAD PASE LARGO  | Velocidad de Pase Largo   | ✅ Renombrado                       |
| 15  | PRECISIÓN DISPARO     | Precisión de Disparo      | ✅ Mapeado                          |
| 16  | POTENCIA DISPARO      | Potencia de Disparo       | ✅ Mapeado                          |
| 17  | TÉCNICA DISPARO       | Técnica de Disparo        | ✅ Mapeado                          |
| 18  | PRECISIÓN TIRO LIBRE  | Precisión Tiro Libre      | ✅ Mapeado                          |
| 19  | EFECTO                | Efecto                    | ✅ Sin cambio                       |
| 20  | CABEZAZO              | Cabezazo                  | ✅ Sin cambio                       |
| 21  | SALTO                 | Salto                     | ✅ Sin cambio                       |
| 22  | TÉCNICA               | Técnica                   | ✅ Sin cambio                       |
| 23  | AGRESIVIDAD           | Agresividad               | ✅ Sin cambio                       |
| 24  | MENTALIDAD            | Mentalidad                | ✅ Sin cambio                       |
| 25  | ARQUERO               | Cualidades de Portero     | ✅ Renombrado                       |
| 26  | TRABAJO EN EQUIPO     | Trabajo en Equipo         | ✅ Mapeado                          |
| 27  | TOLERANCIA A LESIONES | Tolerancia a las Lesiones | ✅ Mapeado                          |
| 28  | CONSISTENCIA          | Consistencia              | ✅ Sin cambio                       |
| 29  | CONDICIÓN             | (ver CONDICIÓN FITNESS)   | ✅ Mapeado como "Condición Física"  |
| 30  | PRECISIÓN PIE MALO    | Precisión de Pie Torpe    | ✅ Renombrado                       |
| 31  | FRECUENCIA PIE MALO   | Frecuencia de Pie Torpe   | ✅ Renombrado                       |

### Habilidades Especiales (★)

| #   | Término Excel          | Nombre en UI Actual        | Estado                                             |
| --- | ---------------------- | -------------------------- | -------------------------------------------------- |
| 32  | ★ REGATE               | Regate                     | ✅ En SPECIAL_SKILL_FIELDS                         |
| 33  | ★ HABILIDAD DE REGATE  | Habilidad de Regate        | ✅ Mapeado como "Habilidad de Regate" (HAB REGATE) |
| 34  | ★ BUSCAR ESPACIOS      | Posicionamiento            | ✅ Mapeado como POSICION                           |
| 35  | ★ REACCIÓN             | Reacción                   | ✅ En SPECIAL_SKILL_FIELDS                         |
| 36  | ★ PLAYMAKING           | Capacidad de Mando         | ✅ Mapeado como CAP MANDO                          |
| 37  | ★ PASES                | Pases                      | ✅ En SPECIAL_SKILL_FIELDS                         |
| 38  | ★ GOLEADOR             | Goleador                   | ✅ En SPECIAL_SKILL_FIELDS                         |
| 39  | ★ EXPERTO EN 1 V 1     | Definición Uno contra Uno  | ✅ Mapeado como 1-1 GOL                            |
| 40  | ★ JUGADOR POSTE        | Jugador Poste              | ✅ Mapeado como JUG POSTE                          |
| 41  | ★ EVADIR EL OFFSIDE    | Evadir Offside             | ✅ Mapeado como NO OFFSIDE                         |
| 42  | ★ DISPAROS MEDIOS      | Disparo de Media Distancia | ✅ Mapeado como MID SHOOT                          |
| 43  | ★ LADO                 | Lado                       | ✅ En SPECIAL_SKILL_FIELDS                         |
| 44  | ★ CENTRO               | Centro                     | ✅ En SPECIAL_SKILL_FIELDS                         |
| 45  | ★ PENALES              | Pateador de Penales        | ✅ Mapeado                                         |
| 46  | ★ JUEGO A 1 TOQUE      | Pase a Un Toque            | ✅ Mapeado como PASE 1 TOQ                         |
| 47  | ★ EXTERIOR DEL PIE     | Exterior                   | ✅ En SPECIAL_SKILL_FIELDS                         |
| 48  | ★ MARCA AL HOMBRE      | Marcaje al Hombre          | ✅ Mapeado como MARCA MAN                          |
| 49  | ★ ENTRADAS DESLIZANTES | Entradas                   | ✅ En SPECIAL_SKILL_FIELDS                         |
| 50  | ★ COBERTURA            | Cobertura                  | ✅ En SPECIAL_SKILL_FIELDS                         |
| 51  | ★ PROVOCAR OFFSIDE     | Trampa del Offside         | ✅ Mapeado como SI OFFSIDE                         |
| 52  | ★ ATAJA PENALES        | Ataja Penales              | ✅ Mapeado como PARAPENAL                          |
| 53  | ★ ACHIQUE 1 V 1        | Achique Uno contra Uno     | ✅ Mapeado como ACHIQUE 1-1                        |
| 54  | ★ SAQUE DE BANDA LARGO | Saque de Banda Largo       | ✅ Mapeado como SAQUE LARG                         |

### Stats Derivados/Modernos

| #   | Término Excel         | Estado en UI                                     |
| --- | --------------------- | ------------------------------------------------ |
| 55  | DESTREZA ATAQUE       | ⚠️ No encontrado en UI                           |
| 56  | FINIQUITO             | ⚠️ No encontrado en UI                           |
| 57  | VELOCIDAD             | ✅ Mapeado como "Rapidez"                        |
| 58  | EXPLOSIVIDAD          | ⚠️ No encontrado en UI                           |
| 59  | AGILIDADES            | ⚠️ No encontrado en UI                           |
| 60  | POTENCIA DE PATADA    | ⚠️ No encontrado en UI                           |
| 61  | DESTREZA DEFENSA      | ⚠️ No encontrado en UI                           |
| 62  | RECUPERACIÓN DE BALÓN | ✅ Mapeado como "Recuperación de Balón"          |
| 63  | ATLETISMO             | ✅ Mapeado como "Atletismo" (ALETISMO en código) |
| 64  | CREATIVIDAD           | ⚠️ No encontrado en UI                           |
| 65  | HC                    | ⚠️ No encontrado en UI                           |

### Abreviaturas de Stats

| #   | Término Excel | Estado en UI                                |
| --- | ------------- | ------------------------------------------- |
| 66  | ATK           | ✅ En FIELD_LABEL_OVERRIDES                 |
| 67  | TEC           | ✅ En FIELD_LABEL_OVERRIDES                 |
| 68  | RES           | ✅ En FIELD_LABEL_OVERRIDES                 |
| 69  | DEF           | ✅ En FIELD_LABEL_OVERRIDES                 |
| 70  | FUE           | ✅ En FIELD_LABEL_OVERRIDES                 |
| 71  | VEL           | ✅ En FIELD_LABEL_OVERRIDES                 |
| 72  | GK            | ⚠️ No encontrado (probablemente es ARQUERO) |

### Posiciones

| #   | Término Excel | Estado en UI                       |
| --- | ------------- | ---------------------------------- |
| 73  | SWP           | ⚠️ Excluido en EXCLUDED_FIELDS     |
| 74  | CB            | ⚠️ Excluido (CBT, CWP en excluded) |
| 75  | SB            | ⚠️ Excluido en EXCLUDED_FIELDS     |
| 76  | RB            | ⚠️ Excluido en EXCLUDED_FIELDS     |
| 77  | LB            | ⚠️ Excluido en EXCLUDED_FIELDS     |
| 78  | DMF           | ⚠️ Excluido en EXCLUDED_FIELDS     |
| 79  | CMF           | ⚠️ Excluido en EXCLUDED_FIELDS     |
| 80  | SMF           | ⚠️ Excluido en EXCLUDED_FIELDS     |
| 81  | RMF           | ⚠️ Excluido en EXCLUDED_FIELDS     |
| 82  | LMF           | ⚠️ Excluido en EXCLUDED_FIELDS     |
| 83  | AMF           | ⚠️ Excluido en EXCLUDED_FIELDS     |
| 84  | SS            | ⚠️ Excluido en EXCLUDED_FIELDS     |
| 85  | WF            | ⚠️ Excluido en EXCLUDED_FIELDS     |
| 86  | RWF           | ⚠️ Excluido en EXCLUDED_FIELDS     |
| 87  | LWF           | ⚠️ Excluido en EXCLUDED_FIELDS     |
| 88  | CF            | ⚠️ Excluido en EXCLUDED_FIELDS     |

### Otros

| #   | Término Excel      | Estado en UI                                 |
| --- | ------------------ | -------------------------------------------- |
| 89  | Leyenda            | ✅ Usado en sistema de imágenes (Legend.png) |
| 90  | Master League (ML) | ✅ Referenciado en ML.txt                    |

---

## 🆕 TÉRMINOS NUEVOS EN UI (No en Glosario Excel)

### Campos de Información del Jugador

- **NACIONALIDAD** → "País"
- **DORSAL** → "Número Dorsal"
- **SKIN COLOR** → "Tono de Piel"
- **nro selección** → "Seleccionado Nacional"
- **nro clasico** → "Selección Clásica"
- **FAVOURED SIDE** → "Lado Preferido"
- **POSICIONES** → "Posiciones"
- **PIE** → "Pie Hábil"

### Stats Promedio de Posición

- **PROMEDIO** → "Promedio Principal"
- **PT** → "Promedio PT" (Portero)
- **LIB** → "Promedio LIB" (Líbero)
- **CT** → "Promedio CT" (Central)
- **SA** → "Promedio SA" (Lateral)
- **LA** → "Promedio LA" (Lateral Avanzado)
- **CCD** → "Promedio CCD" (Contención Defensiva)
- **CC** → "Promedio CC" (Contención)
- **VOL** → "Promedio VOL" (Volante)
- **MP** → "Promedio MP" (Mediapunta)
- **EX** → "Promedio EX" (Extremo)
- **SD** → "Promedio SD" (Segundo Delantero)
- **DC** → "Promedio DC" (Delantero Centro)

### Otras Entradas

- **JUEGO AEREO** → "Juego Aéreo" (derivado de stats)

---

## ❌ TÉRMINOS OBSOLETOS O PROBLEMÁTICOS

### Stats Derivados/Modernos sin Evidencia en UI

Estos términos aparecen en el glosario Excel pero no están presentes en el código de la UI actual:

1. **DESTREZA ATAQUE** (item 55)
2. **FINIQUITO** (item 56)
3. **EXPLOSIVIDAD** (item 58)
4. **AGILIDADES** (item 59)
5. **POTENCIA DE PATADA** (item 60)
6. **DESTREZA DEFENSA** (item 61)
7. **CREATIVIDAD** (item 64)
8. **HC** (item 65)
9. **GK** (item 72) - posiblemente reemplazado por "ARQUERO"

**Nota:** Estos términos pueden ser:

- Campos calculados del Excel que no se exponen en la UI
- Términos legacy que fueron removidos
- Campos internos no visibles al usuario

### Posiciones Excluidas de UI

Las abreviaturas de posiciones (ítems 73-88) están deliberadamente excluidas de la vista de usuario según `EXCLUDED_FIELDS`. La UI prefiere mostrar `POSICIONES` (campo de texto) en lugar de columnas booleanas individuales.

---

## 🎯 RECOMENDACIONES PARA GLOSARIO MODERNIZADO

### 1. Estructura Propuesta

```
GLOSARIO MODERNIZADO
├── 📊 STATS PRINCIPALES (31 términos)
│   ├── Físicos (8): Velocidad, Aceleración, Agilidad, etc.
│   ├── Técnicos (10): Pases, Regate, Disparo, etc.
│   ├── Mentales (4): Ataque, Defensa, Mentalidad, etc.
│   ├── Especiales (6): Arquero, Resistencia, etc.
│   └── Pie y Consistencia (3)
│
├── ⭐ HABILIDADES ESPECIALES (24 términos)
│   ├── Ofensivas (10): Goleador, Regate, 1v1, etc.
│   ├── Defensivas (7): Marca al Hombre, Cobertura, etc.
│   └── Especializadas (7): Penales, Centro, Saque Largo, etc.
│
├── 📈 STATS DERIVADOS (13 términos)
│   ├── Promedios por Posición (13): PT, LIB, CT, SA, etc.
│   └── Otros Calculados: Juego Aéreo, Recuperación de Balón
│
├── 🔤 ABREVIATURAS (7 términos)
│   └── ATK, TEC, RES, DEF, FUE, VEL, GK
│
├── 🎮 POSICIONES (17 términos)
│   ├── Defensivas (5): SWP, CB, SB, RB, LB
│   ├── Medios (8): DMF, CMF, SMF, RMF, LMF, AMF
│   └── Ofensivas (4): SS, WF, RWF, LWF, CF
│
└── ℹ️ INFORMACIÓN GENERAL (8 términos)
    ├── Básicos: Nacionalidad, Dorsal, Posiciones
    ├── Físicos: Tono de Piel, Altura, Peso
    └── Especiales: Leyenda, Master League
```

### 2. Acciones Inmediatas

#### ✅ Mantener del Glosario Original

- Definiciones de los 31 stats principales (ítems 1-31)
- Definiciones de las 24 habilidades especiales (ítems 32-54)
- Abreviaturas de stats (ítems 66-71)
- Posiciones (ítems 73-88) con nota de que no se muestran individualmente en UI

#### 🔄 Actualizar Nombres

Aplicar todos los cambios de `FIELD_LABEL_OVERRIDES`:

- "PRECISIÓN DRIBBLE" → "Precisión de Conducción"
- "VELOCIDAD DRIBBLE" → "Velocidad de Conducción"
- "ARQUERO" → "Cualidades de Portero"
- "REPUESTA" → "Respuesta"
- Etc. (ver tabla completa arriba)

#### ➕ Agregar Nuevos Términos

- **13 Promedios por Posición:** PT, LIB, CT, SA, LA, CCD, CC, VOL, MP, EX, SD, DC, PROMEDIO
- **8 Campos de Información:** País, Número Dorsal, Tono de Piel, Lado Preferido, Pie Hábil, Posiciones, Seleccionado Nacional, Selección Clásica
- **1 Stat Derivado:** Juego Aéreo

#### 🗑️ Marcar como Obsoletos (o Aclarar)

Agregar sección "TÉRMINOS LEGACY" para:

- DESTREZA ATAQUE
- FINIQUITO
- EXPLOSIVIDAD
- AGILIDADES
- POTENCIA DE PATADA
- DESTREZA DEFENSA
- CREATIVIDAD
- HC

Con nota: _"Estos términos pertenecen a versiones anteriores del sistema y ya no se utilizan en la interfaz actual."_

### 3. Formato de Implementación

Dos enfoques posibles:

#### Opción A: Tooltips + Modal

```typescript
// glossary.ts
export const GLOSSARY = {
  'Precisión de Conducción': {
    legacyName: 'PRECISIÓN DRIBBLE',
    category: 'Técnica',
    definition: 'Capacidad del jugador de llevar el balón pegado al pie...',
    icon: '⚽',
    relatedStats: ['Velocidad de Conducción', 'Agilidad'],
  },
  // ... más términos
};
```

#### Opción B: Componente Dedicado

```tsx
// GlossaryModal.tsx
<GlossaryModal>
  <CategoryGroup name="Stats Principales">
    <GlossaryTerm
      term="Precisión de Conducción"
      legacy="PRECISIÓN DRIBBLE"
      definition="..."
    />
  </CategoryGroup>
</GlossaryModal>
```

### 4. Integraciones en UI

1. **Icono de ayuda (?) al lado de cada stat** en PlayerProfile
2. **Tooltip on hover** con definición corta
3. **Click para más detalles** abre modal con definición completa + stats relacionados
4. **Botón "Glosario Completo"** en header o settings
5. **Búsqueda dentro del glosario** para encontrar términos rápidamente

---

## 📝 NOTAS TÉCNICAS

### Inconsistencias Detectadas

1. **REPUESTA vs RESPUESTA**: El Excel usa "REPUESTA" (error ortográfico), la UI lo corrige a "Respuesta"
2. **ALETISMO vs ATLETISMO**: Typo en el código (playerDisplay.ts línea 38)
3. **Posiciones Variables**: El Excel usa columnas individuales (RB, LB, etc.), la UI usa campo de texto "POSICIONES"

### Fuentes de Datos

- **Glosario Excel:** `C:\Users\usuario\Desktop\anfpes-engine\data\raw\Glosario.xlsx`
- **Mapeos UI:** `C:\Users\usuario\Desktop\anfpes-engine\apps\ui\src\utils\playerDisplay.ts`
- **Stats Excluidos:** Ver `EXCLUDED_FIELDS` en playerDisplay.ts
- **Habilidades Especiales:** Ver `SPECIAL_SKILL_FIELDS` en playerDisplay.ts

---

## ✨ CONCLUSIÓN

El glosario Excel original contiene **90 términos** bien documentados que cubren la mayoría de los stats del sistema. Sin embargo:

- ✅ **82% de términos vigentes** (74/90) tienen equivalente directo o están mapeados en la UI actual
- ⚠️ **9 términos obsoletos** (10%) no se encuentran en el código actual
- 🆕 **22 nuevos términos** en la UI actual no están documentados en el glosario Excel

**Próximo Paso Sugerido:** Crear archivo `glossary.ts` consolidado con estructura moderna, definiciones del Excel original actualizadas + nuevos términos, y componente de UI para visualización.
