import { create } from 'zustand';
import type { FormStateId } from '../data/formModifiers';

interface ComparatorState {
  // Cross-module communication
  pendingId: string | null;
  setPending: (id: string) => void;
  consumePending: () => string | null;

  // Selected players
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((current: string[]) => string[])) => void;

  // Form states by player ID
  formById: Record<string, FormStateId>;
  setFormById: (
    forms:
      | Record<string, FormStateId>
      | ((current: Record<string, FormStateId>) => Record<string, FormStateId>),
  ) => void;

  // Search/lookup
  query: string;
  setQuery: (query: string) => void;
  lookupError: string;
  setLookupError: (error: string) => void;

  // Reset
  reset: () => void;

  // Snapshot methods
  getSnapshot: () => Record<string, any>;
  restoreSnapshot: (snapshot: any) => void;
}

export const useComparatorStore = create<ComparatorState>((set, get) => ({
  // Cross-module communication
  pendingId: null,
  setPending: (id) => set({ pendingId: id }),
  consumePending: () => {
    const current = get().pendingId;
    if (current) {
      set({ pendingId: null });
    }
    return current;
  },

  // Selected players
  selectedIds: [],
  setSelectedIds: (ids) =>
    set((state) => ({
      selectedIds: typeof ids === 'function' ? ids(state.selectedIds) : ids,
    })),

  // Form states
  formById: {},
  setFormById: (forms) =>
    set((state) => ({
      formById: typeof forms === 'function' ? forms(state.formById) : forms,
    })),

  // Search/lookup
  query: '',
  setQuery: (query) => set({ query }),
  lookupError: '',
  setLookupError: (error) => set({ lookupError: error }),

  // Reset
  reset: () =>
    set({
      selectedIds: [],
      formById: {},
      query: '',
      lookupError: '',
    }),

  // Snapshot methods for navigation history
  getSnapshot: () => {
    const state = get();
    return {
      selectedIds: [...state.selectedIds],
      formById: { ...state.formById },
      query: state.query,
      lookupError: state.lookupError,
    };
  },

  restoreSnapshot: (snapshot: any) => {
    set({
      selectedIds: snapshot.selectedIds ?? [],
      formById: snapshot.formById ?? {},
      query: snapshot.query ?? '',
      lookupError: snapshot.lookupError ?? '',
    });
  },
}));

// Legacy export for backward compatibility
export const useComparatorLaunchStore = useComparatorStore;
