import { readFileSync } from 'node:fs';
import type { RawPlayer } from '@anfpes/data-ingest';
import { readTable0FromXlsx } from '@anfpes/data-ingest';

export function loadRawPlayers(tablePath: string): RawPlayer[] {
  if (tablePath.toLowerCase().endsWith('.json')) {
    const payload = readFileSync(tablePath, 'utf-8');
    const data = JSON.parse(payload);
    if (!Array.isArray(data)) {
      throw new Error(`Expected array in ${tablePath}`);
    }
    return data as RawPlayer[];
  }
  return readTable0FromXlsx(tablePath);
}
