import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DerivedPlayer } from '@anfpes/engine';
import type {
  FormationSlot,
  PlayerInstruction,
  RunDirection,
  ManualStrategy,
  DepthSlot,
} from '../types/tactics';
import { TacticalPlayerCard } from './TacticalPlayerCard';
import { TacticalAnalysisOverlay } from './TacticalAnalysisOverlay';
import { DepthSlotCard } from './DepthSlotCard';
import { useSelectionStore } from '../store/selectionStore';

interface TacticalPitchProps {
  slots: FormationSlot[];
  players: DerivedPlayer[];
  clubId?: string;
  candidateInIds: string[];
  candidateOutIds: string[];
  planLabel: string;
  playerInstructions?: Record<string, PlayerInstruction>;
  showAnalysis?: boolean;
  showAttitudeColors?: boolean;
  showConnections?: boolean;
  showDepthChart?: boolean;
  depthChartSlots?: DepthSlot[];
  getDepthPlayer?: (playerId: string | undefined) => DerivedPlayer | undefined;
  onDepthSlotDrop?: (slotId: string, depth: 1 | 2 | 3 | 4 | 5, playerId: string) => void;
  onDepthSlotRemove?: (slotId: string, depth: 1 | 2 | 3 | 4 | 5) => void;
  activeStrategies?: ManualStrategy[]; // Active strategies from strategy slots
  editingPosition?: boolean;
  labelAddon?: ReactNode;
  attackDefenceLevel?:
    | 'ALL_OUT_DEFENCE'
    | 'DEFENSIVE'
    | 'BALANCED'
    | 'ATTACKING'
    | 'ALL_OUT_ATTACK';
  backLine?: 'A' | 'B' | 'C';
  offsideTrap?: 'A' | 'B' | 'C';
  selectedCBForOverlap?: string; // slotId of CB for overlap strategy
  planASlots?: FormationSlot[]; // For STRATEGY_PLAN_A transition
  planBSlots?: FormationSlot[]; // For STRATEGY_PLAN_B transition
  onSlotClick?: (slotId: string) => void;
  onPlayerDrop?: (slotId: string, playerId: string) => void;
  onSlotDrag?: (fromSlotId: string, toSlotId: string) => void;
  onUpdateInstruction?: (
    playerId: string,
    instruction: Partial<PlayerInstruction>,
  ) => void;
  onRoleChange?: (slotId: string, role: string) => void;
  onPositionChange?: (slotId: string, coords: { x: number; y: number }) => void;
  onPlayerClick?: (player: DerivedPlayer, event: React.MouseEvent) => void;
}

export function TacticalPitch({
  slots,
  players,
  clubId,
  candidateInIds,
  candidateOutIds,
  planLabel,
  playerInstructions = {},
  showAnalysis = false,
  showAttitudeColors = false,
  showConnections = false,
  showDepthChart = false,
  depthChartSlots = [],
  getDepthPlayer,
  onDepthSlotDrop,
  onDepthSlotRemove,
  activeStrategies = [],
  editingPosition = false,
  labelAddon,
  attackDefenceLevel = 'BALANCED',
  backLine = 'B',
  offsideTrap = 'B',
  selectedCBForOverlap,
  planASlots,
  planBSlots,
  onSlotClick,
  onPlayerDrop,
  onSlotDrag,
  onUpdateInstruction,
  onRoleChange,
  onPositionChange,
  onPlayerClick,
}: TacticalPitchProps) {
  const playerMap = useMemo(() => {
    return new Map(players.map((p) => [p.ID, p]));
  }, [players]);
  const pitchRef = useRef<HTMLDivElement>(null);
  const [draggingSlotId, setDraggingSlotId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    slotId: string;
    x: number;
    y: number;
  } | null>(null);
  const [autoOpenRoleFor, setAutoOpenRoleFor] = useState<string | null>(null);
  const [selectedPlayerForConnections, setSelectedPlayerForConnections] = useState<
    string | null
  >(null);
  const [strategyAnimationActive, setStrategyAnimationActive] = useState(true);

  const { selectedPlayerId, selectedFromRoster, clearSelection } = useSelectionStore();

  // Alternate strategy animations every 2 seconds for PRESSURE, COUNTER_ATTACK, OFFSIDE_TRAP
  useEffect(() => {
    const animatedStrategies = ['PRESSURE', 'COUNTER_ATTACK', 'OFFSIDE_TRAP'];
    const hasAnimatedStrategy = activeStrategies.some((s) =>
      animatedStrategies.includes(s),
    );

    if (hasAnimatedStrategy) {
      const interval = setInterval(() => {
        setStrategyAnimationActive((prev) => !prev);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setStrategyAnimationActive(true);
    }
  }, [activeStrategies]);

  // Auto-select goalkeeper when showConnections is enabled, reset when disabled
  useEffect(() => {
    if (!showConnections) {
      setSelectedPlayerForConnections(null);
    } else if (showConnections && !selectedPlayerForConnections) {
      // Auto-select goalkeeper (PT role)
      const goalkeeperSlot = slots.find((slot) => slot.role === 'PT');
      if (goalkeeperSlot?.playerId) {
        setSelectedPlayerForConnections(goalkeeperSlot.playerId);
      }
    }
  }, [showConnections, selectedPlayerForConnections, slots]);

  const getLineForSlot = (slot: FormationSlot): 'defence' | 'midfield' | 'attack' => {
    if (slot.y > 66) return 'defence';
    if (slot.y > 33) return 'midfield';
    return 'attack';
  };

  // Calculate attack/defence level adjustment (affects all players except goalkeeper)
  const getAttackDefenceLevelAdjustment = (): number => {
    const adjustments = {
      ALL_OUT_DEFENCE: 15, // Players drop back
      DEFENSIVE: 7, // Slightly back
      BALANCED: 0, // No change
      ATTACKING: -7, // Push forward
      ALL_OUT_ATTACK: -15, // Everyone pushes up
    };
    return adjustments[attackDefenceLevel];
  };

  // Calculate defensive line adjustment (affects only defenders, excluding goalkeeper)
  const getBackLineAdjustment = (): number => {
    const adjustments = {
      A: -10, // High line (push up)
      B: 0, // Medium line (normal)
      C: 10, // Deep line (drop back)
    };
    return adjustments[backLine];
  };

  // Calculate final Y position with tactical adjustments
  const getAdjustedY = (slot: FormationSlot): number => {
    if (slot.role === 'PT') return slot.y; // Goalkeeper never moves

    let adjustedY = slot.y;

    // Apply attack/defence level to all non-GK players
    adjustedY += getAttackDefenceLevelAdjustment();

    // Apply back line adjustment only to defenders
    const line = getLineForSlot(slot);
    if (line === 'defence') {
      adjustedY += getBackLineAdjustment();
    }

    // Ensure position stays within bounds
    return Math.max(5, Math.min(95, adjustedY));
  };

  // Calculate average Y position of defensive line (for offside trap flags)
  const getDefensiveLineY = (): number => {
    const defenders = slots.filter((slot) => {
      if (slot.role === 'PT') return false; // Exclude goalkeeper
      return getLineForSlot(slot) === 'defence';
    });

    if (defenders.length === 0) return 70; // Default if no defenders

    const totalY = defenders.reduce((sum, slot) => sum + getAdjustedY(slot), 0);
    return totalY / defenders.length;
  };

  const getAllowedRoles = (slot: FormationSlot): string[] => {
    if (slot.role === 'PT') return ['PT'];

    const libAlreadyUsed = slots.some(
      (s) => s.slotId !== slot.slotId && s.role === 'LIB',
    );
    const diExists = slots.some((s) => s.slotId !== slot.slotId && s.role === 'DI');
    const dliExists = slots.some((s) => s.slotId !== slot.slotId && s.role === 'DLI');
    const ddExists = slots.some((s) => s.slotId !== slot.slotId && s.role === 'DD');
    const dldExists = slots.some((s) => s.slotId !== slot.slotId && s.role === 'DLD');
    const cizExists = slots.some((s) => s.slotId !== slot.slotId && s.role === 'CIZ');
    const cdrExists = slots.some((s) => s.slotId !== slot.slotId && s.role === 'CDR');

    const line = getLineForSlot(slot);
    const isLeft = slot.x <= 30;
    const isRight = slot.x >= 70;

    if (line === 'defence') {
      const roles = ['LIB', 'CT'];
      if (isRight) roles.push('DD');
      if (isLeft) roles.push('DI');
      // Solo un LIB por plan
      if (libAlreadyUsed && slot.role !== 'LIB') {
        const libIndex = roles.indexOf('LIB');
        if (libIndex >= 0) roles.splice(libIndex, 1);
      }
      const filtered = roles.filter((r) => {
        if ((r === 'DI' && dliExists) || (r === 'DLI' && diExists)) return false;
        if ((r === 'DD' && dldExists) || (r === 'DLD' && ddExists)) return false;
        return true;
      });
      return filtered;
    }

    if (line === 'midfield') {
      const roles = ['CCD', 'CC', 'MP'];
      if (isRight) roles.push('DLD', 'CDR');
      if (isLeft) roles.push('DLI', 'CIZ');
      const filtered = roles.filter((r) => {
        if ((r === 'DLI' && diExists) || (r === 'DI' && dliExists)) return false;
        if ((r === 'DLD' && ddExists) || (r === 'DD' && dldExists)) return false;
        if ((r === 'CIZ' && dliExists) || (r === 'DLI' && cizExists)) return false;
        if ((r === 'CDR' && dldExists) || (r === 'DLD' && cdrExists)) return false;
        return true;
      });
      return filtered;
    }

    const roles = ['SD', 'DC'];
    if (isRight) roles.push('ED');
    if (isLeft) roles.push('EI');
    return roles;
  };

  const getLineFromY = (y: number): 'defence' | 'midfield' | 'attack' => {
    if (y > 66) return 'defence';
    if (y > 33) return 'midfield';
    return 'attack';
  };

  const validateLineCounts = (slotId: string, newY: number) => {
    let defence = 0;
    let midfield = 0;
    let attack = 0;

    slots.forEach((s) => {
      if (!s.playerId) return;
      if (s.role === 'PT') return;
      const yVal = s.slotId === slotId ? newY : s.y;
      const line = getLineFromY(yVal);
      if (line === 'defence') defence += 1;
      else if (line === 'midfield') midfield += 1;
      else attack += 1;
    });

    if (defence < 2) return { ok: false as const, reason: 'defence_min' as const };
    if (midfield > 6) return { ok: false as const, reason: 'midfield_max' as const };
    if (attack > 5) return { ok: false as const, reason: 'attack_max' as const };
    return { ok: true as const };
  };

  const updateDragPosition = (clientX: number, clientY: number) => {
    if (!editingPosition || !draggingSlotId || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setDragPreview({ slotId: draggingSlotId, x, y });
  };

  const finalizeDrag = () => {
    if (!draggingSlotId || !dragPreview) return;
    const validation = validateLineCounts(draggingSlotId, dragPreview.y);
    setDraggingSlotId(null);
    setDragPreview(null);
    if (!validation.ok) {
      if (validation.reason === 'defence_min') {
        window.alert('Debe haber al menos 2 defensas (sin contar al portero).');
      } else if (validation.reason === 'midfield_max') {
        window.alert('No puedes tener mas de 6 en el mediocampo.');
      } else if (validation.reason === 'attack_max') {
        window.alert('No puedes tener mas de 5 en la delantera.');
      }
      return;
    }
    onPositionChange?.(draggingSlotId, { x: dragPreview.x, y: dragPreview.y });
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!editingPosition || !draggingSlotId) return;
      updateDragPosition(e.clientX, e.clientY);
    };
    const handleUp = () => {
      if (!editingPosition || !draggingSlotId) return;
      finalizeDrag();
    };
    if (editingPosition) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [editingPosition, draggingSlotId, dragPreview]);

  useEffect(() => {
    if (!editingPosition) {
      setDraggingSlotId(null);
      setDragPreview(null);
    }
  }, [editingPosition]);

  useEffect(() => {
    if (!onRoleChange) return;
    let autoOpened = false;
    slots.forEach((slot) => {
      if (slot.role === 'PT') return;
      const allowed = getAllowedRoles(slot);
      if (allowed.length > 0 && !allowed.includes(slot.role)) {
        onRoleChange(slot.slotId, allowed[0]);
        setAutoOpenRoleFor(slot.slotId);
        autoOpened = true;
      }
    });
    if (!autoOpened) {
      setAutoOpenRoleFor(null);
    }
  }, [slots, onRoleChange]);

  // Calculate strategy effects on positioning
  const getStrategyEffect = (
    strategy: ManualStrategy,
    slot: FormationSlot,
  ): { x: number; y: number } => {
    const isDefender = slot.y > 66 && slot.role !== 'PT';
    const isMidfielder = slot.y > 33 && slot.y <= 66;
    const isAttacker = slot.y <= 33;
    const isWinger = slot.x < 30 || slot.x > 70;
    const isLeft = slot.x < 50;
    const isRight = slot.x > 50;
    const isCentered = slot.x >= 45 && slot.x <= 55;
    const isGK = slot.role === 'PT';
    const isLateralDD = slot.role === 'DD' || slot.role === 'DLD';
    const isLateralDI = slot.role === 'DI' || slot.role === 'DLI';

    if (isGK) return { x: 0, y: 0 }; // GK never moves

    switch (strategy) {
      case 'CENTRE_ATTACK':
        // Narrow formation - offensive players close to center (but not if already centered)
        if ((isAttacker || isMidfielder) && !isCentered) {
          if (isLeft) return { x: 5, y: 0 }; // Suave movimiento
          if (isRight) return { x: -5, y: 0 };
        }
        return { x: 0, y: 0 };

      case 'RIGHT_SIDE_ATTACK':
        // Right side overlaps - lateral derecho sube
        if (isLateralDD) return { x: 0, y: -15 }; // DD sube en su banda
        if (isRight && !isDefender) return { x: 5, y: -8 }; // Push up and wide
        if (!isDefender) return { x: 5, y: 0 }; // Slight shift right
        return { x: 0, y: 0 };

      case 'LEFT_SIDE_ATTACK':
        // Left side overlaps - lateral izquierdo sube
        if (isLateralDI) return { x: 0, y: -15 }; // DI sube en su banda
        if (isLeft && !isDefender) return { x: -5, y: -8 }; // Push up and wide
        if (!isDefender) return { x: -5, y: 0 }; // Slight shift left
        return { x: 0, y: 0 };

      case 'OPPOSITE_SIDE_ATTACK':
        // Wingers stay wide instead of closing to center
        if (isWinger) {
          if (isLeft) return { x: -8, y: 0 }; // Stay wider
          if (isRight) return { x: 8, y: 0 }; // Stay wider
        }
        return { x: 0, y: 0 };

      case 'CHANGE_SIDES':
        // Wingers swap positions (mirror X position)
        if (isWinger) {
          const centerX = 50;
          const distanceFromCenter = slot.x - centerX;
          return { x: -distanceFromCenter * 2, y: 0 }; // Mirror position
        }
        return { x: 0, y: 0 };

      case 'CB_OVERLAP':
        // Selected CB pushes forward to attack line
        if (slot.slotId === selectedCBForOverlap) {
          return { x: 0, y: -45 }; // Push selected CB all the way to attack
        }
        return { x: 0, y: 0 };

      case 'PRESSURE':
        // Everyone except GK pushes up slightly (alternates every 2s)
        return strategyAnimationActive ? { x: 0, y: -8 } : { x: 0, y: 0 };

      case 'COUNTER_ATTACK':
        // Attackers stay high, rest drops back (alternates every 2s)
        if (!strategyAnimationActive) return { x: 0, y: 0 };
        if (isAttacker) return { x: 0, y: -12 };
        if (isMidfielder || isDefender) return { x: 0, y: 8 }; // Drop back
        return { x: 0, y: 0 };

      case 'OFFSIDE_TRAP':
        // Defensive line steps up (alternates every 2s)
        if (!strategyAnimationActive) return { x: 0, y: 0 };
        if (isDefender) return { x: 0, y: -12 };
        return { x: 0, y: 0 };

      case 'STRATEGY_PLAN_A':
        // Transition to Plan A formation
        if (planASlots) {
          const targetSlot = planASlots.find((s) => s.slotId === slot.slotId);
          if (targetSlot) {
            return { x: targetSlot.x - slot.x, y: targetSlot.y - slot.y };
          }
        }
        return { x: 0, y: 0 };

      case 'STRATEGY_PLAN_B':
        // Transition to Plan B formation
        if (planBSlots) {
          const targetSlot = planBSlots.find((s) => s.slotId === slot.slotId);
          if (targetSlot) {
            return { x: targetSlot.x - slot.x, y: targetSlot.y - slot.y };
          }
        }
        return { x: 0, y: 0 };

      default:
        return { x: 0, y: 0 };
    }
  };

  // Calculate ghost positions if analysis is enabled OR if strategies are active
  const ghostPositions = useMemo(() => {
    if (!showAnalysis && activeStrategies.length === 0)
      return new Map<string, { x: number; y: number }>();

    const map = new Map<string, { x: number; y: number }>();
    slots
      .filter((s) => s.playerId)
      .forEach((slot) => {
        const arrows = playerInstructions[slot.playerId!]?.runArrows || [];
        let deltaX = 0;
        let deltaY = 0;
        const moveDistance = 35;

        // Apply arrow movements
        if (showAnalysis && arrows.length > 0) {
          arrows.forEach((arrow) => {
            switch (arrow) {
              case 'FORWARD':
                deltaY -= moveDistance;
                break;
              case 'BACKWARD':
                deltaY += moveDistance;
                break;
              case 'LEFT':
                deltaX -= moveDistance;
                break;
              case 'RIGHT':
                deltaX += moveDistance;
                break;
              case 'DIAGONAL_LEFT_FORWARD':
                deltaX -= moveDistance * 0.7;
                deltaY -= moveDistance * 0.7;
                break;
              case 'DIAGONAL_RIGHT_FORWARD':
                deltaX += moveDistance * 0.7;
                deltaY -= moveDistance * 0.7;
                break;
              case 'DIAGONAL_LEFT_BACKWARD':
                deltaX -= moveDistance * 0.7;
                deltaY += moveDistance * 0.7;
                break;
              case 'DIAGONAL_RIGHT_BACKWARD':
                deltaX += moveDistance * 0.7;
                deltaY += moveDistance * 0.7;
                break;
            }
          });
        }

        // Apply strategy effects (accumulate all active strategies)
        activeStrategies.forEach((strategy) => {
          const strategyDelta = getStrategyEffect(strategy, slot);
          deltaX += strategyDelta.x;
          deltaY += strategyDelta.y;
        });

        if (deltaX !== 0 || deltaY !== 0) {
          map.set(slot.playerId!, { x: deltaX, y: deltaY });
        }
      });
    return map;
  }, [slots, playerInstructions, showAnalysis, activeStrategies]);

  return (
    <div className="tactical-pitch-container">
      <div className="tactical-pitch-header">
        <div className="tactical-pitch-label">{planLabel}</div>
        {labelAddon && <div className="tactical-pitch-addon">{labelAddon}</div>}
      </div>
      <div className="tactical-pitch" ref={pitchRef}>
        {/* Pitch background with lines */}
        <div className="pitch-background">
          <div className="pitch-line halfway-line" />
          <div className="pitch-line penalty-box-top" />
          <div className="pitch-line penalty-box-bottom" />
          <div className="pitch-circle center-circle" />
        </div>

        {editingPosition && (
          <div className="edit-guides">
            <div className="line-band attack-band" />
            <div className="line-band midfield-band" />
            <div className="line-band defence-band" />
            <div className="guide-line guide-horizontal" style={{ top: '33%' }} />
            <div className="guide-line guide-horizontal" style={{ top: '66%' }} />
            <div className="guide-line guide-vertical" style={{ left: '30%' }} />
            <div className="guide-line guide-vertical" style={{ left: '70%' }} />
          </div>
        )}

        {/* Tactical Analysis Overlay */}
        {showAnalysis && (
          <TacticalAnalysisOverlay
            slots={slots}
            playerInstructions={playerInstructions}
          />
        )}

        {/* Offside Trap Flags */}
        {offsideTrap !== 'C' && !editingPosition && (
          <>
            {(() => {
              const lineY = getDefensiveLineY();
              const flagCount = offsideTrap === 'A' ? 2 : 1;
              const flags = [];

              for (let i = 0; i < flagCount; i++) {
                const yPosition = lineY + i * 8; // Space flags vertically if multiple

                // Left side flags
                flags.push(
                  <div
                    key={`flag-left-${i}`}
                    style={{
                      position: 'absolute',
                      left: '-8%',
                      top: `${yPosition}%`,
                      transform: 'translateY(-50%)' + 'scaleX(-1)',
                      fontSize: '1.5rem',
                      zIndex: 5,
                      pointerEvents: 'none',
                      textShadow: '0 0 3px rgba(0,0,0,0.5)',
                    }}
                  >
                    🚩
                  </div>,
                );

                // Right side flags
                flags.push(
                  <div
                    key={`flag-right-${i}`}
                    style={{
                      position: 'absolute',
                      right: '-8%',
                      top: `${yPosition}%`,
                      transform: 'translateY(-50%)',
                      fontSize: '1.5rem',
                      zIndex: 5,
                      pointerEvents: 'none',
                      textShadow: '0 0 3px rgba(0,0,0,0.5)',
                    }}
                  >
                    🚩
                  </div>,
                );
              }

              return flags;
            })()}
          </>
        )}

        {/* Connection Overlay */}
        {showConnections && selectedPlayerForConnections && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.3)',
              boxShadow: 'inset 0 0 50px rgba(0, 0, 0, 0.5)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        )}

        {/* Teamwork Connections */}
        {showConnections && selectedPlayerForConnections && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 100,
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {(() => {
              const selectedSlot = slots.find(
                (s) => s.playerId === selectedPlayerForConnections,
              );
              if (!selectedSlot) return null;

              const selectedPlayer = playerMap.get(selectedPlayerForConnections);
              if (!selectedPlayer) return null;

              const selectedTeamwork = Number(selectedPlayer['TRABAJO EN EQUIPO']) || 0;

              return slots
                .filter((s) => s.playerId && s.playerId !== selectedPlayerForConnections)
                .map((targetSlot) => {
                  const targetPlayer = playerMap.get(targetSlot.playerId!);
                  if (!targetPlayer) return null;

                  const targetTeamwork = Number(targetPlayer['TRABAJO EN EQUIPO']) || 0;
                  const avgTeamwork = Math.floor((selectedTeamwork + targetTeamwork) / 2);

                  // Calculate line color based on teamwork level
                  const getConnectionColor = (teamwork: number) => {
                    if (teamwork >= 85) return '#4CAF50'; // Green
                    if (teamwork >= 75) return '#8BC34A'; // Light green
                    if (teamwork >= 65) return '#FFC107'; // Yellow
                    if (teamwork >= 55) return '#FF9800'; // Orange
                    return '#F44336'; // Red
                  };

                  const color = getConnectionColor(avgTeamwork);

                  return (
                    <g key={targetSlot.slotId}>
                      <line
                        x1={selectedSlot.x}
                        y1={selectedSlot.y}
                        x2={targetSlot.x}
                        y2={targetSlot.y}
                        stroke={color}
                        strokeWidth="0.6"
                        opacity="0.9"
                      />
                      <text
                        x={(selectedSlot.x + targetSlot.x) / 2}
                        y={(selectedSlot.y + targetSlot.y) / 2}
                        fill={color}
                        fontSize="4"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          textShadow: '0 0 0.5 rgba(0,0,0,0.9)',
                          pointerEvents: 'none',
                        }}
                      >
                        {avgTeamwork}
                      </text>
                    </g>
                  );
                });
            })()}
          </svg>
        )}

        {/* Player slots */}
        {slots.map((slot) => {
          const player = slot.playerId ? playerMap.get(slot.playerId) : undefined;
          const isCandidate = slot.playerId
            ? candidateInIds.includes(slot.playerId)
            : false;
          const isMarkedOut = slot.playerId
            ? candidateOutIds.includes(slot.playerId)
            : false;
          const allowedRoles = onRoleChange ? getAllowedRoles(slot) : [];

          // Calculate base position
          let displayX =
            draggingSlotId === slot.slotId && dragPreview ? dragPreview.x : slot.x;
          const baseY =
            draggingSlotId === slot.slotId && dragPreview ? dragPreview.y : slot.y;
          let displayY = editingPosition ? baseY : getAdjustedY({ ...slot, y: baseY });

          // Apply strategy effects to position
          if (!editingPosition && activeStrategies.length > 0) {
            activeStrategies.forEach((strategy) => {
              const strategyDelta = getStrategyEffect(strategy, { ...slot, y: baseY });
              displayX += strategyDelta.x;
              displayY += strategyDelta.y;
            });
          }

          // Ensure position stays within bounds
          displayX = Math.max(0, Math.min(100, displayX));
          displayY = Math.max(0, Math.min(100, displayY));

          return (
            <div
              key={slot.slotId}
              className={`tactical-slot ${selectedPlayerId && selectedFromRoster && !player ? 'target-available' : ''}`}
              style={{
                left: `${displayX}%`,
                top: `${displayY}%`,
                transition: editingPosition
                  ? 'none'
                  : 'left 0.6s ease-out, top 0.6s ease-out',
              }}
              onClick={() => {
                if (showConnections && slot.playerId) {
                  setSelectedPlayerForConnections(slot.playerId);
                } else if (!editingPosition) {
                  // Si hay un jugador seleccionado del roster, asignarlo a este slot
                  if (selectedPlayerId && selectedFromRoster && onPlayerDrop) {
                    if (!player) {
                      // Slot vacío, asignar jugador
                      onPlayerDrop(slot.slotId, selectedPlayerId);
                      clearSelection();
                    } else if (player.ID !== selectedPlayerId) {
                      // Slot ocupado, reemplazar jugador
                      onPlayerDrop(slot.slotId, selectedPlayerId);
                      clearSelection();
                    }
                  } else {
                    // Click normal en slot
                    onSlotClick?.(slot.slotId);
                  }
                }
              }}
              onMouseDown={(e) => {
                if (!editingPosition) return;
                if (slot.role === 'PT') return;
                e.preventDefault();
                setDraggingSlotId(slot.slotId);
                setDragPreview({ slotId: slot.slotId, x: slot.x, y: slot.y });
              }}
            >
              {showDepthChart ? (
                (() => {
                  // Find the depth chart slot matching this formation slot
                  const depthSlot = depthChartSlots.find(
                    (ds) => ds.slotId === slot.slotId,
                  );
                  return (
                    <DepthSlotCard
                      role={slot.role}
                      slotId={slot.slotId}
                      depth1={getDepthPlayer?.(depthSlot?.depth1)}
                      depth2={getDepthPlayer?.(depthSlot?.depth2)}
                      depth3={getDepthPlayer?.(depthSlot?.depth3)}
                      depth4={getDepthPlayer?.(depthSlot?.depth4)}
                      depth5={getDepthPlayer?.(depthSlot?.depth5)}
                      onPlayerDrop={(depth, playerId) => {
                        onDepthSlotDrop?.(slot.slotId, depth, playerId);
                      }}
                      onPlayerRemove={(depth) => {
                        onDepthSlotRemove?.(slot.slotId, depth);
                      }}
                      onPlayerClick={onPlayerClick}
                    />
                  );
                })()
              ) : player ? (
                <TacticalPlayerCard
                  player={player}
                  clubId={clubId}
                  slotRole={slot.role}
                  isCandidate={isCandidate}
                  isMarkedOut={isMarkedOut}
                  movementArrows={playerInstructions[player.ID]?.runArrows || []}
                  onUpdateInstruction={onUpdateInstruction}
                  ghostPosition={ghostPositions.get(player.ID)}
                  defensiveAttitude={playerInstructions[player.ID]?.defensiveAttitude}
                  showAttitudeColors={showAttitudeColors}
                  roleOptions={onRoleChange ? allowedRoles : undefined}
                  autoOpenRoleMenu={autoOpenRoleFor === slot.slotId}
                  onRoleMenuClose={() => setAutoOpenRoleFor(null)}
                  onRoleChange={
                    onRoleChange
                      ? (newRole) => onRoleChange(slot.slotId, newRole)
                      : undefined
                  }
                  onClick={onPlayerClick ? (e) => onPlayerClick(player, e) : undefined}
                />
              ) : (
                <div className="tactical-empty-slot">
                  <div className="empty-slot-role">{slot.role}</div>
                  <div className="empty-slot-hint">+</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getStrategyName(strategy: ManualStrategy): string {
  const names: Record<ManualStrategy, string> = {
    NO_STRATEGY: 'Sin Estrategia',
    CENTRE_ATTACK: 'Ataque Central',
    RIGHT_SIDE_ATTACK: 'Ataque por Derecha',
    LEFT_SIDE_ATTACK: 'Ataque por Izquierda',
    OPPOSITE_SIDE_ATTACK: 'Ataque Lado Contrario',
    CHANGE_SIDES: 'Cambio de Banda',
    CB_OVERLAP: 'Centrales Suben',
    PRESSURE: 'Presión',
    COUNTER_ATTACK: 'Contraataque',
    OFFSIDE_TRAP: 'Trampa Fuera de Juego',
    STRATEGY_PLAN_A: 'Plan A',
    STRATEGY_PLAN_B: 'Plan B',
  };
  return names[strategy] || strategy;
}
