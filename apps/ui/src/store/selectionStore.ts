import { create } from 'zustand';

interface SelectionState {
  // Player selection for tactical assignments
  selectedPlayerId: string | null;
  selectedFromRoster: boolean;

  // Slot selection for depth chart
  selectedDepthSlot: {
    slotId: string;
    depth: 1 | 2 | 3 | 4 | 5;
  } | null;

  // Actions
  selectPlayer: (playerId: string, fromRoster: boolean) => void;
  selectDepthSlot: (slotId: string, depth: 1 | 2 | 3 | 4 | 5) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedPlayerId: null,
  selectedFromRoster: false,
  selectedDepthSlot: null,

  selectPlayer: (playerId, fromRoster) => {
    set({
      selectedPlayerId: playerId,
      selectedFromRoster: fromRoster,
      selectedDepthSlot: null,
    });
  },

  selectDepthSlot: (slotId, depth) => {
    set({
      selectedDepthSlot: { slotId, depth },
      selectedPlayerId: null,
      selectedFromRoster: false,
    });
  },

  clearSelection: () => {
    set({
      selectedPlayerId: null,
      selectedFromRoster: false,
      selectedDepthSlot: null,
    });
  },
}));
