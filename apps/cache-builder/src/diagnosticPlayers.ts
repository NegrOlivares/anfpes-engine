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

async function diagnose() {
  const excelPath = path.join(
    __dirname,
    '../../../apps/ui/src/assets/db mia vs canon.xlsx',
  );
  const workbook = XLSX.readFile(excelPath);

  const miaSheet = workbook.Sheets['mia'];
  const miaPlayers: MiaPlayer[] = XLSX.utils.sheet_to_json(miaSheet);

  const canonSheet = workbook.Sheets['canon'];
  const canonPlayers: CanonPlayer[] = XLSX.utils.sheet_to_json(canonSheet);

  const testCases = ['Ivanschitz', 'G. Petkov', 'G. Iliev'];

  for (const testName of testCases) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`CASO: ${testName}`);
    console.log('='.repeat(80));

    const miaPlayer = miaPlayers.find((p) => p.NOMBRE === testName);

    if (!miaPlayer) {
      console.log(`❌ No se encontró "${testName}" en la hoja "mia"`);
      continue;
    }

    console.log('\n📋 Datos en "mia":');
    console.log(`  - Nombre: ${miaPlayer.NOMBRE}`);
    console.log(`  - Nacionalidad: ${miaPlayer.NACIONALIDAD}`);
    console.log(`  - Altura: ${miaPlayer.ALTURA}`);
    console.log(`  - Peso: ${miaPlayer.PESO}`);
    console.log(`  - Pie: ${miaPlayer.PIE}`);
    console.log(`  - Posición: ${miaPlayer.POSITION}`);

    // Find potential matches in canon
    console.log('\n🔍 Candidatos potenciales en "canon":');

    const candidates = canonPlayers.filter((c) => {
      const matcheableNames = parseMultiValueCell(c['Nombres Matcheables']);
      const fullName = c['Nombre Completo'];
      const allNames = [...matcheableNames, fullName];

      return allNames.some(
        (name) =>
          name.toLowerCase().includes(testName.toLowerCase().replace('.', '').trim()) ||
          testName.toLowerCase().replace('.', '').trim().includes(name.toLowerCase()),
      );
    });

    if (candidates.length === 0) {
      console.log('  ❌ No se encontraron candidatos');
      continue;
    }

    candidates.slice(0, 5).forEach((c, idx) => {
      console.log(`\n  Candidato ${idx + 1}:`);
      console.log(`    - Base ID: ${c['Base ID']}`);
      console.log(`    - Nombre Completo: ${c['Nombre Completo']}`);

      const matcheableNames = parseMultiValueCell(c['Nombres Matcheables']);
      console.log(`    - Nombres Matcheables (${matcheableNames.length}):`);
      matcheableNames.forEach((n) => console.log(`        • "${n}"`));

      const nationalities = parseMultiValueCell(c['Nacionalidades']);
      console.log(`    - Nacionalidades: ${nationalities.join(', ') || '(vacío)'}`);

      const positions = parseMultiValueCell(c['Posiciones']);
      console.log(`    - Posiciones: ${positions.join(', ') || '(vacío)'}`);

      const heights = parseMultiValueCell(c['Alturas']);
      console.log(`    - Alturas: ${heights.join(', ') || '(vacío)'}`);

      const weights = parseMultiValueCell(c['Pesos']);
      console.log(`    - Pesos: ${weights.join(', ') || '(vacío)'}`);

      // Check matches
      console.log(`    - Coincidencias:`);

      const hasExactNameMatch = matcheableNames.some(
        (n) => n.toLowerCase() === testName.toLowerCase(),
      );
      console.log(`        ✓ Nombre exacto: ${hasExactNameMatch ? '✅ SÍ' : '❌ NO'}`);

      const hasNationalityMatch = nationalities.some(
        (n) => n.toLowerCase() === miaPlayer.NACIONALIDAD.toLowerCase(),
      );
      console.log(`        ✓ Nacionalidad: ${hasNationalityMatch ? '✅ SÍ' : '❌ NO'}`);

      const hasHeightMatch = heights.includes(String(miaPlayer.ALTURA));
      console.log(`        ✓ Altura: ${hasHeightMatch ? '✅ SÍ' : '❌ NO'}`);

      const hasWeightMatch = weights.includes(String(miaPlayer.PESO));
      console.log(`        ✓ Peso: ${hasWeightMatch ? '✅ SÍ' : '❌ NO'}`);
    });

    if (candidates.length > 5) {
      console.log(`\n  ... y ${candidates.length - 5} candidatos más`);
    }
  }
}

diagnose().catch(console.error);
