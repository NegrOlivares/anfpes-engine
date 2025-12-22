import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DefensiveAttitude, RunDirection } from '../types/tactics';

interface MovementArrowEditorProps {
  currentArrows: RunDirection[];
  currentAttitude: DefensiveAttitude;
  onUpdate: (arrows: RunDirection[], attitude: DefensiveAttitude) => void;
  onClose: () => void;
  playerName: string;
  allowedDirections?: RunDirection[];
}

const ARROW_DIRECTIONS: Array<{ direction: RunDirection; angle: number; label: string }> =
  [
    { direction: 'FORWARD', angle: 0, label: '↑' },
    { direction: 'DIAGONAL_RIGHT_FORWARD', angle: 45, label: '↗' },
    { direction: 'RIGHT', angle: 90, label: '→' },
    { direction: 'DIAGONAL_RIGHT_BACKWARD', angle: 135, label: '↘' },
    { direction: 'BACKWARD', angle: 180, label: '↓' },
    { direction: 'DIAGONAL_LEFT_BACKWARD', angle: 225, label: '↙' },
    { direction: 'LEFT', angle: 270, label: '←' },
    { direction: 'DIAGONAL_LEFT_FORWARD', angle: 315, label: '↖' },
  ];

export function MovementArrowEditor({
  currentArrows,
  currentAttitude,
  onUpdate,
  onClose,
  playerName,
  allowedDirections,
}: MovementArrowEditorProps) {
  const [selectedArrows, setSelectedArrows] = useState<RunDirection[]>(currentArrows);
  const [attitude, setAttitude] = useState<DefensiveAttitude>(currentAttitude);
  useEffect(() => {
    setAttitude(currentAttitude);
  }, [currentAttitude]);

  const handleDirectionClick = (direction: RunDirection) => {
    if (selectedArrows.includes(direction)) {
      // Remove arrow
      setSelectedArrows(selectedArrows.filter((d) => d !== direction));
    } else if (selectedArrows.length < 2) {
      // Add arrow (max 2)
      setSelectedArrows([...selectedArrows, direction]);
    }
  };

  const handleSave = () => {
    onUpdate(selectedArrows, attitude);
    onClose();
  };

  const handleClear = () => {
    setSelectedArrows([]);
  };

  const editor = (
    <div className="movement-arrow-editor-overlay" onClick={onClose}>
      <div className="movement-arrow-editor" onClick={(e) => e.stopPropagation()}>
        <div className="arrow-editor-header">
          <h3>{playerName}</h3>
          <p className="arrow-editor-hint">
            Selecciona hasta 2 direcciones de movimiento
          </p>
        </div>

        <div className="arrow-attitude-selector">
          <label>Actitud defensiva</label>
          <select
            value={attitude}
            onChange={(e) => setAttitude(e.target.value as DefensiveAttitude)}
            className="arrow-attitude-select"
          >
            <option value="DEFENSIVE">Defensiva</option>
            <option value="BALANCED">Balanceada</option>
            <option value="OFFENSIVE">Ofensiva</option>
          </select>
        </div>

        <div className="arrow-editor-circle">
          {/* Center indicator */}
          <div className="arrow-center">
            <div className="arrow-count">{selectedArrows.length}/2</div>
          </div>

          {/* Direction buttons */}
          {ARROW_DIRECTIONS.map(({ direction, angle, label }) => {
            const isSelected = selectedArrows.includes(direction);
            const isFull = selectedArrows.length >= 2 && !isSelected;
            const isAllowed = !allowedDirections || allowedDirections.includes(direction);

            // Calculate position on circle
            const radius = 80; // pixels
            const radians = (angle - 90) * (Math.PI / 180);
            const x = Math.cos(radians) * radius;
            const y = Math.sin(radians) * radius;

            return (
              <button
                key={direction}
                type="button"
                className={`arrow-direction-btn ${isSelected ? 'selected' : ''} ${isFull || !isAllowed ? 'disabled' : ''}`}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
                onClick={() => !isFull && isAllowed && handleDirectionClick(direction)}
                disabled={isFull || !isAllowed}
                title={direction.replace(/_/g, ' ')}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="arrow-editor-actions">
          <button type="button" onClick={handleClear} className="arrow-btn-secondary">
            Limpiar
          </button>
          <button type="button" onClick={onClose} className="arrow-btn-secondary">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} className="arrow-btn-primary">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(editor, document.body);
}
