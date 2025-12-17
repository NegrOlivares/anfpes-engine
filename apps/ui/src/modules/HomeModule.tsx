import { useMemo, useState } from 'react';
import { useCacheStore } from '../store/cacheStore';
import { usePreselectionStore } from '../store/preselectionStore';
import { useSearchPresetStore } from '../store/searchPresetStore';
import { MODULE_IDS, useModuleStore } from '../store/moduleStore';
import { ANFPES_CLUBS } from '../data/playerStatus';
import { getClubShieldPath } from '../utils/imageHelpers';
import { ensureNumber } from '../utils/format';
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

interface RecentActivity {
  type: 'search' | 'similar' | 'comparison' | 'profile';
  playerId?: string;
  playerName?: string;
  timestamp: number;
  details?: string;
}

export function HomeModule() {
  const players = useCacheStore((state) => state.players);
  const setSelectedPlayer = useCacheStore((state) => state.setSelectedPlayer);
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);

  const preselections = usePreselectionStore((state) => state.preselections);
  const getPlayersInPreselection = usePreselectionStore(
    (state) => state.getPlayersInPreselection,
  );

  const setSearchPreset = useSearchPresetStore((state) => state.setPreset);
  const setActiveModule = useModuleStore((state) => state.setActiveModuleId);

  const allActivities = useActivityHistoryStore((state) => state.activities);
  const clearActivities = useActivityHistoryStore((state) => state.clearActivities);

  const [clubFilter, setClubFilter] = useState('');

  // Get recent activities (memoized to avoid infinite loop)
  const recentActivities = useMemo(() => {
    return allActivities.slice(0, 8);
  }, [allActivities]);

  const loading = status === 'idle' || status === 'loading';

  // Clubes ANFPES ordenados alfabéticamente y filtrados
  const anfpesClubsList = useMemo(() => {
    const sorted = Array.from(ANFPES_CLUBS).sort((a, b) => a.localeCompare(b));
    if (!clubFilter) return sorted;
    return sorted.filter((club) => club.toLowerCase().includes(clubFilter.toLowerCase()));
  }, [clubFilter]);

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
    setSearchPreset({ query: club });
    setActiveModule(MODULE_IDS.search);
  };

  const handleOpenPreselection = (preselectionId: string) => {
    setActiveModule(MODULE_IDS.preselections);
  };

  const handleOpenAllPreselections = () => {
    setActiveModule(MODULE_IDS.preselections);
  };

  const handleActivityClick = (activity: (typeof recentActivities)[0]) => {
    if (activity.playerId) {
      setSelectedPlayer(activity.playerId);
    }

    switch (activity.type) {
      case 'search':
        setActiveModule(MODULE_IDS.search);
        break;
      case 'similar':
        setActiveModule(MODULE_IDS.similar);
        break;
      case 'comparison':
        setActiveModule(MODULE_IDS.comparator);
        break;
      case 'profile':
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
        <input
          type="text"
          placeholder="Filtrar clubes..."
          value={clubFilter}
          onChange={(e) => setClubFilter(e.target.value)}
          className="clubs-filter-input"
        />
        <div className="clubs-grid">
          {anfpesClubsList.map((club) => {
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
      </aside>

      {/* Contenido principal */}
      <main className="home-main-content">
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
                  <div className="recent-item-content">
                    <div className="recent-item-title">
                      {activity.playerName || 'Sin nombre'}
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
