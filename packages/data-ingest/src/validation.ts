import { RawPlayer } from './types';

export interface Table0ValidationOptions {
  requiredColumns?: string[];
  idColumn?: string;
}

export interface Table0ValidationSummary {
  columns: string[];
  missingColumns: string[];
  duplicateIds: string[];
}

const DEFAULT_ID_COLUMN = 'ID';

export function collectColumns(rows: RawPlayer[]): string[] {
  const columnSet = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row ?? {}).forEach((key) => {
      if (key) {
        columnSet.add(key);
      }
    });
  });
  return Array.from(columnSet).sort();
}

export function findMissingColumns(
  columns: Iterable<string>,
  required: string[],
): string[] {
  if (!required.length) {
    return [];
  }
  const columnSet = new Set(Array.from(columns, (column) => column.toLowerCase().trim()));
  return required.reduce<string[]>((missing, column) => {
    if (!columnSet.has(column.toLowerCase().trim())) {
      missing.push(column);
    }
    return missing;
  }, []);
}

export function findDuplicateIds(
  rows: RawPlayer[],
  idColumn: string = DEFAULT_ID_COLUMN,
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  rows.forEach((row, rowIndex) => {
    const raw = row[idColumn];
    if (raw === undefined || raw === null) {
      throw new Error(`Missing "${idColumn}" value at row ${rowIndex + 2}`);
    }
    const key = String(raw).trim();
    if (seen.has(key)) {
      duplicates.add(key);
    } else {
      seen.add(key);
    }
  });
  return Array.from(duplicates).sort();
}

export function validateTable0Dataset(
  rows: RawPlayer[],
  options: Table0ValidationOptions = {},
): Table0ValidationSummary {
  const requiredColumns = options.requiredColumns ?? [];
  const idColumn = options.idColumn ?? DEFAULT_ID_COLUMN;
  const columns = collectColumns(rows);
  const missingColumns = findMissingColumns(columns, requiredColumns);
  if (missingColumns.length) {
    throw new Error(
      `Missing required columns: ${missingColumns.map((col) => `"${col}"`).join(', ')}`,
    );
  }
  const duplicateIds = findDuplicateIds(rows, idColumn);
  if (duplicateIds.length) {
    throw new Error(
      `Duplicate "${idColumn}" values detected: ${duplicateIds.join(', ')}`,
    );
  }
  return {
    columns,
    missingColumns,
    duplicateIds,
  };
}
