import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import XLSX from 'xlsx';

interface Args {
  workbook: string;
  sheet: string;
  outputDir: string;
}

function parseArgs(): Args {
  const [, , workbookArg, sheetArg = '1', outputArg = 'data/reference'] = process.argv;
  if (!workbookArg) {
    console.error(
      'Usage: npm run export:sheet1 -- <workbook.xlsx> [sheetName] [outputDir]',
    );
    process.exit(1);
  }
  return {
    workbook: resolve(process.cwd(), workbookArg),
    sheet: sheetArg,
    outputDir: resolve(process.cwd(), outputArg),
  };
}

export function exportSheetToJson(args: Args) {
  const { workbook, sheet, outputDir } = args;
  const wb = XLSX.readFile(workbook, { cellDates: false });
  const ws = wb.Sheets[sheet];
  if (!ws) {
    throw new Error(`Sheet "${sheet}" not found in ${workbook}`);
  }
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
  mkdirSync(outputDir, { recursive: true });
  const outPath = join(outputDir, `${sheet}.json`);
  writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf-8');
  console.log(`Exported ${rows.length} rows from sheet ${sheet} to ${outPath}`);
}

function main() {
  const args = parseArgs();
  exportSheetToJson(args);
}

main();
