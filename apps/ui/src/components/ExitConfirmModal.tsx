import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface ExitConfirmModalProps {
  onClose: () => void;
}

export function ExitConfirmModal({ onClose }: ExitConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleExit = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (error) {
      console.error('Error al cerrar la aplicación:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="exit-modal" onClick={(e) => e.stopPropagation()}>
        <h2>¿Seguro que quieres salir de Cesante Manager?</h2>
        <div className="exit-modal-buttons">
          <button
            type="button"
            className="exit-modal-button exit-modal-button-yes"
            onClick={handleExit}
          >
            Sí
          </button>
          <button
            type="button"
            className="exit-modal-button exit-modal-button-no"
            onClick={onClose}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
