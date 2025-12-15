import { create } from 'zustand';
import type { FormStateId } from '../data/formModifiers';

interface PlayerProfileState {
  // Selected player ID for profile view (independent from search)
  selectedPlayerId: string | null;
  setSelectedPlayerId: (id: string | null) => void;

  // Profile-specific state
  formById: Record<string, FormStateId>;
  setFormById: (
    forms:
      | Record<string, FormStateId>
      | ((prev: Record<string, FormStateId>) => Record<string, FormStateId>),
  ) => void;

  reset: () => void;

  // Snapshot methods
  getSnapshot: () => Record<string, any>;
  restoreSnapshot: (snapshot: any) => void;
}

export const usePlayerProfileStore = create<PlayerProfileState>((set, get) => ({
  selectedPlayerId: null,
  setSelectedPlayerId: (id) => set({ selectedPlayerId: id }),

  formById: {},
  setFormById: (forms) => {
    if (typeof forms === 'function') {
      set((state) => ({ formById: forms(state.formById) }));
    } else {
      set({ formById: forms });
    }
  },

  reset: () =>
    set({
      selectedPlayerId: null,
      formById: {},
    }),
  // Snapshot methods for navigation history
  getSnapshot: () => {
    const state = get();
    return {
      selectedPlayerId: state.selectedPlayerId,
      formById: { ...state.formById },
    };
  },

  restoreSnapshot: (snapshot: any) => {
    set({
      selectedPlayerId: snapshot.selectedPlayerId ?? null,
      formById: snapshot.formById ?? {},
    });
  },
}));
