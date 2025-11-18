import type { DerivedPlayer } from '@anfpes/engine';
import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useCacheStore } from '../store/cacheStore';
import { usePreselectionStore } from '../store/preselectionStore';
import {
  DEFAULT_TABLE_COLUMNS,
  FIELD_GROUPS,
  getTableHeaderLabel,
  getSortedColumns,
} from '../constants/playerFields';
import { POSITION_COLORS, type SortConfig } from '../types/table';
import { TableCell } from './TableCell';
import { PositionBadges } from './PositionBadges';
import {
  formatClub,
  formatNationality,
  formatSelectionDisplay,
  getFieldFilterValue,
  getFieldLabel,
  normalizeFieldKey,
  shouldDisplayField,
  SPECIAL_SKILL_FIELDS,
} from '../utils/playerDisplay';
import { usePlayerViews, type FilterCondition } from '../hooks/usePlayerViews';
import { getNationalityInfo } from '../data/nationalities';
import { getFlagImagePath, getClubShieldPath } from '../utils/imageHelpers';
import { ANFPES_CLUBS, LEGEND_PLAYERS, ML_PLAYERS } from '../data/playerStatus';
import { openPlayerActionsMenu, closePlayerActionsMenu } from './PlayerActionsOverlay';

type FilterOperator = 'eq' | 'contains' | 'gte' | 'lte' | 'between';

const POSITION_CODES = [
  { code: 'GK', label: 'PT', color: POSITION_COLORS.PT },
  { code: 'SWP', label: 'LIB', color: POSITION_COLORS.LIB },
  { code: 'CB', label: 'CT', color: POSITION_COLORS.CT },
  { code: 'SB', label: 'SA', color: POSITION_COLORS.SA },
  { code: 'RB', label: 'DD', color: POSITION_COLORS.DD },
  { code: 'LB', label: 'DI', color: POSITION_COLORS.DI },
  { code: 'DMF', label: 'CCD', color: POSITION_COLORS.CCD },
  { code: 'WB', label: 'LA', color: POSITION_COLORS.LA },
  { code: 'RWB', label: 'DLD', color: POSITION_COLORS.DLD },
  { code: 'LWB', label: 'DLI', color: POSITION_COLORS.DLI },
  { code: 'CMF', label: 'CC', color: POSITION_COLORS.CC },
  { code: 'SMF', label: 'VOL', color: POSITION_COLORS.VOL },
  { code: 'RMF', label: 'CDR', color: POSITION_COLORS.CDR },
  { code: 'LMF', label: 'CIZ', color: POSITION_COLORS.CIZ },
  { code: 'AMF', label: 'MP', color: POSITION_COLORS.MP },
  { code: 'WF', label: 'EX', color: POSITION_COLORS.EX },
  { code: 'RWF', label: 'ED', color: POSITION_COLORS.ED },
  { code: 'LWF', label: 'EI', color: POSITION_COLORS.EI },
  { code: 'SS', label: 'SD', color: POSITION_COLORS.SD },
  { code: 'CF', label: 'DC', color: POSITION_COLORS.DC },
];

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

const STATIC_FIELD_OPTIONS: Record<string, string[]> = {
  PIE: ['Derecho', 'Izquierdo', 'Ambos'],
  'FAVOURED SIDE': ['Derecho', 'Izquierdo', 'Ambos'],
  'SKIN COLOR': ['Claro', 'Medio', 'Moreno', 'Negro'],
  'TOLERANCIA LESIONES': ['A', 'B', 'C'],
  CONSISTENCIA: ['1', '2', '3', '4', '5', '6', '7', '8'],
  'CONDICIÓN FITNESS': ['1', '2', '3', '4', '5', '6', '7', '8'],
  'PRECICIÓN PIE MALO': ['1', '2', '3', '4', '5', '6', '7', '8'],
  'FRECUENCIA PIE MALO': ['1', '2', '3', '4', '5', '6', '7', '8'],
  'nro selección': ['Si', 'No'],
  'nro clasico': ['Si', 'No'],
  ANFPES: ['Si', 'No'],
};
const DYNAMIC_OPTION_FIELDS = new Set(['NACIONALIDAD', 'CLUB']);

SPECIAL_SKILL_FIELDS.forEach((field) => {
  STATIC_FIELD_OPTIONS[field] = ['Si', 'No'];
});

const OPERATOR_OPTIONS: Array<{
  value: FilterOperator;
  label: string;
  needsSecond?: boolean;
}> = [
  { value: 'eq', label: 'Es exactamente' },
  { value: 'contains', label: 'Contiene' },
  { value: 'gte', label: 'Es mayor o igual que' },
  { value: 'lte', label: 'Es menor o igual que' },
  { value: 'between', label: 'Es entre', needsSecond: true },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function safeNormalize(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return normalize(String(value));
}

export function PlayerSearch() {
  const players = useCacheStore((state) => state.players);
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);
  const selectedId = useCacheStore((state) => state.selectedPlayerId);
  const setSelectedPlayer = useCacheStore((state) => state.setSelectedPlayer);

  const {
    savedViews,
    currentViewId,
    saveView,
    deleteView,
    loadView,
    saveLastViewState,
    loadLastViewState,
  } = usePlayerViews();

  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [positionsFilter, setPositionsFilter] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([
    { key: 'PROMEDIO', direction: 'desc' },
  ]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(DEFAULT_TABLE_COLUMNS),
  );
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [viewsMenuOpen, setViewsMenuOpen] = useState(false);
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  // Preselection states
  const selectedPlayerIds = usePreselectionStore((state) => state.selectedPlayerIds);
  const selectPlayer = usePreselectionStore((state) => state.selectPlayer);
  const deselectPlayer = usePreselectionStore((state) => state.deselectPlayer);
  const selectAllPlayers = usePreselectionStore((state) => state.selectAllPlayers);
  const getPlayerPreselections = usePreselectionStore(
    (state) => state.getPlayerPreselections,
  );

  // Cargar el último estado al iniciar
  useEffect(() => {
    const lastState = loadLastViewState();
    if (lastState) {
      setFilters(lastState.filters);
      setPositionsFilter(lastState.positionsFilter);
      setSortConfig(lastState.sortConfig);
      setVisibleColumns(new Set(lastState.visibleColumns));
    }
  }, []);

  // Guardar el estado actual cuando cambie
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveLastViewState({
        filters,
        positionsFilter,
        sortConfig,
        visibleColumns: Array.from(visibleColumns),
      });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filters, positionsFilter, sortConfig, visibleColumns, saveLastViewState]);

  const normalizedQuery = normalize(query.trim());

  // Columnas visibles ordenadas según FIELD_ORDER
  const sortedVisibleColumns = useMemo(() => {
    return getSortedColumns(visibleColumns);
  }, [visibleColumns]);

  const fieldOptions = useMemo(() => {
    if (!players || !players.length) {
      return [];
    }

    const options: Array<{ value: string; label: string; isGroup?: boolean }> = [];

    FIELD_GROUPS.forEach((group) => {
      // Agregar el divisor de grupo
      options.push({
        value: `__group_${group.label}`,
        label: group.label,
        isGroup: true,
      });

      // Agregar los campos del grupo
      group.fields.forEach((field) => {
        if (shouldDisplayField(field)) {
          options.push({
            value: field,
            label: getFieldLabel(field),
          });
        }
      });
    });

    return options;
  }, [players]);

  const fieldValueOptions = useMemo<Record<string, string[]>>(() => {
    const base: Record<string, string[]> = { ...STATIC_FIELD_OPTIONS };
    if (!players) {
      return base;
    }

    const collectors = new Map<string, Set<string>>();
    DYNAMIC_OPTION_FIELDS.forEach((field) => collectors.set(field, new Set<string>()));

    players.forEach((player) => {
      Object.keys(player).forEach((rawField) => {
        const canonical = normalizeFieldKey(rawField);
        const bucket = collectors.get(canonical);
        if (!bucket) {
          return;
        }
        const value = getFieldFilterValue(rawField as keyof DerivedPlayer, player);
        if (value && value !== '-') {
          bucket.add(value);
        }
      });
    });

    collectors.forEach((set, field) => {
      base[field] = Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
    });

    return base;
  }, [players]);

  const results = useMemo(() => {
    if (!players) {
      return [];
    }

    let filtered = players.filter((player) => {
      const matchesSearch =
        !normalizedQuery ||
        [
          player.NOMBRE,
          formatClub(player.CLUB as string, player.NACIONALIDAD as string),
          formatNationality(player.NACIONALIDAD as string),
        ].some((value) => safeNormalize(value).includes(normalizedQuery));

      if (!matchesSearch) {
        return false;
      }

      if (filters.length && !filters.every((filter) => evaluateFilter(filter, player))) {
        return false;
      }

      return matchesPositions(player, positionsFilter);
    });

    // Aplicar ordenamiento
    if (sortConfig.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        for (const sort of sortConfig) {
          const aValue = a[sort.key];
          const bValue = b[sort.key];

          let comparison = 0;
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
          } else {
            const aStr = String(aValue ?? '');
            const bStr = String(bValue ?? '');
            comparison = aStr.localeCompare(bStr, 'es');
          }

          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }

    return filtered;
  }, [players, normalizedQuery, filters, positionsFilter, sortConfig]);

  const totalPages = Math.ceil(results.length / itemsPerPage);
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return results.slice(start, start + itemsPerPage);
  }, [results, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedQuery, filters, positionsFilter]);

  useEffect(() => {
    if (!paginatedResults.length) {
      setSelectedPlayer(null);
      return;
    }

    if (!selectedId || !paginatedResults.some((player) => player.ID === selectedId)) {
      setSelectedPlayer(paginatedResults[0].ID as string);
    }
  }, [paginatedResults, selectedId, setSelectedPlayer]);

  const loading = status === 'idle' || status === 'loading';

  const handleAddFilter = () => {
    if (!fieldOptions.length) {
      return;
    }
    // Buscar el primer campo que no sea un grupo
    const firstValidField = fieldOptions.find((opt) => !opt.isGroup);
    if (!firstValidField) {
      return;
    }
    const newFilter: FilterCondition = {
      id: crypto.randomUUID(),
      field: firstValidField.value,
      operator: 'eq',
      value: '',
    };
    setFilters((current) => [...current, newFilter]);
    setFiltersOpen(true);
  };

  const handleUpdateFilter = (id: string, partial: Partial<FilterCondition>) => {
    setFilters((current) =>
      current.map((filter) => {
        if (filter.id !== id) {
          return filter;
        }
        const next: FilterCondition = { ...filter, ...partial };
        if (partial.field) {
          next.value = '';
          next.secondaryValue = undefined;
        }
        return next;
      }),
    );
  };

  const handleRemoveFilter = (id: string) => {
    setFilters((current) => current.filter((filter) => filter.id !== id));
  };

  const handleClearFilters = () => {
    setFilters([]);
    setPositionsFilter([]);
  };

  const handleSaveView = () => {
    if (!newViewName.trim()) {
      return;
    }
    saveView(newViewName.trim(), {
      filters,
      positionsFilter,
      sortConfig,
      visibleColumns: Array.from(visibleColumns),
    });
    setNewViewName('');
    setSaveViewDialogOpen(false);
  };

  const handleLoadView = (viewId: string) => {
    const view = loadView(viewId);
    if (view) {
      setFilters(view.filters);
      setPositionsFilter(view.positionsFilter);
      setSortConfig(view.sortConfig);
      setVisibleColumns(new Set(view.visibleColumns));
    }
    setViewsMenuOpen(false);
  };

  const handleDeleteView = (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de que quieres eliminar esta vista?')) {
      deleteView(viewId);
    }
  };

  const handleClearCurrentView = () => {
    setFilters([]);
    setPositionsFilter([]);
    setSortConfig([{ key: 'PROMEDIO', direction: 'desc' }]);
    setVisibleColumns(new Set(DEFAULT_TABLE_COLUMNS));
  };

  const handleTogglePlayerSelection = (
    event: ChangeEvent<HTMLInputElement>,
    player: DerivedPlayer,
  ) => {
    event.stopPropagation();
    if (selectedPlayerIds.has(player.ID)) {
      deselectPlayer(player.ID);
      if (usePreselectionStore.getState().selectedPlayerIds.size === 0) {
        closePlayerActionsMenu();
      }
      return;
    }
    selectPlayer(player.ID);
    openPlayerActionsMenu(event, player);
  };

  const handleToggleAllVisible = (event: ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const visibleIds = paginatedResults.map((p) => p.ID);
    if (visibleIds.length === 0) {
      return;
    }
    const allSelected = visibleIds.every((id) => selectedPlayerIds.has(id));

    if (allSelected) {
      visibleIds.forEach((id) => deselectPlayer(id));
      if (usePreselectionStore.getState().selectedPlayerIds.size === 0) {
        closePlayerActionsMenu();
      }
      return;
    }

    const combinedIds = Array.from(new Set([...selectedPlayerIds, ...visibleIds]));
    selectAllPlayers(combinedIds);
    const anchorPlayer = paginatedResults[0];
    if (anchorPlayer) {
      openPlayerActionsMenu(event, anchorPlayer);
    }
  };

  const handleSort = (key: keyof DerivedPlayer, multi: boolean) => {
    setSortConfig((current) => {
      if (multi) {
        const existing = current.find((s) => s.key === key);
        if (existing) {
          if (existing.direction === 'desc') {
            return current.map((s) =>
              s.key === key ? { ...s, direction: 'asc' as const } : s,
            );
          }
          return current.filter((s) => s.key !== key);
        }
        return [...current, { key, direction: 'desc' }];
      }
      const existing = current.find((s) => s.key === key);
      if (existing && existing.direction === 'desc') {
        return [{ key, direction: 'asc' }];
      }
      if (existing && existing.direction === 'asc') {
        return [];
      }
      return [{ key, direction: 'desc' }];
    });
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns((current) => {
      const next = new Set(current);
      if (next.has(column)) {
        if (column !== 'NOMBRE' && next.size > 1) next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  };

  const getColumnType = (
    field: string,
  ): 'text' | 'number' | 'stat' | 'rating' | 'injury' => {
    if (field === 'TOLERANCIA LESIONES') return 'injury';

    // Ratings de posición (promedios con barras)
    if (
      [
        'PT',
        'LIB',
        'CT',
        'SA',
        'LA',
        'CCD',
        'CC',
        'VOL',
        'MP',
        'EX',
        'SD',
        'DC',
      ].includes(field)
    ) {
      return 'rating';
    }

    // Promedios principales (con barras)
    if (['PROMEDIO', 'MEJOR PROMEDIO'].includes(field)) {
      return 'stat';
    }

    // MacroStats (con barras)
    if (['ATK', 'TEC', 'RES', 'DEF', 'FUE', 'VEL'].includes(field)) {
      return 'stat';
    }

    // Stats generales (con barras)
    if (
      [
        'ATAQUE',
        'DEFENSA',
        'ESTABILIDAD',
        'RESISTENCIA',
        'VELOCIDAD MÁXIMA',
        'ACELERACIÓN',
        'REPUESTA',
        'AGILIDAD',
        'PRECISIÓN DRIBBLE',
        'VELOCIDAD DRIBBLE',
        'PRECISIÓN   P CORTO',
        'VELOCIDAD  P CORTO',
        'PRECISIÓN       P LARGO',
        'VELOCIDAD     P LARGO',
        'PRECISIÓN DISPARO',
        'POTENCIA DISPARO',
        'TÉCNICA DISPARO',
        'PRECISIÓN TIRO LIBRE',
        'EFECTO',
        'CABEZAZO',
        'SALTO',
        'TÉCNICA',
        'AGRESIVIDAD',
        'MENTALIDAD',
        'ARQUERO',
        'TRABAJO EN EQUIPO',
      ].includes(field)
    ) {
      return 'stat';
    }

    // Métricas (con barras)
    if (
      [
        'DESTREZA ATAQUE',
        'DESTREZA DEFENSA',
        'FINIQUITO',
        'VELOCIDAD',
        'EXPLOSIVIDAD',
        'PROMEDIO AGILIDADES',
        'POTENCIA DE PATADA',
        'RECUPERACION DE BALÓN',
        'ALETISMO',
        'JUEGO AEREO',
        'CREATIVIDAD',
      ].includes(field)
    ) {
      return 'stat';
    }

    // Atributos físicos numéricos (con color pero sin barras)
    if (
      [
        'CONSISTENCIA',
        'CONDICIÓN FITNESS',
        'PRECICIÓN PIE MALO',
        'FRECUENCIA PIE MALO',
      ].includes(field)
    ) {
      return 'number';
    }

    // Campos numéricos básicos
    if (field === 'EDAD' || field === 'ALTURA' || field === 'PESO') {
      return 'number';
    }

    return 'text';
  };

  return (
    <section className="card player-search">
      <header className="search-header">
        <div className="search-field">
          <input
            className="search-input"
            type="text"
            placeholder="Nombre, Club o Nacionalidad"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="search-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setViewsMenuOpen((open) => !open)}
          >
            Vistas {viewsMenuOpen ? '▲' : '▼'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            Filtros
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setColumnsMenuOpen((open) => !open)}
          >
            Columnas {columnsMenuOpen ? '▲' : '▼'}
          </button>
          <button
            type="button"
            className="secondary-button ghost"
            onClick={handleClearFilters}
            disabled={!filters.length && !positionsFilter.length}
          >
            Limpiar filtros
          </button>
        </div>
      </header>

      {viewsMenuOpen && (
        <div className="views-panel">
          <div className="views-header">
            <h4>Vistas Guardadas</h4>
            <button
              type="button"
              className="secondary-button small"
              onClick={() => setSaveViewDialogOpen(true)}
            >
              Guardar Vista Actual
            </button>
          </div>
          {savedViews.length === 0 ? (
            <p className="muted">No hay vistas guardadas</p>
          ) : (
            <div className="views-list">
              {savedViews.map((view) => (
                <div
                  key={view.id}
                  className={`view-item ${currentViewId === view.id ? 'active' : ''}`}
                >
                  <button
                    type="button"
                    className="view-name"
                    onClick={() => handleLoadView(view.id)}
                  >
                    {view.name}
                  </button>
                  <button
                    type="button"
                    className="icon-button delete-view"
                    onClick={(e) => handleDeleteView(view.id, e)}
                    aria-label="Eliminar vista"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="secondary-button ghost"
            onClick={handleClearCurrentView}
          >
            Limpiar Vista Actual
          </button>
        </div>
      )}

      {saveViewDialogOpen && (
        <div className="save-view-dialog">
          <h4>Guardar Vista</h4>
          <input
            type="text"
            value={newViewName}
            onChange={(e) => setNewViewName(e.target.value)}
            placeholder="Nombre de la vista"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveView();
              }
            }}
          />
          <div className="dialog-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleSaveView}
              disabled={!newViewName.trim()}
            >
              Guardar
            </button>
            <button
              type="button"
              className="secondary-button ghost"
              onClick={() => {
                setSaveViewDialogOpen(false);
                setNewViewName('');
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {filtersOpen && (
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
                    active
                      ? ({ '--pos-color': position.color } as React.CSSProperties)
                      : undefined
                  }
                  onClick={() => togglePosition(position.code, setPositionsFilter)}
                >
                  {position.label}
                </button>
              );
            })}
          </div>

          {filters.length > 0 && (
            <div className="filters-list">
              {filters.map((filter) => {
                const canonical = normalizeFieldKey(filter.field);
                const baseOptions =
                  STATIC_FIELD_OPTIONS[canonical] ?? fieldValueOptions[canonical];
                const needsSecond =
                  OPERATOR_OPTIONS.find((option) => option.value === filter.operator)
                    ?.needsSecond ?? false;

                return (
                  <div key={filter.id} className="filter-row">
                    <select
                      value={filter.field}
                      onChange={(event) =>
                        handleUpdateFilter(filter.id, { field: event.target.value })
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
                        handleUpdateFilter(filter.id, {
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
                          handleUpdateFilter(filter.id, { value: event.target.value })
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
                          handleUpdateFilter(filter.id, { value: event.target.value })
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
                              handleUpdateFilter(filter.id, {
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
                              handleUpdateFilter(filter.id, {
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
                      onClick={() => handleRemoveFilter(filter.id)}
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
            onClick={handleAddFilter}
            disabled={!fieldOptions.length}
          >
            Agregar filtro
          </button>
        </div>
      )}

      {loading && <p className="loading">Leyendo jugadores...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="search-toolbar">
            <div className="search-info">
              <span>
                <strong>{results.length}</strong> jugadores encontrados
                {totalPages > 1 && ` (página ${currentPage} de ${totalPages})`}
              </span>
            </div>
            {totalPages > 1 && (
              <div className="pagination-inline">
                <button
                  type="button"
                  className="pagination-button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Página anterior"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="pagination-button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Página siguiente"
                >
                  →
                </button>
              </div>
            )}
          </div>

          {columnsMenuOpen && (
            <div className="columns-menu">
              <h4>Columnas visibles ({visibleColumns.size - 1})</h4>
              {FIELD_GROUPS.map((group) => {
                const excludedFromSelector = new Set([
                  'NOMBRE',
                  'nro selección',
                  'nro clasico',
                  'ANFPES',
                ]);
                const groupFields = group.fields.filter(
                  (field) =>
                    shouldDisplayField(field) && !excludedFromSelector.has(field),
                );
                if (groupFields.length === 0) return null;

                return (
                  <div key={group.label} className="column-group">
                    <div className="column-group-header">{group.label}</div>
                    {groupFields.map((field) => (
                      <label key={field} className="column-option">
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(field)}
                          onChange={() => toggleColumn(field)}
                          disabled={field === 'NOMBRE'}
                        />
                        <span>{getFieldLabel(field)}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {results.length === 0 ? (
            <p className="muted">
              No hay coincidencias para <strong>{query || '...'}</strong>.
            </p>
          ) : (
            <>
              <div className="table-container">
                <table className="player-table">
                  <thead className="sticky-header">
                    <tr>
                      <th className="checkbox-column">
                        <input
                          type="checkbox"
                          onChange={handleToggleAllVisible}
                          checked={
                            paginatedResults.length > 0 &&
                            paginatedResults.every((p) => selectedPlayerIds.has(p.ID))
                          }
                          title="Seleccionar todos los visibles"
                        />
                      </th>
                      {sortedVisibleColumns.map((column) => {
                        const sortIndex = sortConfig.findIndex((s) => s.key === column);
                        const sortDir =
                          sortIndex >= 0 ? sortConfig[sortIndex].direction : null;
                        const headerLabel = getTableHeaderLabel(column);
                        const isNameColumn = column === 'NOMBRE';
                        const isImageColumn =
                          column === 'NACIONALIDAD' || column === 'CLUB';
                        const isPositionsColumn = column === 'POSICIONES';
                        const columnType = getColumnType(column);
                        const headerClasses = ['sortable'];
                        if (isNameColumn) headerClasses.push('player-name-header');
                        if (isImageColumn) headerClasses.push('image-header');
                        if (isPositionsColumn) headerClasses.push('positions-header');
                        if (column === 'NACIONALIDAD')
                          headerClasses.push('nationality-column');
                        if (column === 'CLUB') headerClasses.push('club-column');

                        return (
                          <th
                            key={column}
                            className={headerClasses.join(' ')}
                            data-type={columnType}
                            onClick={(e) =>
                              handleSort(column as keyof DerivedPlayer, e.shiftKey)
                            }
                            title={headerLabel}
                          >
                            <div className="th-content">
                              <span>{headerLabel}</span>
                              {sortDir && (
                                <span className="sort-indicator">
                                  {sortDir === 'asc' ? '▲' : '▼'}
                                  {sortConfig.length > 1 && sortIndex >= 0 && (
                                    <sup>{sortIndex + 1}</sup>
                                  )}
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResults.map((player) => {
                      const playerPreselections = getPlayerPreselections(player.ID);

                      return (
                        <tr
                          key={player.ID}
                          data-player-id={player.ID}
                          className={player.ID === selectedId ? 'selected' : undefined}
                          onClick={() => setSelectedPlayer(player.ID as string)}
                        >
                          <td
                            className="checkbox-column"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPlayerIds.has(player.ID)}
                              onChange={(event) =>
                                handleTogglePlayerSelection(event, player)
                              }
                            />
                          </td>
                          {sortedVisibleColumns.map((column) => {
                            if (column === 'NOMBRE') {
                              const rawClub = player.CLUB as string;
                              const playerName = player.NOMBRE as string;
                              const hasNationalTeam = formatSelectionDisplay(
                                player['nro selección'],
                              );
                              const hasClassic = formatSelectionDisplay(
                                player['nro clasico'],
                              );
                              const isLegend =
                                hasClassic !== 'No' || LEGEND_PLAYERS.has(playerName);
                              const isMLPlayer = ML_PLAYERS.has(playerName);
                              const isAnfpes = ANFPES_CLUBS.has(rawClub);

                              return (
                                <td key={column} className="player-name-cell">
                                  <div className="player-name-primary">
                                    <button
                                      type="button"
                                      className="player-name-button"
                                      onClick={(event) =>
                                        openPlayerActionsMenu(event, player)
                                      }
                                    >
                                      <span className="player-name-text">
                                        {player.NOMBRE}
                                      </span>
                                    </button>
                                    <span className="player-badges">
                                      {hasNationalTeam !== 'No' && (
                                        <span
                                          className="badge"
                                          title="Seleccionado Nacional"
                                        >
                                          🌍
                                        </span>
                                      )}
                                      {isLegend && (
                                        <span
                                          className="badge legend"
                                          title="Jugador Leyenda"
                                        >
                                          ★
                                        </span>
                                      )}
                                      {isMLPlayer && (
                                        <span className="badge ml" title="Jugador ML">
                                          ML
                                        </span>
                                      )}
                                      {isAnfpes && (
                                        <span
                                          className="badge anfpes"
                                          title="Afiliado a la ANFPES"
                                        >
                                          ANFPES
                                        </span>
                                      )}
                                      {playerPreselections.length > 0 && (
                                        <span
                                          className="badge preselection"
                                          title={`En ${playerPreselections.length} preselección${playerPreselections.length > 1 ? 'es' : ''}: ${playerPreselections.map((p) => p.name).join(', ')}`}
                                        >
                                          📋
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </td>
                              );
                            }

                            if (column === 'NACIONALIDAD') {
                              const rawNationality = player.NACIONALIDAD as string;
                              const flagPath = getFlagImagePath(rawNationality);
                              const nationalityInfo = getNationalityInfo(rawNationality);
                              const displayName = nationalityInfo?.name || rawNationality;

                              return (
                                <td
                                  key={column}
                                  className="image-cell nationality-column"
                                  title={displayName}
                                >
                                  {flagPath && (
                                    <img src={flagPath} alt="" className="flag-icon" />
                                  )}
                                </td>
                              );
                            }

                            if (column === 'CLUB') {
                              const rawClub = player.CLUB as string;
                              const shieldPath = getClubShieldPath(rawClub);
                              const rawNationality = player.NACIONALIDAD as string;
                              const clubDisplay = formatClub(rawClub, rawNationality);

                              return (
                                <td
                                  key={column}
                                  className="image-cell club-column"
                                  title={clubDisplay}
                                >
                                  {shieldPath ? (
                                    <img
                                      src={shieldPath}
                                      alt=""
                                      className="club-shield"
                                    />
                                  ) : (
                                    <span className="club-icon">⚽</span>
                                  )}
                                </td>
                              );
                            }

                            if (column === 'POSICIONES') {
                              return (
                                <td key={column}>
                                  <PositionBadges player={player} />
                                </td>
                              );
                            }

                            return (
                              <td key={column} data-type={getColumnType(column)}>
                                <TableCell
                                  field={column as keyof DerivedPlayer}
                                  player={player}
                                  type={getColumnType(column)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

function evaluateFilter(filter: FilterCondition, player: DerivedPlayer): boolean {
  // Manejo especial para filtro ANFPES
  if (filter.field === 'ANFPES') {
    const playerClub = player.CLUB as string;
    const isAnfpesClub = ANFPES_CLUBS.has(playerClub);
    const filterValue = filter.value.trim().toLowerCase();

    if (filterValue === 'si') {
      return isAnfpesClub;
    } else if (filterValue === 'no') {
      return !isAnfpesClub;
    }
    return true; // Si no hay valor, no filtrar
  }

  const rawValue = player[filter.field as keyof DerivedPlayer];
  const displayValue = getFieldFilterValue(filter.field as keyof DerivedPlayer, player);
  const normalizedDisplay = displayValue.toLowerCase();
  const normalizedFilterValue = filter.value.trim().toLowerCase();

  switch (filter.operator) {
    case 'contains':
      if (!normalizedFilterValue) {
        return true;
      }
      return normalizedDisplay.includes(normalizedFilterValue);
    case 'eq':
      if (!normalizedFilterValue) {
        return true;
      }
      return normalizedDisplay === normalizedFilterValue;
    case 'gte': {
      const playerNumber = toNumber(rawValue);
      const filterNumber = toNumber(filter.value);
      if (playerNumber === null || filterNumber === null) {
        return false;
      }
      return playerNumber >= filterNumber;
    }
    case 'lte': {
      const playerNumber = toNumber(rawValue);
      const filterNumber = toNumber(filter.value);
      if (playerNumber === null || filterNumber === null) {
        return false;
      }
      return playerNumber <= filterNumber;
    }
    case 'between': {
      const playerNumber = toNumber(rawValue);
      const start = toNumber(filter.value);
      const end = toNumber(filter.secondaryValue);
      if (playerNumber === null || start === null || end === null) {
        return false;
      }
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      return playerNumber >= min && playerNumber <= max;
    }
    default:
      return true;
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value.replace(',', '.'));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

// Mapeo de posiciones ambidiestras a sus variantes laterales
const AMBIDEXTROUS_EQUIVALENCE: Record<string, string[]> = {
  SB: ['RB', 'LB'],
  WB: ['RWB', 'LWB'],
  SMF: ['RMF', 'LMF'],
  WF: ['RWF', 'LWF'],
};

function matchesPositions(player: DerivedPlayer, positions: string[]): boolean {
  if (!positions.length) {
    return true;
  }
  const playerPositions = DEMARCATION_COLUMNS.map(
    (column) => player[column as keyof DerivedPlayer],
  ).filter(Boolean) as string[];
  if (!playerPositions.length) {
    return false;
  }

  return playerPositions.some((playerCode) => {
    // Coincidencia exacta
    if (positions.includes(playerCode)) {
      return true;
    }

    // Si el jugador tiene posición ambidiestra, verificar si buscan sus variantes laterales
    const lateralVariants = AMBIDEXTROUS_EQUIVALENCE[playerCode];
    if (lateralVariants) {
      return lateralVariants.some((variant) => positions.includes(variant));
    }

    return false;
  });
}

function togglePosition(
  code: string,
  setPositions: React.Dispatch<React.SetStateAction<string[]>>,
) {
  setPositions((current) =>
    current.includes(code)
      ? current.filter((position) => position !== code)
      : [...current, code],
  );
}
