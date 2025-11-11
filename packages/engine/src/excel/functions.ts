import type { DerivedFieldValue } from '../types';

export class ExcelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExcelError';
  }
}

export function ifFn<T>(condition: boolean, whenTrue: () => T, whenFalse: () => T): T {
  return condition ? whenTrue() : whenFalse();
}

export function ifError<T>(producer: () => T, fallback: () => T): T {
  try {
    return producer();
  } catch {
    return fallback();
  }
}

export function vlookup<T, Row>(
  key: DerivedFieldValue,
  table: readonly Row[],
  keySelector: (row: Row) => DerivedFieldValue,
  valueSelector: (row: Row) => T,
): T {
  for (const row of table) {
    if (normalize(keySelector(row)) === normalize(key)) {
      return valueSelector(row);
    }
  }
  throw new ExcelError('VLOOKUP_NOT_FOUND');
}

export function matchExact(
  value: DerivedFieldValue,
  entries: readonly DerivedFieldValue[],
): number {
  const normalized = normalize(value);
  for (let i = 0; i < entries.length; i += 1) {
    if (normalize(entries[i]) === normalized) {
      return i;
    }
  }
  throw new ExcelError('MATCH_NOT_FOUND');
}

export function indexRow<T>(rows: readonly T[], position: number): T {
  if (position < 0 || position >= rows.length) {
    throw new ExcelError('INDEX_OUT_OF_RANGE');
  }
  return rows[position];
}

export function average(values: Array<number | null | undefined>): number | null {
  const filtered = values.filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );
  if (!filtered.length) {
    return null;
  }
  const sum = filtered.reduce((acc, value) => acc + value, 0);
  return Math.round((sum / filtered.length) * 100) / 100;
}

function normalize(value: DerivedFieldValue): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return value.trim().toLowerCase();
  }
  return String(value);
}
