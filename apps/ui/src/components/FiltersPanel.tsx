import type { CSSProperties } from 'react';
import type { FilterCondition } from '../hooks/usePlayerViews';
import { normalizeFieldKey } from '../utils/playerDisplay';
import {
  OPERATOR_OPTIONS,
  POSITION_CODES,
  STATIC_FIELD_OPTIONS,
  type FilterOperator,
} from '../utils/playerFilters';

interface FiltersPanelProps {
  filters: FilterCondition[];
  positionsFilter: string[];
  fieldOptions: Array<{ value: string; label: string; isGroup?: boolean }>;
  fieldValueOptions: Record<string, string[]>;
  onAddFilter: () => void;
  onUpdateFilter: (id: string, partial: Partial<FilterCondition>) => void;
  onRemoveFilter: (id: string) => void;
  onTogglePosition: (code: string) => void;
}

export function FiltersPanel({
  filters,
  positionsFilter,
  fieldOptions,
  fieldValueOptions,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onTogglePosition,
}: FiltersPanelProps) {
  return (
    <div className="filters-panel">
      <div className="positions-grid">
        {POSITION_CODES.map((position) => {
          const active = positionsFilter.includes(position.code);
          return (
            <button
              type="button"
              key={position.code}
              className={active ? 'position-button active' : 'position-button'}
              style={
                active ? ({ '--pos-color': position.color } as CSSProperties) : undefined
              }
              onClick={() => onTogglePosition(position.code)}
            >
              {position.label}
            </button>
          );
        })}
      </div>

      {filters.length > 0 && (
        <div className="filters-list">
          {filters.map((filter, index) => {
            const canonical = normalizeFieldKey(filter.field);
            const baseOptions =
              STATIC_FIELD_OPTIONS[canonical] ?? fieldValueOptions[canonical];
            const needsSecond =
              OPERATOR_OPTIONS.find((option) => option.value === filter.operator)
                ?.needsSecond ?? false;

            return (
              <div key={filter.id} className="filter-row">
                {/* Selector Y/O para filtros después del primero */}
                {index > 0 && (
                  <div className="filter-logic-prefix">
                    <select
                      value={filter.logic || 'AND'}
                      onChange={(event) =>
                        onUpdateFilter(filter.id, {
                          logic: event.target.value as 'AND' | 'OR',
                        })
                      }
                      className="logic-select"
                      title="Operador lógico con el filtro anterior"
                    >
                      <option value="AND">Y</option>
                      <option value="OR">O</option>
                    </select>
                  </div>
                )}

                <select
                  value={filter.field}
                  onChange={(event) =>
                    onUpdateFilter(filter.id, { field: event.target.value })
                  }
                >
                  {fieldOptions.map((option) =>
                    option.isGroup ? (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled
                        className="field-group-header"
                      >
                        ── {option.label} ──
                      </option>
                    ) : (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={filter.operator}
                  onChange={(event) =>
                    onUpdateFilter(filter.id, {
                      operator: event.target.value as FilterOperator,
                      secondaryValue: undefined,
                    })
                  }
                >
                  {OPERATOR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {baseOptions && baseOptions.length > 0 ? (
                  <select
                    value={filter.value}
                    onChange={(event) =>
                      onUpdateFilter(filter.id, { value: event.target.value })
                    }
                  >
                    <option value="">Selecciona...</option>
                    {baseOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={filter.value}
                    onChange={(event) =>
                      onUpdateFilter(filter.id, { value: event.target.value })
                    }
                    placeholder="Valor"
                  />
                )}

                {needsSecond &&
                  (baseOptions && baseOptions.length > 0 ? (
                    <>
                      <span className="filter-between-label">y</span>
                      <select
                        value={filter.secondaryValue ?? ''}
                        onChange={(event) =>
                          onUpdateFilter(filter.id, {
                            secondaryValue: event.target.value,
                          })
                        }
                      >
                        <option value="">Selecciona...</option>
                        {baseOptions.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <span className="filter-between-label">y</span>
                      <input
                        type="text"
                        value={filter.secondaryValue ?? ''}
                        onChange={(event) =>
                          onUpdateFilter(filter.id, {
                            secondaryValue: event.target.value,
                          })
                        }
                        placeholder="Valor"
                      />
                    </>
                  ))}

                <button
                  type="button"
                  className="icon-button remove-filter"
                  onClick={() => onRemoveFilter(filter.id)}
                  aria-label="Eliminar filtro"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className="secondary-button add-filter"
        onClick={onAddFilter}
        disabled={!fieldOptions.length}
      >
        Agregar filtro
      </button>
    </div>
  );
}
