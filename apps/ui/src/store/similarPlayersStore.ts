import { create } from 'zustand';
import type { FilterCondition } from '../hooks/usePlayerViews';
import { DEFAULT_TABLE_COLUMNS } from '../constants/playerFields';

type MacroKey = 'ATK' | 'TEC' | 'RES' | 'DEF' | 'FUE' | 'VEL';
type SortDirection = 'asc' | 'desc';
type SimilarSortKey = string | 'SIMILARITY';

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
  setMacroSelection: (selection: Record<MacroKey, boolean>) => void;

  // Mode and similarity
  mode: 'proportional' | 'direct';
  setMode: (mode: 'proportional' | 'direct') => void;
  minSimilarity: number;
  setMinSimilarity: (value: number) => void;
  includePositions: boolean;
  setIncludePositions: (value: boolean) => void;

  // Manual lookup
  manualLookup: string;
  setManualLookup: (value: string) => void;
  lookupError: string;
  setLookupError: (error: string) => void;

  // UI state
  columnsMenuOpen: boolean;
  setColumnsMenuOpen: (open: boolean) => void;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;

  // Sorting
  sortConfig: SimilarSortConfig[];
  setSortConfig: (config: SimilarSortConfig[]) => void;

  // Visible columns
  visibleColumns: Set<string>;
  setVisibleColumns: (columns: Set<string>) => void;

  // Filters
  filters: FilterCondition[];
  setFilters: (filters: FilterCondition[]) => void;
  positionsFilter: string[];
  setPositionsFilter: (positions: string[]) => void;

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

export const useSimilarPlayersStore = create<SimilarPlayersState>((set, get) => ({
  // Base player
  basePlayerId: null,
  setBasePlayerId: (id) => set({ basePlayerId: id }),

  // Macro selection
  macroSelection: DEFAULT_MACRO_SELECTION,
  setMacroSelection: (selection) => set({ macroSelection: selection }),

  // Mode and similarity
  mode: 'proportional',
  setMode: (mode) => set({ mode }),
  minSimilarity: 95,
  setMinSimilarity: (value) => set({ minSimilarity: value }),
  includePositions: false,
  setIncludePositions: (value) => set({ includePositions: value }),

  // Manual lookup
  manualLookup: '',
  setManualLookup: (value) => set({ manualLookup: value }),
  lookupError: '',
  setLookupError: (error) => set({ lookupError: error }),

  // UI state
  columnsMenuOpen: false,
  setColumnsMenuOpen: (open) => set({ columnsMenuOpen: open }),
  filtersOpen: false,
  setFiltersOpen: (open) => set({ filtersOpen: open }),

  // Sorting
  sortConfig: [{ key: 'SIMILARITY', direction: 'desc' }],
  setSortConfig: (config) => set({ sortConfig: config }),

  // Visible columns
  visibleColumns: new Set(DEFAULT_TABLE_COLUMNS),
  setVisibleColumns: (columns) => set({ visibleColumns: columns }),

  // Filters
  filters: [],
  setFilters: (filters) => set({ filters }),
  positionsFilter: [],
  setPositionsFilter: (positions) => set({ positionsFilter: positions }),

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
}));
