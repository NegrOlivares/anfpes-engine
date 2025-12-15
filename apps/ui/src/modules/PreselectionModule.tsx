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
import { PositionBadges } from '../components/PositionBadges';
import {
  formatClub,
  formatSelectionDisplay,
  getFieldLabel,
  shouldDisplayField,
} from '../utils/playerDisplay';
import { getNationalityInfo } from '../data/nationalities';
import { getFlagImagePath, getClubShieldPath } from '../utils/imageHelpers';
import { ANFPES_CLUBS, LEGEND_PLAYERS, ML_PLAYERS } from '../data/playerStatus';
import {
  openPlayerActionsMenu,
  closePlayerActionsMenu,
} from '../components/PlayerActionsOverlay';

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
  }, [filteredPlayers, sortConfig]);

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
              <button
                type="button"
                className="icon-button"
                onClick={() => setColumnsMenuOpen(!columnsMenuOpen)}
                title="Seleccionar columnas"
              >
                ⚙️
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={handleRenamePreselection}
                title="Renombrar preselección"
              >
                ✏️ Renombrar
              </button>

              {activePreselection.id !== 'general' && (
                <button
                  type="button"
                  className="secondary-button danger"
                  onClick={handleDeletePreselection}
                  title="Eliminar preselección"
                >
                  🗑️ Eliminar
                </button>
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
                    <button
                      type="button"
                      className="tag-filter-clear"
                      onClick={() => setFilterByTags(new Set())}
                      title="Limpiar filtros"
                    >
                      ✕ Limpiar
                    </button>
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
                    <th className="actions-column">Acciones</th>
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
                          <td
                            className="actions-column"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="icon-button small"
                                onClick={() =>
                                  isEditingNote
                                    ? setEditingNoteForPlayer(null)
                                    : handleStartEditingNote(player.ID, playerNote)
                                }
                                title={playerNote || 'Agregar nota'}
                                data-has-note={!!playerNote}
                              >
                                {playerNote ? '📝' : '📄'}
                              </button>
                              <button
                                type="button"
                                className={`icon-button small${isManagingTags ? ' active' : ''}`}
                                onClick={() =>
                                  setManagingTagsForPlayer(
                                    isManagingTags ? null : player.ID,
                                  )
                                }
                                title="Gestionar etiquetas"
                              >
                                🏷️
                                {playerTags.length > 0 && (
                                  <span className="tag-count">{playerTags.length}</span>
                                )}
                              </button>
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
                                <button
                                  type="button"
                                  className="icon-button small"
                                  onClick={() => setManagingTagsForPlayer(null)}
                                  title="Cerrar"
                                >
                                  ✓
                                </button>
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
