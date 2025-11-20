import { create } from 'zustand';

interface ComparatorLaunchState {
  pendingId: string | null;
  setPending: (id: string) => void;
  consumePending: () => string | null;
}

export const useComparatorLaunchStore = create<ComparatorLaunchState>((set, get) => ({
  pendingId: null,
  setPending: (id) => set({ pendingId: id }),
  consumePending: () => {
    const current = get().pendingId;
    if (current) {
      set({ pendingId: null });
    }
    return current;
  },
}));
