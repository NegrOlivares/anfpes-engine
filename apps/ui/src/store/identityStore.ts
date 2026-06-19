import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const IDENTITY_SEASON = 'T-XXIII';

export type IdentityMode = 'manager' | 'club' | 'spectator';

export interface UserIdentity {
  mode: IdentityMode;
  season: string;
  configuredAt: number;
  manager?: string;
  club?: string;
}

interface IdentityState {
  profile: UserIdentity | null;
  setManagerIdentity: (manager: string, club: string) => void;
  setClubIdentity: (club: string) => void;
  setSpectatorIdentity: () => void;
  clearIdentity: () => void;
}

export const useIdentityStore = create<IdentityState>()(
  persist(
    (set) => ({
      profile: null,
      setManagerIdentity: (manager, club) =>
        set({
          profile: {
            mode: 'manager',
            season: IDENTITY_SEASON,
            configuredAt: Date.now(),
            manager,
            club,
          },
        }),
      setClubIdentity: (club) =>
        set({
          profile: {
            mode: 'club',
            season: IDENTITY_SEASON,
            configuredAt: Date.now(),
            club,
          },
        }),
      setSpectatorIdentity: () =>
        set({
          profile: {
            mode: 'spectator',
            season: IDENTITY_SEASON,
            configuredAt: Date.now(),
          },
        }),
      clearIdentity: () => set({ profile: null }),
    }),
    {
      name: 'cesante-identity',
    },
  ),
);
