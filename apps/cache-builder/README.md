# Cache Builder

CLI para generar los artefactos de datos.

## Exportar tabla 0

`npm run export:table0 -- <tabla0.xlsx> [rutaSalida]`

Produce able0.json, able0.meta.json y stats.placeholder.json en data/processed/ por defecto.

## Exportar tabla derivada (tabla 1)

`npm run export:derived -- <tabla0.xlsx> <ML.txt> [rutaSalida]`

Lee la tabla 0 y la lista Shop/ML para generar able1.json + able1.meta.json con los campos calculados por el motor.
