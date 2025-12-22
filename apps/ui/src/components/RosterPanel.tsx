import { useState, useMemo } from 'react';
import type { DerivedPlayer } from '@anfpes/engine';
import { getPlayerThumbPath } from '../utils/imageHelpers';
import { PositionBadges } from './PositionBadges';
import { getStatColor } from '../types/table';
import { EnhancedTooltip } from './EnhancedTooltip';
import { openPlayerActionsMenu } from './PlayerActionsOverlay';

interface RosterPanelProps {
  players: DerivedPlayer[];
  clubFilter?: string;
  candidateInIds: string[];
  candidateOutIds: string[];
  onPlayerSelect: (playerId: string) => void;
  onToggleCandidateIn: (playerId: string) => void;
  onToggleCandidateOut: (playerId: string) => void;
  showRecommendations?: boolean;
  onToggleRecommendations?: () => void;
}

export function RosterPanel({
  players,
  clubFilter,
  candidateInIds,
  candidateOutIds,
  onPlayerSelect,
  onToggleCandidateIn,
  onToggleCandidateOut,
  showRecommendations = false,
  onToggleRecommendations,
}: RosterPanelProps) {
  const [panelMode, setPanelMode] = useState<'club' | 'search'>('club');
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  // Solo renderizar jugadores del club + candidatos
  const displayedPlayers = useMemo(() => {
    if (panelMode === 'search') {
      // Modo búsqueda: mostrar resultados sin thumbnail
      if (!search) return [];

      const searchLower = search.toLowerCase();
      return players
        .filter((p) => {
          const name = String(p.NOMBRE || '').toLowerCase();
          return name.includes(searchLower);
        })
        .slice(0, 50); // Limitar a 50 resultados
    }

    // Modo normal: solo club + candidatos
    // Separar jugadores del club y candidatos
    const clubPlayers: DerivedPlayer[] = [];
    const candidatePlayers: DerivedPlayer[] = [];

    players.forEach((p) => {
      const isClubPlayer =
        clubFilter && String(p.CLUB || '').toLowerCase() === clubFilter.toLowerCase();
      const isCandidate = candidateInIds.includes(p.ID) || candidateOutIds.includes(p.ID);

      if (isClubPlayer && !isCandidate) {
        clubPlayers.push(p);
      } else if (isCandidate) {
        candidatePlayers.push(p);
      }
    });

    // Ordenar jugadores del club por DORSAL (menor a mayor)
    clubPlayers.sort((a, b) => {
      const dorsalA = typeof a.DORSAL === 'number' ? a.DORSAL : 99;
      const dorsalB = typeof b.DORSAL === 'number' ? b.DORSAL : 99;
      return dorsalA - dorsalB;
    });

    // Combinar: primero club (hasta 23), luego candidatos
    let result = [...clubPlayers.slice(0, 23), ...candidatePlayers];

    // Position filter
    if (positionFilter) {
      result = result.filter((p) => {
        const positions = [p.D, p.E, p.M, p.A].filter(Boolean);
        return positions.some((pos) => pos === positionFilter);
      });
    }

    return result;
  }, [
    players,
    clubFilter,
    candidateInIds,
    candidateOutIds,
    panelMode,
    search,
    positionFilter,
  ]);

  return (
    <div className="roster-panel">
      <div className="roster-panel-header">
        <div className="roster-mode-toggle">
          <button
            type="button"
            onClick={() => {
              setPanelMode('club');
              setSearch('');
            }}
            className={`mode-btn ${panelMode === 'club' ? 'active' : ''}`}
          >
            Club
          </button>
          <button
            type="button"
            onClick={() => setPanelMode('search')}
            className={`mode-btn ${panelMode === 'search' ? 'active' : ''}`}
          >
            Buscar Fichaje
          </button>
        </div>

        {panelMode === 'search' ? (
          <>
            <input
              type="text"
              placeholder="Buscar jugador para fichar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="roster-search"
              autoFocus
            />
            {onToggleRecommendations && (
              <button
                type="button"
                onClick={onToggleRecommendations}
                className={`tactical-toggle-btn ${showRecommendations ? 'active' : ''}`}
                style={{ marginTop: '8px', width: '100%' }}
              >
                <span className="btn-icon">💡</span>
                <span className="btn-label">Fichajes Recomendados</span>
                <span className="btn-status">{showRecommendations ? '✓' : ''}</span>
              </button>
            )}
          </>
        ) : panelMode === 'club' ? (
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="roster-position-filter"
          >
            <option value="">Todas las posiciones</option>
            <option value="GK">GK</option>
            <option value="CB">CB</option>
            <option value="LB">LB</option>
            <option value="RB">RB</option>
            <option value="DMF">DMF</option>
            <option value="CMF">CMF</option>
            <option value="AMF">AMF</option>
            <option value="LWF">LWF</option>
            <option value="RWF">RWF</option>
            <option value="CF">CF</option>
            <option value="SS">SS</option>
          </select>
        ) : null}
      </div>

      <div className="roster-player-list">
        {displayedPlayers.map((player) => {
          const isCandidate = candidateInIds.includes(player.ID);
          const isMarkedOut = candidateOutIds.includes(player.ID);
          const thumbPath = getPlayerThumbPath(player.ID);

          // Determinar si es jugador del club original (primeros 23 en modo normal)
          const isClubPlayer =
            clubFilter &&
            String(player.CLUB || '').toLowerCase() === clubFilter.toLowerCase();
          const showFichaje = !isClubPlayer || isCandidate;

          return (
            <div
              key={player.ID}
              className={`roster-player-item ${isCandidate ? 'candidate-in' : ''} ${isMarkedOut ? 'candidate-out' : ''} ${panelMode === 'search' ? 'search-result' : ''}`}
              onClick={(e) => openPlayerActionsMenu(e, player)}
              draggable={panelMode !== 'search'}
              onDragStart={(e) => {
                if (panelMode !== 'search') {
                  e.dataTransfer.setData('playerId', player.ID);
                }
              }}
            >
              {panelMode !== 'search' && (
                <img
                  src={thumbPath}
                  alt={player.NOMBRE as string}
                  className="roster-player-thumb"
                  onError={(e) => {
                    e.currentTarget.src = '/images/faces/missing.png';
                  }}
                />
              )}

              <div className="roster-player-info">
                <div className="roster-player-name">{player.NOMBRE as string}</div>
                <div className="roster-player-meta">
                  <PositionBadges player={player} maxVisible={3} />
                  {typeof player.PROMEDIO === 'number' && (
                    <span
                      className="roster-player-avg"
                      style={{ color: getStatColor(player.PROMEDIO) || '#fff' }}
                    >
                      {player.PROMEDIO}
                    </span>
                  )}
                  <span className="roster-player-club">· {player.CLUB}</span>
                </div>
              </div>

              <div className="roster-player-actions">
                {panelMode === 'search' ? (
                  <EnhancedTooltip content="Agregar como posible fichaje">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCandidateIn(player.ID);
                        setPanelMode('club');
                        setSearch('');
                      }}
                      className="roster-action-btn add-transfer"
                    >
                      + Fichar
                    </button>
                  </EnhancedTooltip>
                ) : (
                  <>
                    {showFichaje && (
                      <EnhancedTooltip content="Marcar como fichaje">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleCandidateIn(player.ID);
                          }}
                          className={`roster-action-btn ${isCandidate ? 'active' : ''}`}
                        >
                          +
                        </button>
                      </EnhancedTooltip>
                    )}
                    <EnhancedTooltip content="Marcar como salida">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCandidateOut(player.ID);
                        }}
                        className={`roster-action-btn ${isMarkedOut ? 'active' : ''}`}
                      >
                        ×
                      </button>
                    </EnhancedTooltip>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {displayedPlayers.length === 0 && (
        <div className="roster-empty">
          {panelMode === 'search' ? (
            <p>Escribe para buscar jugadores...</p>
          ) : clubFilter ? (
            <p>No hay jugadores del club seleccionado</p>
          ) : (
            <p>Selecciona un club para ver jugadores</p>
          )}
        </div>
      )}
    </div>
  );
}
