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
    .split(/[\n,;]+/)
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

async function diagnosePlayer(playerName: string) {
  const excelPath = path.join(
    __dirname,
    '../../../apps/ui/src/assets/db mia vs canon.xlsx',
  );
  const workbook = XLSX.readFile(excelPath);

  // Read "mia" sheet
  const miaSheet = workbook.Sheets['mia'];
  const miaPlayers: MiaPlayer[] = XLSX.utils.sheet_to_json(miaSheet);

  // Read "canon" sheet
  const canonSheet = workbook.Sheets['canon'];
  const canonPlayers: CanonPlayer[] = XLSX.utils.sheet_to_json(canonSheet);

  // Find the player in mia
  const player = miaPlayers.find((p) =>
    normalizeString(p.NOMBRE).includes(normalizeString(playerName)),
  );

  if (!player) {
    console.log(`\n❌ Player "${playerName}" not found in "mia" sheet`);
    return;
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 Analyzing: ${player.NOMBRE}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`\nData from "mia":`);
  console.log(`  - Nombre: ${player.NOMBRE}`);
  console.log(`  - Nacionalidad: ${player.NACIONALIDAD}`);
  console.log(`  - Altura: ${player.ALTURA}`);
  console.log(`  - Peso: ${player.PESO}`);
  console.log(`  - Pie: ${player.PIE}`);
  console.log(`  - Position: ${player.POSITION}`);

  // Search for potential matches in canon
  const playerNormalized = normalizeString(player.NOMBRE);
  const words = playerNormalized.split(/\s+/).filter((w) => w.length >= 3);

  console.log(`\n🔍 Searching in canon for name variations...`);
  console.log(`  Normalized name: "${playerNormalized}"`);
  console.log(`  Key words: ${words.join(', ')}`);

  const potentialMatches: Array<{
    canon: CanonPlayer;
    matcheableNames: string[];
    matchReasons: string[];
  }> = [];

  for (const canon of canonPlayers) {
    const matcheableNames = parseMultiValueCell(canon['Nombres Matcheables']);
    const fullName = canon['Nombre Completo'];
    const allNames = [...matcheableNames, fullName];

    const matchReasons: string[] = [];

    for (const name of allNames) {
      const canonNormalized = normalizeString(name);

      // Check for exact match
      if (canonNormalized === playerNormalized) {
        matchReasons.push(`Exact match: "${name}"`);
      }

      // Check if canon contains player name
      else if (
        canonNormalized.includes(playerNormalized) &&
        playerNormalized.length >= 4
      ) {
        matchReasons.push(`Contains: "${name}"`);
      }

      // Check if player name contains canon
      else if (
        playerNormalized.includes(canonNormalized) &&
        canonNormalized.length >= 4
      ) {
        matchReasons.push(`Contained in: "${name}"`);
      }

      // Check for word matches
      else {
        const canonWords = canonNormalized.split(/\s+/).filter((w) => w.length >= 3);
        const commonWords = words.filter((w) => canonWords.includes(w));

        if (
          commonWords.length > 0 &&
          commonWords.length >= Math.min(words.length, canonWords.length) * 0.5
        ) {
          matchReasons.push(`Word match (${commonWords.join(', ')}): "${name}"`);
        }
      }
    }

    if (matchReasons.length > 0) {
      potentialMatches.push({
        canon,
        matcheableNames: allNames,
        matchReasons,
      });
    }
  }

  if (potentialMatches.length === 0) {
    console.log(`\n❌ NO POTENTIAL MATCHES FOUND IN CANON`);
    console.log(`\nPossible reasons:`);
    console.log(`  1. Player name is spelled differently in canon`);
    console.log(`  2. Player doesn't exist in canon database`);
    console.log(
      `  3. Name format is significantly different (e.g., initials vs full name)`,
    );

    // Try fuzzy search with relaxed rules
    console.log(`\n🔍 Trying relaxed search (any word match)...`);

    for (const canon of canonPlayers) {
      const matcheableNames = parseMultiValueCell(canon['Nombres Matcheables']);
      const fullName = canon['Nombre Completo'];
      const allNames = [...matcheableNames, fullName];

      for (const name of allNames) {
        const canonNormalized = normalizeString(name);
        const canonWords = canonNormalized.split(/\s+/).filter((w) => w.length >= 3);

        for (const word of words) {
          if (canonWords.includes(word)) {
            console.log(`  - Found "${word}" in: ${fullName} (ID: ${canon['Base ID']})`);
            console.log(
              `    Matcheable names: ${matcheableNames.slice(0, 3).join(', ')}${matcheableNames.length > 3 ? '...' : ''}`,
            );
            break;
          }
        }
      }
    }
  } else {
    console.log(`\n✅ Found ${potentialMatches.length} potential match(es):\n`);

    potentialMatches.slice(0, 10).forEach((match, idx) => {
      console.log(
        `${idx + 1}. ${match.canon['Nombre Completo']} (ID: ${match.canon['Base ID']})`,
      );
      console.log(
        `   Matcheable names: ${match.matcheableNames.slice(0, 3).join(', ')}${match.matcheableNames.length > 3 ? '...' : ''}`,
      );
      console.log(`   Match reasons: ${match.matchReasons.join(', ')}`);

      const nationalities = parseMultiValueCell(match.canon['Nacionalidades']);
      const positions = parseMultiValueCell(match.canon['Posiciones']);
      const heights = parseMultiValueCell(match.canon['Alturas']);
      const weights = parseMultiValueCell(match.canon['Pesos']);

      console.log(`   Data:`);
      console.log(
        `     - Nacionalidades: ${nationalities.length > 0 ? nationalities.join(', ') : '(vacío)'}`,
      );
      console.log(
        `     - Posiciones: ${positions.length > 0 ? positions.join(', ') : '(vacío)'}`,
      );
      console.log(
        `     - Alturas: ${heights.length > 0 ? heights.join(', ') : '(vacío)'}`,
      );
      console.log(`     - Pesos: ${weights.length > 0 ? weights.join(', ') : '(vacío)'}`);
      console.log('');
    });

    if (potentialMatches.length > 10) {
      console.log(`   ... and ${potentialMatches.length - 10} more matches`);
    }
  }
}

async function main() {
  const players = ['Dober'];

  for (const player of players) {
    await diagnosePlayer(player);
  }
}

main().catch(console.error);
