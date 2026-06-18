import { create } from 'zustand';

interface ClubViewState {
  selectedClub: string | null;
  setSelectedClub: (club: string | null) => void;
  getSnapshot: () => Record<string, any>;
  restoreSnapshot: (snapshot: any) => void;
}

export const useClubViewStore = create<ClubViewState>((set, get) => ({
  selectedClub: null,
  setSelectedClub: (club) => set({ selectedClub: club }),
  getSnapshot: () => ({
    selectedClub: get().selectedClub,
  }),
  restoreSnapshot: (snapshot) =>
    set({
      selectedClub: snapshot?.selectedClub ?? null,
    }),
}));
