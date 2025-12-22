import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Tactic,
  TacticsState,
  FormationSlot,
  PlayerInstruction,
  StrategySlot,
  AttackDefenceLevel,
  BackLineDepth,
  OffsideTrapLevel,
  ManualStrategy,
} from '../types/tactics';

// Formation templates (PT at bottom, forwards at top)
export const FORMATIONS: Record<string, FormationSlot[]> = {
  '4-4-2': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'DI', x: 10, y: 70, role: 'DI' },
    { slotId: 'CT1', x: 35, y: 75, role: 'CT' },
    { slotId: 'CT2', x: 65, y: 75, role: 'CT' },
    { slotId: 'DD', x: 90, y: 70, role: 'DD' },
    { slotId: 'lm', x: 10, y: 30, role: 'CIZ' },
    { slotId: 'cm1', x: 35, y: 45, role: 'CC' },
    { slotId: 'cm2', x: 65, y: 45, role: 'CC' },
    { slotId: 'rm', x: 90, y: 30, role: 'CDR' },
    { slotId: 'DC1', x: 35, y: 10, role: 'DC' },
    { slotId: 'DC2', x: 65, y: 10, role: 'DC' },
  ],
  '4-3-3': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'DI', x: 10, y: 70, role: 'DI' },
    { slotId: 'CT1', x: 35, y: 75, role: 'CT' },
    { slotId: 'CT2', x: 65, y: 75, role: 'CT' },
    { slotId: 'DD', x: 90, y: 70, role: 'DD' },
    { slotId: 'cm1', x: 35, y: 40, role: 'CC' },
    { slotId: 'cm2', x: 50, y: 55, role: 'CCD' },
    { slotId: 'cm3', x: 65, y: 40, role: 'CC' },
    { slotId: 'lw', x: 10, y: 20, role: 'EI' },
    { slotId: 'DC', x: 50, y: 10, role: 'DC' },
    { slotId: 'rw', x: 90, y: 20, role: 'ED' },
  ],
  '4-5-1': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'DI', x: 10, y: 70, role: 'DI' },
    { slotId: 'CT1', x: 35, y: 75, role: 'CT' },
    { slotId: 'CT2', x: 65, y: 75, role: 'CT' },
    { slotId: 'DD', x: 90, y: 70, role: 'DD' },
    { slotId: 'lm', x: 10, y: 35, role: 'CIZ' },
    { slotId: 'cm1', x: 35, y: 45, role: 'CC' },
    { slotId: 'cm2', x: 50, y: 55, role: 'CCD' },
    { slotId: 'cm3', x: 65, y: 45, role: 'CC' },
    { slotId: 'rm', x: 90, y: 35, role: 'CDR' },
    { slotId: 'DC', x: 50, y: 10, role: 'DC' },
  ],
  '3-5-2': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'CT1', x: 20, y: 65, role: 'CT' },
    { slotId: 'CT2', x: 50, y: 70, role: 'LIB' },
    { slotId: 'CT3', x: 80, y: 65, role: 'CT' },
    { slotId: 'lm', x: 10, y: 40, role: 'CIZ' },
    { slotId: 'cm1', x: 35, y: 50, role: 'CC' },
    { slotId: 'cm2', x: 50, y: 30, role: 'MP' },
    { slotId: 'cm3', x: 65, y: 50, role: 'CC' },
    { slotId: 'rm', x: 90, y: 40, role: 'CDR' },
    { slotId: 'DC1', x: 35, y: 10, role: 'DC' },
    { slotId: 'DC2', x: 65, y: 10, role: 'DC' },
  ],
  '5-3-2': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'DI', x: 10, y: 70, role: 'DI' },
    { slotId: 'CT1', x: 30, y: 75, role: 'CT' },
    { slotId: 'CT2', x: 50, y: 77, role: 'LIB' },
    { slotId: 'CT3', x: 70, y: 75, role: 'CT' },
    { slotId: 'DD', x: 90, y: 70, role: 'DD' },
    { slotId: 'cm1', x: 35, y: 40, role: 'CC' },
    { slotId: 'cm2', x: 50, y: 55, role: 'CCD' },
    { slotId: 'cm3', x: 65, y: 40, role: 'CC' },
    { slotId: 'DC1', x: 35, y: 10, role: 'DC' },
    { slotId: 'DC2', x: 65, y: 10, role: 'DC' },
  ],
  '4-2-3-1': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'DI', x: 10, y: 70, role: 'DI' },
    { slotId: 'CT1', x: 35, y: 75, role: 'CT' },
    { slotId: 'CT2', x: 65, y: 75, role: 'CT' },
    { slotId: 'DD', x: 90, y: 70, role: 'DD' },
    { slotId: 'cm1', x: 35, y: 55, role: 'CCD' },
    { slotId: 'cm2', x: 65, y: 55, role: 'CCD' },
    { slotId: 'lw', x: 10, y: 25, role: 'EI' },
    { slotId: 'cam', x: 50, y: 30, role: 'MP' },
    { slotId: 'rw', x: 90, y: 25, role: 'ED' },
    { slotId: 'DC', x: 50, y: 10, role: 'DC' },
  ],
  '4-1-4-1': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'DI', x: 10, y: 70, role: 'DI' },
    { slotId: 'CT1', x: 35, y: 75, role: 'CT' },
    { slotId: 'CT2', x: 65, y: 75, role: 'CT' },
    { slotId: 'DD', x: 90, y: 70, role: 'DD' },
    { slotId: 'cdm', x: 50, y: 60, role: 'CCD' },
    { slotId: 'lm', x: 10, y: 35, role: 'CIZ' },
    { slotId: 'cm1', x: 35, y: 40, role: 'CC' },
    { slotId: 'cm2', x: 65, y: 40, role: 'CC' },
    { slotId: 'rm', x: 90, y: 35, role: 'CDR' },
    { slotId: 'DC', x: 50, y: 10, role: 'DC' },
  ],
  '3-4-3': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'CT1', x: 20, y: 75, role: 'CT' },
    { slotId: 'CT2', x: 50, y: 77, role: 'LIB' },
    { slotId: 'CT3', x: 80, y: 75, role: 'CT' },
    { slotId: 'lm', x: 10, y: 40, role: 'CIZ' },
    { slotId: 'cm1', x: 35, y: 50, role: 'CC' },
    { slotId: 'cm2', x: 65, y: 50, role: 'CC' },
    { slotId: 'rm', x: 90, y: 40, role: 'CDR' },
    { slotId: 'lw', x: 10, y: 15, role: 'EI' },
    { slotId: 'DC', x: 50, y: 10, role: 'DC' },
    { slotId: 'rw', x: 90, y: 15, role: 'ED' },
  ],
  '4-4-1-1': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'DI', x: 10, y: 70, role: 'DI' },
    { slotId: 'CT1', x: 35, y: 75, role: 'CT' },
    { slotId: 'CT2', x: 65, y: 75, role: 'CT' },
    { slotId: 'DD', x: 90, y: 70, role: 'DD' },
    { slotId: 'lm', x: 10, y: 35, role: 'CIZ' },
    { slotId: 'cm1', x: 35, y: 50, role: 'CC' },
    { slotId: 'cm2', x: 65, y: 50, role: 'CC' },
    { slotId: 'rm', x: 90, y: 35, role: 'CDR' },
    { slotId: 'cam', x: 50, y: 25, role: 'MP' },
    { slotId: 'DC', x: 50, y: 10, role: 'DC' },
  ],
  '4-3-2-1': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'DI', x: 10, y: 70, role: 'DI' },
    { slotId: 'CT1', x: 35, y: 75, role: 'CT' },
    { slotId: 'CT2', x: 65, y: 75, role: 'CT' },
    { slotId: 'DD', x: 90, y: 70, role: 'DD' },
    { slotId: 'cm1', x: 30, y: 50, role: 'CC' },
    { slotId: 'cm2', x: 50, y: 55, role: 'CCD' },
    { slotId: 'cm3', x: 70, y: 50, role: 'CC' },
    { slotId: 'ss1', x: 30, y: 25, role: 'SD' },
    { slotId: 'ss2', x: 70, y: 25, role: 'SD' },
    { slotId: 'DC', x: 50, y: 10, role: 'DC' },
  ],
  '3-5-1-1': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'CT1', x: 20, y: 75, role: 'CT' },
    { slotId: 'CT2', x: 50, y: 77, role: 'LIB' },
    { slotId: 'CT3', x: 80, y: 75, role: 'CT' },
    { slotId: 'lm', x: 10, y: 40, role: 'CIZ' },
    { slotId: 'cm1', x: 30, y: 50, role: 'CC' },
    { slotId: 'cm2', x: 50, y: 55, role: 'CCD' },
    { slotId: 'cm3', x: 70, y: 50, role: 'CC' },
    { slotId: 'rm', x: 90, y: 40, role: 'CDR' },
    { slotId: 'cam', x: 50, y: 25, role: 'MP' },
    { slotId: 'DC', x: 50, y: 10, role: 'DC' },
  ],
  '5-4-1': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'DI', x: 10, y: 70, role: 'DI' },
    { slotId: 'CT1', x: 30, y: 75, role: 'CT' },
    { slotId: 'CT2', x: 50, y: 77, role: 'LIB' },
    { slotId: 'CT3', x: 70, y: 75, role: 'CT' },
    { slotId: 'DD', x: 90, y: 70, role: 'DD' },
    { slotId: 'lm', x: 10, y: 40, role: 'CIZ' },
    { slotId: 'cm1', x: 35, y: 45, role: 'CC' },
    { slotId: 'cm2', x: 65, y: 45, role: 'CC' },
    { slotId: 'rm', x: 90, y: 40, role: 'CDR' },
    { slotId: 'DC', x: 50, y: 10, role: 'DC' },
  ],
  '3-4-2-1': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'CT1', x: 20, y: 75, role: 'CT' },
    { slotId: 'CT2', x: 50, y: 77, role: 'LIB' },
    { slotId: 'CT3', x: 80, y: 75, role: 'CT' },
    { slotId: 'lm', x: 10, y: 45, role: 'CIZ' },
    { slotId: 'cm1', x: 35, y: 50, role: 'CC' },
    { slotId: 'cm2', x: 65, y: 50, role: 'CC' },
    { slotId: 'rm', x: 90, y: 45, role: 'CDR' },
    { slotId: 'ss1', x: 30, y: 20, role: 'SD' },
    { slotId: 'ss2', x: 70, y: 20, role: 'SD' },
    { slotId: 'DC', x: 50, y: 10, role: 'DC' },
  ],
  '4-1-2-1-2': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'DI', x: 10, y: 70, role: 'DI' },
    { slotId: 'CT1', x: 35, y: 75, role: 'CT' },
    { slotId: 'CT2', x: 65, y: 75, role: 'CT' },
    { slotId: 'DD', x: 90, y: 70, role: 'DD' },
    { slotId: 'cdm', x: 50, y: 58, role: 'CCD' },
    { slotId: 'cm1', x: 30, y: 42, role: 'CC' },
    { slotId: 'cm2', x: 70, y: 42, role: 'CC' },
    { slotId: 'cam', x: 50, y: 25, role: 'MP' },
    { slotId: 'DC1', x: 35, y: 10, role: 'DC' },
    { slotId: 'DC2', x: 65, y: 10, role: 'DC' },
  ],
  '4-3-1-2': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'DI', x: 10, y: 70, role: 'DI' },
    { slotId: 'CT1', x: 35, y: 75, role: 'CT' },
    { slotId: 'CT2', x: 65, y: 75, role: 'CT' },
    { slotId: 'DD', x: 90, y: 70, role: 'DD' },
    { slotId: 'cm1', x: 30, y: 50, role: 'CC' },
    { slotId: 'cm2', x: 50, y: 55, role: 'CCD' },
    { slotId: 'cm3', x: 70, y: 50, role: 'CC' },
    { slotId: 'cam', x: 50, y: 28, role: 'MP' },
    { slotId: 'DC1', x: 35, y: 10, role: 'DC' },
    { slotId: 'DC2', x: 65, y: 10, role: 'DC' },
  ],
  '5-2-1-2': [
    { slotId: 'PT', x: 50, y: 90, role: 'PT' },
    { slotId: 'DI', x: 10, y: 70, role: 'DI' },
    { slotId: 'CT1', x: 30, y: 75, role: 'CT' },
    { slotId: 'CT2', x: 50, y: 77, role: 'LIB' },
    { slotId: 'CT3', x: 70, y: 75, role: 'CT' },
    { slotId: 'DD', x: 90, y: 70, role: 'DD' },
    { slotId: 'cm1', x: 35, y: 50, role: 'CC' },
    { slotId: 'cm2', x: 65, y: 50, role: 'CC' },
    { slotId: 'cam', x: 50, y: 28, role: 'MP' },
    { slotId: 'DC1', x: 35, y: 10, role: 'DC' },
    { slotId: 'DC2', x: 65, y: 10, role: 'DC' },
  ],
};

const createDefaultSlots = (): FormationSlot[] => FORMATIONS['4-4-2'];

const createEmptyTactic = (name: string, clubId?: string): Tactic => {
  const now = Date.now();
  const slots = createDefaultSlots();
  return {
    tacticId: `tactic-${now}`,
    name,
    clubId,
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
    },
    strategySlots: [
      { strategy: 'NO_STRATEGY', isActive: false },
      { strategy: 'NO_STRATEGY', isActive: false },
      { strategy: 'NO_STRATEGY', isActive: false },
      { strategy: 'NO_STRATEGY', isActive: false },
    ],
    selectedCBForOverlap: undefined,
    depthChart: [],
    depthChartSlots: slots.map((slot) => ({
      slotId: slot.slotId,
      role: slot.role,
      depth1: slot.playerId,
    })),
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
          // Migración: asegurar que recommendedSignings y depthChartSlots existen
          const migratedTactic = {
            ...tactic,
            recommendedSignings: tactic.recommendedSignings || [],
            depthChartSlots:
              tactic.depthChartSlots ||
              tactic.basePlan.slots.map((slot) => ({
                slotId: slot.slotId,
                role: slot.role,
                depth1: slot.playerId,
              })),
          };
          set({
            currentTactic: migratedTactic,
            selectedClubId: migratedTactic.clubId ?? null,
            hasUnsavedChanges: false,
          });
        }
      },

      saveTactic: () => {
        const { currentTactic, savedTactics } = get();
        if (!currentTactic) return;

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
        if (!currentTactic) return;

        const now = Date.now();
        const newTactic = {
          ...currentTactic,
          tacticId: `tactic-${now}`,
          name,
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
          ...original,
          tacticId: `tactic-${now}`,
          name: newName,
          createdAt: now,
          updatedAt: now,
        };

        set({ savedTactics: [...savedTactics, duplicate] });
      },

      renameTactic: (tacticId, newName) => {
        const { savedTactics } = get();
        const index = savedTactics.findIndex((t) => t.tacticId === tacticId);
        if (index < 0) return;

        const newTactics = [...savedTactics];
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
        if (currentTactic) {
          set({
            currentTactic: { ...currentTactic, clubId: clubId ?? undefined },
            hasUnsavedChanges: true,
          });
        }
        set({ selectedClubId: clubId });
      },

      setTacticName: (name) => {
        const { currentTactic } = get();
        if (currentTactic) {
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
        if (!currentTactic) return;

        const planKey =
          plan === 'base' ? 'basePlan' : plan === 'planA' ? 'planA' : 'planB';
        const currentPlan = currentTactic[planKey];
        if (!currentPlan) return;

        const newSlots = currentPlan.slots.map((slot) =>
          slot.slotId === slotId ? { ...slot, ...updates } : slot,
        );

        // Si es basePlan y se actualizó playerId, sincronizar con depthChartSlots
        let updatedDepthChartSlots = currentTactic.depthChartSlots;
        if (plan === 'base' && updates.playerId !== undefined) {
          updatedDepthChartSlots = currentTactic.depthChartSlots.map((depthSlot) =>
            depthSlot.slotId === slotId
              ? { ...depthSlot, depth1: updates.playerId }
              : depthSlot,
          );
        }

        set({
          currentTactic: {
            ...currentTactic,
            [planKey]: { ...currentPlan, slots: newSlots },
            depthChartSlots: updatedDepthChartSlots,
          },
          hasUnsavedChanges: true,
        });
      },

      changeFormation: (plan, formationName) => {
        const { currentTactic } = get();
        if (!currentTactic) return;

        const formationTemplate = FORMATIONS[formationName];
        if (!formationTemplate) return;

        const planKey =
          plan === 'base' ? 'basePlan' : plan === 'planA' ? 'planA' : 'planB';
        const currentPlan = currentTactic[planKey];
        if (!currentPlan) return;

        // Role mapping: equivalent roles across formations
        const ROLE_EQUIVALENTS: Record<string, string[]> = {
          PT: ['PT'],
          DI: ['DI', 'DLI'],
          DD: ['DD', 'DLD'],
          CT: ['CT', 'LIB'],
          LIB: ['LIB', 'CT'],
          CCD: ['CCD', 'CC', 'MP'],
          CC: ['CC', 'CCD', 'MP'],
          CIZ: ['CIZ', 'EI'],
          CDR: ['CDR', 'ED'],
          EI: ['EI', 'CIZ'],
          ED: ['ED', 'CDR'],
          MP: ['MP', 'CC', 'CCD'],
          DC: ['DC', 'SD'],
          SD: ['SD', 'DC'],
          DLI: ['DLI', 'DI', 'CIZ'],
          DLD: ['DLD', 'DD', 'CDR'],
        };

        const usedPlayerIds = new Set<string>();

        // Step 1: Map existing players to new formation template slots by role equivalency
        const newSlots: FormationSlot[] = formationTemplate.map((templateSlot) => {
          // First try exact slotId match (same position in formation)
          const exactMatch = currentPlan.slots.find(
            (s) =>
              s.slotId === templateSlot.slotId &&
              s.playerId &&
              !usedPlayerIds.has(s.playerId),
          );
          if (exactMatch?.playerId) {
            usedPlayerIds.add(exactMatch.playerId);
            return { ...templateSlot, playerId: exactMatch.playerId };
          }

          // Then try role equivalency
          const equivalentRoles = ROLE_EQUIVALENTS[templateSlot.role] || [
            templateSlot.role,
          ];
          const roleMatch = currentPlan.slots.find(
            (s) =>
              s.playerId &&
              equivalentRoles.includes(s.role) &&
              !usedPlayerIds.has(s.playerId),
          );
          if (roleMatch?.playerId) {
            usedPlayerIds.add(roleMatch.playerId);
            return { ...templateSlot, playerId: roleMatch.playerId };
          }

          // No match, leave empty for now
          return { ...templateSlot };
        });

        // Step 2: Fill remaining empty slots with unmatched players
        const unmatchedPlayers = currentPlan.slots
          .filter((s) => s.playerId && !usedPlayerIds.has(s.playerId))
          .map((s) => s.playerId!);

        let playerIndex = 0;
        for (
          let i = 0;
          i < newSlots.length && playerIndex < unmatchedPlayers.length;
          i++
        ) {
          if (!newSlots[i].playerId) {
            newSlots[i] = { ...newSlots[i], playerId: unmatchedPlayers[playerIndex] };
            playerIndex++;
          }
        }

        set({
          currentTactic: {
            ...currentTactic,
            [planKey]: { ...currentPlan, slots: newSlots },
          },
          hasUnsavedChanges: true,
        });
      },

      updatePlayerInstruction: (plan, playerId, instruction) => {
        const { currentTactic } = get();
        if (!currentTactic) return;

        const planKey =
          plan === 'base' ? 'basePlan' : plan === 'planA' ? 'planA' : 'planB';
        const currentPlan = currentTactic[planKey];
        if (!currentPlan) return;

        const current = currentPlan.playerInstructions[playerId] || {
          playerId,
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
                [playerId]: { ...current, ...instruction },
              },
            },
          },
          hasUnsavedChanges: true,
        });
      },

      setAttackDefenceLevel: (plan, level) => {
        const { currentTactic } = get();
        if (!currentTactic) return;

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
        if (!currentTactic) return;

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
        if (!currentTactic) return;

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
        if (!currentTactic || slotIndex < 0 || slotIndex > 3) return;

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
        if (!currentTactic || slotIndex < 0 || slotIndex > 3) return;

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
        if (!currentTactic) return;

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
        if (!currentTactic) return;

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
        if (!currentTactic) return;

        const depthKey = `depth${depth}` as
          | 'depth1'
          | 'depth2'
          | 'depth3'
          | 'depth4'
          | 'depth5';

        set({
          currentTactic: {
            ...currentTactic,
            depthChartSlots: currentTactic.depthChartSlots.map((slot) =>
              slot.slotId === slotId ? { ...slot, [depthKey]: playerId } : slot,
            ),
          },
          hasUnsavedChanges: true,
        });
      },

      addPossibleSigning: (playerId) => {
        const { currentTactic } = get();
        if (!currentTactic) return;

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
        if (!currentTactic) return;

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
        if (!currentTactic) return;

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
        if (!currentTactic) return;

        const ids = currentTactic.rosterContext.candidateOutPlayerIds;
        if (ids.includes(playerId)) return;

        set({
          currentTactic: {
            ...currentTactic,
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
        if (!currentTactic) return;

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
    }),
    {
      name: 'tactics-storage',
      partialize: (state) => ({ savedTactics: state.savedTactics }),
    },
  ),
);
