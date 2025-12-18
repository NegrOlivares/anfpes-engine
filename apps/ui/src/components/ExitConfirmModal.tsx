import { useEffect } from 'react';

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="exit-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Para Salir de Cesante Manager, Presione Alt+F4</h2>
      </div>
    </div>
  );
}
