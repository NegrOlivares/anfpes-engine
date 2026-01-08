import { useEffect, useState } from 'react';
import type { DerivedPlayer } from '@anfpes/engine';
import type { PlayerInstruction, RunDirection } from '../types/tactics';
import { getPlayerThumbPath } from '../utils/imageHelpers';
import { getShirtStyle } from '../components/PlayerProfile';
import { getStatColor } from '../types/table';
import { MovementArrows } from './MovementArrows';
import { MovementArrowEditor } from './MovementArrowEditor';
import { EnhancedTooltip } from './EnhancedTooltip';
import { openPlayerActionsMenu } from './PlayerActionsOverlay';

// Map role to position line for badge color
function getRolePositionLine(role: string): string {
  const lineMap: Record<string, string> = {
    PT: 'PT',
    DI: 'DEF',
    DD: 'DEF',
    CT: 'DEF',
    LIB: 'DEF',
    DLI: 'MED',
    DLD: 'MED',
    CCD: 'MED',
    CC: 'MED',
    CIZ: 'MED',
    CDR: 'MED',
    MP: 'MED',
    EI: 'ATA',
    ED: 'ATA',
    DC: 'ATA',
    SD: 'ATA',
  };
  return lineMap[role] || 'DEF';
}

interface TacticalPlayerCardProps {
  player: DerivedPlayer;
  clubId?: string;
  slotRole: string;
  customDorsal?: string;
  isCandidate?: boolean;
  isMarkedOut?: boolean;
  movementArrows?: RunDirection[];
  onUpdateInstruction?: (
    playerId: string,
    instruction: Partial<PlayerInstruction>,
  ) => void;
  ghostPosition?: { x: number; y: number };
  defensiveAttitude?: 'DEFENSIVE' | 'BALANCED' | 'OFFENSIVE';
  showAttitudeColors?: boolean;
  roleOptions?: string[];
  onRoleChange?: (role: string) => void;
  autoOpenRoleMenu?: boolean;
  onRoleMenuClose?: () => void;
}

// Helper to get position average
function getPositionAverage(player: DerivedPlayer, role: string): string | null {
  // Map tactical roles to DerivedPlayer position fields
  const posMap: Record<string, keyof DerivedPlayer> = {
    PT: 'PT', // Portero
    DI: 'SA', // Defensa Izquierdo -> Lateral (SA)
    DD: 'SA', // Defensa Derecho -> Lateral (SA)
    CT: 'CT', // Central
    LIB: 'LIB', // Líbero
    DLI: 'LA', // Defensa Lateral Izquierdo
    DLD: 'LA', // Defensa Lateral Derecho
    CCD: 'CCD', // Centrocampista Defensivo
    CC: 'CC', // Centrocampista Central
    CIZ: 'VOL', // Centrocampista Izquierdo -> Volante
    CDR: 'VOL', // Centrocampista Derecho -> Volante
    MP: 'MP', // Mediapunta
    EI: 'EX', // Extremo Izquierdo
    ED: 'EX', // Extremo Derecho
    DC: 'DC', // Delantero Centro
    SD: 'SD', // Segundo Delantero
  };

  const field = posMap[role];
  if (!field) return null;

  const value = player[field];
  if (typeof value === 'number') {
    return value.toFixed(0);
  }
  return null;
}

export function TacticalPlayerCard({
  player,
  clubId,
  slotRole,
  customDorsal,
  isCandidate = false,
  isMarkedOut = false,
  movementArrows = [],
  onUpdateInstruction,
  ghostPosition,
  defensiveAttitude = 'BALANCED',
  showAttitudeColors = false,
  roleOptions,
  onRoleChange,
  autoOpenRoleMenu = false,
  onRoleMenuClose,
}: TacticalPlayerCardProps) {
  const [showArrowEditor, setShowArrowEditor] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const [animatedPosition, setAnimatedPosition] = useState({ x: 0, y: 0 });
  const [currentArrowIndex, setCurrentArrowIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const thumbPath = getPlayerThumbPath(player.ID);
  // Usar dorsal customizado si existe, sino el original
  const originalDorsal = typeof player.DORSAL === 'number' ? String(player.DORSAL) : '0';
  const dorsal = customDorsal || originalDorsal;
  const hasDorsal = dorsal && dorsal !== '0';

  // Get shirt style based on club (same system as ProfileModule)
  const shirtStyle = getShirtStyle(
    'club',
    clubId || (player.CLUB as string),
    player.NACIONALIDAD as string,
  );

  // Get position average for the slot role
  const positionAvg = getPositionAverage(player, slotRole);

  // Calculate arrow movement offset
  const calculateArrowOffset = (arrow: RunDirection) => {
    const moveDistance = 15; // 15% del campo
    const diagonal = moveDistance * 0.7;

    const offsets: Record<RunDirection, { x: number; y: number }> = {
      FORWARD: { x: 0, y: -moveDistance },
      BACKWARD: { x: 0, y: moveDistance },
      LEFT: { x: -moveDistance, y: 0 },
      RIGHT: { x: moveDistance, y: 0 },
      DIAGONAL_LEFT_FORWARD: { x: -diagonal, y: -diagonal },
      DIAGONAL_RIGHT_FORWARD: { x: diagonal, y: -diagonal },
      DIAGONAL_LEFT_BACKWARD: { x: -diagonal, y: diagonal },
      DIAGONAL_RIGHT_BACKWARD: { x: diagonal, y: diagonal },
    };

    return offsets[arrow] || { x: 0, y: 0 };
  };

  // Animation effect for movement arrows
  useEffect(() => {
    if (!showAttitudeColors || movementArrows.length === 0) {
      setAnimatedPosition({ x: 0, y: 0 });
      setIsAnimating(false);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let animationFrameId: number;

    const runAnimation = () => {
      const arrow = movementArrows[currentArrowIndex];
      const offset = calculateArrowOffset(arrow);

      // Fase 1: Mover hacia la dirección de la flecha
      setIsAnimating(true);
      setAnimatedPosition(offset);

      // Fase 2: Volver después de 600ms
      timeoutId = setTimeout(() => {
        setAnimatedPosition({ x: 0, y: 0 });

        // Fase 3: Esperar 3 segundos en la posición original
        timeoutId = setTimeout(() => {
          // Cambiar a la siguiente flecha si hay múltiples
          if (movementArrows.length > 1) {
            setCurrentArrowIndex((prev) => (prev + 1) % movementArrows.length);
          }

          // Reiniciar animación
          animationFrameId = requestAnimationFrame(runAnimation);
        }, 3000);
      }, 600);
    };

    // Iniciar animación
    animationFrameId = requestAnimationFrame(runAnimation);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [movementArrows, currentArrowIndex, showAttitudeColors]);

  // Calculate transform for animated position
  const transform =
    isAnimating && animatedPosition
      ? {
          transform: `translate(${animatedPosition.x}%, ${animatedPosition.y}%)`,
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }
      : {};

  // Attitude indicator color
  const attitudeColor = {
    DEFENSIVE: '#f44336',
    BALANCED: '#ffc107',
    OFFENSIVE: '#4caf50',
  }[defensiveAttitude];

  // Auto abrir menú cuando el rol dejó de ser válido
  useEffect(() => {
    if (autoOpenRoleMenu) {
      setRoleMenuOpen(true);
    }
  }, [autoOpenRoleMenu]);

  return (
    <div
      className={`tactical-player-wrapper ${isCandidate ? 'candidate-in' : ''} ${isMarkedOut ? 'candidate-out' : ''}`}
      style={{ ...transform }}
    >
      {showAttitudeColors && movementArrows.length > 0 && (
        <div className="movement-arrows-container">
          <MovementArrows arrows={movementArrows} size={45} />
        </div>
      )}

      {/* Central shirt with dorsal */}
      <div className="tactical-shirt-main">
        <div
          className="tactical-shirt-display"
          style={
            {
              color: shirtStyle.color,
              '--shirt-overlay': shirtStyle.background || '#0f2238',
            } as React.CSSProperties
          }
        >
          {hasDorsal && (
            <div className="tactical-dorsal" style={{ color: shirtStyle.color }}>
              {dorsal}
            </div>
          )}
        </div>

        {/* Arrow Edit Button */}
        {onUpdateInstruction && (
          <EnhancedTooltip content="Editar flechas de movimiento">
            <button
              type="button"
              className="tactical-arrow-edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowArrowEditor(true);
              }}
            >
              ⚡
            </button>
          </EnhancedTooltip>
        )}

        {/* Thumbnail overlay (bottom right) */}
        <img
          src={thumbPath}
          alt={player.NOMBRE as string}
          className="tactical-player-thumb-overlay"
          onError={(e) => {
            e.currentTarget.src = '/images/faces/missing.png';
          }}
        />
      </div>

      {/* Player info below */}
      <div className="tactical-player-info">
        <div
          className="tactical-player-name clickable-name"
          onClick={(e) => {
            e.stopPropagation();
            openPlayerActionsMenu(e, player);
          }}
        >
          {player.NOMBRE as string}
        </div>
        <div className="tactical-player-meta">
          {showAttitudeColors && (
            <EnhancedTooltip content="Actitud defensiva">
              <span className="attitude-indicator" style={{ color: attitudeColor }}>
                ▼
              </span>
            </EnhancedTooltip>
          )}
          <div className="role-badge-select">
            <span
              className={`position-badge primary position-${getRolePositionLine(slotRole)}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onRoleChange && roleOptions && roleOptions.length > 0) {
                  setRoleMenuOpen((open) => !open);
                  if (roleMenuOpen && onRoleMenuClose) onRoleMenuClose();
                }
              }}
            >
              {slotRole}
            </span>
            {onRoleChange && roleOptions && roleOptions.length > 0 && roleMenuOpen && (
              <div className="role-menu">
                {roleOptions.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`role-menu-item ${role === slotRole ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRoleChange(role);
                      setRoleMenuOpen(false);
                      onRoleMenuClose?.();
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>
          {positionAvg && (
            <span
              className="tactical-position-avg"
              style={{ color: getStatColor(positionAvg) || '#fff' }}
            >
              {positionAvg}
            </span>
          )}
        </div>
      </div>

      {/* Arrow Editor Modal */}
      {showArrowEditor && onUpdateInstruction && (
        <MovementArrowEditor
          currentArrows={movementArrows}
          currentAttitude={defensiveAttitude}
          allowedDirections={slotRole === 'PT' ? ['FORWARD', 'BACKWARD'] : undefined}
          onUpdate={(arrows, attitude) =>
            onUpdateInstruction(player.ID, {
              runArrows: arrows,
              defensiveAttitude: attitude,
            })
          }
          onClose={() => setShowArrowEditor(false)}
          playerName={player.NOMBRE as string}
        />
      )}
    </div>
  );
}
