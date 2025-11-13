import type { DerivedPlayer } from '@anfpes/engine';
import { getInjuryColor, getStatColor } from '../types/table';
import { getFieldDisplayValue } from '../utils/playerDisplay';

interface TableCellProps {
  field: keyof DerivedPlayer;
  player: DerivedPlayer;
  type?: 'text' | 'number' | 'stat' | 'rating' | 'injury';
}

export function TableCell({ field, player, type = 'text' }: TableCellProps) {
  const rawValue = player[field];
  const displayValue = getFieldDisplayValue(field, player);

  // Para habilidades especiales (★), mostrar con color dorado
  const isSpecialSkill = displayValue === '★';

  let color: string | null = null;
  let showBar = false;

  if (type === 'stat' || type === 'rating') {
    const numericValue = typeof rawValue === 'number' ? rawValue : null;
    if (numericValue !== null) {
      color = getStatColor(numericValue);
      showBar = true;
    }
  } else if (type === 'number') {
    const numericValue = typeof rawValue === 'number' ? rawValue : null;
    if (numericValue !== null) {
      color = getStatColor(numericValue);
    }
  } else if (type === 'injury') {
    color = getInjuryColor(rawValue as string);
  }

  const numValue = typeof rawValue === 'number' ? rawValue : null;
  const percentage =
    numValue !== null && showBar ? Math.min((numValue / 99) * 100, 100) : 0;

  return (
    <div className="table-cell-content">
      {showBar && (
        <div className="stat-bar-container">
          <div className="stat-bar-bg">
            <div
              className="stat-bar-fill"
              style={{
                width: `${percentage}%`,
                backgroundColor: color || 'rgba(122, 201, 255, 0.3)',
              }}
            />
          </div>
        </div>
      )}
      <span
        className={`table-cell-value ${isSpecialSkill ? 'special-skill-star' : ''}`}
        style={{ color: isSpecialSkill ? '#ffd700' : color || undefined }}
      >
        {displayValue}
      </span>
    </div>
  );
}
