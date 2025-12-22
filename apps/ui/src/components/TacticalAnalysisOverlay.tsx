import { useMemo } from 'react';
import type { FormationSlot, PlayerInstruction } from '../types/tactics';
import { analyzeTacticalCoverage } from '../utils/tacticalAnalysis';

interface TacticalAnalysisOverlayProps {
  slots: FormationSlot[];
  playerInstructions: Record<string, PlayerInstruction>;
  showHeatmap?: boolean;
  showConflicts?: boolean;
}

export function TacticalAnalysisOverlay({
  slots,
  playerInstructions,
  showHeatmap = true,
  showConflicts = true,
}: TacticalAnalysisOverlayProps) {
  const analysis = useMemo(
    () => analyzeTacticalCoverage(slots, playerInstructions),
    [slots, playerInstructions],
  );

  return (
    <div className="tactical-analysis-overlay">
      {/* Heatmap de cobertura */}
      {showHeatmap && (
        <div className="tactical-heatmap">
          {analysis.zoneCoverage.map((zone) => {
            const [row, col] = zone.zone.split('-').map(Number);
            const width = 100 / 5; // 5 columnas
            const height = 100 / 6; // 6 filas

            // Color según cobertura
            const getColor = () => {
              if (zone.coverage >= 0.7) return 'rgba(76, 175, 80, 0.15)'; // Verde
              if (zone.coverage >= 0.4) return 'rgba(255, 193, 7, 0.15)'; // Amarillo
              return 'rgba(244, 67, 54, 0.2)'; // Rojo (zona débil)
            };

            return (
              <div
                key={zone.zone}
                className="heatmap-cell"
                style={{
                  position: 'absolute',
                  left: `${col * width}%`,
                  top: `${row * height}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                  background: getColor(),
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  pointerEvents: 'none',
                }}
                title={`Cobertura: ${(zone.coverage * 100).toFixed(0)}%`}
              />
            );
          })}
        </div>
      )}

      {/* Conflictos de posición */}
      {showConflicts && analysis.conflicts.length > 0 && (
        <div className="tactical-conflicts">
          {analysis.conflicts.map((conflict, idx) => (
            <div
              key={`conflict-${idx}`}
              className={`conflict-marker conflict-${conflict.severity}`}
              style={{
                position: 'absolute',
                left: `${conflict.x}%`,
                top: `${conflict.y}%`,
                transform: 'translate(-50%, -50%)',
                width: '50px',
                height: '50px',
                border: `3px solid ${
                  conflict.severity === 'critical'
                    ? 'rgba(244, 67, 54, 0.8)'
                    : 'rgba(255, 193, 7, 0.8)'
                }`,
                borderRadius: '50%',
                background: `${
                  conflict.severity === 'critical'
                    ? 'rgba(244, 67, 54, 0.2)'
                    : 'rgba(255, 193, 7, 0.2)'
                }`,
                animation: 'pulse-conflict 2s infinite',
                pointerEvents: 'none',
                zIndex: 15,
              }}
              title={`Conflicto de posición`}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '1.5rem',
                }}
              >
                ⚠️
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
