# Cache Builder

CLI para generar los artefactos de datos.

## Exportar tabla 0

```
npm run export:table0 -- <tabla0.xlsx> [rutaSalida]
```

Produce `table0.json`, `table0.meta.json` y `stats.placeholder.json` en `data/processed/` por defecto.

## Exportar tabla derivada (tabla 1)

```
npm run export:derived -- <tabla0.xlsx|tabla0.json> <ML.txt> [rutaSalida]
```

Puedes pasar la hoja original (`.xlsx`) o el `table0.json` generado previamente por `export:table0`. En ambos casos se combina con la lista Shop/ML para producir `table1.json` + `table1.meta.json`.

## Exportar la hoja 1 original (referencia)

```
npm run export:sheet1 -- "RAW DB + FORMULAS.xlsx" 1 [rutaSalida]
```

Convierte la hoja `1` del Excel original en un JSON dentro de `data/reference/`, útil para comparaciones y regresiones.

## Comparar tabla derivada vs. referencia

```
npm run compare:derived -- [derived.json] [referencia.json] [limite]
```

Por defecto compara `data/processed/table1.json` contra `data/reference/1.json` e imprime las primeras divergencias detectadas.

## Generar la cach� completa

```
npm run build:data -- <tabla0.xlsx|tabla0.json> <ML.txt> [directorioCache] [version]
```

Encadena la ingesta y el motor para producir:

- `players.json`: arreglo con los jugadores derivados.
- `clubs.json`: agrupaci�n { nombre, playerIds }.
- `indices/byId.json` y `indices/byClub.json`.
- `meta.json`: metadatos (versionado, hashes, conteos).

Por defecto los artefactos se escriben en `data/cache/`.
