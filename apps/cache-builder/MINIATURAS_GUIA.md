# Guía de Miniaturas de Jugadores

## 📦 Sistema de miniaturas implementado

Este documento explica cómo funciona el sistema de miniaturas y cómo añadir nuevas imágenes.

---

## 🎯 Resumen del sistema

### Estructura de carpetas

```
apps/ui/public/images/
├── faces/          # Imágenes originales (~49 KB cada una)
│   ├── A-12345.png
│   ├── L-67890.png
│   └── ...
└── thumbs/         # Miniaturas (32×32px, ~1.4 KB cada una)
    ├── A-12345.png
    ├── L-67890.png
    └── ...
```

### Nombres de archivo

**IMPORTANTE**: Los nombres de archivo son **idénticos** en ambas carpetas.

- Si tienes `faces/A-12345.png`, la miniatura será `thumbs/A-12345.png`
- El nombre proviene de `profileAddons.ts` (campo `image`)

---

## 🚀 Cómo añadir nuevas imágenes

Cuando agregues una nueva face a la carpeta `faces/`, sigue estos pasos:

### Opción 1: Generar UNA miniatura específica

```powershell
cd apps/cache-builder
npx tsx src/addSingleThumbnail.ts A-12345.png
```

**Ejemplo real:**

```powershell
# Si acabas de agregar faces/A-2020123.png
npx tsx src/addSingleThumbnail.ts A-2020123.png
```

**Resultado:**

```
✅ Miniatura generada: A-2020123.png
```

---

### Opción 2: Sincronizar TODAS las faltantes (recomendado)

Si agregaste varias faces nuevas, es más fácil sincronizar todo:

```powershell
cd apps/cache-builder
npx tsx src/addSingleThumbnail.ts --sync
```

**Resultado:**

```
🔄 Sincronizando miniaturas faltantes...

📊 Miniaturas faltantes: 5

✅ Miniatura generada: A-2020123.png
✅ Miniatura generada: A-2020124.png
✅ Miniatura generada: L-500300.png
✅ Miniatura generada: A-2020125.png
✅ Miniatura generada: A-2020126.png

============================================================
✅ Sincronización completada!
============================================================
📊 Procesadas: 5 imágenes
❌ Errores: 0
============================================================
```

Este comando:

- ✅ Busca todas las faces que NO tienen miniatura
- ✅ Genera solo las faltantes
- ✅ No regenera las que ya existen
- ✅ Es seguro ejecutarlo cuantas veces quieras

---

## 📋 Flujo de trabajo completo

### 1. Agregar nueva face

Copia tu imagen PNG a la carpeta faces:

```
apps/ui/public/images/faces/A-NEW123.png
```

### 2. Actualizar profileAddons.ts

Agrega la entrada en el archivo de configuración:

```typescript
'12345': {
  image: '/images/faces/A-NEW123.png',
  fullName: 'Nombre Completo del Jugador',
  // ...
}
```

### 3. Generar miniatura

```powershell
cd apps/cache-builder
npx tsx src/addSingleThumbnail.ts A-NEW123.png
```

### 4. Verificar

La miniatura estará en:

```
apps/ui/public/images/thumbs/A-NEW123.png
```

¡Listo! La aplicación usará automáticamente la miniatura cuando renderice las tablas.

---

## 🔧 Comandos útiles

### Regenerar TODAS las miniaturas desde cero

```powershell
cd apps/cache-builder

# Eliminar carpeta thumbs
Remove-Item -Path "../ui/public/images/thumbs" -Recurse -Force

# Regenerar todas (toma ~10-12 minutos)
npx tsx src/generateThumbnails.ts
```

### Ver estadísticas de miniaturas

```powershell
# Contar miniaturas
(Get-ChildItem "apps/ui/public/images/thumbs" -Filter "*.png").Count

# Ver tamaño total
$thumbs = Get-ChildItem "apps/ui/public/images/thumbs" -Filter "*.png"
$totalSize = ($thumbs | Measure-Object -Property Length -Sum).Sum
Write-Host "Total: $([math]::Round($totalSize / 1MB, 2)) MB"
```

---

## 📊 Estadísticas actuales

**Estado actual del sistema:**

- ✅ **3,910 miniaturas** generadas
- 📦 **Tamaño promedio**: 1.41 KB por miniatura (vs 49 KB original)
- 📊 **Reducción**: 97% menos tamaño
- 💾 **Total**: 5.38 MB (vs ~187 MB de originales)
- ⚡ **Velocidad**: ~5.2 imágenes/segundo durante generación

---

## ❓ Preguntas frecuentes

### ¿Qué pasa si olvido generar la miniatura?

La aplicación mostrará la imagen original (más pesada). No habrá error, pero el rendimiento será menor.

### ¿Puedo usar miniaturas más grandes?

Sí, puedes cambiar `THUMB_SIZE = 32` en los scripts. Opciones comunes:

- `24`: Más pequeñas, ultra rápidas
- `32`: Balance ideal (actual) ✅
- `48`: Más detalle, pero más pesadas
- `64`: Imágenes más grandes, mejor calidad

### ¿Dónde se usan estas miniaturas?

Se usarán en las tablas de:

- Módulo de Búsqueda (50 filas por página)
- Módulo de Preselección
- Módulo de Similares (hasta 201 filas)

### ¿El script modifica las imágenes originales?

No. Las faces originales NO se tocan. Solo se generan copias en miniatura en la carpeta `thumbs/`.

---

## 🐛 Troubleshooting

### Error: "Input file is missing"

Significa que el archivo face no existe. Verifica:

```powershell
Test-Path "apps/ui/public/images/faces/A-12345.png"
```

### Error: "sharp" no encontrado

Instala la dependencia:

```powershell
cd apps/cache-builder
npm install sharp
```

### La miniatura se ve borrosa

Sharp usa compresión PNG optimizada. Si necesitas mejor calidad, ajusta en el script:

```typescript
.png({
  quality: 90,  // Cambiar de 80 a 90
  compressionLevel: 6,  // Cambiar de 9 a 6 (menos compresión)
})
```

---

## 📝 Próximos pasos

1. **Integrar en la UI**: Modificar componentes de tabla para usar miniaturas
2. **Helper function**: Crear `getPlayerThumbPath()` similar a `getFlagImagePath()`
3. **Lazy loading**: Usar `loading="lazy"` en `<img>` tags
4. **Fallback**: Manejar casos donde no hay miniatura (usar original)

---

**Última actualización**: Diciembre 16, 2025  
**Miniaturas generadas**: 3,910  
**Estado**: ✅ Sistema funcionando correctamente
