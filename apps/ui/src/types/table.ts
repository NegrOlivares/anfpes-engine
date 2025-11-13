import type { DerivedPlayer } from '@anfpes/engine';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: keyof DerivedPlayer;
  direction: SortDirection;
}

export interface ColumnConfig {
  key: keyof DerivedPlayer;
  label: string;
  visible: boolean;
  sortable: boolean;
  width?: string;
  type?: 'text' | 'number' | 'stat' | 'rating' | 'injury';
}

export const POSITION_COLORS: Record<string, string> = {
  PT: '#ffd700', // Amarillo
  GK: '#ffd700',
  LIB: '#87ceeb', // Azul claro
  SWP: '#87ceeb',
  CT: '#87ceeb',
  CB: '#87ceeb',
  DD: '#87ceeb',
  RB: '#87ceeb',
  DI: '#87ceeb',
  LB: '#87ceeb',
  SA: '#87ceeb',
  SB: '#87ceeb',
  CCD: '#90ee90', // Verde
  DMF: '#90ee90',
  CC: '#90ee90',
  CMF: '#90ee90',
  CIZ: '#90ee90',
  LMF: '#90ee90',
  CDR: '#90ee90',
  RMF: '#90ee90',
  MP: '#90ee90',
  AMF: '#90ee90',
  DLD: '#87ceeb',
  RWB: '#87ceeb',
  DLI: '#87ceeb',
  LWB: '#87ceeb',
  VOL: '#90ee90',
  SD: '#ff6b6b', // Rojo
  SS: '#ff6b6b',
  EI: '#ff6b6b',
  LWF: '#ff6b6b',
  ED: '#ff6b6b',
  RWF: '#ff6b6b',
  DC: '#ff6b6b',
  CF: '#ff6b6b',
  EX: '#90ee90',
  LA: '#87ceeb',
};

export function getStatColor(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numValue = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numValue)) {
    return null;
  }

  // Rango 30-99
  if (numValue >= 30 && numValue <= 99) {
    if (numValue >= 95) return '#ff4444'; // Rojo más intenso
    if (numValue >= 90) return '#ff8800'; // Naranja intenso
    if (numValue >= 80) return '#ffdd00'; // Amarillo brillante
    if (numValue >= 75) return '#00ff00'; // Verde brillante
    return null; // Sin color hasta 74
  }

  // Rango 1-8
  if (numValue >= 1 && numValue <= 8) {
    if (numValue === 8) return '#ff4444'; // Rojo más intenso
    if (numValue === 7) return '#ff8800'; // Naranja intenso
    if (numValue === 6) return '#ffdd00'; // Amarillo brillante
    return null; // Sin color hasta 5
  }

  return null;
}

export function getInjuryColor(value: string | null | undefined): string | null {
  if (!value) return null;

  const upper = String(value).toUpperCase();
  if (upper === 'A') return '#ff4444'; // Rojo más intenso
  if (upper === 'B') return '#ffd700'; // Amarillo
  // C sin color
  return null;
}
