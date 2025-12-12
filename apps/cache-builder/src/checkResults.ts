import XLSX from 'xlsx';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkResults() {
  const resultsPath = path.join(__dirname, '../../../data/processed/player-matches.xlsx');
  const workbook = XLSX.readFile(resultsPath);
  const sheet = workbook.Sheets['Matches'];
  const data = XLSX.utils.sheet_to_json(sheet);

  const testCases = [
    'Luis Martínez',
    'Taibi',
    'Rui Marques',
    'Kabba',
    'Ivanschitz',
    'G. Petkov',
    'G. Iliev',
  ];

  console.log('Resultados del matching:\n');

  for (const name of testCases) {
    const result = data.find((row: any) => row.NOMBRE === name);

    if (result) {
      console.log(`${name}:`);
      console.log(`  Base ID: ${(result as any)['Base ID']}`);
      console.log(`  Nombre Completo: ${(result as any)['Nombre Completo']}`);
      console.log(`  Match Score: ${(result as any)['Match Score']}%\n`);
    } else {
      console.log(`${name}: NO ENCONTRADO en el archivo de resultados\n`);
    }
  }
}

checkResults().catch(console.error);
