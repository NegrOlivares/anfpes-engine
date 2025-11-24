import type { DerivedPlayer } from '@anfpes/engine';
import { formatPlayerValue } from '../utils/format';
import { getStatColor } from '../types/table';
import { getPositionLine } from './PositionBadges';

export type PositionCellConfig = {
  label: string;
  valueKey: keyof DerivedPlayer;
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
};

const POSITION_FIELD_CELLS: PositionCellConfig[] = [
  { label: 'EI', valueKey: 'EX', row: 1, col: 1, rowSpan: 2 },
  { label: 'DC', valueKey: 'DC', row: 1, col: 2 },
  { label: 'SD', valueKey: 'SD', row: 2, col: 2 },
  { label: 'ED', valueKey: 'EX', row: 1, col: 3, rowSpan: 2 },
  { label: 'CIZ', valueKey: 'VOL', row: 3, col: 1, rowSpan: 2 },
  { label: 'MP', valueKey: 'MP', row: 3, col: 2 },
  { label: 'CC', valueKey: 'CC', row: 4, col: 2 },
  { label: 'CDR', valueKey: 'VOL', row: 3, col: 3, rowSpan: 2 },
  { label: 'DLI', valueKey: 'LA', row: 5, col: 1, rowSpan: 2 },
  { label: 'CCD', valueKey: 'CCD', row: 5, col: 2 },
  { label: 'CT', valueKey: 'CT', row: 6, col: 2 },
  { label: 'DLD', valueKey: 'LA', row: 5, col: 3, rowSpan: 2 },
  { label: 'DI', valueKey: 'SA', row: 7, col: 1, rowSpan: 2 },
  { label: 'LIB', valueKey: 'LIB', row: 7, col: 2 },
  { label: 'PT', valueKey: 'PT', row: 8, col: 2 },
  { label: 'DD', valueKey: 'SA', row: 7, col: 3, rowSpan: 2 },
];

const POSITION_CELL_ALIASES: Record<string, string[]> = {
  EX: ['EI', 'ED'],
  EI: ['EI'],
  ED: ['ED'],
  VOL: ['CIZ', 'CDR'],
  CIZ: ['CIZ'],
  CDR: ['CDR'],
  LA: ['DLI', 'DLD'],
  DLI: ['DLI'],
  DLD: ['DLD'],
  SA: ['DI', 'DD'],
  DI: ['DI'],
  DD: ['DD'],
  LIB: ['LIB'],
  CT: ['CT'],
  CCD: ['CCD'],
  CC: ['CC'],
  MP: ['MP'],
  SD: ['SD'],
  DC: ['DC'],
  PT: ['PT'],
};

const POSITION_CELL_SET = new Set(
  POSITION_FIELD_CELLS.map((cell) => cell.label.toUpperCase()),
);

const POSITION_NAME_MAP: Record<string, string> = {
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

export const DEMARCATION_COLUMNS = [
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

const DEMARCATION_TRANSLATION: Record<string, string> = {
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

export function getActivePositionCells(player: DerivedPlayer): Set<string> {
  const active = new Set<string>();
  DEMARCATION_COLUMNS.forEach((column) => {
    const rawValue = player[column as keyof DerivedPlayer];
    if (!rawValue) return;
    const normalized = String(rawValue).trim().toUpperCase();
    const translated = DEMARCATION_TRANSLATION[normalized] ?? normalized;
    const targets = resolveCellAliases(translated);
    targets.forEach((cell) => active.add(cell));
  });
  return active;
}

export function PositionMap({
  player,
  activeCells,
  primaryPosition,
}: {
  player: DerivedPlayer;
  activeCells: Set<string>;
  primaryPosition?: string;
}) {
  const primaryCellTargets = resolveCellAliases(primaryPosition);
  return (
    <div className="position-map">
      <div className="position-map-header">
        <h4>Posiciones</h4>
      </div>
      <div className="position-map-inner">
        <div className="position-map-grid">
          {POSITION_FIELD_CELLS.map((cell) => {
            const isActive = activeCells.has(cell.label.toUpperCase());
            const isPrimary = primaryCellTargets.includes(cell.label.toUpperCase());
            const value = valueFromPositionField(cell.valueKey, player);
            const displayValue = value !== undefined ? formatPlayerValue(value, 0) : '-';
            const statColor =
              value !== undefined ? (getStatColor(value) ?? undefined) : undefined;
            const style = {
              gridColumn: `${cell.col} / span ${cell.colSpan ?? 1}`,
              gridRow: `${cell.row} / span ${cell.rowSpan ?? 1}`,
            };
            const positionLine = getPositionLine(cell.label);
            const positionName = POSITION_NAME_MAP[cell.label] ?? cell.label;
            return (
              <div
                key={`${cell.label}-${cell.row}-${cell.col}`}
                className={`position-node col-${cell.col} ${isActive ? 'active' : ''} ${isPrimary ? 'primary' : ''}`}
                style={style}
              >
                <span
                  className={`position-chip position-${positionLine}`}
                  aria-hidden="true"
                >
                  {cell.label}
                </span>
                <strong style={statColor ? { color: statColor } : undefined}>
                  {displayValue}
                </strong>
                <div className="position-node-tooltip">
                  <div className="position-node-tooltip-top">
                    <span className={`position-chip position-${positionLine}`}>
                      {cell.label}
                    </span>
                    <span className="position-node-tooltip-name">{positionName}</span>
                  </div>
                  <div className="position-node-tooltip-bottom">
                    <span>Promedio:</span>
                    <strong
                      className="position-node-tooltip-value"
                      style={statColor ? { color: statColor } : undefined}
                    >
                      {displayValue}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function resolveCellAliases(code?: string): string[] {
  if (!code) return [];
  const normalized = code.trim().toUpperCase();
  if (POSITION_CELL_ALIASES[normalized]) {
    return POSITION_CELL_ALIASES[normalized].map((label) => label.toUpperCase());
  }
  if (POSITION_CELL_SET.has(normalized)) {
    return [normalized];
  }
  return [];
}

function valueFromPositionField(
  field: keyof DerivedPlayer,
  player: DerivedPlayer,
): number | undefined {
  const value = player[field];
  return typeof value === 'number' ? value : undefined;
}
