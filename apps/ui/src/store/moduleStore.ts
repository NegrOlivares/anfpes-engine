import { create } from 'zustand';
import { useNavigationHistoryStore } from './navigationHistoryStore';
import { useSimilarPlayersStore } from './similarPlayersStore';
import { useComparatorStore } from './comparatorLaunchStore';
import { usePlayerProfileStore } from './playerProfileStore';
import { usePreselectionViewStore } from './preselectionViewStore';

export type ModuleId =
  | 'dashboard'
  | 'search'
  | 'preselections'
  | 'profile'
  | 'similar'
  | 'comparator'
  | 'planning';

interface ModuleState {
  activeModuleId: ModuleId;
  isNavigating: boolean;
  setActiveModuleId: (id: ModuleId, fromNavigation?: boolean) => void;
  pushToHistory: (moduleId: ModuleId) => void;
  navigateBack: () => void;
  navigateForward: () => void;
}

export const MODULE_IDS: Record<string, ModuleId> = {
  dashboard: 'dashboard',
  search: 'search',
  preselections: 'preselections',
  profile: 'profile',
  similar: 'similar',
  comparator: 'comparator',
  planning: 'planning',
};

// Helper to capture current state snapshot of all stores
function captureModuleSnapshot(moduleId: ModuleId): Record<string, any> {
  switch (moduleId) {
    case 'similar':
      return useSimilarPlayersStore.getState().getSnapshot();
    case 'comparator':
      return useComparatorStore.getState().getSnapshot();
    case 'profile':
      return usePlayerProfileStore.getState().getSnapshot();
    case 'preselections':
      return usePreselectionViewStore.getState().getSnapshot();
    case 'search':
    case 'dashboard':
    default:
      return {};
  }
}

// Helper to restore state snapshot to appropriate store
function restoreModuleSnapshot(moduleId: ModuleId, snapshot: Record<string, any>) {
  switch (moduleId) {
    case 'similar':
      useSimilarPlayersStore.getState().restoreSnapshot(snapshot);
      break;
    case 'comparator':
      useComparatorStore.getState().restoreSnapshot(snapshot);
      break;
    case 'profile':
      usePlayerProfileStore.getState().restoreSnapshot(snapshot);
      break;
    case 'preselections':
      usePreselectionViewStore.getState().restoreSnapshot(snapshot);
      break;
  }
}

export const useModuleStore = create<ModuleState>((set, get) => ({
  activeModuleId: MODULE_IDS.dashboard,
  isNavigating: false,

  setActiveModuleId: (id, fromNavigation = false) => {
    const { activeModuleId, isNavigating } = get();

    // If already navigating, don't create navigation loops
    if (isNavigating) {
      return;
    }

    // Capture current state BEFORE changing module (only if not navigating)
    if (!fromNavigation && activeModuleId !== id) {
      // Capture the state we're about to leave
      const currentSnapshot = captureModuleSnapshot(activeModuleId);
      useNavigationHistoryStore.getState().push(activeModuleId, currentSnapshot);
    }

    // Update activeModuleId
    if (activeModuleId !== id) {
      set({ activeModuleId: id, isNavigating: fromNavigation });
      if (fromNavigation) {
        setTimeout(() => set({ isNavigating: false }), 0);
      }
    }
  },

  pushToHistory: (moduleId) => {
    const snapshot = captureModuleSnapshot(moduleId);
    useNavigationHistoryStore.getState().push(moduleId, snapshot);
  },

  navigateBack: () => {
    // First, save current state before navigating
    const { activeModuleId } = get();
    const currentSnapshot = captureModuleSnapshot(activeModuleId);
    useNavigationHistoryStore.getState().push(activeModuleId, currentSnapshot);

    const entry = useNavigationHistoryStore.getState().goBack();
    if (entry) {
      // Restore the snapshot for that module
      restoreModuleSnapshot(entry.moduleId as ModuleId, entry.snapshot);
      // Use setActiveModuleId with fromNavigation flag
      get().setActiveModuleId(entry.moduleId as ModuleId, true);
    }
  },

  navigateForward: () => {
    // First, save current state before navigating
    const { activeModuleId } = get();
    const currentSnapshot = captureModuleSnapshot(activeModuleId);
    useNavigationHistoryStore.getState().push(activeModuleId, currentSnapshot);

    const entry = useNavigationHistoryStore.getState().goForward();
    if (entry) {
      // Restore the snapshot for that module
      restoreModuleSnapshot(entry.moduleId as ModuleId, entry.snapshot);
      // Use setActiveModuleId with fromNavigation flag
      get().setActiveModuleId(entry.moduleId as ModuleId, true);
    }
  },
}));
