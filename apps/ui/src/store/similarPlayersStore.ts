import { create } from 'zustand';

interface SimilarPlayersState {
  basePlayerId: string | null;
  setBasePlayerId: (id: string | null) => void;
}

export const useSimilarPlayersStore = create<SimilarPlayersState>((set) => ({
  basePlayerId: null,
  setBasePlayerId: (id) => set({ basePlayerId: id }),
}));
