import { describe, expect, test } from 'vitest';
import {
  collectColumns,
  findMissingColumns,
  validateTable0Dataset,
} from '../src/validation';

const sampleRows = [
  { ID: 1, NAME: 'Jugador 1', ATTACK: 80 },
  { ID: 2, NAME: 'Jugador 2', ATTACK: 75 },
];

describe('validation helpers', () => {
  test('collectColumns merges keys from all rows', () => {
    const columns = collectColumns(sampleRows);
    expect(columns).toEqual(['ATTACK', 'ID', 'NAME']);
  });

  test('findMissingColumns is case-insensitive', () => {
    const missing = findMissingColumns(['ID', 'NAME'], ['ID', 'Name', 'AGE']);
    expect(missing).toEqual(['AGE']);
  });

  test('validateTable0Dataset throws on duplicates', () => {
    expect(() =>
      validateTable0Dataset(
        [
          { ID: 1, NAME: 'Jugador 1' },
          { ID: 1, NAME: 'Jugador 2' },
        ],
        { requiredColumns: ['ID', 'NAME'] },
      ),
    ).toThrow(/Duplicate/);
  });

  test('validateTable0Dataset throws on missing columns', () => {
    expect(() =>
      validateTable0Dataset(sampleRows, { requiredColumns: ['ID', 'AGE'] }),
    ).toThrow(/Missing required columns/);
  });

  test('validateTable0Dataset returns summary when ok', () => {
    const summary = validateTable0Dataset(sampleRows, {
      requiredColumns: ['ID', 'NAME'],
    });
    expect(summary.columns).toContain('NAME');
  });
});
