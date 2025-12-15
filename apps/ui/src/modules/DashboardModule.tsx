import { useMemo, useState } from 'react';
import type { DerivedPlayer } from '@anfpes/engine';
import { useCacheStore } from '../store/cacheStore';
import { usePreselectionStore } from '../store/preselectionStore';
import { useSearchPresetStore } from '../store/searchPresetStore';
import { MODULE_IDS, useModuleStore } from '../store/moduleStore';
import { ANFPES_CLUBS, LEGEND_PLAYERS, ML_PLAYERS } from '../data/playerStatus';
import { ensureNumber } from '../utils/format';
import { getPlayerPositions, getPositionLine } from '../components/PositionBadges';

function formatNumber(value: number | undefined, digits = 1): string {
  if (value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return value.toLocaleString('es-CL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function DashboardModule() {
  const players = useCacheStore((state) => state.players);
  const selectedId = useCacheStore((state) => state.selectedPlayerId);
  const setSelectedPlayer = useCacheStore((state) => state.setSelectedPlayer);
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);

  const preselections = usePreselectionStore((state) => state.preselections);
  const getPlayersInPreselection = usePreselectionStore(
    (state) => state.getPlayersInPreselection,
  );

  const setSearchPreset = useSearchPresetStore((state) => state.setPreset);
  const setActiveModule = useModuleStore((state) => state.setActiveModuleId);

  const [quickSearch, setQuickSearch] = useState('');

  const loading = status === 'idle' || status === 'loading';

  // Métricas rápidas
  const quickMetrics = useMemo(() => {
    if (!players) return null;

    const anfpesPlayers = players.filter((p) => {
      const club = String(p.CLUB ?? '').trim();
      return club && ANFPES_CLUBS.has(club);
    });

    const legendCount = players.filter((p) =>
      LEGEND_PLAYERS.has(String(p.NOMBRE ?? '').trim()),
    ).length;
    const mlCount = players.filter((p) =>
      ML_PLAYERS.has(String(p.NOMBRE ?? '').trim()),
    ).length;

    const anfpesAvg = anfpesPlayers.length
      ? anfpesPlayers.reduce((sum, p) => sum + (ensureNumber(p.PROMEDIO) ?? 0), 0) /
        anfpesPlayers.length
      : 0;

    return {
      totalPlayers: players.length,
      anfpesPlayers: anfpesPlayers.length,
      anfpesClubs: ANFPES_CLUBS.size,
      anfpesAvg,
      legends: legendCount,
      mlPlayers: mlCount,
    };
  }, [players]);

  // Jugadores destacados
  const featuredPlayers = useMemo(() => {
    if (!players || players.length === 0) return [];

    const anfpesPlayers = players.filter((p) => {
      const club = String(p.CLUB ?? '').trim();
      return club && ANFPES_CLUBS.has(club);
    });

    // Top 6 por promedio en clubes ANFPES
    const topByAvg = [...anfpesPlayers]
      .sort((a, b) => (ensureNumber(b.PROMEDIO) ?? 0) - (ensureNumber(a.PROMEDIO) ?? 0))
      .slice(0, 6);

    return topByAvg;
  }, [players]);

  // Preselecciones activas
  const activePreselections = useMemo(() => {
    if (!players) return [];

    return preselections.map((preselection) => {
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

  const handleOpenSearch = () => {
    setActiveModule(MODULE_IDS.search);
  };

  const handleOpenComparator = () => {
    setActiveModule(MODULE_IDS.comparator);
  };

  const handleOpenSimilar = () => {
    setActiveModule(MODULE_IDS.similar);
  };

  const handleOpenPreselection = () => {
    setActiveModule(MODULE_IDS.preselection);
  };

  const handleOpenPreselectionModule = (preselectionId: string) => {
    setActiveModule(MODULE_IDS.preselection);
  };

  const handlePlayerClick = (playerId: string) => {
    setSelectedPlayer(playerId);
    setActiveModule(MODULE_IDS.search);
  };

  const handleQuickSearch = () => {
    if (quickSearch.trim()) {
      setSearchPreset({ query: quickSearch.trim() });
      setActiveModule(MODULE_IDS.search);
      setQuickSearch('');
    }
  };

  const handleQuickSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickSearch();
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <p>Cargando base de datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          <p>Error al cargar datos: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Quick Actions */}
      <section className="dashboard-quick-actions">
        <div className="quick-search-bar">
          <input
            type="text"
            placeholder="Búsqueda rápida: jugador, club, nacionalidad..."
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            onKeyPress={handleQuickSearchKeyPress}
            className="quick-search-input"
          />
          <button
            type="button"
            onClick={handleQuickSearch}
            className="quick-search-button"
          >
            Buscar
          </button>
        </div>
        <div className="quick-action-buttons">
          <button
            type="button"
            onClick={handleOpenComparator}
            className="quick-action-btn"
          >
            <span className="action-icon">⚖</span>
            <span>Nueva comparación</span>
          </button>
          <button
            type="button"
            onClick={handleOpenPreselection}
            className="quick-action-btn"
          >
            <span className="action-icon">⭐</span>
            <span>Preselecciones</span>
          </button>
          <button type="button" onClick={handleOpenSimilar} className="quick-action-btn">
            <span className="action-icon">🔍</span>
            <span>Jugadores similares</span>
          </button>
        </div>
      </section>

      {/* Metrics Overview */}
      {quickMetrics && (
        <section className="dashboard-metrics">
          <div className="metric-card">
            <div className="metric-value">
              {quickMetrics.totalPlayers.toLocaleString()}
            </div>
            <div className="metric-label">Jugadores totales</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">
              {quickMetrics.anfpesPlayers.toLocaleString()}
            </div>
            <div className="metric-label">Jugadores ANFPES</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{quickMetrics.anfpesClubs}</div>
            <div className="metric-label">Clubes ANFPES</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{formatNumber(quickMetrics.anfpesAvg, 1)}</div>
            <div className="metric-label">Promedio ANFPES</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{quickMetrics.legends}</div>
            <div className="metric-label">Leyendas</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{quickMetrics.mlPlayers}</div>
            <div className="metric-label">ML Players</div>
          </div>
        </section>
      )}

      <div className="dashboard-main-content">
        {/* Preselecciones */}
        {activePreselections.length > 0 && (
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <h3 className="dashboard-section-title">Tus preselecciones activas</h3>
              <button
                type="button"
                onClick={handleOpenPreselection}
                className="dashboard-section-link"
              >
                Ver todas →
              </button>
            </div>
            <div className="preselection-cards">
              {activePreselections.slice(0, 4).map((preset) => (
                <div
                  key={preset.id}
                  className="preselection-card"
                  onClick={() => handleOpenPreselectionModule(preset.id)}
                >
                  <div className="preselection-header">
                    <h4 className="preselection-name">{preset.name}</h4>
                    <span className="preselection-count">{preset.count} jugadores</span>
                  </div>
                  <div className="preselection-stats">
                    <div className="preselection-avg">
                      <span className="dashboard-stat-label">Promedio:</span>
                      <span className="dashboard-stat-value">
                        {formatNumber(preset.avg, 1)}
                      </span>
                    </div>
                    <div className="preselection-lines">
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
                  <button type="button" className="preselection-open-btn">
                    Abrir
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Jugadores destacados */}
        {featuredPlayers.length > 0 && (
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <h3 className="dashboard-section-title">Jugadores destacados ANFPES</h3>
              <button
                type="button"
                onClick={handleOpenSearch}
                className="dashboard-section-link"
              >
                Ver todos →
              </button>
            </div>
            <div className="featured-players">
              {featuredPlayers.map((player) => {
                const promedio = ensureNumber(player.PROMEDIO) ?? 0;
                const atk = ensureNumber(player.ATK) ?? 0;
                const def = ensureNumber(player.DEF) ?? 0;
                const positions = getPlayerPositions(player);
                const posLabel = positions[0] || '-';
                const isLegend = LEGEND_PLAYERS.has(player.ID ?? '');
                const isML = ML_PLAYERS.has(player.ID ?? '');

                return (
                  <div
                    key={player.ID}
                    className="featured-player-card"
                    onClick={() => handlePlayerClick(player.ID ?? '')}
                  >
                    <div className="featured-player-header">
                      <div className="player-position-badge">{posLabel}</div>
                      {isLegend && <div className="player-badge legend">LEY</div>}
                      {isML && <div className="player-badge ml">ML</div>}
                    </div>
                    <div className="featured-player-name">
                      {player.NOMBRE || 'Sin nombre'}
                    </div>
                    <div className="featured-player-club">{player.CLUB || '-'}</div>
                    <div className="featured-player-stats">
                      <div className="featured-stat">
                        <span className="featured-stat-label">Prom</span>
                        <span className="featured-stat-value">
                          {formatNumber(promedio, 1)}
                        </span>
                      </div>
                      <div className="featured-stat">
                        <span className="featured-stat-label">ATK</span>
                        <span className="featured-stat-value">
                          {formatNumber(atk, 0)}
                        </span>
                      </div>
                      <div className="featured-stat">
                        <span className="featured-stat-label">DEF</span>
                        <span className="featured-stat-value">
                          {formatNumber(def, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
