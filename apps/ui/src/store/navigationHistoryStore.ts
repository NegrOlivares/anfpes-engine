import { create } from 'zustand';

const MAX_HISTORY = 15;

export interface ModuleSnapshot {
  moduleId: string;
  timestamp: number;
  snapshot: Record<string, any>;
}

interface NavigationHistoryState {
  // History stack with snapshots
  history: ModuleSnapshot[];
  currentIndex: number;

  // Navigation capabilities
  canGoBack: boolean;
  canGoForward: boolean;

  // Actions
  push: (moduleId: string, snapshot: Record<string, any>) => void;
  goBack: () => ModuleSnapshot | null;
  goForward: () => ModuleSnapshot | null;
  reset: () => void;
}

export const useNavigationHistoryStore = create<NavigationHistoryState>((set, get) => ({
  history: [],
  currentIndex: -1,
  canGoBack: false,
  canGoForward: false,

  push: (moduleId: string, snapshot: Record<string, any>) => {
    const { history, currentIndex } = get();

    const entry: ModuleSnapshot = {
      moduleId,
      timestamp: Date.now(),
      snapshot,
    };

    // Check if we're pushing the exact same state (avoid duplicates when user just clicks around)
    const lastEntry = history[currentIndex];
    if (
      lastEntry &&
      lastEntry.moduleId === moduleId &&
      JSON.stringify(lastEntry.snapshot) === JSON.stringify(snapshot)
    ) {
      // Same state, don't add duplicate
      return;
    }

    // Always add new entry to allow multiple visits to same module
    // Remove any forward history when pushing new
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(entry);

    // Apply max limit (FIFO)
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    const newIndex = newHistory.length - 1;

    set({
      history: newHistory,
      currentIndex: newIndex,
      canGoBack: newIndex > 0,
      canGoForward: false,
    });
  },

  goBack: () => {
    const { history, currentIndex } = get();

    if (currentIndex <= 0) {
      return null;
    }

    const newIndex = currentIndex - 1;
    const entry = history[newIndex];

    set({
      currentIndex: newIndex,
      canGoBack: newIndex > 0,
      canGoForward: true,
    });

    return entry;
  },

  goForward: () => {
    const { history, currentIndex } = get();

    if (currentIndex >= history.length - 1) {
      return null;
    }

    const newIndex = currentIndex + 1;
    const entry = history[newIndex];

    set({
      currentIndex: newIndex,
      canGoBack: true,
      canGoForward: newIndex < history.length - 1,
    });

    return entry;
  },

  reset: () =>
    set({
      history: [],
      currentIndex: -1,
      canGoBack: false,
      canGoForward: false,
    }),
}));
