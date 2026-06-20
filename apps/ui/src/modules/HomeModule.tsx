import type { DerivedPlayer } from '@anfpes/engine';
import { useMemo } from 'react';
import { useCacheStore } from '../store/cacheStore';
import { usePreselectionStore } from '../store/preselectionStore';
import { usePreselectionViewStore } from '../store/preselectionViewStore';
import { useTacticsStore } from '../store/tacticsStore';
import { MODULE_IDS, useModuleStore } from '../store/moduleStore';
import { useSimilarPlayersStore } from '../store/similarPlayersStore';
import { useComparatorLaunchStore } from '../store/comparatorLaunchStore';
import { usePlayerProfileStore } from '../store/playerProfileStore';
import { useClubViewStore } from '../store/clubViewStore';
import { useIdentityStore } from '../store/identityStore';
import { ANFPES_CLUBS, LEGEND_PLAYERS, ML_PLAYERS } from '../data/playerStatus';
import {
  CLUBS_BY_DIVISION,
  getClubCompetitionDetail,
  sortClubsAlphabetically,
} from '../data/clubCompetition';
import { getClubShieldPath, getPlayerThumbPath } from '../utils/imageHelpers';
import { ensureNumber } from '../utils/format';
import { formatSelectionDisplay } from '../utils/playerDisplay';
import { getStatColor } from '../types/table';
import { getPlayerPositions, getPositionLine } from '../components/PositionBadges';
import { EnhancedTooltip } from '../components/EnhancedTooltip';
import { useActivityHistoryStore } from '../store/activityHistoryStore';

function formatNumber(value: number | undefined, digits = 1): string {
  if (value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return value.toLocaleString('es-CL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function getAverage(
  targetPlayers: DerivedPlayer[],
  field: keyof DerivedPlayer,
): number | undefined {
  const values = targetPlayers
    .map((player) => ensureNumber(player[field]))
    .filter((value): value is number => value !== undefined);

  if (!values.length) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getPlayerFieldByName(player: DerivedPlayer, namePart: string): unknown {
  const normalizedNamePart = namePart.toLowerCase();
  const key = Object.keys(player).find((candidate) =>
    candidate.toLowerCase().includes(normalizedNamePart),
  );
  return key ? player[key as keyof DerivedPlayer] : undefined;
}

function isNationalPlayer(player: DerivedPlayer): boolean {
  return (
    formatSelectionDisplay(getPlayerFieldByName(player, 'selecci')).toLowerCase() !== 'no'
  );
}

function isLegendPlayer(player: DerivedPlayer): boolean {
  const classicValue = formatSelectionDisplay(getPlayerFieldByName(player, 'clasico'));
  const playerName = String(player.NOMBRE ?? '').trim();
  return classicValue.toLowerCase() !== 'no' || LEGEND_PLAYERS.has(playerName);
}

function isMlPlayer(player: DerivedPlayer): boolean {
  return ML_PLAYERS.has(String(player.NOMBRE ?? '').trim());
}

export function HomeModule() {
  const players = useCacheStore((state) => state.players);
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);

  const preselections = usePreselectionStore((state) => state.preselections);
  const getPlayersInPreselection = usePreselectionStore(
    (state) => state.getPlayersInPreselection,
  );

  const savedTactics = useTacticsStore((state) => state.savedTactics);
  const loadTactic = useTacticsStore((state) => state.loadTactic);

  const setActiveModule = useModuleStore((state) => state.setActiveModuleId);
  const setSelectedClub = useClubViewStore((state) => state.setSelectedClub);
  const identity = useIdentityStore((state) => state.profile);

  const setBasePlayerId = useSimilarPlayersStore((state) => state.setBasePlayerId);
  const setComparatorPending = useComparatorLaunchStore((state) => state.setPending);
  const setComparatorSelectedIds = useComparatorLaunchStore(
    (state) => state.setSelectedIds,
  );
  const setProfilePlayerId = usePlayerProfileStore((state) => state.setSelectedPlayerId);

  const allActivities = useActivityHistoryStore((state) => state.activities);
  const clearActivities = useActivityHistoryStore((state) => state.clearActivities);

  // Get recent activities (memoized to avoid infinite loop)
  const recentActivities = useMemo(() => {
    return allActivities.slice(0, 8);
  }, [allActivities]);

  const loading = status === 'idle' || status === 'loading';

  // Clubes ANFPES ordenados alfabéticamente y filtrados
  const anfpesClubsList = useMemo(() => {
    const sorted = sortClubsAlphabetically(Array.from(ANFPES_CLUBS));
    return sorted;
  }, []);

  const anfpesClubsByDivision = useMemo(
    () =>
      CLUBS_BY_DIVISION.map(({ division, clubs }) => ({
        division,
        clubs: clubs.filter((club) => anfpesClubsList.includes(club)),
      })).filter((group) => group.clubs.length > 0),
    [anfpesClubsList],
  );

  const identityClubSummary = useMemo(() => {
    if (!players || !identity?.club) return null;

    const roster = players.filter(
      (player) => String(player.CLUB ?? '').trim() === identity.club,
    );
    const competitionDetail = getClubCompetitionDetail(identity.club);

    return {
      club: identity.club,
      manager: identity.manager ?? competitionDetail?.manager,
      division: competitionDetail?.division,
      average: getAverage(roster, 'PROMEDIO'),
      averageAge: getAverage(roster, 'EDAD'),
      nationalCount: roster.filter(isNationalPlayer).length,
      legendCount: roster.filter(isLegendPlayer).length,
      mlCount: roster.filter(isMlPlayer).length,
    };
  }, [identity, players]);

  // Preselecciones activas (compactadas)
  const activePreselections = useMemo(() => {
    if (!players) return [];

    return preselections.slice(0, 3).map((preselection) => {
      const preselectionPlayers = getPlayersInPreselection(preselection.id, players);
      const playerIds = preselectionPlayers.map((p) => p.ID ?? '');

      const avg = preselectionPlayers.length
        ? preselectionPlayers.reduce(
            (sum, p) => sum + (ensureNumber(p.PROMEDIO) ?? 0),
            0,
          ) / preselectionPlayers.length
        : 0;

      const lineDistribution = {
        PT: 0,
        DEF: 0,
        MED: 0,
        ATA: 0,
      };

      preselectionPlayers.forEach((p) => {
        const positions = getPlayerPositions(p);
        if (positions.length > 0) {
          const line = getPositionLine(positions[0]);
          lineDistribution[line] = (lineDistribution[line] || 0) + 1;
        }
      });

      return {
        id: preselection.id,
        name: preselection.name,
        count: playerIds.length,
        avg,
        lineDistribution,
      };
    });
  }, [preselections, players, getPlayersInPreselection]);

  const handleClubClick = (club: string) => {
    setSelectedClub(club);
    setActiveModule(MODULE_IDS.club);
  };

  const handleOpenPreselection = (preselectionId: string) => {
    usePreselectionViewStore.getState().setActivePreselectionId(preselectionId);
    setActiveModule(MODULE_IDS.preselections);
  };

  const handleOpenAllPreselections = () => {
    setActiveModule(MODULE_IDS.preselections);
  };

  const handleOpenTactic = (tacticId: string) => {
    loadTactic(tacticId);
    setActiveModule(MODULE_IDS.planning);
  };

  const handleOpenAllTactics = () => {
    setActiveModule(MODULE_IDS.planning);
  };

  const handleActivityClick = (activity: (typeof recentActivities)[0]) => {
    switch (activity.type) {
      case 'club':
        {
          const clubName =
            activity.clubName ??
            (typeof activity.metadata?.club === 'string' ? activity.metadata.club : null);
          if (clubName) {
            setSelectedClub(clubName);
          }
        }
        setActiveModule(MODULE_IDS.club);
        break;
      case 'search':
        setActiveModule(MODULE_IDS.search);
        break;
      case 'similar':
        if (activity.playerId) {
          setBasePlayerId(activity.playerId);
        }
        setActiveModule(MODULE_IDS.similar);
        break;
      case 'comparison':
        if (activity.playerId) {
          setComparatorSelectedIds([]);
          setComparatorPending(activity.playerId);
        }
        setActiveModule(MODULE_IDS.comparator);
        break;
      case 'profile':
        if (activity.playerId) {
          setProfilePlayerId(activity.playerId);
        }
        setActiveModule(MODULE_IDS.profile);
        break;
    }
  };

  const formatActivityTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return new Date(timestamp).toLocaleDateString('es-CL', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'search':
        return '🔍';
      case 'similar':
        return '🔗';
      case 'comparison':
        return '⚖️';
      case 'profile':
        return '👤';
      case 'club':
        return '⚽';
      default:
        return '•';
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'search':
        return 'Búsqueda';
      case 'similar':
        return 'Similares';
      case 'comparison':
        return 'Comparación';
      case 'profile':
        return 'Perfil visitado';
      case 'club':
        return 'Club visitado';
      default:
        return 'Actividad';
    }
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="home-loading">
          <p>Cargando base de datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="home-error">
          <p>Error al cargar datos: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Panel lateral de clubes ANFPES */}
      <aside className="home-clubs-panel">
        <h3 className="clubs-panel-title">Clubes ANFPES</h3>
        <div className="clubs-division-list">
          {anfpesClubsByDivision.map(({ division, clubs }) => (
            <section key={division} className="clubs-division-group">
              <h4>{division}</h4>
              <div className="clubs-grid">
                {clubs.map((club) => {
                  const shieldPath = getClubShieldPath(club);
                  return (
                    <EnhancedTooltip key={club} content={club}>
                      <button
                        type="button"
                        className="club-button"
                        onClick={() => handleClubClick(club)}
                      >
                        {shieldPath ? (
                          <img src={shieldPath} alt={club} className="club-shield-icon" />
                        ) : (
                          <div className="club-fallback">⚽</div>
                        )}
                      </button>
                    </EnhancedTooltip>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="home-main-content">
        {identityClubSummary && (
          <section className="home-identity-card">
            <div className="home-identity-main">
              <button
                type="button"
                className="home-identity-shield"
                onClick={() => handleClubClick(identityClubSummary.club)}
                aria-label={`Abrir club ${identityClubSummary.club}`}
              >
                {getClubShieldPath(identityClubSummary.club) ? (
                  <img src={getClubShieldPath(identityClubSummary.club) ?? ''} alt="" />
                ) : (
                  <span>{identityClubSummary.club.slice(0, 2).toUpperCase()}</span>
                )}
              </button>
              <div className="home-identity-copy">
                <span className="home-identity-kicker">Usuario seleccionado</span>
                <h2>{identityClubSummary.manager ?? 'Usuario'}</h2>
                <p>{identityClubSummary.club}</p>
              </div>
              <div className="home-identity-tags">
                {identityClubSummary.division && (
                  <span>{identityClubSummary.division}</span>
                )}
              </div>
            </div>

            <div className="home-identity-stats">
              <div className="home-identity-average">
                <span>Promedio</span>
                <strong
                  style={{
                    color: getStatColor(identityClubSummary.average) ?? undefined,
                  }}
                >
                  {formatNumber(identityClubSummary.average, 1)}
                </strong>
              </div>
              <div className="home-identity-stat-grid">
                <div>
                  <strong>{formatNumber(identityClubSummary.averageAge, 1)}</strong>
                  <span>Edad media</span>
                </div>
                <div>
                  <strong>{identityClubSummary.nationalCount}</strong>
                  <span>Seleccionados</span>
                </div>
                <div>
                  <strong>{identityClubSummary.legendCount}</strong>
                  <span>Leyendas</span>
                </div>
                <div>
                  <strong>{identityClubSummary.mlCount}</strong>
                  <span>ML</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Contenedor para Preselecciones y Planificaciones */}
        <div className="home-dual-section">
          {/* Mis Preselecciones */}
          <section className="home-section preselections-section">
            <div className="home-section-header">
              <h3 className="home-section-title">Mis Preselecciones</h3>
              {preselections.length > 0 && (
                <button
                  type="button"
                  onClick={handleOpenAllPreselections}
                  className="home-section-link"
                >
                  Ver todas →
                </button>
              )}
            </div>
            {activePreselections.length === 0 ? (
              <div className="home-empty-state">
                <p>No tienes preselecciones guardadas</p>
                <button
                  type="button"
                  onClick={handleOpenAllPreselections}
                  className="home-action-button"
                >
                  Crear preselección
                </button>
              </div>
            ) : (
              <div className="home-preselection-cards">
                {activePreselections.map((preset) => (
                  <div
                    key={preset.id}
                    className="home-preselection-card"
                    onClick={() => handleOpenPreselection(preset.id)}
                  >
                    <div className="preselection-card-header">
                      <h4 className="preselection-card-name">{preset.name}</h4>
                      <span className="preselection-card-count">
                        {preset.count} jugadores
                      </span>
                    </div>
                    <div className="preselection-card-stats">
                      <div className="preselection-card-avg">
                        <span className="stat-label">Promedio:</span>
                        <span className="stat-value">{formatNumber(preset.avg, 1)}</span>
                      </div>
                      <div className="preselection-card-lines">
                        {preset.lineDistribution.PT > 0 && (
                          <span className="line-badge">
                            PT: {preset.lineDistribution.PT}
                          </span>
                        )}
                        {preset.lineDistribution.DEF > 0 && (
                          <span className="line-badge">
                            DEF: {preset.lineDistribution.DEF}
                          </span>
                        )}
                        {preset.lineDistribution.MED > 0 && (
                          <span className="line-badge">
                            MED: {preset.lineDistribution.MED}
                          </span>
                        )}
                        {preset.lineDistribution.ATA > 0 && (
                          <span className="line-badge">
                            ATA: {preset.lineDistribution.ATA}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Mis Planificaciones */}
          <section className="home-section planning-section">
            <div className="home-section-header">
              <h3 className="home-section-title">Mis Planificaciones</h3>
              {savedTactics.length > 0 && (
                <button
                  type="button"
                  onClick={handleOpenAllTactics}
                  className="home-section-link"
                >
                  Ver todas →
                </button>
              )}
            </div>
            {savedTactics.length === 0 ? (
              <div className="home-empty-state">
                <p>No tienes tácticas guardadas</p>
                <button
                  type="button"
                  onClick={handleOpenAllTactics}
                  className="home-action-button"
                >
                  Crear táctica
                </button>
              </div>
            ) : (
              <div className="home-preselection-cards">
                {savedTactics.slice(0, 3).map((tactic) => (
                  <div
                    key={tactic.tacticId}
                    className="home-preselection-card"
                    onClick={() => handleOpenTactic(tactic.tacticId)}
                  >
                    <div className="preselection-card-header">
                      <h4 className="preselection-card-name">{tactic.name}</h4>
                      {tactic.clubId && (
                        <img
                          src={getClubShieldPath(tactic.clubId) || ''}
                          alt={tactic.clubId}
                          style={{
                            width: '20px',
                            height: '20px',
                            objectFit: 'contain',
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <div className="preselection-card-stats">
                      <div className="preselection-card-avg">
                        <span className="stat-label">Plan Base:</span>
                        <span className="stat-value">
                          {tactic.basePlan.slots.filter((s) => s.playerId).length}/11
                        </span>
                      </div>
                      <div className="preselection-card-lines">
                        {tactic.planA && <span className="line-badge">Plan A</span>}
                        {tactic.planB && <span className="line-badge">Plan B</span>}
                        {tactic.strategySlots.filter((s) => s.strategy !== 'NO_STRATEGY')
                          .length > 0 && (
                          <span className="line-badge">
                            {
                              tactic.strategySlots.filter(
                                (s) => s.strategy !== 'NO_STRATEGY',
                              ).length
                            }{' '}
                            Estrategias
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Últimas Actividades */}
        <section className="home-section recent-section">
          <div className="home-section-header">
            <h3 className="home-section-title">Últimas Actividades</h3>
            {recentActivities.length > 0 && (
              <button
                type="button"
                onClick={clearActivities}
                className="home-section-link clear-link"
              >
                Limpiar
              </button>
            )}
          </div>
          {recentActivities.length === 0 ? (
            <div className="home-empty-state">
              <p>No hay actividades recientes</p>
              <p className="home-empty-hint">
                Tus búsquedas, comparaciones y perfiles visitados aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="home-recent-list">
              {recentActivities.map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  className="home-recent-item"
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className="recent-item-icon">{getActivityIcon(activity.type)}</div>
                  {activity.type === 'club' && activity.clubName && (
                    <img
                      src={getClubShieldPath(activity.clubName) || ''}
                      alt={activity.clubName}
                      className="club-shield-icon recent-club-shield"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  {activity.playerId && (
                    <img
                      src={getPlayerThumbPath(activity.playerId)}
                      alt={activity.playerName || 'Jugador'}
                      className="player-thumb"
                      onError={(e) => {
                        e.currentTarget.src = '/images/faces/missing.png';
                      }}
                    />
                  )}
                  <div className="recent-item-content">
                    <div className="recent-item-title">
                      {activity.clubName || activity.playerName || 'Sin nombre'}
                    </div>
                    <div className="recent-item-details">
                      {getActivityLabel(activity.type)}
                      {activity.details && ` • ${activity.details}`}
                    </div>
                  </div>
                  <div className="recent-item-time">
                    {formatActivityTime(activity.timestamp)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
