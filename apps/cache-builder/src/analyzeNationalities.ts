import XLSX from 'xlsx';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function analyzeNationalities() {
  const excelPath = path.join(
    __dirname,
    '../../../apps/ui/src/assets/db mia vs canon.xlsx',
  );
  const workbook = XLSX.readFile(excelPath);

  const canonSheet = workbook.Sheets['canon'];
  const canonPlayers: CanonPlayer[] = XLSX.utils.sheet_to_json(canonSheet);

  const nationalitiesRaw = new Map<string, number>();
  const nationalitiesNormalized = new Map<string, Set<string>>();

  canonPlayers.forEach((p) => {
    const nats = parseMultiValueCell(p['Nacionalidades']);
    nats.forEach((nat) => {
      // Count raw
      nationalitiesRaw.set(nat, (nationalitiesRaw.get(nat) || 0) + 1);

      // Group by normalized
      const normalized = nat.toLowerCase().trim();
      if (!nationalitiesNormalized.has(normalized)) {
        nationalitiesNormalized.set(normalized, new Set());
      }
      nationalitiesNormalized.get(normalized)!.add(nat);
    });
  });

  console.log('ANÁLISIS DE NACIONALIDADES EN CANON:\n');
  console.log(`Total de valores únicos RAW: ${nationalitiesRaw.size}`);
  console.log(`Total de valores únicos NORMALIZADOS: ${nationalitiesNormalized.size}\n`);

  // Find duplicates (same when normalized but different raw)
  console.log('='.repeat(80));
  console.log('NACIONALIDADES DUPLICADAS (misma nacionalidad, diferente formato):');
  console.log('='.repeat(80));

  const duplicates: Array<{ normalized: string; variants: string[] }> = [];

  nationalitiesNormalized.forEach((variants, normalized) => {
    if (variants.size > 1) {
      duplicates.push({
        normalized,
        variants: Array.from(variants).sort(),
      });
    }
  });

  duplicates.sort((a, b) => b.variants.length - a.variants.length);

  duplicates.forEach((dup) => {
    console.log(`\n"${dup.normalized}" tiene ${dup.variants.length} variantes:`);
    dup.variants.forEach((v) => {
      const count = nationalitiesRaw.get(v) || 0;
      console.log(`  • "${v}" (${count} jugadores)`);
    });
  });

  console.log(`\n\nTotal: ${duplicates.length} nacionalidades con múltiples formatos`);

  // Check for Libya
  console.log('\n' + '='.repeat(80));
  console.log('BÚSQUEDA DE NACIONALIDADES ESPECÍFICAS:');
  console.log('='.repeat(80));

  const searchTerms = ['libya', 'macedonia', 'serbia', 'montenegro'];

  searchTerms.forEach((term) => {
    console.log(`\nBuscando "${term}":`);
    const found: string[] = [];
    nationalitiesRaw.forEach((count, nat) => {
      if (nat.toLowerCase().includes(term)) {
        found.push(`  • "${nat}" (${count} jugadores)`);
      }
    });

    if (found.length > 0) {
      found.forEach((f) => console.log(f));
    } else {
      console.log('  ❌ No encontrado');
    }
  });
}

analyzeNationalities().catch(console.error);
