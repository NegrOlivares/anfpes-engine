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
  PT: '#e9b407', // Amarillo
  GK: '#e9b407',
  LIB: '#1975d2', // Azul claro
  SWP: '#1975d2',
  CT: '#1975d2',
  CB: '#1975d2',
  DD: '#1975d2',
  RB: '#1975d2',
  DI: '#1975d2',
  LB: '#1975d2',
  SA: '#1975d2',
  SB: '#1975d2',
  CCD: '#09a959', // Verde
  DMF: '#09a959',
  DLD: '#09a959',
  RWB: '#09a959',
  DLI: '#09a959',
  LWB: '#09a959',
  LA: '#09a959',
  WB: '#09a959',
  CC: '#09a959',
  CMF: '#09a959',
  CIZ: '#09a959',
  LMF: '#09a959',
  CDR: '#09a959',
  RMF: '#09a959',
  VOL: '#09a959',
  SMF: '#09a959',
  MP: '#09a959',
  AMF: '#09a959',
  SD: '#fc2626', // Rojo
  SS: '#fc2626',
  EI: '#fc2626',
  LWF: '#fc2626',
  ED: '#fc2626',
  RWF: '#fc2626',
  EX: '#fc2626',
  WF: '#fc2626',
  DC: '#fc2626',
  CF: '#fc2626',
};

export function getStatColor(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numValue = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numValue)) {
    return null;
  }

  const rounded = Math.round(numValue);

  // Rango 30-99
  if (rounded >= 10 && rounded <= 120) {
    if (rounded >= 100) return '#dc32f3ff'; // Purpura más intenso
    if (rounded >= 95) return '#fc2626'; // Rojo más intenso
    if (rounded >= 90) return '#ff8800'; // Naranja intenso
    if (rounded >= 80) return '#ffdd00'; // Amarillo brillante
    if (rounded >= 75) return '#00ff00'; // Verde brillante
    if (rounded >= 10) return '#ffffffff'; // Blanco
    return null; // Sin color hasta 74
  }

  // Rango 1-8
  if (rounded >= 1 && rounded <= 8) {
    if (rounded === 8) return '#fc2626'; // Rojo más intenso
    if (rounded === 7) return '#ff8800'; // Naranja intenso
    if (rounded === 6) return '#ffdd00'; // Amarillo brillante
    return null; // Sin color hasta 5
  }

  return null;
}

export function getInjuryColor(value: string | null | undefined): string | null {
  if (!value) return null;

  const upper = String(value).toUpperCase();
  if (upper === 'A') return '#fc2626'; // Rojo más intenso
  if (upper === 'B') return '#e9b407'; // Amarillo
  // C sin color
  return null;
}
