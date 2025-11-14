import { useState } from 'react';
import { usePreselectionStore } from '../store/preselectionStore';

interface AddToPreselectionModalProps {
  selectedPlayerIds: Set<string>;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddToPreselectionModal({
  selectedPlayerIds,
  onClose,
  onSuccess,
}: AddToPreselectionModalProps) {
  const preselections = usePreselectionStore((state) => state.preselections);
  const createPreselection = usePreselectionStore((state) => state.createPreselection);
  const addPlayersToPreselection = usePreselectionStore(
    (state) => state.addPlayersToPreselection,
  );

  const [selectedPreselectionId, setSelectedPreselectionId] = useState<string>(
    preselections[0]?.id || '',
  );
  const [newPreselectionName, setNewPreselectionName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let targetId = selectedPreselectionId;

    if (isCreatingNew) {
      if (!newPreselectionName.trim()) {
        alert('Por favor ingresa un nombre para la nueva preselección');
        return;
      }
      createPreselection(newPreselectionName.trim());
      // Get the newly created preselection (last one)
      const newPreselections = usePreselectionStore.getState().preselections;
      targetId = newPreselections[newPreselections.length - 1].id;
    }

    if (!targetId) {
      alert('Por favor selecciona una preselección');
      return;
    }

    const playerIdsArray = Array.from(selectedPlayerIds);
    addPlayersToPreselection(targetId, playerIdsArray);
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
          <h2>Agregar a preselección</h2>
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
              {selectedPlayerIds.size > 1 ? 'es' : ''} a una preselección.
            </p>

            <div className="form-group">
              <label>
                <input
                  type="radio"
                  name="selection-mode"
                  checked={!isCreatingNew}
                  onChange={() => setIsCreatingNew(false)}
                />
                <span>Preselección existente</span>
              </label>

              {!isCreatingNew && (
                <div style={{ paddingLeft: '2rem' }}>
                  <select
                    value={selectedPreselectionId}
                    onChange={(e) => setSelectedPreselectionId(e.target.value)}
                    className="preselection-select"
                    disabled={isCreatingNew}
                  >
                    {preselections.map((ps) => (
                      <option key={ps.id} value={ps.id}>
                        {ps.name} ({ps.playerIds.length} jugadores)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>
                <input
                  type="radio"
                  name="selection-mode"
                  checked={isCreatingNew}
                  onChange={() => setIsCreatingNew(true)}
                />
                <span>Crear nueva preselección</span>
              </label>

              {isCreatingNew && (
                <div style={{ paddingLeft: '2rem' }}>
                  <input
                    type="text"
                    value={newPreselectionName}
                    onChange={(e) => setNewPreselectionName(e.target.value)}
                    placeholder="Ej: Defensa para reforzar"
                    className="preselection-name-input"
                    disabled={!isCreatingNew}
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
