import { create } from 'zustand';

interface WindowModeState {
  isFullscreen: boolean;
  setIsFullscreen: (isFullscreen: boolean) => void;
}

export const useWindowModeStore = create<WindowModeState>((set) => ({
  isFullscreen: true, // Asume fullscreen por defecto para evitar padding flash
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
}));
