/**
 * Types for tactical planning system based on PES6
 */

// Enums
export type AttackDefenceLevel =
  | 'ALL_OUT_DEFENCE'
  | 'DEFENSIVE'
  | 'BALANCED'
  | 'ATTACKING'
  | 'ALL_OUT_ATTACK';

export type DefensiveAttitude = 'DEFENSIVE' | 'BALANCED' | 'OFFENSIVE';

export type BackLineDepth = 'A' | 'B' | 'C'; // A=high, B=medium, C=deep

export type OffsideTrapLevel = 'A' | 'B' | 'C'; // A=aggressive, B=situational, C=minimal

export type RunDirection =
  | 'FORWARD'
  | 'BACKWARD'
  | 'LEFT'
  | 'RIGHT'
  | 'DIAGONAL_LEFT_FORWARD'
  | 'DIAGONAL_RIGHT_FORWARD'
  | 'DIAGONAL_LEFT_BACKWARD'
  | 'DIAGONAL_RIGHT_BACKWARD';

export type ManualStrategy =
  | 'NO_STRATEGY'
  | 'CENTRE_ATTACK'
  | 'RIGHT_SIDE_ATTACK'
  | 'LEFT_SIDE_ATTACK'
  | 'OPPOSITE_SIDE_ATTACK'
  | 'CHANGE_SIDES'
  | 'CB_OVERLAP'
  | 'PRESSURE'
  | 'COUNTER_ATTACK'
  | 'OFFSIDE_TRAP'
  | 'STRATEGY_PLAN_A'
  | 'STRATEGY_PLAN_B';

// Player positioning and instructions
export interface FormationSlot {
  slotId: string;
  x: number; // 0-100 (percentage of pitch width)
  y: number; // 0-100 (percentage of pitch height)
  role: string; // GK, CB, LB, RB, DMF, CMF, AMF, LWF, RWF, CF, SS
  playerId?: string;
}

export interface PlayerInstruction {
  slotId: string;
  runArrows: RunDirection[]; // Max 2
  defensiveAttitude: DefensiveAttitude;
}

export interface StrategySlot {
  strategy: ManualStrategy;
  isActive: boolean; // For animation preview
}

export interface FormationPlan {
  slots: FormationSlot[]; // Always 11
  playerInstructions: Record<string, PlayerInstruction>; // slotId -> instruction
  attackDefenceLevel: AttackDefenceLevel;
  backLine: BackLineDepth;
  offsideTrap: OffsideTrapLevel;
  lastUsedFormation?: string; // Trackea la última formación usada (para mostrar con * cuando se edita)
}

// Squad depth management - Asociado al JUGADOR, no al slot
export interface PlayerDepthChart {
  playerId: string; // Jugador titular
  depth2?: string; // 1st substitute
  depth3?: string; // 2nd substitute
  depth4?: string; // 3rd substitute
  depth5?: string; // 4th substitute
}

// DEPRECATED - solo para compatibilidad con datos antiguos
export interface DepthSlot {
  slotId: string; // Same as FormationSlot.slotId
  role: string; // PT, CT, DI, etc.
  depth1?: string; // Titular (playerId)
  depth2?: string; // 1st substitute
  depth3?: string; // 2nd substitute
  depth4?: string; // 3rd substitute
  depth5?: string; // 4th substitute
}

export interface DepthAssignment {
  position: string; // Role like "CB", "CMF", etc.
  backupPlayerIds: string[]; // Ordered by preference
}

// Transfer recommendations
export interface RecommendedSigning {
  position: string; // Role like "PT", "CT", etc.
  recommendedPlayerIds: string[]; // Up to 3 recommended signings
}

// Team-wide instructions
export interface TeamInstructions {
  attackDefenceLevel: AttackDefenceLevel;
}

export interface TeamStrategy {
  backLine: BackLineDepth;
  offsideTrap: OffsideTrapLevel;
}

// Complete tactic
export interface Tactic {
  tacticId: string;
  name: string;
  dataVersion?: string;
  clubId?: string;
  customDorsals: Record<string, string>; // playerId -> dorsal custom
  rosterContext: {
    candidateInPlayerIds: string[]; // Potential signings
    candidateOutPlayerIds: string[]; // Marked for sale
  };
  basePlan: FormationPlan;
  planA?: FormationPlan;
  planB?: FormationPlan;
  playerDepthCharts: PlayerDepthChart[]; // GLOBAL: Suplentes por jugador (aplica a todos los planes)
  strategySlots: [StrategySlot, StrategySlot, StrategySlot, StrategySlot]; // 4 global strategy slots
  selectedCBForOverlap?: string; // slotId of CB selected for CB_OVERLAP strategy
  depthChart: DepthAssignment[];
  recommendedSignings: RecommendedSigning[];
  createdAt: number;
  updatedAt: number;
}

// Store state
export interface TacticsState {
  savedTactics: Tactic[];
  currentTactic: Tactic | null;
  selectedClubId: string | null;
  showPlanA: boolean;
  showPlanB: boolean;
  combinedView: boolean;
  hasUnsavedChanges: boolean;

  // Actions
  createTactic: (name: string, clubId?: string) => void;
  loadTactic: (tacticId: string) => void;
  saveTactic: () => void;
  saveAsNewTactic: (name: string) => void;
  deleteTactic: (tacticId: string) => void;
  duplicateTactic: (tacticId: string, newName: string) => void;
  duplicateTacticWithoutPlayers: (tacticId: string, newName: string) => void;
  renameTactic: (tacticId: string, newName: string) => void;
  clearCurrentTactic: () => void;

  setClub: (clubId: string | null) => void;
  setTacticName: (name: string) => void;

  // Plan visibility
  setShowPlanA: (show: boolean) => void;
  setShowPlanB: (show: boolean) => void;
  setCombinedView: (combined: boolean) => void;

  // Formation editing
  updateSlot: (
    plan: 'base' | 'planA' | 'planB',
    slotId: string,
    updates: Partial<FormationSlot>,
  ) => void;
  changeFormation: (plan: 'base' | 'planA' | 'planB', formationName: string) => void;
  updatePlayerInstruction: (
    plan: 'base' | 'planA' | 'planB',
    slotId: string,
    instruction: Partial<PlayerInstruction>,
  ) => void;

  // Team instructions
  setAttackDefenceLevel: (
    plan: 'base' | 'planA' | 'planB',
    level: AttackDefenceLevel,
  ) => void;
  setBackLine: (plan: 'base' | 'planA' | 'planB', depth: BackLineDepth) => void;
  setOffsideTrap: (plan: 'base' | 'planA' | 'planB', level: OffsideTrapLevel) => void;

  // Strategy slots (global, not per-plan)
  setStrategyInSlot: (slotIndex: number, strategy: ManualStrategy) => void;
  toggleStrategyActive: (slotIndex: number) => void;
  setSelectedCBForOverlap: (slotId: string | undefined) => void;

  // Roster context
  addCandidateIn: (playerId: string) => void;
  removeCandidateIn: (playerId: string) => void;
  addCandidateOut: (playerId: string) => void;
  removeCandidateOut: (playerId: string) => void;

  // Custom dorsals
  setCustomDorsal: (playerId: string, dorsal: string) => void;

  // Depth chart
  updateDepthChart: (position: string, backupPlayerIds: string[]) => void;
  setDepthSlot: (
    slotId: string,
    depth: 1 | 2 | 3 | 4 | 5,
    playerId: string | undefined,
  ) => void;

  // Recommended signings
  addPossibleSigning: (playerId: string) => void;

  // Export/Import
  exportTactics: () => Tactic[];
  importTactics: (tactics: Tactic[], replace?: boolean) => void;
}
