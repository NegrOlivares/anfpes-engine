import XLSX from 'xlsx';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MiaPlayer {
  NOMBRE: string;
  NACIONALIDAD: string;
  ALTURA: number | string;
  PESO: number | string;
  PIE: string;
  POSITION: string;
}

interface CanonPlayer {
  'Base ID': string;
  'Nombres Matcheables': string;
  'Nombre Completo': string;
  Nacionalidades: string;
  Alturas: string;
  Pesos: string;
  Posiciones: string;
}

function parseMultiValueCell(cellValue: any): string[] {
  if (!cellValue) return [];
  const strValue = String(cellValue).trim();
  if (!strValue) return [];

  return strValue
    .split(/[\n|,;]+/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

async function analyzeBadMatches() {
  const excelPath = path.join(
    __dirname,
    '../../../apps/ui/src/assets/db mia vs canon.xlsx',
  );
  const workbook = XLSX.readFile(excelPath);

  const miaSheet = workbook.Sheets['mia'];
  const miaPlayers: MiaPlayer[] = XLSX.utils.sheet_to_json(miaSheet);

  const canonSheet = workbook.Sheets['canon'];
  const canonPlayers: CanonPlayer[] = XLSX.utils.sheet_to_json(canonSheet);

  const badCases = [
    { nombre: 'Luis Martínez', baseId: '33810', canonName: 'DAVID MARTIN' },
    { nombre: 'Taibi', baseId: '31213', canonName: 'Hasan Al Otaibi' },
    { nombre: 'Rui Marques', baseId: '36843', canonName: 'MARQUE' },
    {
      nombre: 'Kabba',
      baseId: '30460',
      canonName: 'Sultan Rashed Saeed Hared Al Kabbani',
    },
  ];

  for (const badCase of badCases) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`CASO PROBLEMÁTICO: ${badCase.nombre} -> ${badCase.canonName}`);
    console.log('='.repeat(80));

    const miaPlayer = miaPlayers.find((p) => p.NOMBRE === badCase.nombre);
    const canonPlayer = canonPlayers.find((c) => c['Base ID'] === badCase.baseId);

    if (!miaPlayer || !canonPlayer) {
      console.log('❌ No se encontró uno de los jugadores');
      continue;
    }

    console.log('\n📋 Datos en MIA:');
    console.log(`  Nombre: ${miaPlayer.NOMBRE}`);
    console.log(`  Nacionalidad: ${miaPlayer.NACIONALIDAD}`);
    console.log(`  Altura: ${miaPlayer.ALTURA}`);
    console.log(`  Peso: ${miaPlayer.PESO}`);
    console.log(`  Posición: ${miaPlayer.POSITION}`);

    console.log('\n📋 Datos en CANON:');
    console.log(`  Base ID: ${canonPlayer['Base ID']}`);
    console.log(`  Nombre Completo: ${canonPlayer['Nombre Completo']}`);

    const matcheableNames = parseMultiValueCell(canonPlayer['Nombres Matcheables']);
    console.log(`  Nombres Matcheables (${matcheableNames.length}):`);
    matcheableNames.forEach((n) => console.log(`    • "${n}"`));

    const nationalities = parseMultiValueCell(canonPlayer['Nacionalidades']);
    console.log(
      `  Nacionalidades (${nationalities.length}): ${nationalities.join(', ') || '(vacío)'}`,
    );

    const positions = parseMultiValueCell(canonPlayer['Posiciones']);
    console.log(
      `  Posiciones (${positions.length}): ${positions.join(', ') || '(vacío)'}`,
    );

    const heights = parseMultiValueCell(canonPlayer['Alturas']);
    console.log(`  Alturas (${heights.length}): ${heights.join(', ') || '(vacío)'}`);

    const weights = parseMultiValueCell(canonPlayer['Pesos']);
    console.log(`  Pesos (${weights.length}): ${weights.join(', ') || '(vacío)'}`);

    console.log('\n🔍 ANÁLISIS DE SIMILITUD:');

    // Name similarity
    const miaNorm = normalizeString(miaPlayer.NOMBRE);
    const canonNorm = normalizeString(canonPlayer['Nombre Completo']);

    console.log(`  Nombre MIA normalizado: "${miaNorm}"`);
    console.log(`  Nombre CANON normalizado: "${canonNorm}"`);

    const miaWords = miaNorm.split(/\s+/).filter((w) => w.length > 0);
    const canonWords = canonNorm.split(/\s+/).filter((w) => w.length > 0);

    console.log(`  Palabras MIA: [${miaWords.join(', ')}]`);
    console.log(`  Palabras CANON: [${canonWords.join(', ')}]`);

    const commonWords = miaWords.filter((w) => canonWords.includes(w));
    console.log(
      `  Palabras en común: [${commonWords.join(', ')}] (${commonWords.length})`,
    );

    // Check all matcheable names
    console.log('\n  Similitud con cada nombre matcheable:');
    for (const name of matcheableNames) {
      const nameNorm = normalizeString(name);
      const nameWords = nameNorm.split(/\s+/).filter((w) => w.length > 0);
      const commonWithMatcheable = miaWords.filter((w) => nameWords.includes(w));
      console.log(
        `    "${name}" -> palabras comunes: [${commonWithMatcheable.join(', ')}]`,
      );
    }

    // Nationality match
    console.log('\n  ❓ Nacionalidad coincide?');
    console.log(`    MIA: "${miaPlayer.NACIONALIDAD}"`);
    console.log(`    CANON: ${nationalities.join(', ') || '(vacío)'}`);
    const natMatch = nationalities.some(
      (n) => normalizeString(n) === normalizeString(miaPlayer.NACIONALIDAD),
    );
    console.log(`    Match: ${natMatch ? '✅ SÍ' : '❌ NO'}`);

    // Position match
    console.log('\n  ❓ Posición coincide?');
    console.log(`    MIA: "${miaPlayer.POSITION}"`);
    console.log(`    CANON: ${positions.join(', ') || '(vacío)'}`);

    // Physical attributes
    console.log('\n  ❓ Atributos físicos coinciden?');
    const heightMatch = heights.includes(String(miaPlayer.ALTURA));
    const weightMatch = weights.includes(String(miaPlayer.PESO));
    console.log(
      `    Altura: MIA=${miaPlayer.ALTURA}, CANON=[${heights.join(', ')}] -> ${heightMatch ? '✅' : '❌'}`,
    );
    console.log(
      `    Peso: MIA=${miaPlayer.PESO}, CANON=[${weights.join(', ')}] -> ${weightMatch ? '✅' : '❌'}`,
    );

    console.log('\n  💡 CONCLUSIÓN:');
    if (!natMatch && commonWords.length === 0) {
      console.log(
        '    ⚠️ FALSO POSITIVO GRAVE: No hay coincidencia de nacionalidad NI nombres en común',
      );
    } else if (!natMatch) {
      console.log('    ⚠️ NACIONALIDAD NO COINCIDE pero hay similitud de nombre');
    } else if (commonWords.length === 0) {
      console.log('    ⚠️ NOMBRES NO COINCIDEN pero hay similitud de nacionalidad');
    }
  }

  // Check all unique nationalities
  console.log('\n\n' + '='.repeat(80));
  console.log('NACIONALIDADES ÚNICAS EN MIA:');
  console.log('='.repeat(80));

  const miaNationalities = new Set(
    miaPlayers.map((p) => p.NACIONALIDAD).filter((n) => n),
  );
  const sortedMia = Array.from(miaNationalities).sort();
  sortedMia.forEach((n) => console.log(`  • ${n}`));

  console.log(`\nTotal: ${sortedMia.length} nacionalidades únicas`);

  console.log('\n' + '='.repeat(80));
  console.log('NACIONALIDADES ÚNICAS EN CANON:');
  console.log('='.repeat(80));

  const canonNationalities = new Set<string>();
  canonPlayers.forEach((p) => {
    const nats = parseMultiValueCell(p['Nacionalidades']);
    nats.forEach((n) => canonNationalities.add(n));
  });

  const sortedCanon = Array.from(canonNationalities).sort();
  sortedCanon.forEach((n) => console.log(`  • ${n}`));

  console.log(`\nTotal: ${sortedCanon.length} nacionalidades únicas`);

  // Find mismatches
  console.log('\n' + '='.repeat(80));
  console.log(
    'NACIONALIDADES DE MIA QUE NO EXISTEN EN CANON (o tienen diferente formato):',
  );
  console.log('='.repeat(80));

  const mismatches: string[] = [];
  sortedMia.forEach((miaNat) => {
    const miaNorm = normalizeString(miaNat);
    const found = sortedCanon.some((canonNat) => normalizeString(canonNat) === miaNorm);
    if (!found) {
      mismatches.push(miaNat);
    }
  });

  mismatches.forEach((n) => console.log(`  • ${n}`));
  console.log(`\nTotal: ${mismatches.length} nacionalidades que necesitan mapeo`);
}

analyzeBadMatches().catch(console.error);
