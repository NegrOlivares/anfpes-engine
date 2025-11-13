import { useEffect } from 'react';
import { create } from 'zustand';
import type { DerivedPlayer } from '@anfpes/engine';
import type { CacheClub, CacheMeta } from '../types/cache';
import { cacheClient } from '../services/cacheClient';

type CacheStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CacheState {
  status: CacheStatus;
  error?: string;
  meta?: CacheMeta;
  clubs?: CacheClub[];
  players?: DerivedPlayer[];
  selectedPlayerId?: string;
  setSelectedPlayer: (id: string | null) => void;
  load: () => Promise<void>;
  resetError: () => void;
}

export const useCacheStore = create<CacheState>((set, get) => ({
  status: 'idle',
  selectedPlayerId: undefined,
  load: async () => {
    const { status } = get();
    if (status === 'loading' || status === 'ready') {
      return;
    }

    set({ status: 'loading', error: undefined });

    try {
      const [meta, players, clubs] = await Promise.all([
        cacheClient.getMeta(),
        cacheClient.getPlayers(),
        cacheClient.getClubs(),
      ]);

      set({
        status: 'ready',
        meta,
        players,
        clubs,
      });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'No se pudo cargar la cache',
      });
    }
  },
  setSelectedPlayer: (id) =>
    set({
      selectedPlayerId: id ?? undefined,
    }),
  resetError: () => set({ error: undefined }),
}));

export function useCacheLoader() {
  const status = useCacheStore((state) => state.status);
  const load = useCacheStore((state) => state.load);

  useEffect(() => {
    if (status === 'idle') {
      void load();
    }
  }, [status, load]);
}

export function useCacheReady() {
  return useCacheStore((state) => state.status === 'ready');
}

export function useSelectedPlayer(): DerivedPlayer | undefined {
  return useCacheStore((state) => {
    if (!state.players || !state.selectedPlayerId) {
      return undefined;
    }
    return state.players.find((player) => player.ID === state.selectedPlayerId);
  });
}
