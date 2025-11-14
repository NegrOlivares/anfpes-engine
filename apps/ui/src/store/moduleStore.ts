import { create } from 'zustand';

export type ModuleId = 'dashboard' | 'search' | 'preselections' | 'profile' | 'similar';

interface ModuleState {
  activeModuleId: ModuleId;
  setActiveModuleId: (id: ModuleId) => void;
}

export const MODULE_IDS: Record<string, ModuleId> = {
  dashboard: 'dashboard',
  search: 'search',
  preselections: 'preselections',
  profile: 'profile',
  similar: 'similar',
};

export const useModuleStore = create<ModuleState>((set) => ({
  activeModuleId: MODULE_IDS.dashboard,
  setActiveModuleId: (id) => set({ activeModuleId: id }),
}));
