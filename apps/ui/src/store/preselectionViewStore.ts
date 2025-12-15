import { create } from 'zustand';
import type { SortConfig } from '../types/table';
import { DEFAULT_TABLE_COLUMNS } from '../constants/playerFields';

interface PreselectionViewState {
  // Active preselection
  activePreselectionId: string;
  setActivePreselectionId: (id: string) => void;

  // Sorting
  sortConfig: SortConfig[];
  setSortConfig: (config: SortConfig[] | ((prev: SortConfig[]) => SortConfig[])) => void;

  // Visible columns
  visibleColumns: Set<string>;
  setVisibleColumns: (
    columns: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;

  // UI state
  columnsMenuOpen: boolean;
  setColumnsMenuOpen: (open: boolean) => void;

  // Pagination
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;

  // Filter by tags
  filterByTags: Set<string>;
  setFilterByTags: (tags: Set<string> | ((prev: Set<string>) => Set<string>)) => void;

  // Note editing
  editingNoteForPlayer: string | null;
  setEditingNoteForPlayer: (playerId: string | null) => void;
  noteText: string;
  setNoteText: (text: string) => void;

  // Tag management
  managingTagsForPlayer: string | null;
  setManagingTagsForPlayer: (playerId: string | null) => void;

  // Reset
  reset: () => void;

  // Snapshot methods
  getSnapshot: () => Record<string, any>;
  restoreSnapshot: (snapshot: any) => void;
}

export const usePreselectionViewStore = create<PreselectionViewState>((set, get) => ({
  // Active preselection
  activePreselectionId: '',
  setActivePreselectionId: (id) => set({ activePreselectionId: id }),

  // Sorting
  sortConfig: [{ key: 'PROMEDIO', direction: 'desc' }],
  setSortConfig: (config) => {
    const newConfig = typeof config === 'function' ? config(get().sortConfig) : config;
    set({ sortConfig: newConfig });
  },

  // Visible columns
  visibleColumns: new Set(DEFAULT_TABLE_COLUMNS),
  setVisibleColumns: (columns) => {
    const newColumns =
      typeof columns === 'function' ? columns(get().visibleColumns) : columns;
    set({ visibleColumns: newColumns });
  },

  // UI state
  columnsMenuOpen: false,
  setColumnsMenuOpen: (open) => set({ columnsMenuOpen: open }),

  // Pagination
  currentPage: 1,
  setCurrentPage: (page) => {
    const newPage = typeof page === 'function' ? page(get().currentPage) : page;
    set({ currentPage: newPage });
  },

  // Filter by tags
  filterByTags: new Set(),
  setFilterByTags: (tags) => {
    const newTags = typeof tags === 'function' ? tags(get().filterByTags) : tags;
    set({ filterByTags: newTags });
  },

  // Note editing
  editingNoteForPlayer: null,
  setEditingNoteForPlayer: (playerId) => set({ editingNoteForPlayer: playerId }),
  noteText: '',
  setNoteText: (text) => set({ noteText: text }),

  // Tag management
  managingTagsForPlayer: null,
  setManagingTagsForPlayer: (playerId) => set({ managingTagsForPlayer: playerId }),

  // Reset
  reset: () =>
    set({
      sortConfig: [{ key: 'PROMEDIO', direction: 'desc' }],
      visibleColumns: new Set(DEFAULT_TABLE_COLUMNS),
      columnsMenuOpen: false,
      currentPage: 1,
      filterByTags: new Set(),
      editingNoteForPlayer: null,
      noteText: '',
      managingTagsForPlayer: null,
    }),

  // Snapshot methods for navigation history
  getSnapshot: () => {
    const state = get();
    return {
      activePreselectionId: state.activePreselectionId,
      sortConfig: [...state.sortConfig],
      visibleColumns: Array.from(state.visibleColumns),
      columnsMenuOpen: state.columnsMenuOpen,
      currentPage: state.currentPage,
      filterByTags: Array.from(state.filterByTags),
      editingNoteForPlayer: state.editingNoteForPlayer,
      noteText: state.noteText,
      managingTagsForPlayer: state.managingTagsForPlayer,
    };
  },

  restoreSnapshot: (snapshot: any) => {
    set({
      activePreselectionId: snapshot.activePreselectionId ?? '',
      sortConfig: snapshot.sortConfig ?? [{ key: 'PROMEDIO', direction: 'desc' }],
      visibleColumns: new Set(snapshot.visibleColumns ?? DEFAULT_TABLE_COLUMNS),
      columnsMenuOpen: snapshot.columnsMenuOpen ?? false,
      currentPage: snapshot.currentPage ?? 1,
      filterByTags: new Set(snapshot.filterByTags ?? []),
      editingNoteForPlayer: snapshot.editingNoteForPlayer ?? null,
      noteText: snapshot.noteText ?? '',
      managingTagsForPlayer: snapshot.managingTagsForPlayer ?? null,
    });
  },
}));
