import { describe, expect, test } from 'vitest';
import { utils, writeFile } from 'xlsx';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readTable0FromXlsx, buildRawPlayerIndex } from '../src';

function createTempWorkbook(rows: Record<string, unknown>[]) {
  const wb = utils.book_new();
  const sheet = utils.json_to_sheet(rows);
  utils.book_append_sheet(wb, sheet, '0');
  const dir = mkdtempSync(join(tmpdir(), 'anfpes-'));
  const filePath = join(dir, 'table0.xlsx');
  writeFile(wb, filePath);
  return { filePath, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

describe('table 0 reader', () => {
  test('reads rows and preserves columns', () => {
    const { filePath, cleanup } = createTempWorkbook([
      { ID: 1, NAME: 'Jugador 1', ATTACK: 80 },
      { ID: 2, NAME: 'Jugador 2', ATTACK: 75 },
    ]);
    try {
      const rows = readTable0FromXlsx(filePath);
      expect(rows).toHaveLength(2);
      expect(rows[0].NAME).toBe('Jugador 1');
    } finally {
      cleanup();
    }
  });

  test('builds index by ID and detects duplicates', () => {
    const rows = [
      { ID: 1, NAME: 'Jugador 1' },
      { ID: 2, NAME: 'Jugador 2' },
    ];
    const index = buildRawPlayerIndex(rows);
    expect(index.get('1')?.NAME).toBe('Jugador 1');
    expect(() => buildRawPlayerIndex([{ ID: 1 }, { ID: 1 }])).toThrow(/Duplicate "ID"/);
  });
});
