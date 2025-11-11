import XLSX from 'xlsx';
import type { WorkBook } from 'xlsx';
import { RawPlayer } from './types';

export interface ReadTable0Options {
  sheetName?: string;
  idColumn?: string;
}

const DEFAULT_SHEET = '0';
const DEFAULT_ID_COLUMN = 'ID';

export function readTable0FromXlsx(
  filePath: string,
  options: ReadTable0Options = {},
): RawPlayer[] {
  const sheetName = options.sheetName ?? DEFAULT_SHEET;
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found in ${filePath}`);
  }
  return sheetToPlayers(workbook, sheetName);
}

export function sheetToPlayers(workbook: WorkBook, sheetName: string): RawPlayer[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
  const json = XLSX.utils.sheet_to_json<RawPlayer>(sheet, {
    defval: null,
    blankrows: false,
    raw: true,
  });
  return json;
}

export function buildRawPlayerIndex(
  players: RawPlayer[],
  idColumn: string = DEFAULT_ID_COLUMN,
): Map<string, RawPlayer> {
  const index = new Map<string, RawPlayer>();
  players.forEach((player, rowIndex) => {
    const idValue = player[idColumn];
    if (idValue === undefined || idValue === null) {
      throw new Error(`Missing "${idColumn}" value at row ${rowIndex + 2}`);
    }
    const key = String(idValue).trim();
    if (index.has(key)) {
      throw new Error(`Duplicate "${idColumn}" detected: ${key}`);
    }
    index.set(key, player);
  });
  return index;
}
