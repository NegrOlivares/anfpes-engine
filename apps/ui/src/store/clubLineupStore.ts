import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ClubLineupConfig {
  formationName: string | null;
  playersBySlot: Record<string, string>;
  rolesBySlot?: Record<string, string>;
}

interface ClubLineupState {
  lineupsByClub: Record<string, ClubLineupConfig>;
  captainsByClub: Record<string, string>;
  setClubLineup: (club: string, lineup: ClubLineupConfig) => void;
  updateClubLineup: (
    club: string,
    updater: (lineup: ClubLineupConfig) => ClubLineupConfig,
  ) => void;
  setClubCaptain: (club: string, playerId: string | null) => void;
}

export const createEmptyClubLineup = (): ClubLineupConfig => ({
  formationName: null,
  playersBySlot: {},
  rolesBySlot: {},
});

export const useClubLineupStore = create<ClubLineupState>()(
  persist(
    (set) => ({
      lineupsByClub: {},
      captainsByClub: {},
      setClubLineup: (club, lineup) =>
        set((state) => ({
          lineupsByClub: {
            ...state.lineupsByClub,
            [club]: lineup,
          },
        })),
      updateClubLineup: (club, updater) =>
        set((state) => {
          const previous = state.lineupsByClub[club] ?? createEmptyClubLineup();
          return {
            lineupsByClub: {
              ...state.lineupsByClub,
              [club]: updater(previous),
            },
          };
        }),
      setClubCaptain: (club, playerId) =>
        set((state) => {
          const nextCaptains = { ...state.captainsByClub };
          if (playerId) {
            nextCaptains[club] = playerId;
          } else {
            delete nextCaptains[club];
          }
          return { captainsByClub: nextCaptains };
        }),
    }),
    {
      name: 'cesante-club-lineups',
    },
  ),
);
