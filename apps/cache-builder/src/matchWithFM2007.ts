import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCEL_PATH = path.resolve(__dirname, '../../ui/src/assets/db mia vs canon.xlsx');
const CSV_PATH = path.resolve(__dirname, '../../../db fm 2007.csv');
const OUTPUT_PATH = path.resolve(
  __dirname,
  '../../../data/processed/player-matches-fm2007.xlsx',
);

interface MiaPlayer {
  NOMBRE: string;
  NACIONALIDAD: string;
  ALTURA: number | string;
  PESO: number | string;
  PIE: string;
  POSITION: string;
  EDAD?: number; // Will calculate from birth date if available
}

interface FM2007Player {
  'Unique ID': string;
  Name: string;
  Nation: string;
  'Date Of Birth': string;
  Age: string;
}

// Nationality normalization mapping
const NATIONALITY_MAPPING: Record<string, string[]> = {
  Argentina: ['Argentina', 'argentina'],
  Austria: ['Austria', 'AUSTRIA'],
  Belgium: ['Bélgica', 'Belgium', 'B�lgica'],
  Brazil: ['Brasil', 'Brazil'],
  Canada: ['Canadá', 'Canada', 'Canad�'],
  'Czech Republic': ['República Checa', 'Czech Republic', 'Czechia', 'Chequia'],
  Denmark: ['Dinamarca', 'Denmark'],
  England: ['Inglaterra', 'England'],
  Finland: ['Finlandia', 'Finland'],
  France: ['Francia', 'France'],
  Germany: ['Alemania', 'Germany'],
  Greece: ['Grecia', 'Greece'],
  Holland: ['Holanda', 'Holland', 'Netherlands', 'Países Bajos'],
  India: ['India'],
  Indonesia: ['Indonesia'],
  Israel: ['Israel'],
  Italy: ['Italia', 'Italy'],
  Malaysia: ['Malasia', 'Malaysia'],
  Morocco: ['Marruecos', 'Morocco'],
  Norway: ['Noruega', 'Norway'],
  Poland: ['Polonia', 'Poland'],
  Portugal: ['Portugal'],
  Singapore: ['Singapur', 'Singapore'],
  Spain: ['España', 'Spain', 'Espa�a'],
  Sweden: ['Suecia', 'Sweden'],
  Switzerland: ['Suiza', 'Switzerland'],
  Turkey: ['Turquía', 'Turkey'],
};

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function parseMultiValueCell(cellValue: any): string[] {
  if (!cellValue) return [];
  const strValue = String(cellValue).trim();
  if (!strValue || strValue === 'undefined') return [];

  return strValue
    .split(/[\n|,;]+/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v !== 'undefined');
}

function normalizeNationality(nation: string): string {
  const normalized = nation.trim();

  // Handle multiple nationalities (e.g., "Marruecos / Bélgica")
  if (normalized.includes('/')) {
    // Take the first nationality
    const first = normalized.split('/')[0].trim();
    return normalizeNationalityHelper(first);
  }

  return normalizeNationalityHelper(normalized);
}

function normalizeNationalityHelper(nation: string): string {
  const norm = normalizeString(nation);

  for (const [standard, variants] of Object.entries(NATIONALITY_MAPPING)) {
    for (const variant of variants) {
      if (normalizeString(variant) === norm) {
        return standard;
      }
    }
  }

  // Return capitalized version if no mapping found
  return nation.charAt(0).toUpperCase() + nation.slice(1).toLowerCase();
}

function nationalitiesMatch(miaNationality: string, fm2007Nation: string): boolean {
  const miaNorm = normalizeNationality(miaNationality);
  const fmNorm = normalizeNationality(fm2007Nation);

  return miaNorm === fmNorm;
}

function parseDateOfBirth(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Format: "05.05.1984" (DD.MM.YYYY)
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  return new Date(year, month, day);
}

function calculateAge(
  birthDate: Date,
  referenceDate: Date = new Date(2007, 0, 1),
): number {
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const norm1 = normalizeString(name1);
  const norm2 = normalizeString(name2);

  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1.0;

  const words1 = norm1.split(/\s+/).filter((w) => w.length > 0);
  const words2 = norm2.split(/\s+/).filter((w) => w.length > 0);

  if (words1.length === 0 || words2.length === 0) return 0;

  // Word matching
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

  // Substring matching as fallback
  if (norm1.length >= 4 && norm2.length >= 4) {
    if (norm1.includes(norm2)) {
      const ratio = norm2.length / norm1.length;
      if (ratio >= 0.6) return 0.85;
      if (ratio >= 0.4) return 0.65;
      return 0.3;
    }
    if (norm2.includes(norm1)) {
      const ratio = norm1.length / norm2.length;
      if (ratio >= 0.6) return 0.85;
      if (ratio >= 0.4) return 0.65;
      return 0.3;
    }
  }

  return 0;
}

function calculateMatchScore(
  miaPlayer: MiaPlayer,
  fm2007Player: FM2007Player,
  miaAge?: number,
): number {
  // First check nationality - REQUIRED
  if (!nationalitiesMatch(miaPlayer.NACIONALIDAD, fm2007Player.Nation)) {
    return 0;
  }

  // Calculate name similarity
  const nameSimilarity = calculateNameSimilarity(miaPlayer.NOMBRE, fm2007Player.Name);

  // Require minimum 60% name similarity
  if (nameSimilarity < 0.6) return 0;

  let score = 0;
  let totalWeight = 0;

  // Name: 70 points
  score += nameSimilarity * 70;
  totalWeight += 70;

  // Nationality: 20 points (already validated, so add full points)
  score += 20;
  totalWeight += 20;

  // Age: 10 points (with tolerance)
  if (miaAge && fm2007Player.Age) {
    const fm2007Age = parseInt(fm2007Player.Age, 10);
    if (!isNaN(fm2007Age)) {
      const ageDiff = Math.abs(miaAge - fm2007Age);

      if (ageDiff === 0) {
        score += 10; // Exact match
      } else if (ageDiff <= 1) {
        score += 8; // 1 year difference
      } else if (ageDiff <= 2) {
        score += 5; // 2 years difference
      }
      // More than 2 years: 0 points but don't reject

      totalWeight += 10;
    }
  }

  return totalWeight > 0 ? (score / totalWeight) * 100 : 0;
}

function findBestMatch(
  miaPlayer: MiaPlayer,
  fm2007Players: FM2007Player[],
  miaAge?: number,
): { match: FM2007Player | null; score: number } {
  let bestMatch: FM2007Player | null = null;
  let bestScore = 0;

  for (const fm2007Player of fm2007Players) {
    const score = calculateMatchScore(miaPlayer, fm2007Player, miaAge);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = fm2007Player;
    }
  }

  return { match: bestMatch, score: bestScore };
}

console.log(`Reading Excel file: ${EXCEL_PATH}`);
const workbook = XLSX.readFile(EXCEL_PATH);

const miaSheet = workbook.Sheets['mia'];
if (!miaSheet) {
  throw new Error('Sheet "mia" not found in Excel file');
}

const miaData = XLSX.utils.sheet_to_json(miaSheet) as MiaPlayer[];
console.log(`Found ${miaData.length} players in "mia" sheet`);

console.log(`\nReading CSV file: ${CSV_PATH}`);
console.log('(This may take a moment - processing 154,667 lines...)');
const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');

// Use more lenient CSV parsing with escape handling
const fm2007Data = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  delimiter: ',',
  quote: '"',
  escape: '"',
  relax_quotes: true,
  relax_column_count: true,
  skip_records_with_error: true, // Skip problematic lines
  trim: true,
}) as FM2007Player[];

console.log(`Found ${fm2007Data.length} players in FM 2007 database`);

// Pre-filter FM2007 players by nationality for faster matching
console.log('\nIndexing FM2007 players by nationality...');
const fm2007ByNationality = new Map<string, FM2007Player[]>();

for (const player of fm2007Data) {
  const normalizedNation = normalizeNationality(player.Nation);
  if (!fm2007ByNationality.has(normalizedNation)) {
    fm2007ByNationality.set(normalizedNation, []);
  }
  fm2007ByNationality.get(normalizedNation)!.push(player);
}

console.log(`Created index with ${fm2007ByNationality.size} nationalities`);

// Match players
console.log('\nMatching players...');
const matches: Array<{
  miaPlayer: MiaPlayer;
  match: FM2007Player;
  score: number;
  miaAge?: number;
}> = [];

let processed = 0;
const totalPlayers = miaData.length;

for (const miaPlayer of miaData) {
  processed++;
  if (processed % 500 === 0 || processed === totalPlayers) {
    console.log(
      `  Progress: ${processed}/${totalPlayers} (${((processed / totalPlayers) * 100).toFixed(1)}%)`,
    );
  }

  // Only search within same nationality for efficiency
  const miaNationality = normalizeNationality(miaPlayer.NACIONALIDAD);
  const candidatePlayers = fm2007ByNationality.get(miaNationality) || [];

  if (candidatePlayers.length === 0) {
    continue; // Skip if no candidates with this nationality
  }

  const result = findBestMatch(miaPlayer, candidatePlayers, undefined);

  if (result.match) {
    let miaAge: number | undefined;
    const birthDate = parseDateOfBirth(result.match['Date Of Birth']);
    if (birthDate) {
      miaAge = calculateAge(birthDate);
    }

    matches.push({
      miaPlayer,
      match: result.match,
      score: result.score,
      miaAge,
    });
  }
}

console.log(`\nMatched ${matches.length} players out of ${miaData.length}`);

// Sort by score
matches.sort((a, b) => b.score - a.score);

// Ensure unique FM2007 IDs
const finalMatches = new Map<string, (typeof matches)[0]>();
const usedFM2007IDs = new Set<string>();

for (const match of matches) {
  const fm2007ID = match.match['Unique ID'];

  if (!usedFM2007IDs.has(fm2007ID)) {
    const key = `${match.miaPlayer.NOMBRE}|${match.miaPlayer.NACIONALIDAD}`;
    finalMatches.set(key, match);
    usedFM2007IDs.add(fm2007ID);
  }
}

// Prepare output data
const outputData = Array.from(finalMatches.values()).map((match) => ({
  'Nombre (Mia)': match.miaPlayer.NOMBRE,
  'Nacionalidad (Mia)': match.miaPlayer.NACIONALIDAD,
  'Edad (Mia Calculada)': match.miaAge || 'N/A',
  'FM2007 Unique ID': match.match['Unique ID'],
  'FM2007 Name': match.match['Name'],
  'FM2007 Nation': match.match['Nation'],
  'FM2007 Date of Birth': match.match['Date Of Birth'],
  'FM2007 Age': match.match['Age'],
  'Match Score': `${match.score.toFixed(2)}%`,
}));

// Write to Excel
const outputWorkbook = XLSX.utils.book_new();
const outputSheet = XLSX.utils.json_to_sheet(outputData);
XLSX.utils.book_append_sheet(outputWorkbook, outputSheet, 'FM2007 Matches');
XLSX.writeFile(outputWorkbook, OUTPUT_PATH);

console.log(`\nResults written to: ${OUTPUT_PATH}`);

// Statistics
const totalMatches = finalMatches.size;
const avgScore =
  outputData.reduce((sum, row) => sum + parseFloat(row['Match Score']), 0) / totalMatches;
const highConfidence = outputData.filter(
  (row) => parseFloat(row['Match Score']) > 80,
).length;
const mediumConfidence = outputData.filter((row) => {
  const score = parseFloat(row['Match Score']);
  return score >= 60 && score <= 80;
}).length;
const lowConfidence = outputData.filter(
  (row) => parseFloat(row['Match Score']) < 60,
).length;

console.log(`\nMatching Summary:`);
console.log(`- Total players in "mia": ${miaData.length}`);
console.log(`- Successfully matched: ${totalMatches}`);
console.log(`- No match found: ${miaData.length - totalMatches}`);
console.log(`- Average match score: ${avgScore.toFixed(2)}%`);
console.log(`- High confidence (>80%): ${highConfidence}`);
console.log(`- Medium confidence (60-80%): ${mediumConfidence}`);
console.log(`- Low confidence (<60%): ${lowConfidence}`);

console.log(`\nFirst 5 matches:`);
outputData.slice(0, 5).forEach((row) => {
  console.log(
    `  ${row['Nombre (Mia)']} -> ${row['FM2007 Name']} (ID: ${row['FM2007 Unique ID']}, Score: ${row['Match Score']})`,
  );
});
