import XLSX from 'xlsx';

const EXCEL_PATH =
  'C:\\Users\\usuario\\Desktop\\anfpes-engine\\apps\\ui\\src\\assets\\db mia vs canon.xlsx';

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

console.log('Reading Excel...');
const workbook = XLSX.readFile(EXCEL_PATH);

const canonSheet = workbook.Sheets['canon'];
const canonData = XLSX.utils.sheet_to_json(canonSheet);

const andreasD = canonData.find((row: any) => row['Base ID'] === 32811);

console.log('\nAndreas Dober raw data:');
console.log('  Posiciones:', andreasD?.['Posiciones']);
console.log('  Alturas:', andreasD?.['Alturas']);
console.log('  Pesos:', andreasD?.['Pesos']);

console.log('\nAfter parseMultiValueCell:');
console.log('  Posiciones:', parseMultiValueCell(andreasD?.['Posiciones']));
console.log('  Alturas:', parseMultiValueCell(andreasD?.['Alturas']));
console.log('  Pesos:', parseMultiValueCell(andreasD?.['Pesos']));

// Test the string directly
console.log('\nDirect string test:');
console.log('  "undefined" === "undefined":', 'undefined' === 'undefined');
console.log('  String(undefined):', String(undefined));
console.log('  parseMultiValueCell("undefined"):', parseMultiValueCell('undefined'));
console.log('  parseMultiValueCell(undefined):', parseMultiValueCell(undefined));
