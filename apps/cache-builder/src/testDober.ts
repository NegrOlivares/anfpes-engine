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

function testNameSimilarity(name1: string, name2: string): void {
  const norm1 = normalizeString(name1);
  const norm2 = normalizeString(name2);

  console.log(`\nComparando: "${name1}" vs "${name2}"`);
  console.log(`Normalizados: "${norm1}" vs "${norm2}"`);

  const words1 = norm1.split(/\s+/).filter((w) => w.length > 0);
  const words2 = norm2.split(/\s+/).filter((w) => w.length > 0);

  console.log(`Palabras 1: [${words1.join(', ')}]`);
  console.log(`Palabras 2: [${words2.join(', ')}]`);

  let matchingWords = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 && word1.length >= 3) {
        matchingWords++;
        console.log(`  ✓ Palabra común: "${word1}"`);
        break;
      }
    }
  }

  console.log(`Palabras comunes: ${matchingWords}`);

  if (matchingWords > 0) {
    const avgWords = (words1.length + words2.length) / 2;
    const wordScore = matchingWords / avgWords;
    const minWords = Math.min(words1.length, words2.length);

    console.log(`avgWords: ${avgWords}`);
    console.log(`wordScore: ${wordScore.toFixed(2)}`);
    console.log(`minWords: ${minWords}`);

    if (matchingWords === minWords) {
      const finalScore = Math.max(wordScore, 0.85);
      console.log(`✅ Todas las palabras del nombre corto matchean!`);
      console.log(`Score final: ${(finalScore * 100).toFixed(0)}%`);
    } else {
      console.log(`Score final: ${(wordScore * 100).toFixed(0)}%`);
    }
  } else {
    console.log('❌ No hay palabras comunes');
  }
}

async function testDober() {
  const excelPath = path.join(
    __dirname,
    '../../../apps/ui/src/assets/db mia vs canon.xlsx',
  );
  const workbook = XLSX.readFile(excelPath);

  const miaSheet = workbook.Sheets['mia'];
  const miaPlayers: MiaPlayer[] = XLSX.utils.sheet_to_json(miaSheet);

  const canonSheet = workbook.Sheets['canon'];
  const canonPlayers: CanonPlayer[] = XLSX.utils.sheet_to_json(canonSheet);

  const dober = miaPlayers.find((p) => p.NOMBRE === 'Dober');
  const andreasD = canonPlayers.find((c) => c['Base ID'] === '32811');

  if (!dober || !andreasD) {
    console.log('No encontrado');
    return;
  }

  console.log('='.repeat(80));
  console.log('TEST: Dober vs Andreas Dober');
  console.log('='.repeat(80));

  console.log('\nDatos MIA:');
  console.log(`  Nombre: ${dober.NOMBRE}`);
  console.log(`  Nacionalidad: ${dober.NACIONALIDAD}`);

  console.log('\nDatos CANON:');
  console.log(`  Nombre Completo: ${andreasD['Nombre Completo']}`);
  const matcheableNames = parseMultiValueCell(andreasD['Nombres Matcheables']);
  console.log(`  Nombres Matcheables: ${matcheableNames.join(' | ')}`);
  const nats = parseMultiValueCell(andreasD['Nacionalidades']);
  console.log(`  Nacionalidades: ${nats.join(' | ')}`);

  // Test with full name
  testNameSimilarity(dober.NOMBRE, andreasD['Nombre Completo']);

  // Test with each matcheable name
  matcheableNames.forEach((name) => {
    testNameSimilarity(dober.NOMBRE, name);
  });
}

testDober().catch(console.error);
