import type { DerivedPlayer } from '@anfpes/engine';
import { useMemo, useState } from 'react';

const DEMARCATION_COLUMNS = [
  'D',
  'E',
  'M',
  'A',
  'R',
  'C',
  'A_1',
  'C_1',
  'I',
  'O',
  'N',
] as const;

// Mapeo de posiciones inglés → español
const POSITION_TRANSLATION: Record<string, string> = {
  GK: 'PT',
  SWP: 'LIB',
  CB: 'CT',
  SB: 'SA',
  RB: 'DD',
  LB: 'DI',
  DMF: 'CCD',
  WB: 'LA',
  RWB: 'DLD',
  LWB: 'DLI',
  CMF: 'CC',
  SMF: 'VOL',
  RMF: 'CDR',
  LMF: 'CIZ',
  AMF: 'MP',
  WF: 'EX',
  RWF: 'ED',
  LWF: 'EI',
  SS: 'SD',
  CF: 'DC',
};

// Clasificación de posiciones por línea
export type PositionLine = 'PT' | 'DEF' | 'MED' | 'ATA';

const POSITION_LINE: Record<string, PositionLine> = {
  PT: 'PT',
  LIB: 'DEF',
  CT: 'DEF',
  SA: 'DEF',
  DD: 'DEF',
  DI: 'DEF',
  CCD: 'MED',
  LA: 'MED',
  DLD: 'MED',
  DLI: 'MED',
  CC: 'MED',
  VOL: 'MED',
  CDR: 'MED',
  CIZ: 'MED',
  MP: 'MED',
  EX: 'ATA',
  ED: 'ATA',
  EI: 'ATA',
  SD: 'ATA',
  DC: 'ATA',
};

const LINE_LABELS: Record<string, string> = {
  PT: 'Portero',
  DEF: 'Defensa',
  MED: 'Mediocampo',
  ATA: 'Ataque',
};

const POSITION_FULL_NAME: Record<string, string> = {
  PT: 'Portero',
  LIB: 'Líbero',
  DI: 'Defensa Izquierdo',
  DD: 'Defensa Derecho',
  CT: 'Defensa Central',
  CCD: 'Centrocampista Defensivo',
  DLI: 'Defensa Lateral Izquierdo',
  DLD: 'Defensa Lateral Derecho',
  CC: 'Centrocampista',
  MP: 'Mediapunta',
  CIZ: 'Centrocampista Izquierdo',
  CDR: 'Centrocampista Derecho',
  SD: 'Segundo Delantero',
  DC: 'Delantero Centro',
  EI: 'Extremo Izquierdo',
  ED: 'Extremo Derecho',
};

export function getPlayerPositions(player: DerivedPlayer): string[] {
  const codes = DEMARCATION_COLUMNS.map((column) => player[column as keyof DerivedPlayer])
    .filter(Boolean)
    .map((code) => POSITION_TRANSLATION[code as string] || (code as string))
    .filter((pos): pos is string => typeof pos === 'string');

  return Array.from(new Set(codes));
}

export function getPositionLine(position: string): PositionLine {
  return POSITION_LINE[position] || 'DEF';
}

export function getPositionFullName(position: string): string {
  const normalized = position.trim().toUpperCase();
  return POSITION_FULL_NAME[normalized] ?? position;
}

interface PositionBadgesProps {
  player: DerivedPlayer;
  maxVisible?: number;
}

export function PositionBadges({ player, maxVisible = 4 }: PositionBadgesProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const positions = useMemo(() => {
    return getPlayerPositions(player);
  }, [player]);

  const visiblePositions = positions.slice(0, maxVisible);
  const remainingCount = positions.length - maxVisible;
  const remainingPositions = positions.slice(maxVisible);

  const groupedRemaining = useMemo(() => {
    const groups: Record<string, string[]> = {};
    remainingPositions.forEach((pos) => {
      const line = POSITION_LINE[pos] || 'DEF';
      if (!groups[line]) {
        groups[line] = [];
      }
      groups[line].push(pos);
    });
    return groups;
  }, [remainingPositions]);

  if (positions.length === 0) {
    return <span className="text-secondary">-</span>;
  }

  return (
    <div className="position-badges-container">
      {visiblePositions.map((position, index) => {
        const line = getPositionLine(position);
        const isPrimary = index === 0;
        return (
          <span
            key={`${position}-${index}`}
            className={`position-badge position-${line} ${isPrimary ? 'primary' : 'secondary'}`}
          >
            {position}
          </span>
        );
      })}
      {remainingCount > 0 && (
        <span
          className="position-more"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          +{remainingCount}
          {showTooltip && (
            <div className="position-tooltip">
              <div className="position-tooltip-title">Posiciones Adicionales:</div>
              {Object.entries(groupedRemaining).map(([line, positions]) => (
                <div key={line} className="position-tooltip-line">
                  <span className="position-tooltip-line-label">
                    {LINE_LABELS[line]}:
                  </span>
                  <div className="position-tooltip-badges">
                    {positions.map((pos, idx) => (
                      <span
                        key={`${pos}-${idx}`}
                        className={`position-badge position-${line} secondary`}
                      >
                        {pos}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </span>
      )}
    </div>
  );
}
