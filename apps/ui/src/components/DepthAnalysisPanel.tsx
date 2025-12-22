import { useMemo } from 'react';
import type { DerivedPlayer } from '@anfpes/engine';
import type { DepthSlot, FormationSlot } from '../types/tactics';
import { getStatColor } from '../types/table';
import { EnhancedTooltip } from './EnhancedTooltip';
import './DepthAnalysisPanel.css';

interface DepthAnalysisPanelProps {
  depthChartSlots: DepthSlot[];
  slots: FormationSlot[];
  players: DerivedPlayer[];
}

interface PositionAnalysis {
  slotId: string;
  role: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  depthCount: number;
  exclusiveCount: number;
  dropOff: number | null; // Diferencia entre titular y primer suplente
  players: Array<{ playerId: string; avg: number; depth: number }>;
}

// Map tactical roles to DerivedPlayer position fields
function getPositionAverage(player: DerivedPlayer, role: string): number | null {
  const posMap: Record<string, keyof DerivedPlayer> = {
    PT: 'PT',
    DI: 'SA',
    DD: 'SA',
    CT: 'CT',
    LIB: 'LIB',
    DLI: 'LA',
    DLD: 'LA',
    CCD: 'CCD',
    CC: 'CC',
    CIZ: 'VOL',
    CDR: 'VOL',
    MP: 'MP',
    EI: 'EX',
    ED: 'EX',
    DC: 'DC',
    SD: 'SD',
    MCO: 'MP',
  };

  const field = posMap[role];
  if (!field) return null;

  const value = player[field];
  return typeof value === 'number' ? value : null;
}

export function DepthAnalysisPanel({
  depthChartSlots,
  slots,
  players,
}: DepthAnalysisPanelProps) {
  const playerMap = useMemo(() => new Map(players.map((p) => [p.ID, p])), [players]);

  const analysis = useMemo((): PositionAnalysis[] => {
    // Build a map of which players appear in which positions
    const playerPositions = new Map<string, Set<string>>(); // playerId -> Set<slotId>

    depthChartSlots.forEach((slot) => {
      [slot.depth1, slot.depth2, slot.depth3, slot.depth4, slot.depth5].forEach(
        (playerId) => {
          if (playerId) {
            if (!playerPositions.has(playerId)) {
              playerPositions.set(playerId, new Set());
            }
            playerPositions.get(playerId)!.add(slot.slotId);
          }
        },
      );
    });

    return depthChartSlots.map((depthSlot) => {
      const depths = [
        { playerId: depthSlot.depth1, depth: 1 },
        { playerId: depthSlot.depth2, depth: 2 },
        { playerId: depthSlot.depth3, depth: 3 },
        { playerId: depthSlot.depth4, depth: 4 },
        { playerId: depthSlot.depth5, depth: 5 },
      ].filter((d) => d.playerId);

      const depthCount = depths.length;

      // Count exclusive players (only appear in this position)
      const exclusiveCount = depths.filter((d) => {
        const positions = playerPositions.get(d.playerId!);
        return positions && positions.size === 1;
      }).length;

      // Calculate drop-off (difference between starter and first backup)
      let dropOff: number | null = null;
      if (depths.length >= 2) {
        const starter = playerMap.get(depths[0].playerId!);
        const backup = playerMap.get(depths[1].playerId!);
        if (starter && backup) {
          const starterAvg = getPositionAverage(starter, depthSlot.role);
          const backupAvg = getPositionAverage(backup, depthSlot.role);
          if (starterAvg !== null && backupAvg !== null) {
            dropOff = starterAvg - backupAvg;
          }
        }
      }

      // Determine status
      let status: PositionAnalysis['status'];
      if (depthCount >= 3) {
        status = 'excellent';
      } else if (depthCount === 2 && exclusiveCount === 2) {
        status = 'excellent'; // 2 jugadores exclusivos = excelente
      } else if (depthCount === 2) {
        status = 'good'; // 2 opciones = bien cubierto
      } else if (depthCount === 1) {
        status = 'warning';
      } else {
        status = 'critical'; // Sin titular
      }

      // Get player details
      const playerDetails = depths.map((d) => {
        const player = playerMap.get(d.playerId!);
        const avg = player
          ? getPositionAverage(player, depthSlot.role) || Number(player.PROMEDIO)
          : 0;
        return {
          playerId: d.playerId!,
          avg,
          depth: d.depth,
        };
      });

      return {
        slotId: depthSlot.slotId,
        role: depthSlot.role,
        status,
        depthCount,
        exclusiveCount,
        dropOff,
        players: playerDetails,
      };
    });
  }, [depthChartSlots, playerMap]);

  const summary = useMemo(() => {
    const excellent = analysis.filter((a) => a.status === 'excellent').length;
    const good = analysis.filter((a) => a.status === 'good').length;
    const warning = analysis.filter((a) => a.status === 'warning').length;
    const critical = analysis.filter((a) => a.status === 'critical').length;

    const avgDropOff =
      analysis.filter((a) => a.dropOff !== null).reduce((sum, a) => sum + a.dropOff!, 0) /
      analysis.filter((a) => a.dropOff !== null).length;

    return { excellent, good, warning, critical, avgDropOff };
  }, [analysis]);

  const roleLabels: Record<string, string> = {
    PT: 'PT',
    DI: 'LI',
    CT: 'CT',
    DD: 'LD',
    CIZ: 'MI',
    CC: 'MC',
    CCD: 'MCD',
    CDR: 'MD',
    EI: 'EI',
    ED: 'ED',
    DC: 'DC',
    SD: 'SD',
    MCO: 'MCO',
  };

  return (
    <div className="depth-analysis-panel">
      <div className="depth-analysis-header">
        <h3>📊 Análisis de Profundidad</h3>
        <div className="depth-summary">
          <span className="summary-item excellent">🟢 {summary.excellent}</span>
          <span className="summary-item good">🟡 {summary.good}</span>
          <span className="summary-item warning">🟠 {summary.warning}</span>
          <span className="summary-item critical">🔴 {summary.critical}</span>
          {!isNaN(summary.avgDropOff) && (
            <EnhancedTooltip content="Drop-off promedio">
              <span className="summary-item">📉 {summary.avgDropOff.toFixed(1)}</span>
            </EnhancedTooltip>
          )}
        </div>
      </div>

      <div className="depth-analysis-grid">
        {analysis.map((pos) => {
          const statusColors = {
            excellent: '#4CAF50',
            good: '#8BC34A',
            warning: '#FF9800',
            critical: '#F44336',
          };

          const statusIcons = {
            excellent: '🟢',
            good: '🟡',
            warning: '🟠',
            critical: '🔴',
          };

          return (
            <div
              key={pos.slotId}
              className={`depth-analysis-item status-${pos.status}`}
              style={{ borderLeftColor: statusColors[pos.status] }}
            >
              <div className="position-header">
                <span className="position-name">{roleLabels[pos.role] || pos.role}</span>
                <span className="position-status">{statusIcons[pos.status]}</span>
              </div>

              <div className="position-stats">
                <EnhancedTooltip content="Total de jugadores">
                  <span className="stat-item">👥 {pos.depthCount}</span>
                </EnhancedTooltip>
                {pos.exclusiveCount > 0 && (
                  <EnhancedTooltip content="Jugadores exclusivos">
                    <span className="stat-item">🎯 {pos.exclusiveCount}</span>
                  </EnhancedTooltip>
                )}
                {pos.dropOff !== null && (
                  <EnhancedTooltip content="Drop-off (Titular vs Suplente)">
                    <span
                      className="stat-item"
                      style={{
                        color:
                          pos.dropOff > 10
                            ? '#F44336'
                            : pos.dropOff > 5
                              ? '#FF9800'
                              : '#4CAF50',
                      }}
                    >
                      📉 {pos.dropOff > 0 ? '-' : '+'}
                      {Math.abs(pos.dropOff).toFixed(0)}
                    </span>
                  </EnhancedTooltip>
                )}
              </div>

              <div className="position-players">
                {pos.players.slice(0, 3).map((p) => {
                  const player = playerMap.get(p.playerId);
                  return (
                    <div key={`${pos.slotId}-${p.playerId}`} className="player-line">
                      <span className="depth-badge">D{p.depth}</span>
                      <EnhancedTooltip content={player?.NOMBRE as string}>
                        <span className="player-name">{player?.NOMBRE}</span>
                      </EnhancedTooltip>
                      <span
                        className="player-avg"
                        style={{ color: getStatColor(p.avg) || '#fff' }}
                      >
                        {p.avg.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
                {pos.depthCount > 3 && (
                  <div className="more-players">+{pos.depthCount - 3} más</div>
                )}
                {pos.depthCount === 0 && <div className="no-players">⚠️ Sin titular</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="depth-analysis-legend">
        <h4>Leyenda</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-icon">🟢</span>
            <span>Excelente: 3+ opciones o 2 jugadores exclusivos</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🟡</span>
            <span>Bien: 2 opciones</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🟠</span>
            <span>Advertencia: 1 opción (sin respaldo)</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🔴</span>
            <span>Crítico: Sin titular</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">📉</span>
            <span>Drop-off: Diferencia entre titular y suplente</span>
          </div>
        </div>
      </div>
    </div>
  );
}
