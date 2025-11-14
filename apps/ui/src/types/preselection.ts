/**
 * Types for the preselection system
 */

import type { DerivedPlayer } from '@anfpes/engine';

/**
 * Player tag for custom categorization
 */
export interface PlayerTag {
  id: string;
  label: string;
  color: string; // hex color
}

/**
 * Note attached to a player in a preselection
 */
export interface PlayerNote {
  playerId: string;
  note: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

/**
 * Custom player tags in a preselection
 */
export interface PlayerTags {
  playerId: string;
  tags: string[]; // tag IDs
}

/**
 * A preselection of players
 */
export interface Preselection {
  id: string;
  name: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  playerIds: string[]; // IDs of players in this preselection
  notes: Record<string, string>; // playerId -> note text
  tags: Record<string, string[]>; // playerId -> tag IDs
}

/**
 * State for managing preselections
 */
export interface PreselectionState {
  // All preselections
  preselections: Preselection[];

  // Available tags
  availableTags: PlayerTag[];

  // Currently selected players in the search view (for bulk actions)
  selectedPlayerIds: Set<string>;

  // Actions
  createPreselection: (name: string) => void;
  deletePreselection: (id: string) => void;
  renamePreselection: (id: string, newName: string) => void;

  addPlayersToPreselection: (preselectionId: string, playerIds: string[]) => void;
  removePlayersFromPreselection: (preselectionId: string, playerIds: string[]) => void;

  setPlayerNote: (preselectionId: string, playerId: string, note: string) => void;
  deletePlayerNote: (preselectionId: string, playerId: string) => void;

  addPlayerTag: (preselectionId: string, playerId: string, tagId: string) => void;
  removePlayerTag: (preselectionId: string, playerId: string, tagId: string) => void;

  createTag: (label: string, color: string) => PlayerTag;
  deleteTag: (tagId: string) => void;
  updateTag: (tagId: string, label: string, color: string) => void;

  // Selection management
  selectPlayer: (playerId: string) => void;
  deselectPlayer: (playerId: string) => void;
  selectAllPlayers: (playerIds: string[]) => void;
  clearSelection: () => void;

  // Helper queries
  getPreselection: (id: string) => Preselection | undefined;
  getPlayerPreselections: (playerId: string) => Preselection[];
  getPlayersInPreselection: (id: string, allPlayers: DerivedPlayer[]) => DerivedPlayer[];
}
