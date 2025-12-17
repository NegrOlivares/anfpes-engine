import { Fragment, useMemo, useState } from 'react';
import type { DerivedPlayer } from '@anfpes/engine';
import { useCacheStore } from '../store/cacheStore';
import { useSimilarPlayersStore } from '../store/similarPlayersStore';
import {
  DEFAULT_TABLE_COLUMNS,
  FIELD_GROUPS,
  getSortedColumns,
  getTableHeaderLabel,
} from '../constants/playerFields';
import { TableCell } from '../components/TableCell';
import { GlossaryTooltip } from '../components/GlossaryTooltip';
import { EnhancedTooltip } from '../components/EnhancedTooltip';
import {
  PositionBadges,
  getPlayerPositions,
  getPositionLine,
} from '../components/PositionBadges';
import {
  formatClub,
  formatSelectionDisplay,
  getFieldFilterValue,
  getFieldLabel,
  normalizeFieldKey,
  shouldDisplayField,
} from '../utils/playerDisplay';
import {
  DYNAMIC_OPTION_FIELDS,
  STATIC_FIELD_OPTIONS,
  evaluateFilter,
  matchesPositions,
  togglePosition,
} from '../utils/playerFilters';
import { FiltersPanel } from '../components/FiltersPanel';
import type { FilterCondition } from '../hooks/usePlayerViews';
import {
  getFlagImagePath,
  getClubShieldPath,
  getPlayerThumbPath,
} from '../utils/imageHelpers';
import { getNationalityInfo } from '../data/nationalities';
import { openPlayerActionsMenu } from '../components/PlayerActionsOverlay';
import { getStatColor, type SortDirection } from '../types/table';
import { ANFPES_CLUBS, LEGEND_PLAYERS, ML_PLAYERS } from '../data/playerStatus';

const MACRO_KEYS = ['ATK', 'TEC', 'RES', 'DEF', 'FUE', 'VEL'] as const;
const POSITION_RATING_KEYS = [
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
] as const;

type MacroKey = (typeof MACRO_KEYS)[number];

interface StatusBadge {
  key: string;
  label: string;
  className: string;
  title: string;
}

const STATUS_BADGES: StatusBadge[] = [
  { key: 'national', label: '🌍', className: 'badge', title: 'Seleccionado Nacional' },
  { key: 'legend', label: '★', className: 'badge legend', title: 'Jugador Leyenda' },
  { key: 'ml', label: 'ML', className: 'badge ml', title: 'Jugador ML' },
  {
    key: 'anfpes',
    label: 'ANFPES',
    className: 'badge anfpes',
    title: 'Afiliado a la ANFPES',
  },
];

type SimilarSortKey = keyof DerivedPlayer | 'SIMILARITY';
interface SimilarSortConfig {
  key: SimilarSortKey;
  direction: SortDirection;
}

function getStatusBadges(player: DerivedPlayer): StatusBadge[] {
  const selectionValue = formatSelectionDisplay(player['nro selección'] as string);
  const classicValue = formatSelectionDisplay(player['nro clasico'] as string);
  const playerName = String(player.NOMBRE ?? '').trim();
  const rawClub = String(player.CLUB ?? '').trim();

  const hasNationalTeam = selectionValue !== 'No';
  const isLegend = classicValue !== 'No' || LEGEND_PLAYERS.has(playerName);
  const isMLPlayer = ML_PLAYERS.has(playerName);
  const isAnfpes = ANFPES_CLUBS.has(rawClub);

  return STATUS_BADGES.filter((badge) => {
    if (badge.key === 'national') return hasNationalTeam;
    if (badge.key === 'legend') return isLegend;
    if (badge.key === 'ml') return isMLPlayer;
    if (badge.key === 'anfpes') return isAnfpes;
    return false;
  });
}

function getPrimaryPositionBadge(player: DerivedPlayer) {
  const positions = getPlayerPositions(player);
  if (!positions.length) return null;
  const primary = positions[0];
  const line = getPositionLine(primary);
  return { position: primary, line };
}

interface SimilarEntry {
  player: DerivedPlayer;
  similarity: number;
  macroDistance: number;
  positionDistance: number | null;
  isBase?: boolean;
}

export function SimilarPlayersModule() {
  const players = useCacheStore((state) => state.players);
  const selectedId = useCacheStore((state) => state.selectedPlayerId);
  const setSelectedPlayer = useCacheStore((state) => state.setSelectedPlayer);

  // All state from store
  const basePlayerId = useSimilarPlayersStore((state) => state.basePlayerId);
  const setBasePlayerId = useSimilarPlayersStore((state) => state.setBasePlayerId);
  const macroSelection = useSimilarPlayersStore((state) => state.macroSelection);
  const setMacroSelection = useSimilarPlayersStore((state) => state.setMacroSelection);
  const mode = useSimilarPlayersStore((state) => state.mode);
  const setMode = useSimilarPlayersStore((state) => state.setMode);
  const minSimilarity = useSimilarPlayersStore((state) => state.minSimilarity);
  const setMinSimilarity = useSimilarPlayersStore((state) => state.setMinSimilarity);
  const includePositions = useSimilarPlayersStore((state) => state.includePositions);
  const setIncludePositions = useSimilarPlayersStore(
    (state) => state.setIncludePositions,
  );
  const manualLookup = useSimilarPlayersStore((state) => state.manualLookup);
  const setManualLookup = useSimilarPlayersStore((state) => state.setManualLookup);
  const lookupError = useSimilarPlayersStore((state) => state.lookupError);
  const setLookupError = useSimilarPlayersStore((state) => state.setLookupError);
  const columnsMenuOpen = useSimilarPlayersStore((state) => state.columnsMenuOpen);
  const setColumnsMenuOpen = useSimilarPlayersStore((state) => state.setColumnsMenuOpen);
  const sortConfig = useSimilarPlayersStore((state) => state.sortConfig);
  const setSortConfig = useSimilarPlayersStore((state) => state.setSortConfig);
  const visibleColumns = useSimilarPlayersStore((state) => state.visibleColumns);
  const setVisibleColumns = useSimilarPlayersStore((state) => state.setVisibleColumns);
  const filtersOpen = useSimilarPlayersStore((state) => state.filtersOpen);
  const setFiltersOpen = useSimilarPlayersStore((state) => state.setFiltersOpen);
  const filters = useSimilarPlayersStore((state) => state.filters);
  const setFilters = useSimilarPlayersStore((state) => state.setFilters);
  const positionsFilter = useSimilarPlayersStore((state) => state.positionsFilter);
  const setPositionsFilter = useSimilarPlayersStore((state) => state.setPositionsFilter);

  const basePlayer = useMemo(() => {
    if (!players || !basePlayerId) return undefined;
    return players.find((player) => String(player.ID) === String(basePlayerId));
  }, [players, basePlayerId]);

  const sortedVisibleColumns = useMemo(
    () => getSortedColumns(visibleColumns),
    [visibleColumns],
  );
  const activeMacroKeys = useMemo(
    () => MACRO_KEYS.filter((key) => macroSelection[key]),
    [macroSelection],
  );
  const fieldOptions = useMemo(() => {
    if (!players || !players.length) {
      return [];
    }

    const options: Array<{ value: string; label: string; isGroup?: boolean }> = [];

    FIELD_GROUPS.forEach((group) => {
      options.push({
        value: `__group_${group.label}`,
        label: group.label,
        isGroup: true,
      });

      group.fields.forEach((field) => {
        if (shouldDisplayField(field) && field !== 'POSICIONES') {
          options.push({
            value: field,
            label: getFieldLabel(field),
          });
        }
      });
    });

    return options;
  }, [players]);

  const fieldValueOptions = useMemo(() => {
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

  const handleAddFilter = () => {
    if (!fieldOptions.length) {
      return;
    }
    const firstValid = fieldOptions.find((option) => !option.isGroup);
    if (!firstValid) {
      return;
    }
    const newFilter: FilterCondition = {
      id: crypto.randomUUID(),
      field: firstValid.value,
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

  const handleTogglePosition = (code: string) => {
    togglePosition(code, setPositionsFilter);
  };

  const similarEntries = useMemo<SimilarEntry[]>(() => {
    if (!players || !basePlayer || activeMacroKeys.length === 0) {
      return [];
    }

    const baseMacroVector = buildVector(basePlayer, activeMacroKeys);
    const basePositionVector = includePositions
      ? buildVector(basePlayer, POSITION_RATING_KEYS)
      : null;

    const filteredCandidates = players.filter((candidate) => {
      if (candidate.ID === basePlayer.ID) {
        return false;
      }
      if (
        filters.length &&
        !filters.every((filter) => evaluateFilter(filter, candidate))
      ) {
        return false;
      }
      if (!matchesPositions(candidate, positionsFilter)) {
        return false;
      }
      return true;
    });

    return filteredCandidates
      .map((candidate) => {
        const candidateMacroVector = buildVector(candidate, activeMacroKeys);
        const macroDistance =
          mode === 'proportional'
            ? scaledProportionalDistance(baseMacroVector, candidateMacroVector)
            : directDistance(baseMacroVector, candidateMacroVector);

        let positionDistance: number | null = null;
        if (includePositions && basePositionVector) {
          const candidatePositionVector = buildVector(candidate, POSITION_RATING_KEYS);
          positionDistance =
            mode === 'proportional'
              ? scaledProportionalDistance(basePositionVector, candidatePositionVector)
              : directDistance(basePositionVector, candidatePositionVector);
        }

        const combinedDistance =
          includePositions && positionDistance !== null
            ? clamp01((macroDistance + positionDistance) / 2)
            : macroDistance;

        const similarity = Math.round((1 - combinedDistance) * 100);

        return {
          player: candidate,
          similarity,
          macroDistance,
          positionDistance,
        };
      })
      .filter((entry) => entry.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 200);
  }, [
    players,
    basePlayer,
    activeMacroKeys,
    includePositions,
    mode,
    minSimilarity,
    filters,
    positionsFilter,
  ]);
  const sortedSimilarEntries = useMemo(() => {
    if (!similarEntries.length) {
      return similarEntries;
    }
    const rows = [...similarEntries];
    const activeSorts = sortConfig.length
      ? sortConfig
      : ([
          { key: 'SIMILARITY', direction: 'desc' as SortDirection },
        ] as SimilarSortConfig[]);

    rows.sort((a, b) => {
      for (const sort of activeSorts) {
        let comparison = 0;
        if (sort.key === 'SIMILARITY') {
          comparison = a.similarity - b.similarity;
        } else {
          const aValue = a.player[sort.key];
          const bValue = b.player[sort.key];

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
          } else {
            const aStr = String(aValue ?? '');
            const bStr = String(bValue ?? '');
            comparison = aStr.localeCompare(bStr, 'es');
          }
        }

        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });

    return rows;
  }, [similarEntries, sortConfig]);

  const tableRows = useMemo(() => {
    if (!basePlayer) return [];
    return [
      {
        player: basePlayer,
        similarity: 100,
        macroDistance: 0,
        positionDistance: 0,
        isBase: true,
      },
      ...sortedSimilarEntries,
    ];
  }, [basePlayer, sortedSimilarEntries]);

  const handleMacroToggle = (key: MacroKey) => {
    setMacroSelection((prev) => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (prev[key] && activeCount === 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const handleSort = (key: SimilarSortKey, multi: boolean) => {
    setSortConfig((current) => {
      if (multi) {
        const existing = current.find((s) => s.key === key);
        if (existing) {
          if (existing.direction === 'desc') {
            return current.map((s) =>
              s.key === key ? { ...s, direction: 'asc' as SortDirection } : s,
            );
          }
          return current.filter((s) => s.key !== key);
        }
        return [...current, { key, direction: 'desc' as SortDirection }];
      }
      const existing = current.find((s) => s.key === key);
      if (existing && existing.direction === 'desc') {
        return [{ key, direction: 'asc' as SortDirection }];
      }
      if (existing && existing.direction === 'asc') {
        return [];
      }
      return [{ key, direction: 'desc' as SortDirection }];
    });
  };

  const toggleColumn = (field: string) => {
    setVisibleColumns((current) => {
      const next = new Set(current);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const handleManualLookup = (event: React.FormEvent) => {
    event.preventDefault();
    setLookupError('');
    if (!players || !manualLookup.trim()) return;
    const query = manualLookup.trim().toLowerCase();
    const byId = players.find((player) => String(player.ID).toLowerCase() === query);
    if (byId) {
      setBasePlayerId(byId.ID as string);
      setManualLookup('');
      return;
    }
    const byName = players.find((player) =>
      String(player.NOMBRE).toLowerCase().includes(query),
    );
    if (byName) {
      setBasePlayerId(byName.ID as string);
      setManualLookup('');
      return;
    }
    setLookupError('No se encontró un jugador con esos datos');
  };

  const handleClearBase = () => {
    setBasePlayerId(null);
  };

  const baseStatusBadges = basePlayer ? getStatusBadges(basePlayer) : [];
  const similaritySortConfig = sortConfig.find((config) => config.key === 'SIMILARITY');
  const basePrimaryPosition = basePlayer ? getPrimaryPositionBadge(basePlayer) : null;
  const baseFlagPath = basePlayer
    ? getFlagImagePath(basePlayer.NACIONALIDAD as string)
    : null;
  const baseShieldPath = basePlayer ? getClubShieldPath(basePlayer.CLUB as string) : null;
  const baseClubDisplay = basePlayer
    ? formatClub(basePlayer.CLUB as string, basePlayer.NACIONALIDAD as string)
    : '';
  const basePromedioValue =
    basePlayer && typeof basePlayer.PROMEDIO === 'number' ? basePlayer.PROMEDIO : null;
  const basePromedioText = basePromedioValue !== null ? basePromedioValue : '-';
  const basePromedioColor =
    basePromedioValue !== null ? getStatColor(basePromedioValue) : undefined;

  return (
    <section className="module-stack similar-module">
      <div className="card similar-setup-card">
        <div className="similar-base-grid">
          <div className="base-slot">
            {basePlayer ? (
              <div className="base-player-card">
                <div className="base-player-info">
                  <div className="base-player-row name-row">
                    <strong className="base-player-name">
                      {basePlayer.NOMBRE as string}
                    </strong>
                    <span className="player-badges">
                      {baseStatusBadges.map((badge) => (
                        <EnhancedTooltip key={badge.key} content={badge.title}>
                          <span className={badge.className}>{badge.label}</span>
                        </EnhancedTooltip>
                      ))}
                    </span>
                  </div>
                  <div className="base-player-row meta-row">
                    <div className="base-player-icons">
                      {baseFlagPath && (
                        <EnhancedTooltip content={basePlayer.NACIONALIDAD as string}>
                          <img src={baseFlagPath} alt="" className="flag-icon" />
                        </EnhancedTooltip>
                      )}
                      {baseShieldPath && (
                        <EnhancedTooltip content={baseClubDisplay}>
                          <img src={baseShieldPath} alt="" className="club-shield" />
                        </EnhancedTooltip>
                      )}
                    </div>
                    <span
                      className="base-player-rating"
                      style={{ color: basePromedioColor || undefined }}
                    >
                      {basePromedioText}
                    </span>
                    {basePrimaryPosition && (
                      <span
                        className={`position-badge position-${basePrimaryPosition.line} primary`}
                      >
                        {basePrimaryPosition.position}
                      </span>
                    )}
                  </div>
                </div>
                <div className="base-player-actions">
                  <button
                    type="button"
                    className="secondary-button ghost"
                    onClick={handleClearBase}
                  >
                    Limpiar base
                  </button>
                </div>
              </div>
            ) : (
              <div className="manual-lookup-panel compact">
                <p>Indica un jugador para establecerlo como referencia.</p>
                <form className="manual-lookup-form" onSubmit={handleManualLookup}>
                  <input
                    type="text"
                    placeholder="ID o nombre del jugador"
                    value={manualLookup}
                    onChange={(event) => setManualLookup(event.target.value)}
                  />
                  <button type="submit" className="primary-button">
                    Establecer base
                  </button>
                </form>
                {lookupError && <p className="error">{lookupError}</p>}
              </div>
            )}
          </div>

          <div className="control-block stack-block chip-panel">
            <EnhancedTooltip content="Activa o desactiva los macrostats que se cruzan en la comparación.">
              <p className="control-title">Macrostats comparados</p>
            </EnhancedTooltip>
            <div className="macro-pill-group compact macro-pill-grid">
              {MACRO_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`macro-pill ${macroSelection[key] ? 'active' : ''}`}
                  onClick={() => handleMacroToggle(key)}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="control-block stack-block">
            <EnhancedTooltip content="Define si la similitud se basa en proporciones o en valores absolutos.">
              <p className="control-title">Modo</p>
            </EnhancedTooltip>
            <div className="toggle-pill-group">
              <button
                type="button"
                className={`toggle-pill ${mode === 'proportional' ? 'active' : ''}`}
                onClick={() => setMode('proportional')}
                aria-pressed={mode === 'proportional'}
              >
                Proporcional
              </button>
              <button
                type="button"
                className={`toggle-pill ${mode === 'direct' ? 'active' : ''}`}
                onClick={() => setMode('direct')}
                aria-pressed={mode === 'direct'}
              >
                Directa
              </button>
            </div>
          </div>

          <div className="control-block stack-block">
            <EnhancedTooltip content="Incluye los promedios por posición dentro del cálculo de similitud.">
              <p className="control-title">Promedios</p>
            </EnhancedTooltip>
            <div className="toggle-pill-group">
              <button
                type="button"
                className={`toggle-pill ${includePositions ? 'active' : ''}`}
                onClick={() => setIncludePositions((prev) => !prev)}
                aria-pressed={includePositions}
              >
                Usar promedios
              </button>
            </div>
          </div>

          <div className="control-block slider-chip">
            <EnhancedTooltip content="Establece el porcentaje mínimo requerido para mostrar coincidencias.">
              <p className="control-title">Porcentaje de similitud</p>
            </EnhancedTooltip>
            <div className="slider-row">
              <span className="slider-value">{minSimilarity}%</span>
              <input
                id="similarity-slider"
                type="range"
                min={50}
                max={100}
                step={1}
                value={minSimilarity}
                onChange={(event) => setMinSimilarity(Number(event.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card similar-results-card">
        <header className="card-header compact-header">
          <div>
            <h2>Resultados</h2>
            <p className="muted">
              {similarEntries.length} jugadores con al menos {minSimilarity}% de
              similitud.
            </p>
          </div>
          <div className="search-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setFiltersOpen((prev) => !prev)}
            >
              Filtros
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setColumnsMenuOpen((prev) => !prev)}
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

        {filtersOpen && (
          <FiltersPanel
            filters={filters}
            positionsFilter={positionsFilter}
            fieldOptions={fieldOptions}
            fieldValueOptions={fieldValueOptions}
            onAddFilter={handleAddFilter}
            onUpdateFilter={handleUpdateFilter}
            onRemoveFilter={handleRemoveFilter}
            onTogglePosition={handleTogglePosition}
          />
        )}

        {columnsMenuOpen && (
          <div className="columns-menu">
            <h4>Columnas visibles ({visibleColumns.size})</h4>
            {FIELD_GROUPS.map((group) => {
              const excluded = new Set(['ANFPES']);
              const fields = group.fields.filter(
                (field) => shouldDisplayField(field) && !excluded.has(field),
              );
              if (!fields.length) return null;
              return (
                <div key={group.label} className="column-group">
                  <div className="column-group-header">{group.label}</div>
                  {fields.map((field) => (
                    <label key={field} className="column-option">
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(field)}
                        onChange={() => toggleColumn(field)}
                      />
                      <span>{getFieldLabel(field)}</span>
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {!basePlayer && (
          <p className="muted">Selecciona un jugador base para ver recomendaciones.</p>
        )}

        {basePlayer && (
          <div className="table-container">
            <table className="player-table similar-table">
              <thead className="sticky-header">
                <tr>
                  <th
                    className="similarity-column sortable"
                    onClick={(e) => handleSort('SIMILARITY', e.shiftKey)}
                  >
                    <EnhancedTooltip content="Porcentaje de similitud respecto al jugador base.">
                      <div className="th-content">
                        <span>
                          <strong>%</strong>
                        </span>
                        {similaritySortConfig && (
                          <span className="sort-indicator">
                            {similaritySortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </EnhancedTooltip>
                  </th>
                  {sortedVisibleColumns.map((column) => {
                    const headerLabel = getTableHeaderLabel(column);
                    const isImageColumn = column === 'NACIONALIDAD' || column === 'CLUB';
                    const isPositionsColumn = column === 'POSICIONES';
                    const columnType = getColumnType(column);
                    const headerClasses = ['sortable'];
                    if (isImageColumn) headerClasses.push('image-header');
                    if (isPositionsColumn) headerClasses.push('positions-header');
                    if (column === 'NACIONALIDAD')
                      headerClasses.push('nationality-column');
                    if (column === 'CLUB') headerClasses.push('club-column');
                    if (column === 'NOMBRE') headerClasses.push('player-name-header');

                    const sortIndex = sortConfig.findIndex(
                      (s) => s.key === (column as keyof DerivedPlayer),
                    );
                    const sortDir =
                      sortIndex >= 0 ? sortConfig[sortIndex].direction : null;

                    return (
                      <th
                        key={column}
                        className={headerClasses.join(' ')}
                        data-type={columnType}
                        onClick={(e) =>
                          handleSort(column as keyof DerivedPlayer, e.shiftKey)
                        }
                      >
                        <div className="th-content">
                          <GlossaryTooltip fieldName={column}>
                            <span>{headerLabel}</span>
                          </GlossaryTooltip>
                          {sortDir && (
                            <span className="sort-indicator">
                              {sortDir === 'asc' ? '↑' : '↓'}
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
                {tableRows.map(({ player, similarity, isBase }, index) => {
                  const rowClasses = ['similar-row'];
                  if (player.ID === selectedId) {
                    rowClasses.push('selected');
                  }
                  if (isBase) {
                    rowClasses.push('similar-base-row');
                  }

                  return (
                    <Fragment
                      key={`${player.ID}-${isBase ? 'base' : `similar-${index}`}`}
                    >
                      <tr
                        data-player-id={player.ID}
                        className={rowClasses.join(' ')}
                        onClick={() => setSelectedPlayer(player.ID as string)}
                      >
                        <td className="similarity-column">
                          <span className={`similarity-badge ${isBase ? 'base' : ''}`}>
                            {similarity}%
                          </span>
                        </td>
                        {sortedVisibleColumns.map((column) => {
                          if (column === 'NOMBRE') {
                            const rowStatusBadges = getStatusBadges(player);
                            const thumbPath = getPlayerThumbPath(player.ID);
                            return (
                              <td key={column} className="player-name-cell">
                                <div className="player-name-with-thumb">
                                  <img
                                    src={thumbPath}
                                    alt=""
                                    className="player-thumb"
                                    loading="lazy"
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                      // Detectar si es una leyenda (prefijo L-) para usar Legend.png
                                      const isLegend = img.src.includes('/L-');
                                      const fallbackSrc = isLegend
                                        ? '/images/thumbs/Legend.png'
                                        : '/images/thumbs/missing.png';
                                      if (img.src !== fallbackSrc) {
                                        img.src = fallbackSrc;
                                      }
                                    }}
                                  />
                                  <div className="player-name-content">
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
                                      {rowStatusBadges.length > 0 && (
                                        <span className="player-badges">
                                          {rowStatusBadges.map((badge) => (
                                            <EnhancedTooltip
                                              key={badge.key}
                                              content={badge.title}
                                            >
                                              <span className={badge.className}>
                                                {badge.label}
                                              </span>
                                            </EnhancedTooltip>
                                          ))}
                                        </span>
                                      )}
                                    </div>
                                  </div>
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
                              <td key={column} className="image-cell nationality-column">
                                {flagPath && (
                                  <EnhancedTooltip content={displayName}>
                                    <img src={flagPath} alt="" className="flag-icon" />
                                  </EnhancedTooltip>
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
                              <td key={column} className="image-cell club-column">
                                {shieldPath ? (
                                  <EnhancedTooltip content={clubDisplay}>
                                    <img
                                      src={shieldPath}
                                      alt=""
                                      className="club-shield"
                                    />
                                  </EnhancedTooltip>
                                ) : (
                                  <EnhancedTooltip content={clubDisplay}>
                                    <span className="club-icon">⚽</span>
                                  </EnhancedTooltip>
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
                      {isBase && tableRows.length > 1 && (
                        <tr className="similar-divider-row">
                          <td colSpan={sortedVisibleColumns.length + 1}>
                            Resultados similares
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function buildVector(player: DerivedPlayer, keys: readonly string[]) {
  return keys.map((key) => {
    const raw = player[key as keyof DerivedPlayer];
    return typeof raw === 'number' ? raw : Number(raw) || 0;
  });
}

function scaledProportionalDistance(base: number[], candidate: number[]) {
  if (!base.length || !candidate.length) return 1;
  const numerator = candidate.reduce((acc, value, index) => acc + value * base[index], 0);
  const denominator = candidate.reduce((acc, value) => acc + value * value, 0);
  const scale = denominator === 0 ? 1 : numerator / denominator;

  const delta =
    base.reduce((acc, baseValue, index) => {
      const scaledCandidate = candidate[index] * scale;
      const reference = Math.max(Math.abs(baseValue), 1);
      return acc + Math.abs(scaledCandidate - baseValue) / reference;
    }, 0) / base.length;

  return clamp01(delta);
}

function directDistance(a: number[], b: number[]) {
  if (!a.length || !b.length) return 1;
  const delta =
    a.reduce((acc, value, index) => acc + Math.abs(value - b[index]) / 99, 0) / a.length;
  return clamp01(delta);
}

function clamp01(value: number) {
  if (Number.isNaN(value)) return 1;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function getColumnType(column: string) {
  const ratingColumns = new Set(['PROMEDIO', 'MEJOR PROMEDIO', ...POSITION_RATING_KEYS]);
  const statColumns = new Set([
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
    'ATK',
    'TEC',
    'RES',
    'DEF',
    'FUE',
    'VEL',
  ]);

  if (ratingColumns.has(column)) return 'rating';
  if (statColumns.has(column)) return 'stat';
  if (column === 'TOLERANCIA LESIONES') return 'injury';
  return 'text';
}
