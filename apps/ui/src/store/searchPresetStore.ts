import { create } from 'zustand';

export interface SearchPreset {
  query?: string;
}

interface SearchPresetState {
  preset?: SearchPreset;
  setPreset: (preset: SearchPreset) => void;
  consumePreset: () => SearchPreset | undefined;
}

export const useSearchPresetStore = create<SearchPresetState>((set, get) => ({
  preset: undefined,
  setPreset: (preset) => set({ preset }),
  consumePreset: () => {
    const current = get().preset;
    if (!current) {
      return undefined;
    }
    set({ preset: undefined });
    return current;
  },
}));
