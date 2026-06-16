import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Tactic,
  TacticsState,
  FormationSlot,
  FormationPlan,
  PlayerInstruction,
  StrategySlot,
  AttackDefenceLevel,
  BackLineDepth,
  OffsideTrapLevel,
  ManualStrategy,
} from '../types/tactics';

export const TACTICS_DATA_VERSION = 'TXXIV';

export const isReadOnlyTactic = (
  tactic: Pick<Tactic, 'dataVersion'> | null | undefined,
) => Boolean(tactic && tactic.dataVersion !== TACTICS_DATA_VERSION);

const canEditTactic = (tactic: Tactic | null | undefined): tactic is Tactic =>
  Boolean(tactic && !isReadOnlyTactic(tactic));

type LegacyPlayerInstruction = PlayerInstruction & {
  playerId?: string;
  slotId?: string;
};

export const FORMATIONS: Record<string, FormationSlot[]> = {
  // ===== 5 DEFENDERS =====
  '5-4-1': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 50, y: 73, role: 'LIB' },
    { slotId: 'slot3', x: 30, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 70, y: 71, role: 'CT' },
    { slotId: 'slot5', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot6', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot7', x: 33, y: 45, role: 'CC' },
    { slotId: 'slot8', x: 67, y: 45, role: 'CC' },
    { slotId: 'slot9', x: 90, y: 34, role: 'CDR' },
    { slotId: 'slot10', x: 10, y: 34, role: 'CIZ' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '5-3-2': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 50, y: 73, role: 'LIB' },
    { slotId: 'slot3', x: 30, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 70, y: 71, role: 'CT' },
    { slotId: 'slot5', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot6', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot7', x: 50, y: 53, role: 'CCD' },
    { slotId: 'slot8', x: 30, y: 45, role: 'CC' },
    { slotId: 'slot9', x: 70, y: 45, role: 'CC' },
    { slotId: 'slot10', x: 35, y: 10, role: 'DC' },
    { slotId: 'slot11', x: 65, y: 10, role: 'DC' },
  ],
  '5-3-1-1': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 50, y: 73, role: 'LIB' },
    { slotId: 'slot3', x: 30, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 70, y: 71, role: 'CT' },
    { slotId: 'slot5', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot6', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot7', x: 50, y: 53, role: 'CCD' },
    { slotId: 'slot8', x: 30, y: 45, role: 'CC' },
    { slotId: 'slot9', x: 70, y: 45, role: 'CC' },
    { slotId: 'slot10', x: 50, y: 34, role: 'MP' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '5-2-1-2': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 50, y: 73, role: 'LIB' },
    { slotId: 'slot3', x: 30, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 70, y: 71, role: 'CT' },
    { slotId: 'slot5', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot6', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot7', x: 35, y: 53, role: 'CCD' },
    { slotId: 'slot8', x: 65, y: 53, role: 'CCD' },
    { slotId: 'slot9', x: 50, y: 34, role: 'MP' },
    { slotId: 'slot10', x: 35, y: 10, role: 'DC' },
    { slotId: 'slot11', x: 65, y: 10, role: 'DC' },
  ],
  '5-2-3': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 50, y: 73, role: 'LIB' },
    { slotId: 'slot3', x: 30, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 70, y: 71, role: 'CT' },
    { slotId: 'slot5', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot6', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot7', x: 35, y: 45, role: 'CC' },
    { slotId: 'slot8', x: 65, y: 45, role: 'CC' },
    { slotId: 'slot9', x: 90, y: 26, role: 'ED' },
    { slotId: 'slot10', x: 10, y: 26, role: 'EI' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],

  // ===== 4 DEFENDERS =====
  '4-1-4-1': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 35, y: 71, role: 'CT' },
    { slotId: 'slot3', x: 65, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot5', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot6', x: 50, y: 53, role: 'CCD' },
    { slotId: 'slot7', x: 30, y: 45, role: 'CC' },
    { slotId: 'slot8', x: 70, y: 45, role: 'CC' },
    { slotId: 'slot9', x: 90, y: 34, role: 'CDR' },
    { slotId: 'slot10', x: 10, y: 34, role: 'CIZ' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '4-4-2': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 35, y: 71, role: 'CT' },
    { slotId: 'slot3', x: 65, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot5', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot6', x: 35, y: 45, role: 'CC' },
    { slotId: 'slot7', x: 65, y: 45, role: 'CC' },
    { slotId: 'slot8', x: 90, y: 34, role: 'CDR' },
    { slotId: 'slot9', x: 10, y: 34, role: 'CIZ' },
    { slotId: 'slot10', x: 35, y: 10, role: 'DC' },
    { slotId: 'slot11', x: 65, y: 10, role: 'DC' },
  ],
  '4-4-1-1': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 35, y: 71, role: 'CT' },
    { slotId: 'slot3', x: 65, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot5', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot6', x: 35, y: 45, role: 'CC' },
    { slotId: 'slot7', x: 65, y: 45, role: 'CC' },
    { slotId: 'slot8', x: 90, y: 34, role: 'CDR' },
    { slotId: 'slot9', x: 10, y: 34, role: 'CIZ' },
    { slotId: 'slot10', x: 50, y: 26, role: 'SD' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '4-1-3-2': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 35, y: 71, role: 'CT' },
    { slotId: 'slot3', x: 65, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot5', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot6', x: 50, y: 53, role: 'CCD' },
    { slotId: 'slot7', x: 90, y: 34, role: 'CDR' },
    { slotId: 'slot8', x: 10, y: 34, role: 'CIZ' },
    { slotId: 'slot9', x: 50, y: 34, role: 'MP' },
    { slotId: 'slot10', x: 35, y: 10, role: 'DC' },
    { slotId: 'slot11', x: 65, y: 10, role: 'DC' },
  ],
  '4-3-3': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 35, y: 71, role: 'CT' },
    { slotId: 'slot3', x: 65, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot5', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot6', x: 50, y: 53, role: 'CCD' },
    { slotId: 'slot7', x: 28, y: 45, role: 'CC' },
    { slotId: 'slot8', x: 72, y: 45, role: 'CC' },
    { slotId: 'slot9', x: 90, y: 26, role: 'ED' },
    { slotId: 'slot10', x: 10, y: 26, role: 'EI' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '4-2-3-1': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 35, y: 71, role: 'CT' },
    { slotId: 'slot3', x: 65, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot5', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot6', x: 35, y: 53, role: 'CCD' },
    { slotId: 'slot7', x: 65, y: 53, role: 'CCD' },
    { slotId: 'slot8', x: 90, y: 34, role: 'CDR' },
    { slotId: 'slot9', x: 10, y: 34, role: 'CIZ' },
    { slotId: 'slot10', x: 50, y: 34, role: 'MP' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '4-2-1-3': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 35, y: 71, role: 'CT' },
    { slotId: 'slot3', x: 65, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot5', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot6', x: 35, y: 53, role: 'CCD' },
    { slotId: 'slot7', x: 65, y: 53, role: 'CCD' },
    { slotId: 'slot8', x: 50, y: 34, role: 'MP' },
    { slotId: 'slot9', x: 90, y: 26, role: 'ED' },
    { slotId: 'slot10', x: 10, y: 26, role: 'EI' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '4-3-1-2': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 35, y: 71, role: 'CT' },
    { slotId: 'slot3', x: 65, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot5', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot6', x: 28, y: 53, role: 'CCD' },
    { slotId: 'slot7', x: 50, y: 53, role: 'CCD' },
    { slotId: 'slot8', x: 72, y: 53, role: 'CCD' },
    { slotId: 'slot9', x: 50, y: 34, role: 'MP' },
    { slotId: 'slot10', x: 35, y: 10, role: 'DC' },
    { slotId: 'slot11', x: 65, y: 10, role: 'DC' },
  ],
  '4-3-2-1': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 35, y: 71, role: 'CT' },
    { slotId: 'slot3', x: 65, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot5', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot6', x: 50, y: 53, role: 'CCD' },
    { slotId: 'slot7', x: 28, y: 45, role: 'CC' },
    { slotId: 'slot8', x: 72, y: 45, role: 'CC' },
    { slotId: 'slot9', x: 32, y: 26, role: 'SD' },
    { slotId: 'slot10', x: 68, y: 26, role: 'SD' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '4-1-2-1-2': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 35, y: 71, role: 'CT' },
    { slotId: 'slot3', x: 65, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot5', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot6', x: 50, y: 53, role: 'CCD' },
    { slotId: 'slot7', x: 30, y: 45, role: 'CC' },
    { slotId: 'slot8', x: 70, y: 45, role: 'CC' },
    { slotId: 'slot9', x: 50, y: 34, role: 'MP' },
    { slotId: 'slot10', x: 35, y: 10, role: 'DC' },
    { slotId: 'slot11', x: 65, y: 10, role: 'DC' },
  ],
  '4-2-2-2': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 35, y: 71, role: 'CT' },
    { slotId: 'slot3', x: 65, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot5', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot6', x: 35, y: 53, role: 'CCD' },
    { slotId: 'slot7', x: 65, y: 53, role: 'CCD' },
    { slotId: 'slot8', x: 30, y: 34, role: 'MP' },
    { slotId: 'slot9', x: 70, y: 34, role: 'MP' },
    { slotId: 'slot10', x: 35, y: 10, role: 'DC' },
    { slotId: 'slot11', x: 65, y: 10, role: 'DC' },
  ],
  '4-2-4': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 35, y: 71, role: 'CT' },
    { slotId: 'slot3', x: 65, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 90, y: 69, role: 'DD' },
    { slotId: 'slot5', x: 10, y: 69, role: 'DI' },
    { slotId: 'slot6', x: 35, y: 45, role: 'CC' },
    { slotId: 'slot7', x: 65, y: 45, role: 'CC' },
    { slotId: 'slot8', x: 90, y: 26, role: 'ED' },
    { slotId: 'slot9', x: 10, y: 26, role: 'EI' },
    { slotId: 'slot10', x: 33, y: 10, role: 'DC' },
    { slotId: 'slot11', x: 67, y: 10, role: 'DC' },
  ],

  // ===== 3 DEFENDERS =====
  '3-5-2': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 50, y: 73, role: 'LIB' },
    { slotId: 'slot3', x: 20, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 80, y: 71, role: 'CT' },
    { slotId: 'slot5', x: 35, y: 53, role: 'CCD' },
    { slotId: 'slot6', x: 65, y: 53, role: 'CCD' },
    { slotId: 'slot7', x: 90, y: 34, role: 'CDR' },
    { slotId: 'slot8', x: 10, y: 34, role: 'CIZ' },
    { slotId: 'slot9', x: 50, y: 34, role: 'MP' },
    { slotId: 'slot10', x: 35, y: 10, role: 'DC' },
    { slotId: 'slot11', x: 65, y: 10, role: 'DC' },
  ],
  '3-5-1-1': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 50, y: 73, role: 'LIB' },
    { slotId: 'slot3', x: 20, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 80, y: 71, role: 'CT' },
    { slotId: 'slot5', x: 50, y: 53, role: 'CCD' },
    { slotId: 'slot6', x: 30, y: 45, role: 'CC' },
    { slotId: 'slot7', x: 70, y: 45, role: 'CC' },
    { slotId: 'slot8', x: 90, y: 34, role: 'CDR' },
    { slotId: 'slot9', x: 10, y: 34, role: 'CIZ' },
    { slotId: 'slot10', x: 50, y: 26, role: 'SD' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '3-4-3': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 50, y: 73, role: 'LIB' },
    { slotId: 'slot3', x: 20, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 80, y: 71, role: 'CT' },
    { slotId: 'slot5', x: 90, y: 50, role: 'DLD' },
    { slotId: 'slot6', x: 10, y: 50, role: 'DLI' },
    { slotId: 'slot7', x: 35, y: 53, role: 'CCD' },
    { slotId: 'slot8', x: 65, y: 53, role: 'CCD' },
    { slotId: 'slot9', x: 90, y: 26, role: 'ED' },
    { slotId: 'slot10', x: 10, y: 26, role: 'EI' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '3-4-1-2': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 50, y: 73, role: 'LIB' },
    { slotId: 'slot3', x: 20, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 80, y: 71, role: 'CT' },
    { slotId: 'slot5', x: 90, y: 50, role: 'DLD' },
    { slotId: 'slot6', x: 10, y: 50, role: 'DLI' },
    { slotId: 'slot7', x: 35, y: 53, role: 'CCD' },
    { slotId: 'slot8', x: 65, y: 53, role: 'CCD' },
    { slotId: 'slot9', x: 50, y: 34, role: 'MP' },
    { slotId: 'slot10', x: 35, y: 10, role: 'DC' },
    { slotId: 'slot11', x: 65, y: 10, role: 'DC' },
  ],
  '3-4-2-1': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 50, y: 73, role: 'LIB' },
    { slotId: 'slot3', x: 20, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 80, y: 71, role: 'CT' },
    { slotId: 'slot5', x: 35, y: 45, role: 'CC' },
    { slotId: 'slot6', x: 65, y: 45, role: 'CC' },
    { slotId: 'slot7', x: 90, y: 34, role: 'CDR' },
    { slotId: 'slot8', x: 10, y: 34, role: 'CIZ' },
    { slotId: 'slot9', x: 30, y: 26, role: 'SD' },
    { slotId: 'slot10', x: 70, y: 26, role: 'SD' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '3-2-4-1': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 50, y: 73, role: 'LIB' },
    { slotId: 'slot3', x: 20, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 80, y: 71, role: 'CT' },
    { slotId: 'slot5', x: 35, y: 53, role: 'CCD' },
    { slotId: 'slot6', x: 65, y: 53, role: 'CCD' },
    { slotId: 'slot7', x: 90, y: 34, role: 'CDR' },
    { slotId: 'slot8', x: 10, y: 34, role: 'CIZ' },
    { slotId: 'slot9', x: 35, y: 34, role: 'MP' },
    { slotId: 'slot10', x: 65, y: 34, role: 'MP' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '3-2-2-3': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 50, y: 73, role: 'LIB' },
    { slotId: 'slot3', x: 20, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 80, y: 71, role: 'CT' },
    { slotId: 'slot5', x: 35, y: 53, role: 'CCD' },
    { slotId: 'slot6', x: 65, y: 53, role: 'CCD' },
    { slotId: 'slot7', x: 35, y: 34, role: 'MP' },
    { slotId: 'slot8', x: 65, y: 34, role: 'MP' },
    { slotId: 'slot9', x: 90, y: 26, role: 'ED' },
    { slotId: 'slot10', x: 10, y: 26, role: 'EI' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '3-2-5': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 50, y: 73, role: 'LIB' },
    { slotId: 'slot3', x: 20, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 80, y: 71, role: 'CT' },
    { slotId: 'slot5', x: 35, y: 45, role: 'CC' },
    { slotId: 'slot6', x: 65, y: 45, role: 'CC' },
    { slotId: 'slot7', x: 90, y: 26, role: 'ED' },
    { slotId: 'slot8', x: 10, y: 26, role: 'EI' },
    { slotId: 'slot9', x: 35, y: 26, role: 'SD' },
    { slotId: 'slot10', x: 65, y: 26, role: 'SD' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '3-1-4-2': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 50, y: 73, role: 'LIB' },
    { slotId: 'slot3', x: 20, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 80, y: 71, role: 'CT' },
    { slotId: 'slot5', x: 50, y: 53, role: 'CCD' },
    { slotId: 'slot6', x: 90, y: 34, role: 'CDR' },
    { slotId: 'slot7', x: 10, y: 34, role: 'CIZ' },
    { slotId: 'slot8', x: 35, y: 34, role: 'MP' },
    { slotId: 'slot9', x: 65, y: 34, role: 'MP' },
    { slotId: 'slot10', x: 35, y: 10, role: 'DC' },
    { slotId: 'slot11', x: 65, y: 10, role: 'DC' },
  ],

  // ===== 2 DEFENDERS =====
  '2-3-4-1': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 35, y: 71, role: 'CT' },
    { slotId: 'slot3', x: 65, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 30, y: 53, role: 'CCD' },
    { slotId: 'slot5', x: 50, y: 53, role: 'CCD' },
    { slotId: 'slot6', x: 70, y: 53, role: 'CCD' },
    { slotId: 'slot7', x: 90, y: 34, role: 'CDR' },
    { slotId: 'slot8', x: 10, y: 34, role: 'CIZ' },
    { slotId: 'slot9', x: 35, y: 34, role: 'MP' },
    { slotId: 'slot10', x: 65, y: 34, role: 'MP' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '2-3-2-3': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 35, y: 71, role: 'CT' },
    { slotId: 'slot3', x: 65, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 30, y: 53, role: 'CCD' },
    { slotId: 'slot5', x: 50, y: 53, role: 'CCD' },
    { slotId: 'slot6', x: 70, y: 53, role: 'CCD' },
    { slotId: 'slot7', x: 35, y: 34, role: 'MP' },
    { slotId: 'slot8', x: 65, y: 34, role: 'MP' },
    { slotId: 'slot9', x: 90, y: 26, role: 'ED' },
    { slotId: 'slot10', x: 10, y: 26, role: 'EI' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
  '2-3-5': [
    { slotId: 'slot1', x: 50, y: 91, role: 'PT' },
    { slotId: 'slot2', x: 35, y: 71, role: 'CT' },
    { slotId: 'slot3', x: 65, y: 71, role: 'CT' },
    { slotId: 'slot4', x: 50, y: 53, role: 'CCD' },
    { slotId: 'slot5', x: 30, y: 45, role: 'CC' },
    { slotId: 'slot6', x: 70, y: 45, role: 'CC' },
    { slotId: 'slot7', x: 90, y: 26, role: 'ED' },
    { slotId: 'slot8', x: 10, y: 26, role: 'EI' },
    { slotId: 'slot9', x: 35, y: 26, role: 'SD' },
    { slotId: 'slot10', x: 65, y: 26, role: 'SD' },
    { slotId: 'slot11', x: 50, y: 10, role: 'DC' },
  ],
};

const createDefaultSlots = (): FormationSlot[] => FORMATIONS['4-4-2'];

const normalizePlanInstructions = (plan: FormationPlan): FormationPlan => {
  const source = plan.playerInstructions as Record<string, LegacyPlayerInstruction>;
  const playerInstructions: Record<string, PlayerInstruction> = {};

  for (const slot of plan.slots) {
    const bySlot = source[slot.slotId];
    const byPlayer = slot.playerId ? source[slot.playerId] : undefined;
    const instruction = bySlot ?? byPlayer;

    if (instruction) {
      playerInstructions[slot.slotId] = {
        slotId: slot.slotId,
        runArrows: instruction.runArrows ?? [],
        defensiveAttitude: instruction.defensiveAttitude ?? 'BALANCED',
      };
    }
  }

  return {
    ...plan,
    playerInstructions,
  };
};

const normalizeTacticInstructions = (tactic: Tactic): Tactic => ({
  ...tactic,
  basePlan: normalizePlanInstructions(tactic.basePlan),
  planA: tactic.planA ? normalizePlanInstructions(tactic.planA) : undefined,
  planB: tactic.planB ? normalizePlanInstructions(tactic.planB) : undefined,
});

const clearPlanPlayers = (plan: FormationPlan): FormationPlan => {
  const normalizedPlan = normalizePlanInstructions(plan);

  return {
    ...normalizedPlan,
    slots: normalizedPlan.slots.map((slot) => ({
      slotId: slot.slotId,
      x: slot.x,
      y: slot.y,
      role: slot.role,
    })),
  };
};

const clearOptionalPlanPlayers = (
  plan: FormationPlan | undefined,
): FormationPlan | undefined => (plan ? clearPlanPlayers(plan) : undefined);

const createTacticalOnlyCopy = (tactic: Tactic, name: string, now: number): Tactic => {
  const normalizedTactic = normalizeTacticInstructions(tactic);

  return {
    ...normalizedTactic,
    tacticId: `tactic-${now}`,
    name,
    dataVersion: TACTICS_DATA_VERSION,
    customDorsals: {},
    rosterContext: {
      candidateInPlayerIds: [],
      candidateOutPlayerIds: [],
    },
    basePlan: clearPlanPlayers(normalizedTactic.basePlan),
    planA: clearOptionalPlanPlayers(normalizedTactic.planA),
    planB: clearOptionalPlanPlayers(normalizedTactic.planB),
    playerDepthCharts: [],
    depthChart: [],
    recommendedSignings: [],
    createdAt: now,
    updatedAt: now,
  };
};

const createEmptyTactic = (name: string, clubId?: string): Tactic => {
  const now = Date.now();
  const slots = createDefaultSlots();
  return {
    tacticId: `tactic-${now}`,
    name,
    dataVersion: TACTICS_DATA_VERSION,
    clubId,
    customDorsals: {},
    rosterContext: {
      candidateInPlayerIds: [],
      candidateOutPlayerIds: [],
    },
    basePlan: {
      slots,
      playerInstructions: {},
      attackDefenceLevel: 'BALANCED',
      backLine: 'B',
      offsideTrap: 'B',
      lastUsedFormation: '4-4-2', // Formación por defecto
    },
    playerDepthCharts: [], // GLOBAL: Ahora est\u00e1 en Tactic, no en FormationPlan
    strategySlots: [
      { strategy: 'NO_STRATEGY', isActive: false },
      { strategy: 'NO_STRATEGY', isActive: false },
      { strategy: 'NO_STRATEGY', isActive: false },
      { strategy: 'NO_STRATEGY', isActive: false },
    ],
    selectedCBForOverlap: undefined,
    depthChart: [],
    recommendedSignings: [],
    createdAt: now,
    updatedAt: now,
  };
};

export const useTacticsStore = create<TacticsState>()(
  persist(
    (set, get) => ({
      savedTactics: [],
      currentTactic: null,
      selectedClubId: null,
      showPlanA: false,
      showPlanB: false,
      combinedView: false,
      hasUnsavedChanges: false,

      createTactic: (name, clubId) => {
        const newTactic = createEmptyTactic(name, clubId);
        set({
          currentTactic: newTactic,
          selectedClubId: clubId ?? null,
          hasUnsavedChanges: false,
        });
      },

      loadTactic: (tacticId) => {
        const tactic = get().savedTactics.find((t) => t.tacticId === tacticId);
        if (tactic) {
          // Migración: mover playerDepthCharts de basePlan/planA/planB a nivel global
          let migratedPlayerDepthCharts: any[] = [];

          // Prioridad: si ya existe playerDepthCharts global, usarlo
          if (
            (tactic as any).playerDepthCharts &&
            Array.isArray((tactic as any).playerDepthCharts)
          ) {
            migratedPlayerDepthCharts = (tactic as any).playerDepthCharts;
          }
          // Si no, intentar desde basePlan (formato antiguo)
          else if (
            (tactic.basePlan as any).playerDepthCharts &&
            Array.isArray((tactic.basePlan as any).playerDepthCharts)
          ) {
            migratedPlayerDepthCharts = (tactic.basePlan as any).playerDepthCharts;
          }
          // Si tampoco, array vacío (el usuario deberá reasignar suplentes)
          else {
            migratedPlayerDepthCharts = [];
          }

          const migratedTactic = normalizeTacticInstructions({
            ...tactic,
            customDorsals: tactic.customDorsals || {},
            recommendedSignings: tactic.recommendedSignings || [],
            playerDepthCharts: migratedPlayerDepthCharts,
          });
          set({
            currentTactic: migratedTactic,
            selectedClubId: migratedTactic.clubId ?? null,
            hasUnsavedChanges: false,
          });
        }
      },

      saveTactic: () => {
        const { currentTactic, savedTactics } = get();
        if (!canEditTactic(currentTactic)) return;

        const updated = { ...currentTactic, updatedAt: Date.now() };
        const index = savedTactics.findIndex((t) => t.tacticId === updated.tacticId);

        if (index >= 0) {
          const newTactics = [...savedTactics];
          newTactics[index] = updated;
          set({
            savedTactics: newTactics,
            currentTactic: updated,
            hasUnsavedChanges: false,
          });
        } else {
          set({
            savedTactics: [...savedTactics, updated],
            currentTactic: updated,
            hasUnsavedChanges: false,
          });
        }
      },

      saveAsNewTactic: (name) => {
        const { currentTactic, savedTactics } = get();
        if (!canEditTactic(currentTactic)) return;

        const now = Date.now();
        const newTactic = {
          ...currentTactic,
          tacticId: `tactic-${now}`,
          name,
          dataVersion: TACTICS_DATA_VERSION,
          createdAt: now,
          updatedAt: now,
        };

        set({
          savedTactics: [...savedTactics, newTactic],
          currentTactic: newTactic,
          hasUnsavedChanges: false,
        });
      },

      deleteTactic: (tacticId) => {
        const { savedTactics, currentTactic } = get();
        const newTactics = savedTactics.filter((t) => t.tacticId !== tacticId);
        set({
          savedTactics: newTactics,
          currentTactic: currentTactic?.tacticId === tacticId ? null : currentTactic,
        });
      },

      duplicateTactic: (tacticId, newName) => {
        const { savedTactics } = get();
        const original = savedTactics.find((t) => t.tacticId === tacticId);
        if (!original) return;

        const now = Date.now();
        const duplicate = {
          ...normalizeTacticInstructions(original),
          tacticId: `tactic-${now}`,
          name: newName,
          createdAt: now,
          updatedAt: now,
        };

        set({ savedTactics: [...savedTactics, duplicate] });
      },

      duplicateTacticWithoutPlayers: (tacticId, newName) => {
        const { savedTactics } = get();
        const original = savedTactics.find((t) => t.tacticId === tacticId);
        if (!original) return;

        const now = Date.now();
        const duplicate = createTacticalOnlyCopy(original, newName, now);

        set({ savedTactics: [...savedTactics, duplicate] });
      },

      renameTactic: (tacticId, newName) => {
        const { savedTactics } = get();
        const index = savedTactics.findIndex((t) => t.tacticId === tacticId);
        if (index < 0) return;

        const newTactics = [...savedTactics];
        if (isReadOnlyTactic(newTactics[index])) return;
        newTactics[index] = {
          ...newTactics[index],
          name: newName,
          updatedAt: Date.now(),
        };
        set({ savedTactics: newTactics });
      },

      clearCurrentTactic: () => {
        set({ currentTactic: null, hasUnsavedChanges: false });
      },

      setClub: (clubId) => {
        const { currentTactic } = get();
        if (canEditTactic(currentTactic)) {
          set({
            currentTactic: { ...currentTactic, clubId: clubId ?? undefined },
            hasUnsavedChanges: true,
          });
        }
        set({ selectedClubId: clubId });
      },

      setTacticName: (name) => {
        const { currentTactic } = get();
        if (canEditTactic(currentTactic)) {
          set({
            currentTactic: { ...currentTactic, name },
            hasUnsavedChanges: true,
          });
        }
      },

      setShowPlanA: (show) => set({ showPlanA: show }),
      setShowPlanB: (show) => set({ showPlanB: show }),
      setCombinedView: (combined) => set({ combinedView: combined }),

      updateSlot: (plan, slotId, updates) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic)) return;

        const planKey =
          plan === 'base' ? 'basePlan' : plan === 'planA' ? 'planA' : 'planB';
        const currentPlan = currentTactic[planKey];
        if (!currentPlan) return;

        let updatedBasePlan = currentTactic.basePlan;
        let updatedPlanA = currentTactic.planA;
        let updatedPlanB = currentTactic.planB;

        if (updates.playerId !== undefined) {
          const oldSlot = currentPlan.slots.find((s) => s.slotId === slotId);
          const newPlayerId = updates.playerId;
          const oldPlayerId = oldSlot?.playerId;

          // Intercambio de jugadores
          if (newPlayerId && oldPlayerId && newPlayerId !== oldPlayerId) {
            // Encontrar de dónde viene el nuevo jugador
            const sourceSlotId = currentPlan.slots.find(
              (s) => s.playerId === newPlayerId && s.slotId !== slotId,
            )?.slotId;

            if (sourceSlotId) {
              // INTERCAMBIO DENTRO DEL MISMO PLAN
              // Actualizar AMBOS slots (source y target) para el intercambio
              const newSlots = currentPlan.slots.map((slot) => {
                if (slot.slotId === slotId) {
                  // Target: recibe el nuevo jugador
                  return { ...slot, playerId: newPlayerId };
                } else if (slot.slotId === sourceSlotId) {
                  // Source: recibe el jugador viejo
                  return { ...slot, playerId: oldPlayerId };
                }
                return slot;
              });

              if (plan === 'base') {
                // En base plan, propagar el intercambio a planA y planB
                updatedBasePlan = {
                  ...currentPlan,
                  slots: newSlots,
                };

                if (currentTactic.planA) {
                  updatedPlanA = {
                    ...currentTactic.planA,
                    slots: currentTactic.planA.slots.map((slot) => {
                      if (slot.playerId === oldPlayerId)
                        return { ...slot, playerId: newPlayerId };
                      if (slot.playerId === newPlayerId)
                        return { ...slot, playerId: oldPlayerId };
                      return slot;
                    }),
                  };
                }
                if (currentTactic.planB) {
                  updatedPlanB = {
                    ...currentTactic.planB,
                    slots: currentTactic.planB.slots.map((slot) => {
                      if (slot.playerId === oldPlayerId)
                        return { ...slot, playerId: newPlayerId };
                      if (slot.playerId === newPlayerId)
                        return { ...slot, playerId: oldPlayerId };
                      return slot;
                    }),
                  };
                }
              } else {
                // En planA o planB, solo actualizar ese plan
                const updatedCurrentPlan = {
                  ...currentPlan,
                  slots: newSlots,
                };

                if (plan === 'planA') {
                  updatedPlanA = updatedCurrentPlan;
                } else {
                  updatedPlanB = updatedCurrentPlan;
                }
              }
            } else {
              // JUGADOR VIENE DEL ROSTER (no estaba en campo)
              // Esto es un REEMPLAZO, no un intercambio

              // En Plan A/B NO permitir reemplazo desde roster (solo intercambio)
              if (plan !== 'base') {
                return;
              }

              // Construir newSlots para el reemplazo (solo actualiza el target)
              const newSlots = currentPlan.slots.map((slot) =>
                slot.slotId === slotId ? { ...slot, playerId: newPlayerId } : slot,
              );

              // REGLA: Eliminar chart del jugador viejo, NO crear ni transferir al nuevo
              // Los playerDepthCharts ahora son GLOBALES (en tactic, no en plan)
              const updatedDepthCharts = currentTactic.playerDepthCharts.filter(
                (chart) =>
                  chart.playerId !== oldPlayerId && chart.playerId !== newPlayerId,
              );

              updatedBasePlan = {
                ...currentPlan,
                slots: newSlots,
              };

              // Propagar cambio de jugador a planA y planB
              if (currentTactic.planA) {
                updatedPlanA = {
                  ...currentTactic.planA,
                  slots: currentTactic.planA.slots.map((slot) =>
                    slot.playerId === oldPlayerId
                      ? { ...slot, playerId: newPlayerId }
                      : slot,
                  ),
                };
              }
              if (currentTactic.planB) {
                updatedPlanB = {
                  ...currentTactic.planB,
                  slots: currentTactic.planB.slots.map((slot) =>
                    slot.playerId === oldPlayerId
                      ? { ...slot, playerId: newPlayerId }
                      : slot,
                  ),
                };
              }

              // Actualizar los depth charts globales
              set({
                currentTactic: {
                  ...currentTactic,
                  basePlan: updatedBasePlan,
                  planA: updatedPlanA,
                  planB: updatedPlanB,
                  playerDepthCharts: updatedDepthCharts,
                },
                hasUnsavedChanges: true,
              });
              return; // Salir temprano porque ya hicimos set()
            }
          } else if (!newPlayerId && oldPlayerId) {
            // REMOVER jugador
            const newSlots = currentPlan.slots.map((slot) =>
              slot.slotId === slotId ? { ...slot, playerId: undefined } : slot,
            );

            const updatedDepthCharts = currentTactic.playerDepthCharts.filter(
              (chart) => chart.playerId !== oldPlayerId,
            );

            const updatedCurrentPlan = {
              ...currentPlan,
              slots: newSlots,
            };

            if (plan === 'base') {
              updatedBasePlan = updatedCurrentPlan;
            } else if (plan === 'planA') {
              updatedPlanA = updatedCurrentPlan;
            } else {
              updatedPlanB = updatedCurrentPlan;
            }

            set({
              currentTactic: {
                ...currentTactic,
                basePlan: updatedBasePlan,
                planA: updatedPlanA,
                planB: updatedPlanB,
                playerDepthCharts: updatedDepthCharts,
              },
              hasUnsavedChanges: true,
            });
            return; // Salir temprano
          } else if (newPlayerId && !oldPlayerId) {
            // AGREGAR jugador nuevo (slot vacío)
            const newSlots = currentPlan.slots.map((slot) =>
              slot.slotId === slotId ? { ...slot, playerId: newPlayerId } : slot,
            );

            // No crear chart automáticamente, el usuario debe asignar suplentes manualmente
            const updatedCurrentPlan = {
              ...currentPlan,
              slots: newSlots,
            };

            if (plan === 'base') {
              updatedBasePlan = updatedCurrentPlan;
            } else if (plan === 'planA') {
              updatedPlanA = updatedCurrentPlan;
            } else {
              updatedPlanB = updatedCurrentPlan;
            }
          }
        } else {
          // Actualización que no involucra playerId (ej: posición, rol)
          const newSlots = currentPlan.slots.map((slot) =>
            slot.slotId === slotId ? { ...slot, ...updates } : slot,
          );

          const updatedCurrentPlan = {
            ...currentPlan,
            slots: newSlots,
          };

          if (plan === 'base') {
            updatedBasePlan = updatedCurrentPlan;
          } else if (plan === 'planA') {
            updatedPlanA = updatedCurrentPlan;
          } else {
            updatedPlanB = updatedCurrentPlan;
          }
        }

        set({
          currentTactic: {
            ...currentTactic,
            basePlan: updatedBasePlan,
            planA: updatedPlanA,
            planB: updatedPlanB,
          },
          hasUnsavedChanges: true,
        });
      },

      changeFormation: (plan, formationName) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic)) return;

        const formationTemplate = FORMATIONS[formationName];
        if (!formationTemplate) return;

        const planKey =
          plan === 'base' ? 'basePlan' : plan === 'planA' ? 'planA' : 'planB';
        const currentPlan = currentTactic[planKey];
        if (!currentPlan) return;

        // Mantener jugadores en sus slots (slot1-slot11 son fijos)
        // Solo actualizar coordenadas (x, y) y rol desde la plantilla
        const newSlots: FormationSlot[] = formationTemplate.map((template, index) => {
          const currentSlot = currentPlan.slots[index];
          return {
            slotId: template.slotId, // slot1-slot11, siempre el mismo
            x: template.x,
            y: template.y,
            role: template.role,
            playerId: currentSlot?.playerId, // Mantener el jugador asignado
          };
        });

        // Limpiar instrucciones del slot del plan (flechas de movimiento)
        const cleanedInstructions: Record<string, PlayerInstruction> = {};

        // playerDepthCharts se mantienen (siguen al jugador, no al slot)
        const updatedPlan = {
          ...currentPlan,
          slots: newSlots,
          playerInstructions: cleanedInstructions,
          lastUsedFormation: formationName, // Trackear última formación usada
        };

        set({
          currentTactic: {
            ...currentTactic,
            [planKey]: updatedPlan,
          },
          hasUnsavedChanges: true,
        });
      },

      updatePlayerInstruction: (plan, slotId, instruction) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic)) return;

        const planKey =
          plan === 'base' ? 'basePlan' : plan === 'planA' ? 'planA' : 'planB';
        const currentPlan = currentTactic[planKey];
        if (!currentPlan) return;

        const current = currentPlan.playerInstructions[slotId] || {
          slotId,
          runArrows: [],
          defensiveAttitude: 'BALANCED',
        };

        set({
          currentTactic: {
            ...currentTactic,
            [planKey]: {
              ...currentPlan,
              playerInstructions: {
                ...currentPlan.playerInstructions,
                [slotId]: { ...current, ...instruction, slotId },
              },
            },
          },
          hasUnsavedChanges: true,
        });
      },

      setAttackDefenceLevel: (plan, level) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic)) return;

        const updatedTactic = { ...currentTactic };
        if (plan === 'base') {
          updatedTactic.basePlan = {
            ...updatedTactic.basePlan,
            attackDefenceLevel: level,
          };
        } else if (plan === 'planA' && updatedTactic.planA) {
          updatedTactic.planA = { ...updatedTactic.planA, attackDefenceLevel: level };
        } else if (plan === 'planB' && updatedTactic.planB) {
          updatedTactic.planB = { ...updatedTactic.planB, attackDefenceLevel: level };
        }

        set({
          currentTactic: updatedTactic,
          hasUnsavedChanges: true,
        });
      },

      setBackLine: (plan, depth) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic)) return;

        const updatedTactic = { ...currentTactic };
        if (plan === 'base') {
          updatedTactic.basePlan = { ...updatedTactic.basePlan, backLine: depth };
        } else if (plan === 'planA' && updatedTactic.planA) {
          updatedTactic.planA = { ...updatedTactic.planA, backLine: depth };
        } else if (plan === 'planB' && updatedTactic.planB) {
          updatedTactic.planB = { ...updatedTactic.planB, backLine: depth };
        }

        set({
          currentTactic: updatedTactic,
          hasUnsavedChanges: true,
        });
      },

      setOffsideTrap: (plan, level) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic)) return;

        const updatedTactic = { ...currentTactic };
        if (plan === 'base') {
          updatedTactic.basePlan = { ...updatedTactic.basePlan, offsideTrap: level };
        } else if (plan === 'planA' && updatedTactic.planA) {
          updatedTactic.planA = { ...updatedTactic.planA, offsideTrap: level };
        } else if (plan === 'planB' && updatedTactic.planB) {
          updatedTactic.planB = { ...updatedTactic.planB, offsideTrap: level };
        }

        set({
          currentTactic: updatedTactic,
          hasUnsavedChanges: true,
        });
      },

      setStrategyInSlot: (slotIndex, strategy) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic) || slotIndex < 0 || slotIndex > 3) return;

        const newStrategySlots = [...currentTactic.strategySlots] as [
          StrategySlot,
          StrategySlot,
          StrategySlot,
          StrategySlot,
        ];
        newStrategySlots[slotIndex] = { ...newStrategySlots[slotIndex], strategy };

        set({
          currentTactic: {
            ...currentTactic,
            strategySlots: newStrategySlots,
          },
          hasUnsavedChanges: true,
        });
      },

      toggleStrategyActive: (slotIndex) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic) || slotIndex < 0 || slotIndex > 3) return;

        const newStrategySlots = [...currentTactic.strategySlots] as [
          StrategySlot,
          StrategySlot,
          StrategySlot,
          StrategySlot,
        ];
        newStrategySlots[slotIndex] = {
          ...newStrategySlots[slotIndex],
          isActive: !newStrategySlots[slotIndex].isActive,
        };

        set({
          currentTactic: {
            ...currentTactic,
            strategySlots: newStrategySlots,
          },
          hasUnsavedChanges: true,
        });
      },

      setSelectedCBForOverlap: (slotId) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic)) return;

        set({
          currentTactic: {
            ...currentTactic,
            selectedCBForOverlap: slotId,
          },
          hasUnsavedChanges: true,
        });
      },

      updateDepthChart: (position, backupPlayerIds) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic)) return;

        const existingIndex = currentTactic.depthChart.findIndex(
          (d) => d.position === position,
        );
        let newDepthChart = [...currentTactic.depthChart];

        if (existingIndex >= 0) {
          newDepthChart[existingIndex] = { position, backupPlayerIds };
        } else {
          newDepthChart.push({ position, backupPlayerIds });
        }

        set({
          currentTactic: {
            ...currentTactic,
            depthChart: newDepthChart,
          },
          hasUnsavedChanges: true,
        });
      },

      setDepthSlot: (slotId, depth, playerId) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic)) return;

        // Si es depth1, actualizar el titular en el slot (en base plan)
        if (depth === 1) {
          const oldPlayerId = currentTactic.basePlan.slots.find(
            (s) => s.slotId === slotId,
          )?.playerId;

          const updatedBasePlanSlots = currentTactic.basePlan.slots.map((slot) =>
            slot.slotId === slotId ? { ...slot, playerId } : slot,
          );

          // Actualizar también en planA y planB
          const updatedPlanASlots = currentTactic.planA
            ? currentTactic.planA.slots.map((slot) =>
                slot.playerId === oldPlayerId ? { ...slot, playerId } : slot,
              )
            : undefined;

          const updatedPlanBSlots = currentTactic.planB
            ? currentTactic.planB.slots.map((slot) =>
                slot.playerId === oldPlayerId ? { ...slot, playerId } : slot,
              )
            : undefined;

          // Actualizar playerDepthCharts GLOBALES
          let updatedDepthCharts = currentTactic.playerDepthCharts;
          if (oldPlayerId && playerId) {
            // Renombrar el playerDepthChart
            updatedDepthCharts = updatedDepthCharts.map((chart) =>
              chart.playerId === oldPlayerId ? { ...chart, playerId } : chart,
            );
          } else if (!oldPlayerId && playerId) {
            // Agregar nuevo
            updatedDepthCharts = [...updatedDepthCharts, { playerId }];
          } else if (oldPlayerId && !playerId) {
            // Remover
            updatedDepthCharts = updatedDepthCharts.filter(
              (c) => c.playerId !== oldPlayerId,
            );
          }

          set({
            currentTactic: {
              ...currentTactic,
              basePlan: {
                ...currentTactic.basePlan,
                slots: updatedBasePlanSlots,
              },
              planA: updatedPlanASlots
                ? {
                    ...currentTactic.planA!,
                    slots: updatedPlanASlots,
                  }
                : currentTactic.planA,
              planB: updatedPlanBSlots
                ? {
                    ...currentTactic.planB!,
                    slots: updatedPlanBSlots,
                  }
                : currentTactic.planB,
              playerDepthCharts: updatedDepthCharts,
            },
            hasUnsavedChanges: true,
          });
        } else {
          // Para depth2-5, actualizar el suplente del jugador titular en ese slot
          const titularPlayerId = currentTactic.basePlan.slots.find(
            (s) => s.slotId === slotId,
          )?.playerId;

          if (!titularPlayerId) return;

          // VALIDACIÓN: No permitir que un jugador sea su propio suplente
          if (playerId === titularPlayerId) return;

          const depthKey = `depth${depth}` as 'depth2' | 'depth3' | 'depth4' | 'depth5';

          // Buscar el chart del jugador titular en playerDepthCharts GLOBALES
          const titularChart = currentTactic.playerDepthCharts.find(
            (c) => c.playerId === titularPlayerId,
          );

          if (titularChart) {
            // VALIDACIÓN: No permitir duplicados en el mismo chart
            const existingDepths = [
              titularChart.depth2,
              titularChart.depth3,
              titularChart.depth4,
              titularChart.depth5,
            ];
            if (playerId && existingDepths.includes(playerId)) {
              // El jugador ya está en otro depth, no permitir duplicado
              return;
            }

            // Actualizar el chart existente
            const updatedDepthCharts = currentTactic.playerDepthCharts.map((chart) =>
              chart.playerId === titularPlayerId
                ? { ...chart, [depthKey]: playerId }
                : chart,
            );

            set({
              currentTactic: {
                ...currentTactic,
                playerDepthCharts: updatedDepthCharts,
              },
              hasUnsavedChanges: true,
            });
          } else {
            // No existe chart, crear uno nuevo
            const updatedDepthCharts = [
              ...currentTactic.playerDepthCharts,
              { playerId: titularPlayerId, [depthKey]: playerId },
            ];

            set({
              currentTactic: {
                ...currentTactic,
                playerDepthCharts: updatedDepthCharts,
              },
              hasUnsavedChanges: true,
            });
          }
        }
      },

      addPossibleSigning: (playerId) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic)) return;

        // Agregar a candidateInPlayerIds si no existe
        const alreadyAdded =
          currentTactic.rosterContext.candidateInPlayerIds.includes(playerId);
        if (alreadyAdded) return;

        set({
          currentTactic: {
            ...currentTactic,
            rosterContext: {
              ...currentTactic.rosterContext,
              candidateInPlayerIds: [
                ...currentTactic.rosterContext.candidateInPlayerIds,
                playerId,
              ],
            },
          },
          hasUnsavedChanges: true,
        });
      },

      addCandidateIn: (playerId) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic)) return;

        const ids = currentTactic.rosterContext.candidateInPlayerIds;
        if (ids.includes(playerId)) return;

        set({
          currentTactic: {
            ...currentTactic,
            rosterContext: {
              ...currentTactic.rosterContext,
              candidateInPlayerIds: [...ids, playerId],
            },
          },
          hasUnsavedChanges: true,
        });
      },

      removeCandidateIn: (playerId) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic)) return;

        set({
          currentTactic: {
            ...currentTactic,
            rosterContext: {
              ...currentTactic.rosterContext,
              candidateInPlayerIds:
                currentTactic.rosterContext.candidateInPlayerIds.filter(
                  (id) => id !== playerId,
                ),
            },
          },
          hasUnsavedChanges: true,
        });
      },

      addCandidateOut: (playerId) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic)) return;

        const ids = currentTactic.rosterContext.candidateOutPlayerIds;
        if (ids.includes(playerId)) return;

        // Limpiar jugador de todos los slots de formación
        const cleanedBasePlan = {
          ...currentTactic.basePlan,
          slots: currentTactic.basePlan.slots.map((slot) =>
            slot.playerId === playerId ? { ...slot, playerId: undefined } : slot,
          ),
        };

        const cleanedPlanA = currentTactic.planA
          ? {
              ...currentTactic.planA,
              slots: currentTactic.planA.slots.map((slot) =>
                slot.playerId === playerId ? { ...slot, playerId: undefined } : slot,
              ),
            }
          : undefined;

        const cleanedPlanB = currentTactic.planB
          ? {
              ...currentTactic.planB,
              slots: currentTactic.planB.slots.map((slot) =>
                slot.playerId === playerId ? { ...slot, playerId: undefined } : slot,
              ),
            }
          : undefined;

        // Limpiar playerDepthCharts GLOBALES
        const cleanedDepthCharts = currentTactic.playerDepthCharts
          .filter((chart) => chart.playerId !== playerId)
          .map((chart) => ({
            ...chart,
            depth2: chart.depth2 === playerId ? undefined : chart.depth2,
            depth3: chart.depth3 === playerId ? undefined : chart.depth3,
            depth4: chart.depth4 === playerId ? undefined : chart.depth4,
            depth5: chart.depth5 === playerId ? undefined : chart.depth5,
          }));

        set({
          currentTactic: {
            ...currentTactic,
            basePlan: cleanedBasePlan,
            planA: cleanedPlanA,
            planB: cleanedPlanB,
            playerDepthCharts: cleanedDepthCharts,
            rosterContext: {
              ...currentTactic.rosterContext,
              candidateOutPlayerIds: [...ids, playerId],
            },
          },
          hasUnsavedChanges: true,
        });
      },

      removeCandidateOut: (playerId) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic)) return;

        set({
          currentTactic: {
            ...currentTactic,
            rosterContext: {
              ...currentTactic.rosterContext,
              candidateOutPlayerIds:
                currentTactic.rosterContext.candidateOutPlayerIds.filter(
                  (id) => id !== playerId,
                ),
            },
          },
          hasUnsavedChanges: true,
        });
      },

      setCustomDorsal: (playerId, dorsal) => {
        const { currentTactic } = get();
        if (!canEditTactic(currentTactic)) return;

        set({
          currentTactic: {
            ...currentTactic,
            customDorsals: {
              ...currentTactic.customDorsals,
              [playerId]: dorsal,
            },
          },
          hasUnsavedChanges: true,
        });
      },

      // Export/Import
      exportTactics: () => {
        return get().savedTactics;
      },

      importTactics: (tactics, replace = false) => {
        if (replace) {
          set({ savedTactics: tactics });
        } else {
          // Merge: regenerar IDs para evitar conflictos
          const timestamp = Date.now();
          const newTactics = tactics.map((tactic, idx) => ({
            ...tactic,
            tacticId: `${timestamp}-${idx}`,
            createdAt: timestamp,
            updatedAt: timestamp,
          }));

          set((state) => ({
            savedTactics: [...state.savedTactics, ...newTactics],
          }));
        }
      },
    }),
    {
      name: 'tactics-storage',
      partialize: (state) => ({ savedTactics: state.savedTactics }),
    },
  ),
);
