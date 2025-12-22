import * as XLSX from 'xlsx';

// Normalizar nombres para comparación (mismo método que usa PlayerProfile)
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Leer jugadores del cache (tiene los nombres correctos)
const playersCache = require('../data/cache/dev/players.json');

console.log(`✅ Cache tiene ${playersCache.length} jugadores\n`);

// Leer Excel de estadísticas
const wb = XLSX.readFile('DB ESTADISTICAS.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

// Filtrar temporada 22
const t22Records = data.filter((r: any) => r.Temporada === 22);
const t22Names = [...new Set(t22Records.map((r: any) => r.Nombre))].sort();

console.log(`📊 Analizando ${t22Names.length} jugadores únicos de la temporada 22...\n`);

// Crear mapa de nombres de jugadores en nuestra DB
const playerNamesMap = new Map<string, string>();

for (const player of playersCache) {
  if (player.NOMBRE) {
    const normalized = normalizeName(player.NOMBRE);
    playerNamesMap.set(normalized, player.NOMBRE);
  }
}

console.log(`✅ Base de datos tiene ${playerNamesMap.size} nombres únicos\n`);

// Verificar cada nombre de la temporada 22
const notFound: string[] = [];
const found: Array<{ statsName: string; dbName: string }> = [];
const multiMatch: Array<{ statsName: string; matches: string[] }> = [];

for (const statsName of t22Names) {
  const normalized = normalizeName(statsName);

  if (playerNamesMap.has(normalized)) {
    found.push({ statsName, dbName: playerNamesMap.get(normalized)! });
  } else {
    // Buscar coincidencias parciales
    const possibleMatches: string[] = [];

    for (const [dbNormalized, dbName] of playerNamesMap.entries()) {
      // Verificar si el nombre de stats está contenido en el de la DB o viceversa
      if (dbNormalized.includes(normalized) || normalized.includes(dbNormalized)) {
        possibleMatches.push(dbName);
      }
    }

    if (possibleMatches.length === 0) {
      notFound.push(statsName);
    } else if (possibleMatches.length === 1) {
      // Match único - lo consideramos válido
      found.push({ statsName, dbName: possibleMatches[0] });
    } else {
      // Múltiples matches - necesita revisión manual
      multiMatch.push({ statsName, matches: possibleMatches });
      notFound.push(statsName);
    }
  }
}

console.log(`\n✅ ${found.length} jugadores encontrados correctamente`);
console.log(`⚠️  ${multiMatch.length} jugadores con múltiples coincidencias`);
console.log(`❌ ${notFound.length - multiMatch.length} jugadores NO encontrados\n`);

if (multiMatch.length > 0) {
  console.log(`\n⚠️  JUGADORES CON MÚLTIPLES COINCIDENCIAS:\n`);
  multiMatch.slice(0, 10).forEach(({ statsName, matches }) => {
    console.log(`   "${statsName}":`);
    matches.slice(0, 3).forEach((m) => console.log(`      → ${m}`));
  });
  if (multiMatch.length > 10) {
    console.log(`   ... y ${multiMatch.length - 10} más`);
  }
}

const realNotFound = notFound.filter((n) => !multiMatch.some((m) => m.statsName === n));

if (realNotFound.length > 0 && realNotFound.length <= 30) {
  console.log(`\n❌ JUGADORES NO ENCONTRADOS:\n`);
  realNotFound.forEach((name) => {
    console.log(`   ❌ "${name}"`);
  });

  console.log(`\n\n💡 SUGERENCIAS:\n`);
  console.log(`Estos nombres deben ser corregidos en "DB ESTADISTICAS.xlsx"`);
  console.log(`O agregados a la base de datos si son jugadores válidos.`);
} else if (realNotFound.length > 30) {
  console.log(`\n❌ JUGADORES NO ENCONTRADOS: ${realNotFound.length}\n`);
  console.log(`Primeros 20:`);
  realNotFound.slice(0, 20).forEach((name) => console.log(`   ❌ "${name}"`));
  console.log(`\n... y ${realNotFound.length - 20} más`);
} else if (multiMatch.length === 0) {
  console.log(`\n✅ ¡Todos los jugadores de la temporada 22 están en la base de datos!`);
  console.log(`   Puedes proceder a actualizar player-goal-stats.json con seguridad.`);
}
