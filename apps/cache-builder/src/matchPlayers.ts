import XLSX from 'xlsx';
import * as fs from 'fs';
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

interface MatchResult extends MiaPlayer {
  'Base ID': string;
  'Nombre Completo': string;
  'Mejor Nombre': string;
  'Nacionalidades Canon': string;
  'Match Score': number;
}

const POSITION_MAPPING: Record<string, string[]> = {
  Portero: ['GK'],
  Defensa: ['CB', 'CBT', 'CWP', 'LB', 'RB', 'SB', 'SW', 'SWP', 'WB'],
  Mediocampista: ['AMF', 'CMF', 'DMF', 'LMF', 'RMF', 'SMF'],
  Delantero: ['CF', 'LWF', 'RWF', 'SS', 'WF'],
};

// Mapeo de nacionalidades históricas o alternativas
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
  if (!strValue || strValue === 'undefined') return []; // Handle "undefined" string

  // Split by newlines, pipes (|), commas, or semicolons and filter empty values
  return strValue
    .split(/[\n|,;]+/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v !== 'undefined'); // Also filter out "undefined" from arrays
}

function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function normalizeNationality(nationality: string): string {
  const normalized = normalizeString(nationality);

  // Check if this nationality has aliases
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

    // Direct match
    if (miaNorm === canonNorm) return true;

    // Check if they share any aliases
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

  // Exact match
  if (norm1 === norm2) return 1.0;

  // Split into words for analysis
  const words1 = norm1.split(/\s+/).filter((w) => w.length > 0);
  const words2 = norm2.split(/\s+/).filter((w) => w.length > 0);

  if (words1.length === 0 || words2.length === 0) return 0;

  // Special case: Check if name1 has initials (e.g., "I. Petkov", "V. Iliev", "G. Iliev")
  const hasInitial = words1.some((w) => w.length === 1);

  if (hasInitial && words1.length >= 2) {
    // Extract all initials and the longest word (likely surname)
    const initials: string[] = [];
    let surname = '';

    for (const word of words1) {
      if (word.length === 1) {
        initials.push(word);
      } else if (word.length > surname.length) {
        surname = word;
      }
    }

    // Check if surname matches any word in name2
    if (surname.length >= 3) {
      for (const word2 of words2) {
        if (word2 === surname) {
          // Surname matches! Check if any initial matches
          if (initials.length > 0) {
            // Look for words in name2 that start with any of the initials
            const initialMatch = initials.some((initial) =>
              words2.some((w) => w.startsWith(initial) && w.length > 2),
            );
            return initialMatch ? 0.95 : 0.75; // Very high score if initial+surname match
          }
          return 0.85; // No initial to check, but surname matches
        }
      }
    }
  }

  // Check for common words FIRST (more reliable than substring matching)
  let matchingWords = 0;
  const matchedIndices = new Set<number>();

  for (const word1 of words1) {
    for (let i = 0; i < words2.length; i++) {
      const word2 = words2[i];
      // Skip if already matched or word too short
      if (matchedIndices.has(i) || word1.length < 3) continue;

      if (word1 === word2) {
        matchingWords++;
        matchedIndices.add(i);
        break;
      }
    }
  }

  // If we have word matches, calculate score based on that
  if (matchingWords > 0) {
    const avgWords = (words1.length + words2.length) / 2;
    const wordScore = matchingWords / avgWords;

    // If all words from the shorter name match, give high score
    const minWords = Math.min(words1.length, words2.length);
    if (matchingWords === minWords) {
      return Math.max(wordScore, 0.85); // At least 85% if all words match
    }

    return wordScore;
  }

  // No word matches - now check substring matching as fallback
  if (norm1.length >= 4 && norm2.length >= 4) {
    if (norm1.includes(norm2)) {
      const ratio = norm2.length / norm1.length;
      // Only give high score if the contained string is a significant portion
      if (ratio >= 0.6) {
        return 0.85;
      } else if (ratio >= 0.4) {
        return 0.65;
      }
      // If it's a small substring, give very low score to avoid false positives
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

    // Check which category this position belongs to
    for (const [category, positions] of Object.entries(POSITION_MAPPING)) {
      if (positions.includes(canonPosUpper)) {
        categoriesFound.add(category);

        if (category === miaPosition) {
          hasMatch = true;
        }
      }
    }
  }

  // Multi-category means the player has positions in different categories
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

    // Exact match
    if (diff === 0) return 1.0;

    // Close match (within 2 units for height, 3 units for weight)
    if (diff <= 3) return 0.8;
    if (diff <= 5) return 0.5;
  }

  return 0;
}

function calculateMatchScore(miaPlayer: MiaPlayer, canonPlayer: CanonPlayer): number {
  // First, check nationality - if doesn't match, reject immediately
  const nationalities = parseMultiValueCell(canonPlayer['Nacionalidades']);

  if (nationalities.length > 0) {
    const nationalityMatch = nationalitiesMatch(miaPlayer.NACIONALIDAD, nationalities);
    if (!nationalityMatch) {
      // Nationality is REQUIRED - no match means score = 0
      return 0;
    }
  }

  // Check name similarity - if too low, reject immediately
  const matcheableNames = parseMultiValueCell(canonPlayer['Nombres Matcheables']);
  const fullName = canonPlayer['Nombre Completo'];

  let bestNameScore = 0;
  for (const name of matcheableNames) {
    const similarity = calculateNameSimilarity(miaPlayer.NOMBRE, name);
    bestNameScore = Math.max(bestNameScore, similarity);
  }

  // Also check against full name
  const fullNameSimilarity = calculateNameSimilarity(miaPlayer.NOMBRE, fullName);
  bestNameScore = Math.max(bestNameScore, fullNameSimilarity);

  // Require minimum name similarity to continue (raised to 60%)
  if (bestNameScore < 0.6) return 0;

  // Dynamic weight distribution based on available data
  let score = 0;
  let totalWeight = 0;

  // Name (60 points)
  const baseNameWeight = 60;
  score += bestNameScore * baseNameWeight;
  totalWeight += baseNameWeight;

  // Nationality matching (20 points) - already validated above, so always add
  score += 20;
  totalWeight += 20;

  // Position matching (15 points, 7 if multi-category)
  const positions = parseMultiValueCell(canonPlayer['Posiciones']);
  if (positions.length > 0) {
    const posMatch = matchPosition(miaPlayer.POSITION, positions);
    if (posMatch.match) {
      // Give partial credit if player has positions in multiple categories
      score += posMatch.multiCategory ? 7 : 15;
    }
    totalWeight += 15;
  }

  // Height matching (5 points)
  const heights = parseMultiValueCell(canonPlayer['Alturas']);
  if (heights.length > 0) {
    const heightScore = matchNumericValue(miaPlayer.ALTURA, heights);
    score += heightScore * 5;
    totalWeight += 5;
  }

  // Weight matching (5 points)
  const weights_values = parseMultiValueCell(canonPlayer['Pesos']);
  if (weights_values.length > 0) {
    const weightScore = matchNumericValue(miaPlayer.PESO, weights_values);
    score += weightScore * 5;
    totalWeight += 5;
  }

  // Return normalized score (0-100)
  return totalWeight > 0 ? (score / totalWeight) * 100 : 0;
}

function selectBestName(miaName: string, canonPlayer: CanonPlayer): string {
  const matcheableNames = parseMultiValueCell(canonPlayer['Nombres Matcheables']);
  const fullName = canonPlayer['Nombre Completo'];

  // Collect all possible names including the one from mia
  const allNames = [miaName, fullName, ...matcheableNames];

  // Return the longest name
  let longest = '';
  for (const name of allNames) {
    if (name && name.length > longest.length) {
      longest = name;
    }
  }

  return longest || fullName;
}

function findBestMatch(
  miaPlayer: MiaPlayer,
  canonPlayers: CanonPlayer[],
): { match: CanonPlayer | null; score: number } {
  let bestMatch: CanonPlayer | null = null;
  let bestScore = 0;

  for (const canonPlayer of canonPlayers) {
    const score = calculateMatchScore(miaPlayer, canonPlayer);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = canonPlayer;
    }
  }

  return { match: bestMatch, score: bestScore };
}

async function matchPlayers() {
  const excelPath = path.join(
    __dirname,
    '../../../apps/ui/src/assets/db mia vs canon.xlsx',
  );

  console.log('Reading Excel file:', excelPath);

  if (!fs.existsSync(excelPath)) {
    console.error('File not found:', excelPath);
    return;
  }

  const workbook = XLSX.readFile(excelPath);

  // Read "mia" sheet
  const miaSheet = workbook.Sheets['mia'];
  if (!miaSheet) {
    console.error('Sheet "mia" not found');
    return;
  }

  const miaPlayers: MiaPlayer[] = XLSX.utils.sheet_to_json(miaSheet);
  console.log(`Found ${miaPlayers.length} players in "mia" sheet`);

  // Read "canon" sheet
  const canonSheet = workbook.Sheets['canon'];
  if (!canonSheet) {
    console.error('Sheet "canon" not found');
    return;
  }

  const canonPlayers: CanonPlayer[] = XLSX.utils.sheet_to_json(canonSheet);
  console.log(`Found ${canonPlayers.length} players in "canon" sheet`);

  // Match each player
  const results: MatchResult[] = [];
  const usedCanonIds = new Set<string>();

  // First pass: find best matches
  const matches: Array<{ miaPlayer: MiaPlayer; match: CanonPlayer; score: number }> = [];

  for (const miaPlayer of miaPlayers) {
    const { match, score } = findBestMatch(miaPlayer, canonPlayers);

    if (match) {
      matches.push({ miaPlayer, match, score });
    }
  }

  // Sort by score descending to assign best matches first
  matches.sort((a, b) => b.score - a.score);

  // Assign matches, ensuring unique canon IDs
  // Use player name as key to avoid reference issues
  const finalMatches = new Map<
    string,
    { miaPlayer: MiaPlayer; match: CanonPlayer; score: number }
  >();

  for (const { miaPlayer, match, score } of matches) {
    const playerKey = `${miaPlayer.NOMBRE}|${miaPlayer.NACIONALIDAD}|${miaPlayer.ALTURA}`;

    if (!usedCanonIds.has(match['Base ID']) && !finalMatches.has(playerKey)) {
      usedCanonIds.add(match['Base ID']);
      finalMatches.set(playerKey, { miaPlayer, match, score });
    }
  }

  // Create results
  for (const miaPlayer of miaPlayers) {
    const playerKey = `${miaPlayer.NOMBRE}|${miaPlayer.NACIONALIDAD}|${miaPlayer.ALTURA}`;
    const matchInfo = finalMatches.get(playerKey);

    if (matchInfo) {
      const bestName = selectBestName(miaPlayer.NOMBRE, matchInfo.match);
      const canonNationalities = parseMultiValueCell(
        matchInfo.match['Nacionalidades'],
      ).join(' | ');

      results.push({
        ...miaPlayer,
        'Base ID': matchInfo.match['Base ID'],
        'Nombre Completo': matchInfo.match['Nombre Completo'],
        'Mejor Nombre': bestName,
        'Nacionalidades Canon': canonNationalities,
        'Match Score': Math.round(matchInfo.score),
      });
    } else {
      results.push({
        ...miaPlayer,
        'Base ID': 'NO_MATCH',
        'Nombre Completo': 'NO_MATCH',
        'Mejor Nombre': miaPlayer.NOMBRE,
        'Nacionalidades Canon': '',
        'Match Score': 0,
      });
    }
  }

  // Write results to a new Excel file
  const outputPath = path.join(__dirname, '../../../data/processed/player-matches.xlsx');
  const outputWorkbook = XLSX.utils.book_new();
  const outputSheet = XLSX.utils.json_to_sheet(results);

  XLSX.utils.book_append_sheet(outputWorkbook, outputSheet, 'Matches');
  XLSX.writeFile(outputWorkbook, outputPath);

  console.log(`\nResults written to: ${outputPath}`);
  console.log(`\nMatching Summary:`);
  console.log(`- Total players in "mia": ${miaPlayers.length}`);
  console.log(
    `- Successfully matched: ${results.filter((r) => r['Base ID'] !== 'NO_MATCH').length}`,
  );
  console.log(
    `- No match found: ${results.filter((r) => r['Base ID'] === 'NO_MATCH').length}`,
  );

  // Show some statistics
  const scores = results.filter((r) => r['Match Score'] > 0).map((r) => r['Match Score']);
  if (scores.length > 0) {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    console.log(`- Average match score: ${avgScore.toFixed(2)}%`);
    console.log(
      `- High confidence (>80%): ${results.filter((r) => r['Match Score'] > 80).length}`,
    );
    console.log(
      `- Medium confidence (60-80%): ${results.filter((r) => r['Match Score'] >= 60 && r['Match Score'] <= 80).length}`,
    );
    console.log(
      `- Low confidence (<60%): ${results.filter((r) => r['Match Score'] > 0 && r['Match Score'] < 60).length}`,
    );
  }

  // Show first few matches as examples
  console.log(`\nFirst 5 matches:`);
  results.slice(0, 5).forEach((r) => {
    console.log(
      `  ${r.NOMBRE} -> ${r['Nombre Completo']} (ID: ${r['Base ID']}, Score: ${r['Match Score']}%)`,
    );
  });
}

matchPlayers().catch(console.error);
