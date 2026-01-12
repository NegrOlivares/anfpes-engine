import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterCondition, FilterLogicMode } from '../hooks/usePlayerViews';
import { DEFAULT_TABLE_COLUMNS } from '../constants/playerFields';

type MacroKey = 'ATK' | 'TEC' | 'RES' | 'DEF' | 'FUE' | 'VEL';
type SortDirection = 'asc' | 'desc';
type SimilarSortKey = string | number;

interface SimilarSortConfig {
  key: SimilarSortKey;
  direction: SortDirection;
}

interface SimilarPlayersState {
  // Base player
  basePlayerId: string | null;
  setBasePlayerId: (id: string | null) => void;

  // Macro selection
  macroSelection: Record<MacroKey, boolean>;
  setMacroSelection: (
    selection:
      | Record<MacroKey, boolean>
      | ((prev: Record<MacroKey, boolean>) => Record<MacroKey, boolean>),
  ) => void;

  // Mode and similarity
  mode: 'proportional' | 'direct';
  setMode: (mode: 'proportional' | 'direct') => void;
  minSimilarity: number;
  setMinSimilarity: (value: number) => void;
  includePositions: boolean;
  setIncludePositions: (value: boolean | ((prev: boolean) => boolean)) => void;

  // Manual lookup
  manualLookup: string;
  setManualLookup: (value: string) => void;
  lookupError: string;
  setLookupError: (error: string) => void;

  // UI state
  columnsMenuOpen: boolean;
  setColumnsMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean | ((prev: boolean) => boolean)) => void;

  // Sorting
  sortConfig: SimilarSortConfig[];
  setSortConfig: (
    config: SimilarSortConfig[] | ((prev: SimilarSortConfig[]) => SimilarSortConfig[]),
  ) => void;

  // Visible columns
  visibleColumns: Set<string>;
  setVisibleColumns: (
    columns: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;

  // Filters
  filters: FilterCondition[];
  setFilters: (
    filters: FilterCondition[] | ((prev: FilterCondition[]) => FilterCondition[]),
  ) => void;
  positionsFilter: string[];
  setPositionsFilter: (positions: string[] | ((prev: string[]) => string[])) => void;

  // Reset
  reset: () => void;

  // Snapshot methods
  getSnapshot: () => Record<string, any>;
  restoreSnapshot: (snapshot: any) => void;
}

const DEFAULT_MACRO_SELECTION: Record<MacroKey, boolean> = {
  ATK: true,
  TEC: true,
  RES: true,
  DEF: true,
  FUE: true,
  VEL: true,
};

export const useSimilarPlayersStore = create<SimilarPlayersState>()(
  persist(
    (set, get) => ({
      // Base player
      basePlayerId: null,
      setBasePlayerId: (id) => set({ basePlayerId: id }),

      // Macro selection
      macroSelection: DEFAULT_MACRO_SELECTION,
      setMacroSelection: (selection) => {
        const newSelection =
          typeof selection === 'function' ? selection(get().macroSelection) : selection;
        set({ macroSelection: newSelection });
      },

      // Mode and similarity
      mode: 'proportional',
      setMode: (mode) => set({ mode }),
      minSimilarity: 95,
      setMinSimilarity: (value) => set({ minSimilarity: value }),
      includePositions: false,
      setIncludePositions: (value) => {
        const newValue =
          typeof value === 'function' ? value(get().includePositions) : value;
        set({ includePositions: newValue });
      },

      // Manual lookup
      manualLookup: '',
      setManualLookup: (value) => set({ manualLookup: value }),
      lookupError: '',
      setLookupError: (error) => set({ lookupError: error }),

      // UI state
      columnsMenuOpen: false,
      setColumnsMenuOpen: (open) => {
        const newOpen = typeof open === 'function' ? open(get().columnsMenuOpen) : open;
        set({ columnsMenuOpen: newOpen });
      },
      filtersOpen: false,
      setFiltersOpen: (open) => {
        const newOpen = typeof open === 'function' ? open(get().filtersOpen) : open;
        set({ filtersOpen: newOpen });
      },

      // Sorting
      sortConfig: [{ key: 'SIMILARITY', direction: 'desc' }],
      setSortConfig: (config) => {
        const newConfig =
          typeof config === 'function' ? config(get().sortConfig) : config;
        set({ sortConfig: newConfig });
      },

      // Visible columns
      visibleColumns: new Set(DEFAULT_TABLE_COLUMNS),
      setVisibleColumns: (columns) => {
        const newColumns =
          typeof columns === 'function' ? columns(get().visibleColumns) : columns;
        set({ visibleColumns: newColumns });
      },

      // Filters
      filters: [],
      setFilters: (filters) => {
        const newFilters =
          typeof filters === 'function' ? filters(get().filters) : filters;
        set({ filters: newFilters });
      },
      positionsFilter: [],
      setPositionsFilter: (positions) => {
        const newPositions =
          typeof positions === 'function' ? positions(get().positionsFilter) : positions;
        set({ positionsFilter: newPositions });
      },

      // Reset
      reset: () =>
        set({
          macroSelection: DEFAULT_MACRO_SELECTION,
          mode: 'proportional',
          minSimilarity: 95,
          includePositions: false,
          manualLookup: '',
          lookupError: '',
          columnsMenuOpen: false,
          filtersOpen: false,
          sortConfig: [{ key: 'SIMILARITY', direction: 'desc' }],
          visibleColumns: new Set(DEFAULT_TABLE_COLUMNS),
          filters: [],
          positionsFilter: [],
        }),

      // Snapshot methods for navigation history
      getSnapshot: () => {
        const state = get();
        return {
          basePlayerId: state.basePlayerId,
          macroSelection: { ...state.macroSelection },
          mode: state.mode,
          minSimilarity: state.minSimilarity,
          includePositions: state.includePositions,
          manualLookup: state.manualLookup,
          lookupError: state.lookupError,
          columnsMenuOpen: state.columnsMenuOpen,
          filtersOpen: state.filtersOpen,
          sortConfig: [...state.sortConfig],
          visibleColumns: Array.from(state.visibleColumns),
          filters: state.filters.map((f) => ({ ...f })),
          positionsFilter: [...state.positionsFilter],
        };
      },

      restoreSnapshot: (snapshot: any) => {
        set({
          basePlayerId: snapshot.basePlayerId ?? null,
          macroSelection: snapshot.macroSelection ?? DEFAULT_MACRO_SELECTION,
          mode: snapshot.mode ?? 'proportional',
          minSimilarity: snapshot.minSimilarity ?? 95,
          includePositions: snapshot.includePositions ?? false,
          manualLookup: snapshot.manualLookup ?? '',
          lookupError: snapshot.lookupError ?? '',
          columnsMenuOpen: snapshot.columnsMenuOpen ?? false,
          filtersOpen: snapshot.filtersOpen ?? false,
          sortConfig: snapshot.sortConfig ?? [{ key: 'SIMILARITY', direction: 'desc' }],
          visibleColumns: new Set(snapshot.visibleColumns ?? DEFAULT_TABLE_COLUMNS),
          filters: snapshot.filters ?? [],
          positionsFilter: snapshot.positionsFilter ?? [],
        });
      },
    }),
    {
      name: 'anfpes-similar-players',
      partialize: (state) => ({
        // Solo persistir configuraciones de UI
        sortConfig: state.sortConfig,
        visibleColumns: Array.from(state.visibleColumns),
        filters: state.filters,
        positionsFilter: state.positionsFilter,
        // También persistir preferencias del módulo
        macroSelection: state.macroSelection,
        mode: state.mode,
        minSimilarity: state.minSimilarity,
        includePositions: state.includePositions,
      }),
      // Necesitamos manejar la conversión del Set
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            state: {
              ...parsed.state,
              visibleColumns: new Set(
                parsed.state.visibleColumns || DEFAULT_TABLE_COLUMNS,
              ),
            },
          };
        },
        setItem: (name, value) => {
          const str = JSON.stringify({
            state: {
              ...value.state,
              visibleColumns: Array.from(value.state.visibleColumns || []),
            },
          });
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);
