import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DerivedPlayer } from '@anfpes/engine';
import type { Preselection, PlayerTag, PreselectionState } from '../types/preselection';

const DEFAULT_PRESELECTION_ID = 'general';
const DEFAULT_PRESELECTION_NAME = 'Preselección General';

/**
 * Generate a unique ID for preselections and tags
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Default predefined tags
 */
const DEFAULT_TAGS: PlayerTag[] = [
  { id: 'priority', label: 'Prioridad', color: '#ef4444' },
  { id: 'observe', label: 'Observar', color: '#f59e0b' },
  { id: 'backup', label: 'Backup', color: '#3b82f6' },
  { id: 'discard', label: 'Descartado', color: '#6b7280' },
];

export const usePreselectionStore = create<PreselectionState>()(
  persist(
    (set, get) => ({
      preselections: [
        {
          id: DEFAULT_PRESELECTION_ID,
          name: DEFAULT_PRESELECTION_NAME,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          playerIds: [],
          notes: {},
          tags: {},
        },
      ],

      availableTags: DEFAULT_TAGS,

      selectedPlayerIds: new Set<string>(),

      // Preselection management
      createPreselection: (name: string) => {
        const newPreselection: Preselection = {
          id: generateId(),
          name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          playerIds: [],
          notes: {},
          tags: {},
        };

        set((state) => ({
          preselections: [...state.preselections, newPreselection],
        }));
      },

      deletePreselection: (id: string) => {
        if (id === DEFAULT_PRESELECTION_ID) return; // Can't delete default

        set((state) => ({
          preselections: state.preselections.filter((p) => p.id !== id),
        }));
      },

      renamePreselection: (id: string, newName: string) => {
        set((state) => ({
          preselections: state.preselections.map((p) =>
            p.id === id
              ? { ...p, name: newName, updatedAt: new Date().toISOString() }
              : p,
          ),
        }));
      },

      // Player management
      addPlayersToPreselection: (preselectionId: string, playerIds: string[]) => {
        set((state) => ({
          preselections: state.preselections.map((p) =>
            p.id === preselectionId
              ? {
                  ...p,
                  playerIds: [...new Set([...p.playerIds, ...playerIds])],
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      removePlayersFromPreselection: (preselectionId: string, playerIds: string[]) => {
        const playerIdSet = new Set(playerIds);

        set((state) => ({
          preselections: state.preselections.map((p) =>
            p.id === preselectionId
              ? {
                  ...p,
                  playerIds: p.playerIds.filter((id) => !playerIdSet.has(id)),
                  notes: Object.fromEntries(
                    Object.entries(p.notes).filter(([id]) => !playerIdSet.has(id)),
                  ),
                  tags: Object.fromEntries(
                    Object.entries(p.tags).filter(([id]) => !playerIdSet.has(id)),
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      // Notes management
      setPlayerNote: (preselectionId: string, playerId: string, note: string) => {
        set((state) => ({
          preselections: state.preselections.map((p) =>
            p.id === preselectionId
              ? {
                  ...p,
                  notes: { ...p.notes, [playerId]: note },
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      deletePlayerNote: (preselectionId: string, playerId: string) => {
        set((state) => ({
          preselections: state.preselections.map((p) =>
            p.id === preselectionId
              ? {
                  ...p,
                  notes: Object.fromEntries(
                    Object.entries(p.notes).filter(([id]) => id !== playerId),
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      // Tags management
      addPlayerTag: (preselectionId: string, playerId: string, tagId: string) => {
        set((state) => ({
          preselections: state.preselections.map((p) =>
            p.id === preselectionId
              ? {
                  ...p,
                  tags: {
                    ...p.tags,
                    [playerId]: [...new Set([...(p.tags[playerId] || []), tagId])],
                  },
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      removePlayerTag: (preselectionId: string, playerId: string, tagId: string) => {
        set((state) => ({
          preselections: state.preselections.map((p) =>
            p.id === preselectionId
              ? {
                  ...p,
                  tags: {
                    ...p.tags,
                    [playerId]: (p.tags[playerId] || []).filter((id) => id !== tagId),
                  },
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      // Tag definitions
      createTag: (label: string, color: string): PlayerTag => {
        const newTag: PlayerTag = {
          id: generateId(),
          label,
          color,
        };

        set((state) => ({
          availableTags: [...state.availableTags, newTag],
        }));

        return newTag;
      },

      deleteTag: (tagId: string) => {
        // Remove from all preselections
        set((state) => ({
          availableTags: state.availableTags.filter((t) => t.id !== tagId),
          preselections: state.preselections.map((p) => ({
            ...p,
            tags: Object.fromEntries(
              Object.entries(p.tags).map(([playerId, tags]) => [
                playerId,
                tags.filter((id) => id !== tagId),
              ]),
            ),
          })),
        }));
      },

      updateTag: (tagId: string, label: string, color: string) => {
        set((state) => ({
          availableTags: state.availableTags.map((t) =>
            t.id === tagId ? { ...t, label, color } : t,
          ),
        }));
      },

      // Selection management (for bulk operations in search view)
      selectPlayer: (playerId: string) => {
        set((state) => {
          const newSet = new Set(state.selectedPlayerIds);
          newSet.add(playerId);
          return { selectedPlayerIds: newSet };
        });
      },

      deselectPlayer: (playerId: string) => {
        set((state) => {
          const newSet = new Set(state.selectedPlayerIds);
          newSet.delete(playerId);
          return { selectedPlayerIds: newSet };
        });
      },

      selectAllPlayers: (playerIds: string[]) => {
        set({ selectedPlayerIds: new Set(playerIds) });
      },

      clearSelection: () => {
        set({ selectedPlayerIds: new Set() });
      },

      // Helper queries
      getPreselection: (id: string) => {
        return get().preselections.find((p) => p.id === id);
      },

      getPlayerPreselections: (playerId: string) => {
        return get().preselections.filter((p) => p.playerIds.includes(playerId));
      },

      getPlayersInPreselection: (id: string, allPlayers: DerivedPlayer[]) => {
        const preselection = get().preselections.find((p) => p.id === id);
        if (!preselection) return [];

        const playerIdSet = new Set(preselection.playerIds);
        return allPlayers.filter((p) => playerIdSet.has(p.ID));
      },
    }),
    {
      name: 'anfpes-preselections',
      partialize: (state) => ({
        preselections: state.preselections,
        availableTags: state.availableTags,
        // Don't persist selectedPlayerIds (session-only)
      }),
    },
  ),
);
