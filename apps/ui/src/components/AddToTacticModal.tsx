import { useState } from 'react';
import { isReadOnlyTactic, useTacticsStore } from '../store/tacticsStore';

interface AddToTacticModalProps {
  selectedPlayerIds: Set<string>;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddToTacticModal({
  selectedPlayerIds,
  onClose,
  onSuccess,
}: AddToTacticModalProps) {
  const savedTactics = useTacticsStore((state) => state.savedTactics);
  const editableTactics = savedTactics.filter((tactic) => !isReadOnlyTactic(tactic));
  const addCandidateIn = useTacticsStore((state) => state.addCandidateIn);
  const loadTactic = useTacticsStore((state) => state.loadTactic);

  const [selectedTacticId, setSelectedTacticId] = useState<string>(
    editableTactics[0]?.tacticId || '',
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTacticId) {
      alert('Por favor selecciona una planificación');
      return;
    }

    const playerIdsArray = Array.from(selectedPlayerIds);

    // Cargar la táctica primero
    loadTactic(selectedTacticId);

    // Agregar cada jugador como candidato entrante
    playerIdsArray.forEach((playerId) => {
      addCandidateIn(playerId);
    });

    onSuccess();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content add-to-preselection-modal">
        <div className="modal-header">
          <h2>Fichar en planificador</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="modal-description">
              Vas a agregar <strong>{selectedPlayerIds.size}</strong> jugador
              {selectedPlayerIds.size > 1 ? 'es' : ''} como fichajes entrantes a una
              planificación.
            </p>
            {editableTactics.length === 0 && (
              <p className="modal-description">
                No hay planificaciones editables de la temporada actual.
              </p>
            )}

            <div className="form-group">
              <label htmlFor="tactic-select">
                <span>Planificación</span>
              </label>

              <select
                id="tactic-select"
                value={selectedTacticId}
                onChange={(e) => setSelectedTacticId(e.target.value)}
                disabled={editableTactics.length === 0}
                className="preselection-select"
              >
                <option value="" disabled>
                  Selecciona una planificación
                </option>
                {editableTactics.map((tactic) => (
                  <option key={tactic.tacticId} value={tactic.tacticId}>
                    {tactic.name} ({tactic.clubId || 'Sin club'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={editableTactics.length === 0}
            >
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
