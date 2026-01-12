import type { DerivedPlayer } from '@anfpes/engine';
import type React from 'react';
import type { FilterCondition } from '../hooks/usePlayerViews';
import { POSITION_COLORS } from '../types/table';
import { ANFPES_CLUBS } from '../data/playerStatus';
import { getFieldFilterValue, SPECIAL_SKILL_FIELDS } from './playerDisplay';

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'gte'
  | 'lte'
  | 'between';

export const POSITION_CODES = [
  { code: 'GK', label: 'PT', color: POSITION_COLORS.PT },
  { code: 'SWP', label: 'LIB', color: POSITION_COLORS.LIB },
  { code: 'CB', label: 'CT', color: POSITION_COLORS.CT },
  { code: 'SB', label: 'SA', color: POSITION_COLORS.SA },
  { code: 'RB', label: 'DD', color: POSITION_COLORS.DD },
  { code: 'LB', label: 'DI', color: POSITION_COLORS.DI },
  { code: 'DMF', label: 'CCD', color: POSITION_COLORS.CCD },
  { code: 'WB', label: 'LA', color: POSITION_COLORS.LA },
  { code: 'RWB', label: 'DLD', color: POSITION_COLORS.DLD },
  { code: 'LWB', label: 'DLI', color: POSITION_COLORS.DLI },
  { code: 'CMF', label: 'CC', color: POSITION_COLORS.CC },
  { code: 'SMF', label: 'VOL', color: POSITION_COLORS.VOL },
  { code: 'RMF', label: 'CDR', color: POSITION_COLORS.CDR },
  { code: 'LMF', label: 'CIZ', color: POSITION_COLORS.CIZ },
  { code: 'AMF', label: 'MP', color: POSITION_COLORS.MP },
  { code: 'WF', label: 'EX', color: POSITION_COLORS.EX },
  { code: 'RWF', label: 'ED', color: POSITION_COLORS.ED },
  { code: 'LWF', label: 'EI', color: POSITION_COLORS.EI },
  { code: 'SS', label: 'SD', color: POSITION_COLORS.SD },
  { code: 'CF', label: 'DC', color: POSITION_COLORS.DC },
];

export const DEMARCATION_COLUMNS = [
  'D',
  'E',
  'M',
  'A',
  'R',
  'C',
  'A_1',
  'C_1',
  'I',
  'O',
  'N',
] as const;

export const STATIC_FIELD_OPTIONS: Record<string, string[]> = {
  PIE: ['Derecho', 'Izquierdo', 'Ambos'],
  'FAVOURED SIDE': ['Derecho', 'Izquierdo', 'Ambos'],
  'SKIN COLOR': ['Claro', 'Medio', 'Moreno', 'Negro'],
  'TOLERANCIA LESIONES': ['A', 'B', 'C'],
  CONSISTENCIA: ['1', '2', '3', '4', '5', '6', '7', '8'],
  'CONDICIÓN FITNESS': ['1', '2', '3', '4', '5', '6', '7', '8'],
  'PRECICIÓN PIE MALO': ['1', '2', '3', '4', '5', '6', '7', '8'],
  'FRECUENCIA PIE MALO': ['1', '2', '3', '4', '5', '6', '7', '8'],
  'nro selección': ['Si', 'No'],
  'nro clasico': ['Si', 'No'],
  ANFPES: ['Si', 'No'],
};

export const DYNAMIC_OPTION_FIELDS = new Set(['NACIONALIDAD', 'CLUB']);

SPECIAL_SKILL_FIELDS.forEach((field) => {
  STATIC_FIELD_OPTIONS[field] = ['Si', 'No'];
});

export const OPERATOR_OPTIONS: Array<{
  value: FilterOperator;
  label: string;
  needsSecond?: boolean;
}> = [
  { value: 'eq', label: 'Es exactamente' },
  { value: 'neq', label: 'No es exactamente' },
  { value: 'contains', label: 'Contiene' },
  { value: 'not_contains', label: 'No contiene' },
  { value: 'starts_with', label: 'Comienza con' },
  { value: 'gte', label: 'Es mayor o igual que' },
  { value: 'lte', label: 'Es menor o igual que' },
  { value: 'between', label: 'Es entre', needsSecond: true },
];

const AMBIDEXTROUS_EQUIVALENCE: Record<string, string[]> = {
  SB: ['RB', 'LB'],
  WB: ['RWB', 'LWB'],
  SMF: ['RMF', 'LMF'],
  WF: ['RWF', 'LWF'],
};

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value.replace(',', '.'));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

export function evaluateFilter(filter: FilterCondition, player: DerivedPlayer): boolean {
  if (filter.field === 'ANFPES') {
    const playerClub = player.CLUB as string;
    const isAnfpesClub = ANFPES_CLUBS.has(playerClub);
    const filterValue = filter.value.trim().toLowerCase();

    if (filterValue === 'si') {
      return isAnfpesClub;
    } else if (filterValue === 'no') {
      return !isAnfpesClub;
    }
    return true;
  }

  const rawValue = player[filter.field as keyof DerivedPlayer];
  const displayValue = getFieldFilterValue(filter.field as keyof DerivedPlayer, player);
  const normalizedDisplay = displayValue.toLowerCase();
  const normalizedFilterValue = filter.value.trim().toLowerCase();

  switch (filter.operator) {
    case 'contains':
      if (!normalizedFilterValue) {
        return true;
      }
      return normalizedDisplay.includes(normalizedFilterValue);
    case 'not_contains':
      if (!normalizedFilterValue) {
        return true;
      }
      return !normalizedDisplay.includes(normalizedFilterValue);
    case 'starts_with':
      if (!normalizedFilterValue) {
        return true;
      }
      return normalizedDisplay.startsWith(normalizedFilterValue);
    case 'eq':
      if (!normalizedFilterValue) {
        return true;
      }
      if (SPECIAL_SKILL_FIELDS.has(filter.field)) {
        const hasSkill = rawValue === 1;
        return normalizedFilterValue === 'si' ? hasSkill : !hasSkill;
      }
      return normalizedDisplay === normalizedFilterValue;
    case 'neq':
      if (!normalizedFilterValue) {
        return true;
      }
      if (SPECIAL_SKILL_FIELDS.has(filter.field)) {
        const hasSkill = rawValue === 1;
        const expectedHas = normalizedFilterValue === 'si';
        return expectedHas !== hasSkill;
      }
      return normalizedDisplay !== normalizedFilterValue;
    case 'gte': {
      const playerNumber = toNumber(rawValue);
      const filterNumber = toNumber(filter.value);
      if (playerNumber === null || filterNumber === null) {
        return false;
      }
      return playerNumber >= filterNumber;
    }
    case 'lte': {
      const playerNumber = toNumber(rawValue);
      const filterNumber = toNumber(filter.value);
      if (playerNumber === null || filterNumber === null) {
        return false;
      }
      return playerNumber <= filterNumber;
    }
    case 'between': {
      const playerNumber = toNumber(rawValue);
      const start = toNumber(filter.value);
      const end = toNumber(filter.secondaryValue);
      if (playerNumber === null || start === null || end === null) {
        return false;
      }
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      return playerNumber >= min && playerNumber <= max;
    }
    default:
      return true;
  }
}

export function matchesPositions(player: DerivedPlayer, positions: string[]): boolean {
  if (!positions.length) {
    return true;
  }
  const playerPositions = DEMARCATION_COLUMNS.map(
    (column) => player[column as keyof DerivedPlayer],
  ).filter(Boolean) as string[];
  if (!playerPositions.length) {
    return false;
  }

  return playerPositions.some((playerCode) => {
    if (positions.includes(playerCode)) {
      return true;
    }

    const lateralVariants = AMBIDEXTROUS_EQUIVALENCE[playerCode];
    if (lateralVariants) {
      return lateralVariants.some((variant) => positions.includes(variant));
    }

    return false;
  });
}

export function togglePosition(
  code: string,
  setPositions: React.Dispatch<React.SetStateAction<string[]>>,
) {
  setPositions((current) =>
    current.includes(code)
      ? current.filter((position) => position !== code)
      : [...current, code],
  );
}
