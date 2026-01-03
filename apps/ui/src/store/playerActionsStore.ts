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
  hideCompare?: boolean;
  hideProfile?: boolean;
  forceDown?: boolean;
  open: (
    player: DerivedPlayer,
    anchor: AnchorPosition,
    opts?: { hideCompare?: boolean; hideProfile?: boolean; forceDown?: boolean },
  ) => void;
  close: () => void;
}

export const usePlayerActionsStore = create<PlayerActionsState>((set) => ({
  isOpen: false,
  open: (player, anchor, opts) =>
    set({
      isOpen: true,
      player,
      anchor,
      hideCompare: opts?.hideCompare ?? false,
      hideProfile: opts?.hideProfile ?? false,
      forceDown: opts?.forceDown ?? false,
    }),
  close: () =>
    set({
      isOpen: false,
      player: undefined,
      anchor: undefined,
      hideCompare: false,
      hideProfile: false,
      forceDown: false,
    }),
}));
