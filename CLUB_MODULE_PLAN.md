# Plan Modulo Club

Este documento define como iniciar el modulo Club sin implementar codigo todavia.
La meta es construir primero una vista confiable para los 32 clubes ANFPES actuales,
dejando preparada la base para historico, usuarios y temporadas futuras.

## Objetivo

Crear un modulo dedicado a cada club ANFPES, donde se pueda consultar su identidad,
plantel actual, datos competitivos y relaciones futuras con usuarios/historico.

El modulo Club no debe depender inicialmente del modulo Usuario. El usuario/manager
actual puede agregarse despues, cuando exista una fuente de verdad completa para
temporada XXIV.

## Principio Central

Separar tres conceptos:

- Club: identidad estable del equipo dentro de la app.
- Temporada del club: participacion del club en una temporada ANFPES concreta.
- Usuario/manager: persona que administra o administro el club en una temporada.

Esto evita que un cambio de usuario rompa el perfil del club, y tambien evita que
el historial del club se pierda si el equipo cambia de manager.

## Fuente De Verdad Inicial

Para el primer MVP del modulo Club, las fuentes actuales bastan:

- `ANFPES_CLUBS` en `apps/ui/src/data/playerStatus.ts`: lista oficial de 32 clubes activos.
- `players.json` en cache: plantel actual por club.
- `clubIdentities.ts`: colores base ya disponibles para la identidad visual.
- `imageHelpers.ts`: escudos y camisetas cuando existan.
- Estadisticas de goles TXXIII/TXXIV: se integran cuando el archivo este cerrado.

No se debe crear todavia una fuente de verdad de usuarios.

## Modelo De Datos Propuesto

Crear mas adelante una entidad local de club con esta forma conceptual:

```ts
type ClubProfile = {
  id: string;
  dbName: string;
  displayName: string;
  slug: string;
  active: boolean;
  colors: {
    primary: string;
    secondary: string;
  };
  assets: {
    shield?: string;
    kit?: string;
  };
};
```

Ejemplos:

- `dbName`: `R. Madrid`
- `displayName`: `Real Madrid`
- `slug`: `real-madrid`
- `kit`: `/images/kits/profile/Real%20Madrid.png`

## Vistas Del Modulo

### 1. Indice De Clubes

Pantalla inicial del modulo Club:

- Grid/listado de los 32 clubes ANFPES.
- Escudo.
- Camiseta si existe.
- Nombre del club.
- Cantidad de jugadores actuales.
- Promedio del plantel.
- Indicadores simples: edad promedio, valor total, top jugador.

### 2. Perfil De Club

Vista individual por club:

- Header con escudo, camiseta, colores y nombre.
- Plantel actual completo.
- Resumen por posicion.
- Mejores jugadores por macro: ataque, tecnica, resistencia, defensa, fuerza, velocidad.
- Jugadores seleccionados nacionales.
- Jugadores leyenda o ML si aplica.
- Alertas de profundidad: posiciones con baja cobertura.

### 3. Plantel Y Profundidad

Subvista enfocada en gestion deportiva:

- Tabla del plantel.
- Filtros por posicion, edad, promedio, nacionalidad, condicion, pie.
- Depth chart por linea.
- Comparacion con otros clubes.

### 4. Estadisticas

Subvista pendiente de fuente final:

- Goles por temporada.
- Goleadores historicos del club.
- Goles por jugador actual.
- Rendimiento por temporada si luego existe esa data.

### 5. Historico

No implementar en el MVP, pero dejar el modelo preparado para:

- Temporadas en las que participo el club.
- Managers historicos.
- Cambios de nombre o reemplazos competitivos.
- Relacion Fiorentina -> Livorno si se decide conservar ese antecedente.

## Navegacion

Agregar mas adelante un nuevo modulo `club` al registro de modulos:

- Entrada en sidebar/nav.
- Ruta interna por slug o seleccion desde estado global.
- Link desde perfil de jugador hacia perfil de club.
- Link desde tarjetas/listados de club hacia busqueda filtrada por plantel.

## MVP Recomendado

Primera version pequena pero util:

1. Crear fuente local `clubs.ts` con los 32 clubes actuales.
2. Derivar plantel desde cache por `player.CLUB`.
3. Crear `ClubModule`.
4. Crear `ClubIndex`.
5. Crear `ClubProfile`.
6. Linkear desde perfil de jugador al club.
7. Usar escudos, colores y camisetas ya existentes.

No incluir todavia:

- Usuarios historicos.
- Campeonatos.
- Palmares.
- Mercado/fichajes.
- Estadisticas incompletas.

## Riesgos Y Decisiones Pendientes

- Definir si Livorno hereda historial competitivo de Fiorentina o si parte como club nuevo.
- Definir nombres publicos: usar nombre DB exacto o nombre normalizado de presentacion.
- Definir si clubes no activos deben existir en historico mas adelante.
- Definir como se versionan planteles por temporada.
- Definir si el modulo Club sera solo consulta o tambien tendra herramientas de gestion.

## Criterios Para Empezar A Codificar

Antes de implementar, confirmar:

- Nombre final visible de cada club.
- Si el MVP debe mostrar solo clubes actuales o tambien historicos.
- Si Livorno debe aparecer con historial heredado de Fiorentina.
- Si las estadisticas de goles entran en el primer release del modulo o en una segunda fase.
- Si el modulo debe incluir manager actual cuando la lista de usuarios XXIV este lista.

## Assets De Camisetas

Las camisetas del perfil deben vivir en:

`apps/ui/public/images/kits/profile/`

Formato recomendado:

- PNG RGBA con transparencia real.
- Lienzo uniforme de `1448 x 1086 px`.
- Camiseta centrada horizontalmente.
- Cuello tocando o muy cerca del borde superior.
- Dobladillo inferior tocando o muy cerca del borde inferior.
- Sin sombra externa ni fondo de color.
- No dejar margenes laterales asimetricos.

Nombres de archivo esperados para los 32 clubes:

```text
AC Milan.png
AS Roma.png
Ajax.png
Arsenal.png
Athletic Club.png
Bayern Munchen.png
Boca Juniors.png
Celtic.png
Chelsea FC.png
Chievo Verona.png
Dynamo Kiev.png
FC Barcelona.png
Girondins de Bordeaux.png
Inter.png
Juventus.png
Lazio.png
Liverpool FC.png
Livorno.png
Manchester City.png
Manchester United.png
Newcastle United FC.png
Olympique de Marseille.png
Olympique Lyonnais.png
Paris Saint-Germain.png
Parma.png
Real Madrid.png
Real Sociedad.png
RC Celta.png
Roda JC.png
Sevilla FC.png
Sporting Lisbon.png
Villarreal CF.png
```
