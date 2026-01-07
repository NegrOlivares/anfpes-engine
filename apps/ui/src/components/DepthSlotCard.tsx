import { useState } from 'react';
import type { DerivedPlayer } from '@anfpes/engine';
import { getStatColor } from '../types/table';
import { EnhancedTooltip } from './EnhancedTooltip';
import { openPlayerActionsMenu } from './PlayerActionsOverlay';
import { useSelectionStore } from '../store/selectionStore';
import './DepthSlotCard.css';

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
    MCO: 'MED',
  };
  return lineMap[role] || 'DEF';
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
    MCO: 'MP', // Media punta ofensivo
  };

  const field = posMap[role];
  if (!field) return null;

  const value = player[field];
  if (typeof value === 'number') {
    return value.toFixed(0);
  }
  return null;
}

interface DepthSlotCardProps {
  role: string;
  slotId: string; // ← AGREGAR
  depth1?: DerivedPlayer;
  depth2?: DerivedPlayer;
  depth3?: DerivedPlayer;
  depth4?: DerivedPlayer;
  depth5?: DerivedPlayer;
  onPlayerDrop: (depth: 1 | 2 | 3 | 4 | 5, playerId: string) => void;
  onPlayerRemove: (depth: 1 | 2 | 3 | 4 | 5) => void;
  onPlayerClick?: (player: DerivedPlayer, event: React.MouseEvent) => void;
}

export function DepthSlotCard({
  role,
  slotId,
  depth1,
  depth2,
  depth3,
  depth4,
  depth5,
  onPlayerDrop,
  onPlayerRemove,
  onPlayerClick,
}: DepthSlotCardProps) {
  const {
    selectedPlayerId,
    selectedFromRoster,
    selectedDepthSlot,
    selectDepthSlot,
    clearSelection,
  } = useSelectionStore();

  const depths = [
    { num: 1 as const, player: depth1 },
    { num: 2 as const, player: depth2 },
    { num: 3 as const, player: depth3 },
    { num: 4 as const, player: depth4 },
    { num: 5 as const, player: depth5 },
  ];

  const roleLabels: Record<string, string> = {
    PT: 'PT',
    DI: 'DI',
    CT: 'CT',
    DD: 'DD',
    CIZ: 'CIZ',
    CC: 'CC',
    CCD: 'CCD',
    CDR: 'CDR',
    EI: 'EI',
    ED: 'ED',
    DC: 'DC',
    SD: 'SD',
    MCO: 'MP',
  };

  return (
    <div className="depth-slot-card">
      <div className="depth-slot-header">
        <span className={`position-badge primary position-${getRolePositionLine(role)}`}>
          {roleLabels[role] || role}
        </span>
      </div>
      <div className="depth-slot-list">
        {depths.map(({ num, player }) => {
          const isSelected =
            selectedDepthSlot?.slotId === slotId && selectedDepthSlot?.depth === num;

          return (
            <div
              key={num}
              className={`depth-slot-line depth-${num} ${!player ? 'empty' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();

                // Si hay un jugador seleccionado del roster, asignarlo aquí
                if (selectedPlayerId && selectedFromRoster) {
                  // Validar que el jugador no esté ya en esta card
                  const allPlayers = [depth1, depth2, depth3, depth4, depth5];
                  const isDuplicate = allPlayers.some((p) => p?.ID === selectedPlayerId);
                  if (!isDuplicate) {
                    onPlayerDrop(num, selectedPlayerId);
                    clearSelection();
                  }
                  return;
                }

                // Si hay un slot de depth seleccionado, intercambiar
                if (
                  selectedDepthSlot &&
                  selectedDepthSlot.slotId === slotId &&
                  selectedDepthSlot.depth !== num
                ) {
                  // Intercambiar dentro de la misma card
                  const sourcePlayer = depths.find(
                    (d) => d.num === selectedDepthSlot.depth,
                  )?.player;
                  const targetPlayer = player;

                  if (sourcePlayer) {
                    onPlayerDrop(num, sourcePlayer.ID);
                  } else {
                    onPlayerRemove(num);
                  }

                  if (targetPlayer) {
                    onPlayerDrop(selectedDepthSlot.depth, targetPlayer.ID);
                  } else {
                    onPlayerRemove(selectedDepthSlot.depth);
                  }

                  clearSelection();
                  return;
                }

                // Si este slot tiene jugador, seleccionarlo para mover
                if (player) {
                  if (isSelected) {
                    clearSelection();
                  } else {
                    selectDepthSlot(slotId, num);
                  }
                } else if (isSelected) {
                  clearSelection();
                } else {
                  // Slot vacío, seleccionarlo como destino
                  selectDepthSlot(slotId, num);
                }
              }}
            >
              {player ? (
                <>
                  <span
                    className="depth-player-name clickable-name"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPlayerActionsMenu(e, player);
                    }}
                  >
                    {player.NOMBRE as string}
                  </span>
                  <span
                    className="depth-player-avg"
                    style={{
                      color:
                        getStatColor(
                          Number(getPositionAverage(player, role) || player.PROMEDIO),
                        ) || '#fff',
                    }}
                  >
                    {getPositionAverage(player, role) || player.PROMEDIO}
                  </span>
                  <EnhancedTooltip content="Eliminar">
                    <button
                      className="depth-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayerRemove(num);
                      }}
                    >
                      ×
                    </button>
                  </EnhancedTooltip>
                </>
              ) : (
                <span className="depth-empty-text">+ Agregar</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
