import { useState, useMemo } from 'react';
import type { Tactic } from '../types/tactics';
import { ANFPES_CLUBS } from '../data/playerStatus';

interface SavedTacticsLibraryProps {
  tactics: Tactic[];
  currentTacticId?: string;
  onLoad: (tacticId: string) => void;
  onDelete: (tacticId: string) => void;
  onDuplicate: (tacticId: string, newName: string) => void;
  onRename: (tacticId: string, newName: string) => void;
  onClose: () => void;
}

export function SavedTacticsLibrary({
  tactics,
  currentTacticId,
  onLoad,
  onDelete,
  onDuplicate,
  onRename,
  onClose,
}: SavedTacticsLibraryProps) {
  const [search, setSearch] = useState('');
  const [filterClub, setFilterClub] = useState('');

  const filteredTactics = useMemo(() => {
    return tactics
      .filter((t) => {
        const matchesSearch =
          !search || t.name.toLowerCase().includes(search.toLowerCase());

        const matchesClub =
          !filterClub ||
          (t.clubId && t.clubId.toLowerCase() === filterClub.toLowerCase());

        return matchesSearch && matchesClub;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt); // Más recientes primero
  }, [tactics, search, filterClub]);

  const handleDelete = (tacticId: string, tacticName: string) => {
    if (confirm(`¿Eliminar la táctica "${tacticName}"?`)) {
      onDelete(tacticId);
    }
  };

  const handleDuplicate = (tacticId: string, originalName: string) => {
    const newName = prompt('Nombre para la copia:', `${originalName} (copia)`);
    if (newName) {
      onDuplicate(tacticId, newName);
    }
  };

  const handleRename = (tacticId: string, originalName: string) => {
    const newName = prompt('Nuevo nombre:', originalName);
    if (newName && newName !== originalName) {
      onRename(tacticId, newName);
    }
  };

  const getFormationName = (tactic: Tactic): string => {
    const slots = tactic.basePlan.slots;
    const defenders = slots.filter((s) =>
      ['DI', 'DD', 'CT', 'LIB', 'SA'].includes(s.role),
    ).length;
    const midfielders = slots.filter((s) =>
      ['CCD', 'CC', 'CIZ', 'CDR', 'MP', 'VOL'].includes(s.role),
    ).length;
    const forwards = slots.filter((s) =>
      ['EI', 'ED', 'DC', 'SD', 'EX'].includes(s.role),
    ).length;

    return `${defenders}-${midfielders}-${forwards}`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="saved-tactics-overlay">
      <div className="saved-tactics-modal">
        <div className="saved-tactics-header">
          <h2>Tácticas Guardadas</h2>
          <button type="button" onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        <div className="saved-tactics-filters">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="tactics-search"
          />
          <select
            value={filterClub}
            onChange={(e) => setFilterClub(e.target.value)}
            className="tactics-club-filter"
          >
            <option value="">Todos los clubes</option>
            {Array.from(ANFPES_CLUBS)
              .sort()
              .map((clubName) => (
                <option key={clubName} value={clubName}>
                  {clubName}
                </option>
              ))}
          </select>
        </div>

        <div className="saved-tactics-list">
          {filteredTactics.length === 0 ? (
            <div className="tactics-empty">
              <p>No hay tácticas guardadas</p>
            </div>
          ) : (
            filteredTactics.map((tactic) => {
              const isCurrent = tactic.tacticId === currentTacticId;
              const clubName = tactic.clubId || 'Sin club';
              const formation = getFormationName(tactic);
              const assignedPlayers = tactic.basePlan.slots.filter(
                (s) => s.playerId,
              ).length;

              return (
                <div
                  key={tactic.tacticId}
                  className={`tactics-item ${isCurrent ? 'current' : ''}`}
                >
                  <div className="tactics-item-info">
                    <div className="tactics-item-header">
                      <h3 className="tactics-item-name">
                        {tactic.name}
                        {isCurrent && <span className="current-badge">Actual</span>}
                      </h3>
                      <div className="tactics-item-meta">
                        <span className="tactics-club">{clubName}</span>
                        <span className="tactics-formation">{formation}</span>
                      </div>
                    </div>
                    <div className="tactics-item-details">
                      <span className="tactics-players">
                        {assignedPlayers}/11 jugadores
                      </span>
                      <span className="tactics-date">{formatDate(tactic.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="tactics-item-actions">
                    <button
                      type="button"
                      onClick={() => onLoad(tactic.tacticId)}
                      className="tactics-btn load-btn"
                      disabled={isCurrent}
                      title="Cargar táctica"
                    >
                      Cargar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(tactic.tacticId, tactic.name)}
                      className="tactics-btn duplicate-btn"
                      title="Duplicar táctica"
                    >
                      Duplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRename(tactic.tacticId, tactic.name)}
                      className="tactics-btn rename-btn"
                      title="Renombrar táctica"
                    >
                      Renombrar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tactic.tacticId, tactic.name)}
                      className="tactics-btn delete-btn"
                      disabled={isCurrent}
                      title="Eliminar táctica"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="saved-tactics-footer">
          <p className="tactics-count">
            {filteredTactics.length} de {tactics.length} tácticas
          </p>
        </div>
      </div>
    </div>
  );
}
