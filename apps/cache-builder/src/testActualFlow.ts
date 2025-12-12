import XLSX from 'xlsx';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the ACTUAL functions from matchPlayers
async function testActualFlow() {
  const excelPath = path.join(
    __dirname,
    '../../../apps/ui/src/assets/db mia vs canon.xlsx',
  );

  if (!fs.existsSync(excelPath)) {
    console.error('File not found');
    return;
  }

  const workbook = XLSX.readFile(excelPath);

  const miaSheet = workbook.Sheets['mia'];
  const miaPlayers = XLSX.utils.sheet_to_json(miaSheet);

  const canonSheet = workbook.Sheets['canon'];
  const canonPlayers = XLSX.utils.sheet_to_json(canonSheet);

  const dober = miaPlayers.find((p: any) => p.NOMBRE === 'Dober');

  if (!dober) {
    console.log('Dober not found');
    return;
  }

  console.log('Dober found in mia:', dober);
  console.log('\nDober object type:', typeof dober);
  console.log('Dober keys:', Object.keys(dober));

  // Check if it's being added to matches array
  const matches: any[] = [];

  // Simulate findBestMatch inline
  let bestMatch: any = null;
  let bestScore = 0;

  for (const canonPlayer of canonPlayers) {
    // Simulate scoring (just check if Andreas Dober exists)
    if ((canonPlayer as any)['Base ID'] === '32811') {
      bestMatch = canonPlayer;
      bestScore = 88.8;
      console.log('\nFound Andreas Dober as best match!');
      console.log('Andreas object:', canonPlayer);
      break;
    }
  }

  console.log(`\nbestMatch: ${bestMatch ? 'NOT NULL' : 'NULL'}`);
  console.log(`bestScore: ${bestScore}`);

  if (bestMatch) {
    matches.push({ miaPlayer: dober, match: bestMatch, score: bestScore });
    console.log(`\nAdded to matches array. Length: ${matches.length}`);
  }

  // Sort
  matches.sort((a, b) => b.score - a.score);

  console.log(`\nAfter sort, matches length: ${matches.length}`);

  // Create finalMatches
  const usedCanonIds = new Set<string>();
  const finalMatches = new Map<string, any>();

  for (const { miaPlayer, match, score } of matches) {
    const playerKey = `${miaPlayer.NOMBRE}|${miaPlayer.NACIONALIDAD}|${miaPlayer.ALTURA}`;
    console.log(`\nProcessing match for key: ${playerKey}`);
    console.log(`  Canon ID: ${match['Base ID']}`);
    console.log(`  Used already? ${usedCanonIds.has(match['Base ID'])}`);
    console.log(`  Key exists in map? ${finalMatches.has(playerKey)}`);

    if (!usedCanonIds.has(match['Base ID']) && !finalMatches.has(playerKey)) {
      usedCanonIds.add(match['Base ID']);
      finalMatches.set(playerKey, { miaPlayer, match, score });
      console.log(`  ✅ Added to finalMatches!`);
    }
  }

  console.log(`\nfinalMatches size: ${finalMatches.size}`);

  // Now try to retrieve
  const playerKey = `${(dober as any).NOMBRE}|${(dober as any).NACIONALIDAD}|${(dober as any).ALTURA}`;
  console.log(`\nLooking up key: ${playerKey}`);
  const matchInfo = finalMatches.get(playerKey);
  console.log(`Result: ${matchInfo ? 'FOUND' : 'NOT FOUND'}`);

  if (matchInfo) {
    console.log('Match info:', matchInfo);
  }
}

testActualFlow().catch(console.error);
