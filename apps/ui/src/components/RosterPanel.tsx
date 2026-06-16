import { useState, useMemo } from 'react';
import type { DerivedPlayer } from '@anfpes/engine';
import { getPlayerThumbPath } from '../utils/imageHelpers';
import { PositionBadges } from './PositionBadges';
import { getStatColor } from '../types/table';
import { EnhancedTooltip } from './EnhancedTooltip';
import { openPlayerActionsMenu } from './PlayerActionsOverlay';
import { useSelectionStore } from '../store/selectionStore';

interface RosterPanelProps {
  players: DerivedPlayer[];
  clubFilter?: string;
  candidateInIds: string[];
  candidateOutIds: string[];
  customDorsals?: Record<string, string>;
  onPlayerSelect: (playerId: string) => void;
  onToggleCandidateIn: (playerId: string) => void;
  onToggleCandidateOut: (playerId: string) => void;
  onSetCustomDorsal?: (playerId: string, dorsal: string) => void;
  showRecommendations?: boolean;
  onToggleRecommendations?: () => void;
  readOnly?: boolean;
}

export function RosterPanel({
  players,
  clubFilter,
  candidateInIds,
  candidateOutIds,
  customDorsals = {},
  onPlayerSelect,
  onToggleCandidateIn,
  onToggleCandidateOut,
  onSetCustomDorsal,
  showRecommendations = false,
  onToggleRecommendations,
  readOnly = false,
}: RosterPanelProps) {
  const [panelMode, setPanelMode] = useState<'club' | 'search'>('club');
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  const { selectedPlayerId, selectedFromRoster, selectPlayer, clearSelection } =
    useSelectionStore();

  // Solo renderizar jugadores del club + candidatos
  const displayedPlayers = useMemo(() => {
    if (panelMode === 'search') {
      // Modo búsqueda: mostrar resultados sin thumbnail con prioridad de coincidencia exacta
      if (!search) return [];

      const searchLower = search.toLowerCase().trim();
      const exactMatches: DerivedPlayer[] = [];
      const partialMatches: DerivedPlayer[] = [];

      players.forEach((p) => {
        const name = String(p.NOMBRE || '').toLowerCase();
        const id = String(p.ID || '').toLowerCase();

        // Prioridad 1: Coincidencia exacta
        if (name === searchLower || id === searchLower) {
          exactMatches.push(p);
        }
        // Prioridad 2: Coincidencias parciales
        else if (name.includes(searchLower) || id.includes(searchLower)) {
          partialMatches.push(p);
        }
      });

      return [...exactMatches, ...partialMatches].slice(0, 50); // Limitar a 50 resultados
    }

    // Modo normal: solo club + candidatos
    // Separar jugadores del club, candidatos IN y candidatos OUT
    const clubPlayers: DerivedPlayer[] = [];
    const candidateInPlayers: DerivedPlayer[] = [];
    const candidateOutPlayers: DerivedPlayer[] = [];

    players.forEach((p) => {
      const isClubPlayer =
        clubFilter && String(p.CLUB || '').toLowerCase() === clubFilter.toLowerCase();
      const isCandidateIn = candidateInIds.includes(p.ID);
      const isCandidateOut = candidateOutIds.includes(p.ID);

      if (isCandidateOut) {
        candidateOutPlayers.push(p);
      } else if (isCandidateIn) {
        candidateInPlayers.push(p);
      } else if (isClubPlayer) {
        clubPlayers.push(p);
      }
    });

    // Ordenar jugadores del club por DORSAL (menor a mayor)
    clubPlayers.sort((a, b) => {
      const dorsalA = typeof a.DORSAL === 'number' ? a.DORSAL : 99;
      const dorsalB = typeof b.DORSAL === 'number' ? b.DORSAL : 99;
      return dorsalA - dorsalB;
    });

    // Ordenar candidateOut por nombre
    candidateOutPlayers.sort((a, b) =>
      String(a.NOMBRE || '').localeCompare(String(b.NOMBRE || '')),
    );

    // Combinar: primero club (hasta 23), luego candidatos IN, finalmente candidatos OUT al final
    let result = [
      ...clubPlayers.slice(0, 23),
      ...candidateInPlayers,
      ...candidateOutPlayers,
    ];

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
                disabled={readOnly}
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
            <option value="GK">PT</option>
            <option value="SWP">LIB</option>
            <option value="CB">CT</option>
            <option value="LB">DI</option>
            <option value="RB">DD</option>
            <option value="DMF">CCD</option>
            <option value="LWB">DLI</option>
            <option value="RWB">DLD</option>
            <option value="CMF">CC</option>
            <option value="LMF">CIZ</option>
            <option value="RMF">CDR</option>
            <option value="AMF">MP</option>
            <option value="LWF">EI</option>
            <option value="RWF">ED</option>
            <option value="SS">SD</option>
            <option value="CF">DC</option>
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

          const isSelected = selectedPlayerId === player.ID && selectedFromRoster;

          // Obtener dorsal (custom o original)
          const originalDorsal =
            typeof player.DORSAL === 'number' ? String(player.DORSAL) : '0';
          const displayDorsal = customDorsals[player.ID] || originalDorsal;

          return (
            <div
              key={player.ID}
              className={`roster-player-item ${isCandidate ? 'candidate-in' : ''} ${isMarkedOut ? 'candidate-out' : ''} ${panelMode === 'search' ? 'search-result' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={(e) => {
                // Bloquear selección de candidatos OUT
                if (readOnly || isMarkedOut) {
                  e.stopPropagation();
                  return;
                }

                // Solo seleccionar si no es modo búsqueda
                if (panelMode !== 'search') {
                  if (isSelected) {
                    clearSelection();
                  } else {
                    selectPlayer(player.ID, true);
                  }
                }
              }}
              style={{
                cursor: readOnly || isMarkedOut ? 'not-allowed' : undefined,
                opacity: isMarkedOut ? 0.5 : undefined,
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
                <div
                  className="roster-player-name clickable-name"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPlayerActionsMenu(e, player);
                  }}
                >
                  {player.NOMBRE as string}
                </div>
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
                        if (readOnly) return;
                        onToggleCandidateIn(player.ID);
                        setPanelMode('club');
                        setSearch('');
                      }}
                      disabled={readOnly}
                      className="roster-action-btn add-transfer"
                    >
                      + Fichar
                    </button>
                  </EnhancedTooltip>
                ) : (
                  <>
                    {/* Dorsal editable */}
                    {onSetCustomDorsal && !isMarkedOut && !readOnly && (
                      <EnhancedTooltip content="Editar dorsal">
                        <input
                          type="text"
                          value={displayDorsal}
                          onChange={(e) => {
                            e.stopPropagation();
                            const value = e.target.value;
                            // Solo permitir números de 1-99
                            if (value === '' || /^[1-9][0-9]?$/.test(value)) {
                              onSetCustomDorsal(player.ID, value);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="roster-dorsal-input"
                          maxLength={2}
                          placeholder="#"
                        />
                      </EnhancedTooltip>
                    )}

                    {showFichaje && (
                      <EnhancedTooltip content="Marcar como fichaje">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (readOnly) return;
                            onToggleCandidateIn(player.ID);
                          }}
                          disabled={readOnly}
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
                          if (readOnly) return;
                          onToggleCandidateOut(player.ID);
                        }}
                        disabled={readOnly}
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
