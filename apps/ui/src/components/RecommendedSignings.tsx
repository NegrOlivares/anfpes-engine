import { useMemo, useState } from 'react';
import type { DerivedPlayer } from '@anfpes/engine';
import type { FormationSlot, RecommendedSigning } from '../types/tactics';
import { getPlayerThumbPath } from '../utils/imageHelpers';
import { getStatColor } from '../types/table';
import { ANFPES_CLUBS } from '../data/playerStatus';
import { getPlayerPositions, getPositionLine } from './PositionBadges';

interface RecommendedSigningsProps {
  slots: FormationSlot[];
  players: DerivedPlayer[];
  recommendedSignings: RecommendedSigning[];
  clubId?: string;
  onAddPossibleSigning: (playerId: string) => void;
  readOnly?: boolean;
}

// Mapeo de roles a nombres legibles y campos de promedio
const ROLE_INFO: Record<string, { name: string; field: keyof DerivedPlayer }> = {
  PT: { name: 'Portero', field: 'PT' },
  DI: { name: 'Lateral Izq.', field: 'SA' },
  DD: { name: 'Lateral Der.', field: 'SA' },
  CT: { name: 'Central', field: 'CT' },
  LIB: { name: 'Líbero', field: 'LIB' },
  CCD: { name: 'Mediocentro Def.', field: 'CCD' },
  CC: { name: 'Centrocampista', field: 'CC' },
  CIZ: { name: 'Medio Izq.', field: 'VOL' },
  CDR: { name: 'Medio Der.', field: 'VOL' },
  MP: { name: 'Mediapunta', field: 'MP' },
  EI: { name: 'Extremo Izq.', field: 'EX' },
  ED: { name: 'Extremo Der.', field: 'EX' },
  DC: { name: 'Delantero Centro', field: 'DC' },
  SD: { name: 'Segundo Delantero', field: 'SD' },
};

// Mapeo de posiciones compatibles para fichajes
const COMPATIBLE_POSITIONS: Record<string, string[]> = {
  PT: ['PT'],
  LIB: ['LIB', 'CT', 'CCD'],
  CT: ['CT', 'LIB', 'CCD'],
  DD: ['CT', 'LIB', 'SA', 'DD', 'DI', 'LA', 'DLD'],
  DI: ['CT', 'LIB', 'SA', 'DD', 'DI', 'LA', 'DLI'],
  CCD: ['LIB', 'CT', 'CCD', 'CC'],
  DLD: ['SA', 'DD', 'LA', 'DLD', 'VOL', 'CDR'],
  DLI: ['SA', 'DI', 'LA', 'DLI', 'VOL', 'CIZ'],
  CC: ['CCD', 'CC', 'MP', 'VOL', 'CIZ', 'CDR'],
  CDR: ['CC', 'MP', 'VOL', 'CDR', 'CIZ', 'EX', 'ED', 'EI'],
  CIZ: ['CC', 'MP', 'VOL', 'CDR', 'CIZ', 'EX', 'ED', 'EI'],
  MP: ['CC', 'MP', 'VOL', 'CDR', 'CIZ', 'SD'],
  SD: ['VOL', 'CIZ', 'CDR', 'MP', 'SD', 'DC'],
  ED: ['VOL', 'CIZ', 'CDR', 'EX', 'ED', 'EI', 'SD'],
  EI: ['VOL', 'CIZ', 'CDR', 'EX', 'ED', 'EI', 'SD'],
  DC: ['SD', 'DC'],
};

export function RecommendedSignings({
  slots,
  players,
  recommendedSignings,
  clubId,
  onAddPossibleSigning,
  readOnly = false,
}: RecommendedSigningsProps) {
  const [filterMode, setFilterMode] = useState<'contracted' | 'free' | 'all'>('free');
  const [minAverage, setMinAverage] = useState<number>(65);
  const [maxAverage, setMaxAverage] = useState<number>(99);

  const playerMap = useMemo(() => {
    return new Map(players.map((p) => [p.ID, p]));
  }, [players]);

  // Agrupar slots por rol (posición única)
  const positions = useMemo(() => {
    const posMap = new Map<string, FormationSlot[]>();
    slots.forEach((slot) => {
      const existing = posMap.get(slot.role) || [];
      posMap.set(slot.role, [...existing, slot]);
    });
    return Array.from(posMap.entries()).map(([role, roleSlots]) => ({
      role,
      slots: roleSlots,
    }));
  }, [slots]);

  // Obtener recomendaciones guardadas para una posición
  const getRecommendationsForPosition = (role: string): string[] => {
    const entry = recommendedSignings.find((d) => d.position === role);
    return entry?.recommendedPlayerIds || [];
  };

  // Sugerencias de fichajes con filtros inteligentes
  const getSuggestedSignings = (
    role: string,
    starterIds: string[],
    count: number = 3,
  ): DerivedPlayer[] => {
    const roleInfo = ROLE_INFO[role];
    if (!roleInfo) return [];

    // Obtener promedios de los titulares para comparar
    const starterAverages = starterIds
      .map((id) => {
        const player = playerMap.get(id);
        if (!player) return 0;
        const value = player[roleInfo.field];
        return typeof value === 'number' ? value : 0;
      })
      .filter((v) => v > 0);

    const minStarterAvg = starterAverages.length > 0 ? Math.min(...starterAverages) : 0;

    // Obtener posiciones compatibles para el rol
    const compatiblePositions = COMPATIBLE_POSITIONS[role] || [];

    return players
      .filter((p) => !starterIds.includes(p.ID))
      .filter((p) => {
        // Filtro por club según modo seleccionado
        const playerClub = String(p.CLUB || '').toLowerCase();
        const isAnfpesClub = ANFPES_CLUBS.has(p.CLUB as string);
        const isCurrentClub = clubId && playerClub === clubId.toLowerCase();

        if (filterMode === 'contracted') {
          // Jugadores con contrato ANFPES (excepto el club actual)
          return isAnfpesClub && !isCurrentClub;
        } else if (filterMode === 'free') {
          // Jugadores libres (no ANFPES)
          return !isAnfpesClub;
        }
        // 'all': todos excepto el club actual
        return !isCurrentClub;
      })
      .filter((p) => {
        // Filtro: debe tener al menos una posición compatible
        const playerPositions = getPlayerPositions(p);
        if (playerPositions.length === 0) return false;
        return playerPositions.some((pos) => compatiblePositions.includes(pos));
      })
      .filter((p) => {
        // Filtro por promedio principal
        const promedio = typeof p.PROMEDIO === 'number' ? p.PROMEDIO : 0;
        if (promedio < minAverage || promedio > maxAverage) return false;

        // Filtro: debe ser >= al titular más bajo (solo si hay titular)
        const value = p[roleInfo.field];
        const posValue = typeof value === 'number' ? value : 0;

        // Si no hay titulares, solo validar que tenga valor > 0
        if (minStarterAvg === 0) return posValue > 0;

        // Si hay titulares, debe ser >= al más bajo
        return posValue >= minStarterAvg;
      })
      .sort((a, b) => {
        const aVal = typeof a[roleInfo.field] === 'number' ? a[roleInfo.field] : 0;
        const bVal = typeof b[roleInfo.field] === 'number' ? b[roleInfo.field] : 0;
        return (bVal as number) - (aVal as number);
      })
      .slice(0, count);
  };

  const handleAddSigning = (playerId: string) => {
    if (readOnly) return;
    onAddPossibleSigning(playerId);
  };

  const renderPlayer = (
    playerId: string | undefined,
    role: string,
    showClub: boolean = false,
    showBadges: boolean = false,
  ) => {
    if (!playerId) return <div className="depth-chart-empty">Sin asignar</div>;

    const player = playerMap.get(playerId);
    if (!player) return <div className="depth-chart-empty">Jugador no encontrado</div>;

    const roleInfo = ROLE_INFO[role];
    const avgValue = roleInfo ? player[roleInfo.field] : null;
    const avg = typeof avgValue === 'number' ? avgValue.toFixed(0) : '-';

    const positions = showBadges ? getPlayerPositions(player) : [];

    return (
      <div className="depth-chart-player">
        <img
          src={getPlayerThumbPath(playerId)}
          alt={player.NOMBRE as string}
          className="depth-player-thumb"
          onError={(e) => {
            e.currentTarget.src = '/images/faces/missing.png';
          }}
        />
        <div className="depth-player-info">
          <div className="depth-player-name">{player.NOMBRE as string}</div>
          <div className="depth-player-details">
            <span
              className="depth-player-avg"
              style={{ color: getStatColor(avg) || '#fff' }}
            >
              {avg}
            </span>
            {showClub && player.CLUB && (
              <span className="depth-player-club">{player.CLUB}</span>
            )}
          </div>
          {showBadges && positions.length > 0 && (
            <div className="depth-player-positions">
              {positions.slice(0, 4).map((pos, idx) => (
                <span
                  key={idx}
                  className={`position-badge position-${getPositionLine(pos)} ${idx === 0 ? 'primary' : 'secondary'}`}
                >
                  {pos}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="depth-chart">
      <div className="depth-chart-header">
        <div className="depth-header-title">
          <h3>Fichajes Recomendados</h3>
          <p className="depth-chart-hint">
            Jugadores recomendados para reforzar cada posición (máximo 3 por puesto)
          </p>
        </div>

        <div className="depth-chart-filters">
          <div className="depth-filter-group">
            <label className="depth-filter-label">Mostrar:</label>
            <div className="depth-filter-tabs">
              <button
                type="button"
                onClick={() => setFilterMode('contracted')}
                className={`depth-filter-tab ${filterMode === 'contracted' ? 'active' : ''}`}
              >
                Jugadores con Contrato
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('free')}
                className={`depth-filter-tab ${filterMode === 'free' ? 'active' : ''}`}
              >
                Jugadores Libres
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`depth-filter-tab ${filterMode === 'all' ? 'active' : ''}`}
              >
                Todos los Jugadores
              </button>
            </div>
          </div>

          <div className="depth-filter-group">
            <label className="depth-filter-label" htmlFor="min-avg">
              Promedio mín:
            </label>
            <input
              id="min-avg"
              type="number"
              min="40"
              max="99"
              value={minAverage}
              onChange={(e) => setMinAverage(Number(e.target.value))}
              className="depth-filter-input"
            />
          </div>

          <div className="depth-filter-group">
            <label className="depth-filter-label" htmlFor="max-avg">
              Promedio máx:
            </label>
            <input
              id="max-avg"
              type="number"
              min="40"
              max="99"
              value={maxAverage}
              onChange={(e) => setMaxAverage(Number(e.target.value))}
              className="depth-filter-input"
            />
          </div>
        </div>
      </div>

      <div className="depth-chart-grid">
        {positions.map(({ role, slots: roleSlots }) => {
          const roleInfo = ROLE_INFO[role];
          const starters = roleSlots.filter((s) => s.playerId).map((s) => s.playerId!);
          const suggestedSignings = getSuggestedSignings(role, starters, 3);

          return (
            <div key={role} className="depth-chart-position">
              <div className="depth-position-header">
                <div className="depth-position-title">
                  <span className="depth-position-role">{role}</span>
                  <span className="depth-position-name">{roleInfo?.name || role}</span>
                </div>
              </div>

              <div className="depth-position-slots">
                {/* Titulares */}
                <div className="depth-slot starter-slot">
                  <div className="depth-slot-label">Titular(es)</div>
                  {starters.length === 0 ? (
                    <div className="depth-chart-empty">Sin asignar</div>
                  ) : (
                    starters.map((playerId) => (
                      <div key={playerId}>{renderPlayer(playerId, role, false)}</div>
                    ))
                  )}
                </div>

                {/* Recomendaciones de fichajes */}
                <div className="depth-slot signing-slot">
                  <div className="depth-slot-label">Fichajes Recomendados</div>
                  {suggestedSignings.length > 0 ? (
                    <div className="depth-suggestions">
                      {suggestedSignings.map((player) => (
                        <div
                          key={player.ID}
                          className="depth-suggestion"
                          onClick={() => handleAddSigning(player.ID)}
                          title={
                            readOnly
                              ? 'Táctica en modo lectura'
                              : 'Click para agregar como fichaje posible'
                          }
                        >
                          {renderPlayer(player.ID, role, true, true)}
                          <button
                            type="button"
                            className="add-signing-btn"
                            disabled={readOnly}
                          >
                            + Fichar
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="depth-chart-empty">
                      {starters.length === 0
                        ? 'Asigna un titular primero'
                        : 'Sin recomendaciones con los filtros actuales'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
