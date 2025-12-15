import { create } from 'zustand';
import type { SortConfig } from '../types/table';
import { DEFAULT_TABLE_COLUMNS } from '../constants/playerFields';

interface PreselectionViewState {
  // Active preselection
  activePreselectionId: string;
  setActivePreselectionId: (id: string) => void;

  // Sorting
  sortConfig: SortConfig[];
  setSortConfig: (config: SortConfig[]) => void;

  // Visible columns
  visibleColumns: Set<string>;
  setVisibleColumns: (columns: Set<string>) => void;

  // UI state
  columnsMenuOpen: boolean;
  setColumnsMenuOpen: (open: boolean) => void;

  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;

  // Filter by tags
  filterByTags: Set<string>;
  setFilterByTags: (tags: Set<string>) => void;

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
  setSortConfig: (config) => set({ sortConfig: config }),

  // Visible columns
  visibleColumns: new Set(DEFAULT_TABLE_COLUMNS),
  setVisibleColumns: (columns) => set({ visibleColumns: columns }),

  // UI state
  columnsMenuOpen: false,
  setColumnsMenuOpen: (open) => set({ columnsMenuOpen: open }),

  // Pagination
  currentPage: 1,
  setCurrentPage: (page) => set({ currentPage: page }),

  // Filter by tags
  filterByTags: new Set(),
  setFilterByTags: (tags) => set({ filterByTags: tags }),

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
