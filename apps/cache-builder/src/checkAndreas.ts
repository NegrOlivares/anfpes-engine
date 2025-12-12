import XLSX from 'xlsx';
import * as path from 'path';

const resultsPath = path.join(process.cwd(), 'data/processed/player-matches.xlsx');
const wb = XLSX.readFile(resultsPath);
const data = XLSX.utils.sheet_to_json(wb.Sheets['Matches']);

const andreas = data.filter((r: any) => r['Base ID'] === '32811');
console.log(`Jugadores con Base ID 32811: ${andreas.length}`);
andreas.forEach((p: any) => console.log(`  - ${p.NOMBRE} (Score: ${p['Match Score']}%)`));
