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

const POSITION_MAPPING: Record<string, string[]> = {
  Portero: ['GK'],
  Defensa: ['CB', 'CBT', 'CWP', 'LB', 'RB', 'SB', 'SW', 'SWP', 'WB'],
  Mediocampista: ['AMF', 'CMF', 'DMF', 'LMF', 'RMF', 'SMF'],
  Delantero: ['CF', 'LWF', 'RWF', 'SS', 'WF'],
};

const NATIONALITY_ALIASES: Record<string, string[]> = {
  serbia: ['serbia', 'serbia and montenegro', 'yugoslavia', 'fr yugoslavia'],
  montenegro: ['montenegro', 'serbia and montenegro', 'yugoslavia'],
  'czech republic': ['czech republic', 'czechia', 'czechoslovakia'],
  slovakia: ['slovakia', 'czechoslovakia'],
  croatia: ['croatia', 'yugoslavia'],
  'bosnia herzegovina': ['bosnia herzegovina', 'bosnia', 'yugoslavia'],
  'north macedonia': ['north macedonia', 'macedonia', 'fyr macedonia'],
  germany: ['germany', 'west germany', 'east germany'],
  russia: ['russia', 'soviet union', 'ussr'],
  ukraine: ['ukraine', 'soviet union'],
  belarus: ['belarus', 'soviet union'],
  'ivory coast': ['cote divoire', 'ivory coast', 'cote d ivoire'],
  'dr congo': ['dr congo', 'congo dr', 'democratic republic of congo'],
  'south korea': ['south korea', 'korea republic', 'republic of korea'],
  'north korea': ['north korea', 'korea dpr', 'dpr korea'],
  'united states': ['united states', 'usa', 'united states of america'],
  uae: ['uae', 'united arab emirates'],
  'cape verde': ['cape verde', 'cabo verde'],
};

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

function normalizeNationality(nationality: string): string {
  const normalized = normalizeString(nationality);

  for (const [key, aliases] of Object.entries(NATIONALITY_ALIASES)) {
    if (aliases.includes(normalized)) {
      return key;
    }
  }

  return normalized;
}

function nationalitiesMatch(mia: string, canonList: string[]): boolean {
  const miaNorm = normalizeNationality(mia);

  for (const canon of canonList) {
    const canonNorm = normalizeNationality(canon);

    if (miaNorm === canonNorm) {
      return true;
    }

    const miaAliases = NATIONALITY_ALIASES[miaNorm] || [miaNorm];
    const canonAliases = NATIONALITY_ALIASES[canonNorm] || [canonNorm];

    for (const miaAlias of miaAliases) {
      for (const canonAlias of canonAliases) {
        if (normalizeString(miaAlias) === normalizeString(canonAlias)) {
          return true;
        }
      }
    }
  }

  return false;
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const norm1 = normalizeString(name1);
  const norm2 = normalizeString(name2);

  if (!norm1 || !norm2) return 0;

  if (norm1 === norm2) return 1.0;

  const words1 = norm1.split(/\s+/).filter((w) => w.length > 0);
  const words2 = norm2.split(/\s+/).filter((w) => w.length > 0);

  if (words1.length === 0 || words2.length === 0) return 0;

  const hasInitial = words1.some((w) => w.length === 1);

  if (hasInitial && words1.length >= 2) {
    const initials: string[] = [];
    let surname = '';

    for (const word of words1) {
      if (word.length === 1) {
        initials.push(word);
      } else if (word.length > surname.length) {
        surname = word;
      }
    }

    if (surname.length >= 3) {
      for (const word2 of words2) {
        if (word2 === surname) {
          if (initials.length > 0) {
            const initialMatch = initials.some((initial) =>
              words2.some((w) => w.startsWith(initial) && w.length > 2),
            );
            return initialMatch ? 0.95 : 0.75;
          }
          return 0.85;
        }
      }
    }
  }

  let matchingWords = 0;
  const matchedIndices = new Set<number>();

  for (const word1 of words1) {
    for (let i = 0; i < words2.length; i++) {
      const word2 = words2[i];
      if (matchedIndices.has(i) || word1.length < 3) continue;

      if (word1 === word2) {
        matchingWords++;
        matchedIndices.add(i);
        break;
      }
    }
  }

  if (matchingWords > 0) {
    const avgWords = (words1.length + words2.length) / 2;
    const wordScore = matchingWords / avgWords;

    const minWords = Math.min(words1.length, words2.length);
    if (matchingWords === minWords) {
      return Math.max(wordScore, 0.85);
    }

    return wordScore;
  }

  if (norm1.length >= 4 && norm2.length >= 4) {
    if (norm1.includes(norm2)) {
      const ratio = norm2.length / norm1.length;
      if (ratio >= 0.6) {
        return 0.85;
      } else if (ratio >= 0.4) {
        return 0.65;
      }
      return 0.3;
    }
    if (norm2.includes(norm1)) {
      const ratio = norm1.length / norm2.length;
      if (ratio >= 0.6) {
        return 0.85;
      } else if (ratio >= 0.4) {
        return 0.65;
      }
      return 0.3;
    }
  }

  return 0;
}

function matchPosition(
  miaPosition: string,
  canonPositions: string[],
): { match: boolean; multiCategory: boolean } {
  const expectedPositions = POSITION_MAPPING[miaPosition] || [];

  let hasMatch = false;
  const categoriesFound = new Set<string>();

  for (const canonPos of canonPositions) {
    const canonPosUpper = canonPos.toUpperCase();

    for (const [category, positions] of Object.entries(POSITION_MAPPING)) {
      if (positions.includes(canonPosUpper)) {
        categoriesFound.add(category);

        if (category === miaPosition) {
          hasMatch = true;
        }
      }
    }
  }

  const multiCategory = categoriesFound.size > 1;

  return { match: hasMatch, multiCategory };
}

function matchNumericValue(miaValue: any, canonValues: string[]): number {
  if (!miaValue || canonValues.length === 0) return 0;

  const miaNum = typeof miaValue === 'number' ? miaValue : parseFloat(String(miaValue));
  if (isNaN(miaNum)) return 0;

  for (const canonValue of canonValues) {
    const canonNum = parseFloat(canonValue);
    if (isNaN(canonNum)) continue;

    const diff = Math.abs(miaNum - canonNum);

    if (diff === 0) return 1.0;

    if (diff <= 3) return 0.8;
    if (diff <= 5) return 0.5;
  }

  return 0;
}

function calculateMatchScore(
  miaPlayer: MiaPlayer,
  canonPlayer: CanonPlayer,
  debug: boolean = false,
): number {
  if (debug)
    console.log(
      `\n  Evaluating canon: ${canonPlayer['Nombre Completo']} (ID: ${canonPlayer['Base ID']})`,
    );

  const nationalities = parseMultiValueCell(canonPlayer['Nacionalidades']);

  if (nationalities.length > 0) {
    const nationalityMatch = nationalitiesMatch(miaPlayer.NACIONALIDAD, nationalities);
    if (debug)
      console.log(`    Nationality check: ${nationalityMatch ? '✅ PASS' : '❌ FAIL'}`);
    if (!nationalityMatch) {
      if (debug) console.log(`    ⚠️ REJECTED: Nationality mismatch`);
      return 0;
    }
  }

  const matcheableNames = parseMultiValueCell(canonPlayer['Nombres Matcheables']);
  const fullName = canonPlayer['Nombre Completo'];

  let bestNameScore = 0;
  let bestNameMatch = '';

  for (const name of matcheableNames) {
    const similarity = calculateNameSimilarity(miaPlayer.NOMBRE, name);
    if (similarity > bestNameScore) {
      bestNameScore = similarity;
      bestNameMatch = name;
    }
  }

  const fullNameSimilarity = calculateNameSimilarity(miaPlayer.NOMBRE, fullName);
  if (fullNameSimilarity > bestNameScore) {
    bestNameScore = fullNameSimilarity;
    bestNameMatch = fullName;
  }

  if (debug) {
    console.log(
      `    Best name match: "${bestNameMatch}" with score ${(bestNameScore * 100).toFixed(0)}%`,
    );
  }

  if (bestNameScore < 0.6) {
    if (debug)
      console.log(
        `    ⚠️ REJECTED: Name score ${(bestNameScore * 100).toFixed(0)}% < 60% threshold`,
      );
    return 0;
  }

  let score = 0;
  let totalWeight = 0;

  const baseNameWeight = 60;
  score += bestNameScore * baseNameWeight;
  totalWeight += baseNameWeight;

  score += 20;
  totalWeight += 20;

  const positions = parseMultiValueCell(canonPlayer['Posiciones']);
  if (positions.length > 0) {
    const posMatch = matchPosition(miaPlayer.POSITION, positions);
    if (posMatch.match) {
      score += posMatch.multiCategory ? 7 : 15;
    }
    totalWeight += 15;
  }

  const heights = parseMultiValueCell(canonPlayer['Alturas']);
  if (heights.length > 0) {
    const heightScore = matchNumericValue(miaPlayer.ALTURA, heights);
    score += heightScore * 5;
    totalWeight += 5;
  }

  const weights_values = parseMultiValueCell(canonPlayer['Pesos']);
  if (weights_values.length > 0) {
    const weightScore = matchNumericValue(miaPlayer.PESO, weights_values);
    score += weightScore * 5;
    totalWeight += 5;
  }

  const finalScore = totalWeight > 0 ? (score / totalWeight) * 100 : 0;

  if (debug) {
    console.log(`    Score breakdown:`);
    console.log(
      `      Name: ${(bestNameScore * baseNameWeight).toFixed(1)}/${baseNameWeight}`,
    );
    console.log(`      Nationality: 20/20`);
    console.log(`      Position: ${positions.length > 0 ? 'checked' : 'not available'}`);
    console.log(`      Height: ${heights.length > 0 ? 'checked' : 'not available'}`);
    console.log(
      `      Weight: ${weights_values.length > 0 ? 'checked' : 'not available'}`,
    );
    console.log(
      `      Total: ${score.toFixed(1)}/${totalWeight} = ${finalScore.toFixed(1)}%`,
    );
  }

  return finalScore;
}

async function debugDober() {
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

  if (!dober) {
    console.log('Dober not found in mia');
    return;
  }

  console.log('='.repeat(80));
  console.log('DEBUG: Finding matches for Dober');
  console.log('='.repeat(80));
  console.log(`\nMia player: ${dober.NOMBRE}`);
  console.log(`  Nationality: ${dober.NACIONALIDAD}`);
  console.log(`  Position: ${dober.POSITION}`);
  console.log(`  Height: ${dober.ALTURA}`);
  console.log(`  Weight: ${dober.PESO}`);

  console.log('\n' + '-'.repeat(80));
  console.log('Evaluating ALL canon players...');
  console.log('-'.repeat(80));

  const results: Array<{ canon: CanonPlayer; score: number }> = [];

  for (const canonPlayer of canonPlayers) {
    const score = calculateMatchScore(dober, canonPlayer, false);
    if (score > 0) {
      results.push({ canon: canonPlayer, score });
    }
  }

  console.log(`\nFound ${results.length} potential matches with score > 0`);

  results.sort((a, b) => b.score - a.score);

  console.log('\nTop 10 matches:');
  results.slice(0, 10).forEach((r, idx) => {
    console.log(
      `\n${idx + 1}. ${r.canon['Nombre Completo']} (ID: ${r.canon['Base ID']}) - Score: ${r.score.toFixed(1)}%`,
    );
    if (idx < 3) {
      calculateMatchScore(dober, r.canon, true);
    }
  });

  const andreasD = canonPlayers.find((c) => c['Base ID'] === '32811');
  if (andreasD) {
    console.log('\n' + '='.repeat(80));
    console.log('DETAILED ANALYSIS: Andreas Dober (ID: 32811)');
    console.log('='.repeat(80));
    calculateMatchScore(dober, andreasD, true);
  }
}

debugDober().catch(console.error);
