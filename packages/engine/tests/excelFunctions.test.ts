import { describe, expect, test } from 'vitest';
import { average, ifError, ifFn, matchExact, vlookup } from '../src/excel/functions';

describe('Excel-like helpers', () => {
  test('ifFn selects the branch correctly', () => {
    expect(
      ifFn(
        true,
        () => 'yes',
        () => 'no',
      ),
    ).toBe('yes');
  });

  test('ifError falls back when producer throws', () => {
    const result = ifError(
      () => {
        throw new Error('boom');
      },
      () => 'fallback',
    );
    expect(result).toBe('fallback');
  });

  test('vlookup matches values case-insensitively', () => {
    const table = [
      { key: 'Alpha', value: 10 },
      { key: 'Beta', value: 20 },
    ];
    const value = vlookup(
      'beta',
      table,
      (row) => row.key,
      (row) => row.value,
    );
    expect(value).toBe(20);
  });

  test('matchExact returns index', () => {
    expect(matchExact('B', ['A', 'B', 'C'])).toBe(1);
  });

  test('average ignores nulls', () => {
    expect(average([10, null, 20])).toBe(15);
    expect(average([null, undefined])).toBeNull();
  });
});
