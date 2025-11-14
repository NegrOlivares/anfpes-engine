import type { DerivedPlayer } from '@anfpes/engine';
import { create } from 'zustand';

interface AnchorPosition {
  x: number;
  y: number;
}

interface PlayerActionsState {
  isOpen: boolean;
  player?: DerivedPlayer;
  anchor?: AnchorPosition;
  open: (player: DerivedPlayer, anchor: AnchorPosition) => void;
  close: () => void;
}

export const usePlayerActionsStore = create<PlayerActionsState>((set) => ({
  isOpen: false,
  open: (player, anchor) => set({ isOpen: true, player, anchor }),
  close: () => set({ isOpen: false, player: undefined, anchor: undefined }),
}));
