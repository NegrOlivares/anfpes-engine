import type { FormationSlot, PlayerInstruction } from '../types/tactics';
import { analyzeTacticalCoverage } from '../utils/tacticalAnalysis';
import { useMemo } from 'react';

interface TacticalAnalysisPanelProps {
  slots: FormationSlot[];
  playerInstructions: Record<string, PlayerInstruction>;
  formationName: string;
}

export function TacticalAnalysisPanel({
  slots,
  playerInstructions,
  formationName,
}: TacticalAnalysisPanelProps) {
  const analysis = useMemo(
    () => analyzeTacticalCoverage(slots, playerInstructions),
    [slots, playerInstructions],
  );

  const getBalanceColor = (value: number) => {
    if (value >= 4) return '#4caf50'; // Verde
    if (value >= 3) return '#8bc34a'; // Verde claro
    if (value >= 2) return '#ffc107'; // Amarillo
    return '#ff5722'; // Naranja/Rojo
  };

  const getCoverageLevel = (coverage: number) => {
    if (coverage >= 0.7) return { label: 'Excelente', color: '#4caf50' };
    if (coverage >= 0.5) return { label: 'Buena', color: '#8bc34a' };
    if (coverage >= 0.3) return { label: 'Moderada', color: '#ffc107' };
    return { label: 'Débil', color: '#ff5722' };
  };

  const averageCoverage =
    analysis.zoneCoverage.reduce((sum, z) => sum + z.coverage, 0) /
    analysis.zoneCoverage.length;

  const coverageInfo = getCoverageLevel(averageCoverage);

  return (
    <div className="tactical-analysis-panel">
      <div className="analysis-header">
        <h3>📊 Análisis Táctico</h3>
        <span className="formation-display">{formationName}</span>
      </div>

      {/* Balance Táctico */}
      <div className="analysis-section">
        <h4>Balance de Líneas</h4>
        <div className="balance-display">
          <div className="balance-item">
            <span className="balance-label">Defensa</span>
            <span
              className="balance-value"
              style={{ color: getBalanceColor(analysis.balance.defensive) }}
            >
              {analysis.balance.defensive}
            </span>
          </div>
          <div className="balance-divider">-</div>
          <div className="balance-item">
            <span className="balance-label">Mediocampo</span>
            <span
              className="balance-value"
              style={{ color: getBalanceColor(analysis.balance.midfield) }}
            >
              {analysis.balance.midfield}
            </span>
          </div>
          <div className="balance-divider">-</div>
          <div className="balance-item">
            <span className="balance-label">Ataque</span>
            <span
              className="balance-value"
              style={{ color: getBalanceColor(analysis.balance.attacking) }}
            >
              {analysis.balance.attacking}
            </span>
          </div>
        </div>
        <div className="balance-summary">
          Formación efectiva: <strong>{analysis.balance.formationString}</strong>
        </div>
      </div>

      {/* Cobertura Global */}
      <div className="analysis-section">
        <h4>Cobertura del Campo</h4>
        <div className="coverage-meter">
          <div
            className="coverage-fill"
            style={{
              width: `${averageCoverage * 100}%`,
              background: coverageInfo.color,
            }}
          />
        </div>
        <div className="coverage-label">
          <span style={{ color: coverageInfo.color }}>{coverageInfo.label}</span>
          <span>{(averageCoverage * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Zonas Débiles */}
      {analysis.weakZones.length > 0 && (
        <div className="analysis-section analysis-warning">
          <h4>⚠️ Zonas Débiles</h4>
          <div className="weak-zones-list">
            {analysis.weakZones.map((zone) => {
              const [row, col] = zone.zone.split('-').map(Number);
              const zoneName = getZoneName(row, col);
              return (
                <div key={zone.zone} className="weak-zone-item">
                  <span className="zone-name">{zoneName}</span>
                  <span className="zone-coverage">
                    {(zone.coverage * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conflictos */}
      {analysis.conflicts.length > 0 && (
        <div className="analysis-section analysis-danger">
          <h4>🔴 Conflictos de Posición ({analysis.conflicts.length})</h4>
          <p className="conflict-hint">
            Jugadores moviéndose al mismo espacio. Considera ajustar las flechas de
            movimiento.
          </p>
          <div className="conflict-severity">
            <span className="conflict-critical">
              Críticos:{' '}
              {analysis.conflicts.filter((c) => c.severity === 'critical').length}
            </span>
            <span className="conflict-warning">
              Advertencias:{' '}
              {analysis.conflicts.filter((c) => c.severity === 'warning').length}
            </span>
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      {(analysis.weakZones.length > 3 || analysis.conflicts.length > 0) && (
        <div className="analysis-section analysis-tips">
          <h4>💡 Recomendaciones</h4>
          <ul>
            {analysis.weakZones.length > 3 && (
              <li>Considera reposicionar jugadores para cubrir zonas débiles</li>
            )}
            {analysis.conflicts.length > 0 && (
              <li>Ajusta las flechas de movimiento para evitar aglomeraciones</li>
            )}
            {analysis.balance.defensive < 2 && (
              <li>Defensiva muy ligera - vulnerable a contraataques</li>
            )}
            {analysis.balance.attacking < 2 && (
              <li>Poco peso ofensivo - puede costar crear oportunidades</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function getZoneName(row: number, col: number): string {
  const rowNames = [
    'Ataque Final',
    'Ataque Medio',
    'Med. Ofens.',
    'Med. Def.',
    'Def. Media',
    'Def. Propia',
  ];
  const colNames = ['Banda Izq.', 'Canal Izq.', 'Centro', 'Canal Der.', 'Banda Der.'];
  return `${rowNames[row]} - ${colNames[col]}`;
}
