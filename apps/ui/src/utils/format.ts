import type { DerivedPlayer } from '@anfpes/engine';

export type PlayerValue = DerivedPlayer[keyof DerivedPlayer];

export function formatPlayerValue(value: PlayerValue, digits = 2): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'number') {
    return value.toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    });
  }

  return String(value);
}

export function ensureNumber(value: PlayerValue): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}
