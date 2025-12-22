import * as XLSX from 'xlsx';
import * as fs from 'fs';

// Normalizar nombres (mismo método que PlayerProfile.tsx)
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalizar nombres de equipos (estandarizar formato)
function normalizeTeamName(team: string): string {
  const trimmed = team.trim();

  // Mapeo de países/selecciones a formato "Selección <gentilicio>"
  const nationalTeamMapping: Record<string, string> = {
    // Español
    Angola: 'Selección Angoleña',
    'Arabia Saudita': 'Selección Saudita',
    Australia: 'Selección Australiana',
    Brasil: 'Selección Brasileña',
    Bélgica: 'Selección Belga',
    Camerún: 'Selección Camerunesa',
    'Costa Rica': 'Selección Costarricense',
    Croacia: 'Selección Croata',
    Ecuador: 'Selección Ecuatoriana',
    Escocia: 'Selección Escocesa',
    Eslovenia: 'Selección Eslovena',
    España: 'Selección Española',
    Finlandia: 'Selección Finlandesa',
    Francia: 'Selección Francesa',
    Ghana: 'Selección Ghanesa',
    Grecia: 'Selección Griega',
    Inglaterra: 'Selección Inglesa',
    Inglarerra: 'Selección Inglesa', // Typo en Excel
    'Irlanda del Norte': 'Selección Norirlandesa',
    Irán: 'Selección Iraní',
    Italia: 'Selección Italiana',
    Japón: 'Selección Japonesa',
    Letonia: 'Selección Letona',
    México: 'Selección Mexicana',
    Nigeria: 'Selección Nigeriana',
    'Países Bajos': 'Selección Neerlandesa',
    Perú: 'Selección Peruana',
    Rusia: 'Selección Rusa',
    Suiza: 'Selección Suiza',
    'Trinidad y Tobago': 'Selección Trinitense',
    Uruguay: 'Selección Uruguaya',

    // Inglés (temporadas anteriores)
    Argentina: 'Selección Argentina',
    Austria: 'Selección Austríaca',
    Belgium: 'Selección Belga',
    Brazil: 'Selección Brasileña',
    Bulgaria: 'Selección Búlgara',
    Cameroon: 'Selección Camerunesa',
    Colombia: 'Selección Colombiana',
    'Czech Republic': 'Selección Checa',
    England: 'Selección Inglesa',
    France: 'Selección Francesa',
    Germany: 'Selección Alemana',
    Iran: 'Selección Iraní',
    Ireland: 'Selección Irlandesa',
    Italy: 'Selección Italiana',
    Japan: 'Selección Japonesa',
    Mexico: 'Selección Mexicana',
    Netherlands: 'Selección Neerlandesa',
    Norway: 'Selección Noruega',
    Peru: 'Selección Peruana',
    Poland: 'Selección Polaca',
    Portugal: 'Selección Portuguesa',
    'Saudi Arabia': 'Selección Saudita',
    'Serbia and Montenegro': 'Selección Serbia',
    Slovakia: 'Selección Eslovaca',
    Slovenia: 'Selección Eslovena',
    'South Africa': 'Selección Sudafricana',
    'South Korea': 'Selección Surcoreana',
    Spain: 'Selección Española',
    Sweden: 'Selección Sueca',
    Switzerland: 'Selección Suiza',
    'Trinidad and Tobago': 'Selección Trinitense',
    Tunisia: 'Selección Tunecina',
    Ukraine: 'Selección Ucraniana',
    'United States': 'Selección Estadounidense',
    Wales: 'Selección Galesa',
  };

  // Si es una selección nacional, aplicar el mapeo
  if (nationalTeamMapping[trimmed]) {
    return nationalTeamMapping[trimmed];
  }

  // Mapeo de correcciones de clubes conocidas
  const teamMapping: Record<string, string> = {
    // Milan
    'AC Milan': 'A.C. Milan',
    'AC Chievo Verona': 'Chievo Verona',

    // Roma
    'AS Roma': 'A.S. Roma',

    // Ajax
    'AFC Ajax': 'Ajax',

    // Arsenal
    'Arsenal FC': 'Arsenal',

    // Fiorentina
    'ACF Fiorentina': 'Fiorentina',

    // Barcelona
    'FC Barcelona': 'F.C. Barcelona',

    // Bayern
    'FC Bayern München': 'Bayern München',

    // Bordeaux
    'FC Girondins de Bordeaux': 'Girondins de Bordeaux',

    // Inter
    'FC Internazionale': 'Inter',

    // Dynamo Kiev
    'FK Dynamo Kyiv': 'Dynamo Kiev',

    // Juventus
    'Juventus FC': 'Juventus',

    // Lazio
    'SS Lazio': 'Lazio',

    // Celtic
    'Celtic FC': 'Celtic',

    // Manchester City
    'Manchester City FC': 'Manchester City',

    // Manchester United
    'Manchester United FC': 'Manchester United',

    // Newcastle
    'Newcastle United FC': 'Newcastle United',

    // Real Madrid
    'R. Madrid': 'Real Madrid',
    'Real Madrid CF': 'Real Madrid',

    // Real Sociedad
    'R. Sociedad': 'Real Sociedad',

    // Celta
    'RC Celta de Vigo': 'R.C. Celta',

    // Parma
    'Parma Calcio': 'Parma',

    // Sevilla
    'Sevilla FC': 'Sevilla F.C.',

    // Sporting
    'Sporting CP': 'Sporting Lisbon',

    // Villarreal
    'Villarreal CF': 'Villarreal C.F.',

    // Países/Selecciones (mantener sin cambios si no están en el mapeo nacional)
    Inglarerra: 'Inglaterra', // Corregir typo primero
  };

  // Aplicar corrección de typos primero
  let correctedTeam = teamMapping[trimmed] || trimmed;

  // Luego aplicar mapeo de selecciones si aplica
  return nationalTeamMapping[correctedTeam] || correctedTeam;
}

console.log('📊 Extrayendo estadísticas de goles desde DB ESTADISTICAS.xlsx...\n');

// Leer Excel
const wb = XLSX.readFile('DB ESTADISTICAS.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

console.log(`✅ Leídas ${data.length} filas del Excel\n`);

// Transformar a formato del JSON
interface GoalRecord {
  name: string;
  nameNormalized: string;
  user: string;
  team: string;
  goals: number;
  season: number;
  type: string;
  competition: string;
}

const records: GoalRecord[] = data.map((row) => {
  const name = String(row.Nombre || '').trim();

  // Aplicar correcciones conocidas a nombres de jugadores
  let correctedName = name;
  if (name === 'Darren Bent') correctedName = 'D. Bent';
  if (name === 'Marcus Bent') correctedName = 'M. Bent';

  // Normalizar nombre del equipo
  const team = normalizeTeamName(String(row.Equipo || '').trim());

  return {
    name: correctedName,
    nameNormalized: normalizeName(correctedName),
    user: String(row.Usuario || '').trim(),
    team,
    goals: Number(row.Goles) || 0,
    season: Number(row.Temporada) || 0,
    type: String(row.Tipo || '').trim(),
    competition: String(row.Competición || '').trim(),
  };
});

// Crear objeto final
const output = {
  version: '1.0',
  updatedAt: new Date().toISOString(),
  source: 'DB ESTADISTICAS.xlsx',
  rowCount: records.length,
  columns: [
    'name',
    'nameNormalized',
    'user',
    'team',
    'goals',
    'season',
    'type',
    'competition',
  ],
  notes: 'Estadísticas de goles por jugador, DT, equipo y temporada',
  records,
};

// Guardar JSON
const outputPath = './data/processed/player-goal-stats.json';
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

console.log(`✅ Generado ${outputPath}`);
console.log(`   - ${records.length} registros totales`);
console.log(`   - ${new Set(records.map((r) => r.name)).size} jugadores únicos`);
console.log(`   - ${new Set(records.map((r) => r.season)).size} temporadas`);

// Estadísticas por temporada
const bySeasonMap = new Map<number, number>();
records.forEach((r) => {
  const current = bySeasonMap.get(r.season) || 0;
  bySeasonMap.set(r.season, current + r.goals);
});

const seasons = Array.from(bySeasonMap.keys()).sort((a, b) => a - b);
console.log(`\n📈 Goles por temporada:`);
seasons.forEach((s) => {
  console.log(`   T${s}: ${bySeasonMap.get(s)} goles`);
});

console.log(`\n✅ ¡Actualización completada!`);
