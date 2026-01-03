import type { DerivedPlayer } from '@anfpes/engine';
import React, { useEffect, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { useCacheStore } from '../store/cacheStore';
import { usePreselectionStore } from '../store/preselectionStore';
import { usePreselectionViewStore } from '../store/preselectionViewStore';
import {
  DEFAULT_TABLE_COLUMNS,
  FIELD_GROUPS,
  getTableHeaderLabel,
  getSortedColumns,
} from '../constants/playerFields';
import { type SortConfig } from '../types/table';
import { TableCell } from '../components/TableCell';
import { PositionBadges, getPlayerPositions } from '../components/PositionBadges';
import { GlossaryTooltip } from '../components/GlossaryTooltip';
import { EnhancedTooltip } from '../components/EnhancedTooltip';
import {
  formatClub,
  formatSelectionDisplay,
  getFieldLabel,
  shouldDisplayField,
} from '../utils/playerDisplay';
import { getNationalityInfo } from '../data/nationalities';
import {
  getFlagImagePath,
  getClubShieldPath,
  getPlayerThumbPath,
} from '../utils/imageHelpers';
import { ANFPES_CLUBS, LEGEND_PLAYERS, ML_PLAYERS } from '../data/playerStatus';
import {
  openPlayerActionsMenu,
  closePlayerActionsMenu,
} from '../components/PlayerActionsOverlay';

const POSITION_SORT_ORDER = [
  'PT',
  'LIB',
  'CT',
  'SA',
  'DD',
  'DI',
  'CCD',
  'LA',
  'DLD',
  'DLI',
  'CC',
  'VOL',
  'CDR',
  'CIZ',
  'MP',
  'SD',
  'EX',
  'ED',
  'EI',
  'DC',
] as const;

function comparePositions(a: DerivedPlayer, b: DerivedPlayer): number {
  const rank = (pos?: string) => {
    const idx = POSITION_SORT_ORDER.indexOf(pos as any);
    return idx === -1 ? POSITION_SORT_ORDER.length : idx;
  };
  const aPositions = getPlayerPositions(a);
  const bPositions = getPlayerPositions(b);

  const primaryCmp = rank(aPositions[0]) - rank(bPositions[0]);
  if (primaryCmp !== 0) return primaryCmp;

  const aSecondary = aPositions
    .slice(1)
    .map(rank)
    .sort((x, y) => x - y);
  const bSecondary = bPositions
    .slice(1)
    .map(rank)
    .sort((x, y) => x - y);

  if (aSecondary.length !== bSecondary.length) {
    return aSecondary.length - bSecondary.length;
  }

  for (let i = 0; i < aSecondary.length; i += 1) {
    const diff = aSecondary[i] - bSecondary[i];
    if (diff !== 0) return diff;
  }

  return 0;
}

export function PreselectionModule() {
  const players = useCacheStore((state) => state.players);
  const selectedId = useCacheStore((state) => state.selectedPlayerId);
  const setSelectedPlayer = useCacheStore((state) => state.setSelectedPlayer);

  const preselections = usePreselectionStore((state) => state.preselections);
  const getPlayersInPreselection = usePreselectionStore(
    (state) => state.getPlayersInPreselection,
  );
  const removePlayersFromPreselection = usePreselectionStore(
    (state) => state.removePlayersFromPreselection,
  );
  const deletePreselection = usePreselectionStore((state) => state.deletePreselection);
  const renamePreselection = usePreselectionStore((state) => state.renamePreselection);
  const setPlayerNote = usePreselectionStore((state) => state.setPlayerNote);
  const addPlayerTag = usePreselectionStore((state) => state.addPlayerTag);
  const removePlayerTag = usePreselectionStore((state) => state.removePlayerTag);
  const availableTags = usePreselectionStore((state) => state.availableTags);
  const selectedPlayerIds = usePreselectionStore((state) => state.selectedPlayerIds);
  const selectPlayer = usePreselectionStore((state) => state.selectPlayer);
  const deselectPlayer = usePreselectionStore((state) => state.deselectPlayer);
  const selectAllPlayers = usePreselectionStore((state) => state.selectAllPlayers);
  const clearSelection = usePreselectionStore((state) => state.clearSelection);

  // View state from store
  const activePreselectionId = usePreselectionViewStore(
    (state) => state.activePreselectionId,
  );
  const setActivePreselectionId = usePreselectionViewStore(
    (state) => state.setActivePreselectionId,
  );
  const sortConfig = usePreselectionViewStore((state) => state.sortConfig);
  const setSortConfig = usePreselectionViewStore((state) => state.setSortConfig);
  const visibleColumns = usePreselectionViewStore((state) => state.visibleColumns);
  const setVisibleColumns = usePreselectionViewStore((state) => state.setVisibleColumns);
  const columnsMenuOpen = usePreselectionViewStore((state) => state.columnsMenuOpen);
  const setColumnsMenuOpen = usePreselectionViewStore(
    (state) => state.setColumnsMenuOpen,
  );
  const currentPage = usePreselectionViewStore((state) => state.currentPage);
  const setCurrentPage = usePreselectionViewStore((state) => state.setCurrentPage);
  const filterByTags = usePreselectionViewStore((state) => state.filterByTags);
  const setFilterByTags = usePreselectionViewStore((state) => state.setFilterByTags);
  const editingNoteForPlayer = usePreselectionViewStore(
    (state) => state.editingNoteForPlayer,
  );
  const setEditingNoteForPlayer = usePreselectionViewStore(
    (state) => state.setEditingNoteForPlayer,
  );
  const noteText = usePreselectionViewStore((state) => state.noteText);
  const setNoteText = usePreselectionViewStore((state) => state.setNoteText);
  const managingTagsForPlayer = usePreselectionViewStore(
    (state) => state.managingTagsForPlayer,
  );
  const setManagingTagsForPlayer = usePreselectionViewStore(
    (state) => state.setManagingTagsForPlayer,
  );

  const itemsPerPage = 50;

  // Columnas visibles ordenadas según FIELD_ORDER
  const sortedVisibleColumns = useMemo(() => {
    return getSortedColumns(visibleColumns);
  }, [visibleColumns]);

  const activePreselection = preselections.find((p) => p.id === activePreselectionId);
  const playersInPreselection = useMemo(() => {
    if (!activePreselectionId || !players) return [];
    return getPlayersInPreselection(activePreselectionId, players);
  }, [activePreselectionId, players, getPlayersInPreselection, preselections]);

  // Filter by tags
  const filteredPlayers = useMemo(() => {
    if (filterByTags.size === 0 || !activePreselection) return playersInPreselection;

    return playersInPreselection.filter((player) => {
      const playerTags = activePreselection.tags[player.ID] || [];
      // Player must have at least one of the selected tags
      return playerTags.some((tagId) => filterByTags.has(tagId));
    });
  }, [playersInPreselection, filterByTags, activePreselection]);

  // Sort players
  const sortedPlayers = useMemo(() => {
    if (sortConfig.length === 0) return filteredPlayers;

    return [...filteredPlayers].sort((a, b) => {
      for (const sort of sortConfig) {
        // Special sorting for ACCIONES tag priority
        if (sort.key === 'ACCIONES') {
          const getTagPriority = (tagId: string | null | undefined): number => {
            if (!tagId) return 5; // No tag = lowest priority
            // Los IDs de los tags son: 'priority', 'backup', 'observe', 'discard'
            if (tagId === 'priority') return 1; // Prioridad
            if (tagId === 'backup') return 2; // Backup
            if (tagId === 'observe') return 3; // Observar
            if (tagId === 'discard') return 4; // Descartado
            return 5; // Unknown tag
          };

          // tags es un Record<string, string[]>, acceder correctamente
          const aTags = activePreselection?.tags[a.ID];
          const bTags = activePreselection?.tags[b.ID];
          const aTag = aTags && aTags.length > 0 ? aTags[0] : null;
          const bTag = bTags && bTags.length > 0 ? bTags[0] : null;

          const comparison = getTagPriority(aTag) - getTagPriority(bTag);

          if (comparison !== 0) {
            // Invertir la dirección: asc muestra Priority primero (arriba)
            return sort.direction === 'asc' ? comparison : -comparison;
          }
          continue;
        }

        if (sort.key === 'POSICIONES') {
          const comparison = comparePositions(a, b);
          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison;
          }
          continue;
        }

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
  }, [filteredPlayers, sortConfig, activePreselection]);

  const totalPages = Math.ceil(sortedPlayers.length / itemsPerPage);
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedPlayers.slice(start, start + itemsPerPage);
  }, [sortedPlayers, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
    setFilterByTags(new Set());
  }, [activePreselectionId]);

  useEffect(() => {
    if (preselections.length > 0 && !activePreselectionId) {
      setActivePreselectionId(preselections[0].id);
    }
  }, [preselections, activePreselectionId]);

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
        const initialDir = key === 'POSICIONES' ? 'asc' : 'desc';
        return [...current, { key, direction: initialDir }];
      }
      const existing = current.find((s) => s.key === key);
      if (existing && existing.direction === 'desc') {
        return [{ key, direction: 'asc' }];
      }
      if (existing && existing.direction === 'asc') {
        return [];
      }
      // ACCIONES empieza con 'asc' para mostrar Priority primero
      const initialDir = key === 'POSICIONES' || key === 'ACCIONES' ? 'asc' : 'desc';
      return [{ key, direction: initialDir }];
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
    if (
      players &&
      players[0] &&
      typeof players[0][field as keyof DerivedPlayer] === 'number'
    ) {
      return 'stat';
    }
    return 'text';
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

  const handleRemoveSelected = () => {
    if (selectedPlayerIds.size === 0) return;

    removePlayersFromPreselection(activePreselectionId, Array.from(selectedPlayerIds));
    clearSelection();
    closePlayerActionsMenu();
  };

  const handleDeletePreselection = () => {
    if (activePreselection?.id === 'general') {
      alert('No puedes eliminar la Preselección General');
      return;
    }

    const confirmed = confirm(
      `¿Estás seguro de que quieres eliminar la preselección "${activePreselection?.name}"?`,
    );

    if (confirmed) {
      deletePreselection(activePreselectionId);
      setActivePreselectionId(preselections[0]?.id || '');
    }
  };

  const handleRenamePreselection = () => {
    const newName = prompt('Nuevo nombre:', activePreselection?.name);
    if (newName && newName.trim()) {
      renamePreselection(activePreselectionId, newName.trim());
    }
  };

  const handleSaveNote = (playerId: string) => {
    setPlayerNote(activePreselectionId, playerId, noteText);
    setEditingNoteForPlayer(null);
    setNoteText('');
  };

  const handleStartEditingNote = (playerId: string, currentNote?: string) => {
    setEditingNoteForPlayer(playerId);
    setNoteText(currentNote || '');
  };

  const handleToggleTag = (playerId: string, tagId: string) => {
    const playerTags = activePreselection?.tags[playerId] || [];
    if (playerTags.includes(tagId)) {
      removePlayerTag(activePreselectionId, playerId, tagId);
    } else {
      addPlayerTag(activePreselectionId, playerId, tagId);
    }
  };

  const handleToggleTagFilter = (tagId: string) => {
    setFilterByTags((current) => {
      const next = new Set(current);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  if (preselections.length === 0) {
    return (
      <section className="module-section">
        <p className="muted">
          No hay preselecciones. Agrega jugadores desde el buscador.
        </p>
      </section>
    );
  }

  return (
    <section className="module-section">
      {/* Tabs for preselections */}
      <div className="preselection-tabs">
        {preselections.map((ps) => (
          <button
            key={ps.id}
            type="button"
            className={`preselection-tab${ps.id === activePreselectionId ? ' active' : ''}`}
            onClick={() => setActivePreselectionId(ps.id)}
          >
            {ps.name}
            <span className="tab-count">({ps.playerIds.length})</span>
          </button>
        ))}
      </div>

      {activePreselection && (
        <>
          <div className="preselection-toolbar">
            <div className="toolbar-left">
              <EnhancedTooltip content="Seleccionar columnas">
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setColumnsMenuOpen(!columnsMenuOpen)}
                >
                  ⚙️
                </button>
              </EnhancedTooltip>

              <EnhancedTooltip content="Renombrar preselección">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleRenamePreselection}
                >
                  ✏️ Renombrar
                </button>
              </EnhancedTooltip>

              {activePreselection.id !== 'general' && (
                <EnhancedTooltip content="Eliminar preselección">
                  <button
                    type="button"
                    className="secondary-button danger"
                    onClick={handleDeletePreselection}
                  >
                    🗑️ Eliminar
                  </button>
                </EnhancedTooltip>
              )}

              {/* Tag filters inline */}
              {availableTags.length > 0 && (
                <>
                  <span className="toolbar-separator">│</span>
                  <span className="toolbar-label">Filtrar:</span>
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className={`tag-filter-button${filterByTags.has(tag.id) ? ' active' : ''}`}
                      style={{
                        borderColor: tag.color,
                        backgroundColor: filterByTags.has(tag.id)
                          ? tag.color
                          : 'transparent',
                        color: filterByTags.has(tag.id) ? 'white' : tag.color,
                      }}
                      onClick={() => handleToggleTagFilter(tag.id)}
                    >
                      {tag.label}
                    </button>
                  ))}
                  {filterByTags.size > 0 && (
                    <EnhancedTooltip content="Limpiar filtros">
                      <button
                        type="button"
                        className="tag-filter-clear"
                        onClick={() => setFilterByTags(new Set())}
                      >
                        ✕ Limpiar
                      </button>
                    </EnhancedTooltip>
                  )}
                </>
              )}
            </div>

            <div className="toolbar-right">
              {selectedPlayerIds.size > 0 && (
                <button
                  type="button"
                  className="secondary-button danger"
                  onClick={handleRemoveSelected}
                >
                  Quitar {selectedPlayerIds.size} seleccionado
                  {selectedPlayerIds.size > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>

          <div className="search-toolbar">
            <div className="search-info">
              <span>
                <strong>{sortedPlayers.length}</strong> jugadores en esta preselección
                {totalPages > 1 && ` (página ${currentPage} de ${totalPages})`}
              </span>
            </div>
            {totalPages > 1 && (
              <div className="pagination-inline">
                <EnhancedTooltip content="Página anterior">
                  <button
                    type="button"
                    className="pagination-button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    ←
                  </button>
                </EnhancedTooltip>
                <EnhancedTooltip content="Página siguiente">
                  <button
                    type="button"
                    className="pagination-button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    →
                  </button>
                </EnhancedTooltip>
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

          {sortedPlayers.length === 0 ? (
            <p className="muted">
              No hay jugadores en esta preselección. Agrégalos desde el buscador.
            </p>
          ) : (
            <div className="table-container">
              <table className="player-table">
                <thead className="sticky-header">
                  <tr>
                    <th className="checkbox-column">
                      <EnhancedTooltip content="Seleccionar todos los visibles">
                        <input
                          type="checkbox"
                          onChange={handleToggleAllVisible}
                          checked={
                            paginatedResults.length > 0 &&
                            paginatedResults.every((p) => selectedPlayerIds.has(p.ID))
                          }
                        />
                      </EnhancedTooltip>
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
                        >
                          <div className="th-content">
                            {/* Usar EnhancedTooltip simple para promedios de posici\u00f3n y promedios generales */}
                            {[
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
                              'PROMEDIO',
                              'MEJOR PROMEDIO',
                            ].includes(column) ? (
                              <EnhancedTooltip content={headerLabel}>
                                <span>{headerLabel}</span>
                              </EnhancedTooltip>
                            ) : (
                              <GlossaryTooltip fieldName={column}>
                                <span>{headerLabel}</span>
                              </GlossaryTooltip>
                            )}
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
                    <th
                      className="actions-column sortable"
                      onClick={(e) =>
                        handleSort('ACCIONES' as keyof DerivedPlayer, e.shiftKey)
                      }
                    >
                      <div className="th-content">
                        <span>Acciones</span>
                        {sortConfig.findIndex((s) => s.key === 'ACCIONES') >= 0 && (
                          <span className="sort-indicator">
                            {sortConfig.find((s) => s.key === 'ACCIONES')?.direction ===
                            'asc'
                              ? '▲'
                              : '▼'}
                            {sortConfig.length > 1 &&
                              sortConfig.findIndex((s) => s.key === 'ACCIONES') >= 0 && (
                                <sup>
                                  {sortConfig.findIndex((s) => s.key === 'ACCIONES') + 1}
                                </sup>
                              )}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResults.map((player) => {
                    const playerNote = activePreselection.notes[player.ID];
                    const playerTags = activePreselection.tags[player.ID] || [];
                    const isEditingNote = editingNoteForPlayer === player.ID;
                    const isManagingTags = managingTagsForPlayer === player.ID;

                    // Get player's primary tag for row styling
                    const primaryTag =
                      playerTags.length > 0
                        ? availableTags.find((t) => t.id === playerTags[0])
                        : null;

                    return (
                      <React.Fragment key={player.ID}>
                        <tr
                          className={`${player.ID === selectedId ? 'selected' : ''} ${primaryTag ? 'has-tag' : ''}`}
                          style={
                            primaryTag
                              ? {
                                  borderLeft: `4px solid ${primaryTag.color}`,
                                  background: `linear-gradient(90deg, ${primaryTag.color}15 0%, transparent 100%)`,
                                }
                              : undefined
                          }
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
                                player['nro clásico'],
                              );
                              const isLegend =
                                hasClassic !== 'No' || LEGEND_PLAYERS.has(playerName);
                              const isMLPlayer = ML_PLAYERS.has(playerName);
                              const isAnfpes = ANFPES_CLUBS.has(rawClub);
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
                                          <span
                                            className="player-name-text"
                                            style={
                                              primaryTag
                                                ? { color: primaryTag.color }
                                                : undefined
                                            }
                                          >
                                            {player.NOMBRE}
                                          </span>
                                        </button>
                                        <span className="player-badges">
                                          {hasNationalTeam !== 'No' && (
                                            <EnhancedTooltip content="Seleccionado Nacional">
                                              <span className="badge">🌍</span>
                                            </EnhancedTooltip>
                                          )}
                                          {isLegend && (
                                            <EnhancedTooltip content="Jugador Leyenda">
                                              <span className="badge legend">★</span>
                                            </EnhancedTooltip>
                                          )}
                                          {isMLPlayer && (
                                            <EnhancedTooltip content="Jugador ML">
                                              <span className="badge ml">ML</span>
                                            </EnhancedTooltip>
                                          )}
                                          {isAnfpes && (
                                            <EnhancedTooltip content="Afiliado a la ANFPES">
                                              <span className="badge anfpes">ANFPES</span>
                                            </EnhancedTooltip>
                                          )}
                                        </span>
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
                                <td
                                  key={column}
                                  className="image-cell nationality-column"
                                >
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
                                  <EnhancedTooltip content={clubDisplay}>
                                    {shieldPath ? (
                                      <img
                                        src={shieldPath}
                                        alt=""
                                        className="club-shield"
                                      />
                                    ) : (
                                      <span className="club-icon">⚽</span>
                                    )}
                                  </EnhancedTooltip>
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
                          <td
                            className="actions-column"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="action-buttons">
                              <EnhancedTooltip content={playerNote || 'Agregar nota'}>
                                <button
                                  type="button"
                                  className="icon-button small"
                                  onClick={() =>
                                    isEditingNote
                                      ? setEditingNoteForPlayer(null)
                                      : handleStartEditingNote(player.ID, playerNote)
                                  }
                                  data-has-note={!!playerNote}
                                >
                                  {playerNote ? '📝' : '📄'}
                                </button>
                              </EnhancedTooltip>
                              <EnhancedTooltip content="Gestionar etiquetas">
                                <button
                                  type="button"
                                  className={`icon-button small${isManagingTags ? ' active' : ''}`}
                                  onClick={() =>
                                    setManagingTagsForPlayer(
                                      isManagingTags ? null : player.ID,
                                    )
                                  }
                                >
                                  🏷️
                                  {playerTags.length > 0 && (
                                    <span className="tag-count">{playerTags.length}</span>
                                  )}
                                </button>
                              </EnhancedTooltip>
                            </div>
                          </td>
                        </tr>

                        {/* Inline note editor */}
                        {isEditingNote && (
                          <tr className="note-editor-row">
                            <td colSpan={sortedVisibleColumns.length + 2}>
                              <div className="note-editor-inline">
                                <textarea
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                  placeholder="Escribe una nota sobre este jugador..."
                                  rows={2}
                                  autoFocus
                                />
                                <div className="note-editor-actions">
                                  <button
                                    type="button"
                                    className="secondary-button small"
                                    onClick={() => {
                                      setEditingNoteForPlayer(null);
                                      setNoteText('');
                                    }}
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    className="primary-button small"
                                    onClick={() => handleSaveNote(player.ID)}
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Inline tag manager */}
                        {isManagingTags && (
                          <tr className="tag-manager-row">
                            <td colSpan={sortedVisibleColumns.length + 2}>
                              <div className="tag-manager-inline">
                                <span className="tag-manager-label">Etiquetas:</span>
                                <div className="tag-list-inline">
                                  {availableTags.map((tag) => {
                                    const isActive = playerTags.includes(tag.id);
                                    return (
                                      <button
                                        key={tag.id}
                                        type="button"
                                        className={`player-tag-mini${isActive ? ' active' : ''}`}
                                        style={{
                                          borderColor: tag.color,
                                          backgroundColor: isActive
                                            ? tag.color
                                            : 'transparent',
                                          color: isActive ? 'white' : tag.color,
                                        }}
                                        onClick={() => {
                                          // Only allow one tag per player
                                          if (isActive) {
                                            handleToggleTag(player.ID, tag.id);
                                          } else {
                                            // Remove all other tags first
                                            playerTags.forEach(
                                              (existingTagId: string) => {
                                                if (existingTagId !== tag.id) {
                                                  removePlayerTag(
                                                    activePreselection.id,
                                                    player.ID,
                                                    existingTagId,
                                                  );
                                                }
                                              },
                                            );
                                            // Add the new tag
                                            handleToggleTag(player.ID, tag.id);
                                          }
                                        }}
                                      >
                                        {tag.label}
                                      </button>
                                    );
                                  })}
                                </div>
                                <EnhancedTooltip content="Cerrar">
                                  <button
                                    type="button"
                                    className="icon-button small"
                                    onClick={() => setManagingTagsForPlayer(null)}
                                  >
                                    ✓
                                  </button>
                                </EnhancedTooltip>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
