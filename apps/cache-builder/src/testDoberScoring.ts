import XLSX from 'xlsx';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copy all the functions from matchPlayers.ts but add logging
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

  console.log(`    Checking nationality: "${mia}" (normalized: "${miaNorm}")`);
  console.log(`    Against canon list: [${canonList.join(', ')}]`);

  for (const canon of canonList) {
    const canonNorm = normalizeNationality(canon);
    console.log(`      - "${canon}" (normalized: "${canonNorm}")`);

    if (miaNorm === canonNorm) {
      console.log(`        ✅ MATCH!`);
      return true;
    }

    const miaAliases = NATIONALITY_ALIASES[miaNorm] || [miaNorm];
    const canonAliases = NATIONALITY_ALIASES[canonNorm] || [canonNorm];

    for (const miaAlias of miaAliases) {
      for (const canonAlias of canonAliases) {
        if (normalizeString(miaAlias) === normalizeString(canonAlias)) {
          console.log(`        ✅ MATCH via alias!`);
          return true;
        }
      }
    }
  }

  console.log(`      ❌ No match found`);
  return false;
}

async function testDoberScoring() {
  const excelPath = path.join(
    __dirname,
    '../../../apps/ui/src/assets/db mia vs canon.xlsx',
  );
  const workbook = XLSX.readFile(excelPath);

  const miaSheet = workbook.Sheets['mia'];
  const miaPlayers = XLSX.utils.sheet_to_json(miaSheet);

  const canonSheet = workbook.Sheets['canon'];
  const canonPlayers = XLSX.utils.sheet_to_json(canonSheet);

  const dober = miaPlayers.find((p: any) => p.NOMBRE === 'Dober');
  const andreasD = canonPlayers.find((c: any) => c['Base ID'] === '32811');

  if (!dober || !andreasD) {
    console.log('No encontrado');
    return;
  }

  console.log('='.repeat(80));
  console.log('SCORING TEST: Dober vs Andreas Dober');
  console.log('='.repeat(80));

  console.log('\n1. Checking nationality (REQUIRED):');
  const nationalities = parseMultiValueCell((andreasD as any)['Nacionalidades']);
  console.log(`  Nationalities in canon: [${nationalities.join(', ')}]`);

  if (nationalities.length > 0) {
    const nationalityMatch = nationalitiesMatch(
      (dober as any).NACIONALIDAD,
      nationalities,
    );
    console.log(`  Result: ${nationalityMatch ? '✅ PASS' : '❌ FAIL - Score = 0'}`);

    if (!nationalityMatch) {
      console.log('\n❌ REJECTED: Nationality mismatch');
      return;
    }
  }

  console.log('\n✅ Nationality check passed, continuing...');
}

testDoberScoring().catch(console.error);
