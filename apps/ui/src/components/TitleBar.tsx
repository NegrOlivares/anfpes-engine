import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface TitleBarProps {
  visible: boolean;
}

export function TitleBar({ visible }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const checkMaximized = async () => {
      try {
        const appWindow = getCurrentWindow();
        const maximized = await appWindow.isMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        console.error('Error checking maximized state:', error);
      }
    };

    checkMaximized();
  }, [visible]);

  const handleMinimize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (error) {
      console.error('Error minimizing:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      const appWindow = getCurrentWindow();
      const maximized = await appWindow.isMaximized();

      if (maximized) {
        await appWindow.unmaximize();
        setIsMaximized(false);
      } else {
        await appWindow.maximize();
        setIsMaximized(true);
      }
    } catch (error) {
      console.error('Error toggling maximize:', error);
    }
  };

  const handleClose = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (error) {
      console.error('Error closing:', error);
    }
  };

  const handleStartDrag = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.startDragging();
    } catch (error) {
      console.error('Error starting drag:', error);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="titlebar">
      <div className="titlebar-drag-region" onMouseDown={handleStartDrag}>
        <div className="titlebar-title">Cesante Manager</div>
      </div>
      <div className="titlebar-buttons">
        <button
          type="button"
          className="titlebar-button titlebar-minimize"
          onClick={handleMinimize}
          title="Minimizar"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          className="titlebar-button titlebar-maximize"
          onClick={handleMaximize}
          title={isMaximized ? 'Restaurar' : 'Maximizar'}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                d="M 0 2 L 0 10 L 8 10 L 8 2 L 0 2 Z M 1 3 L 7 3 L 7 9 L 1 9 L 1 3 Z"
                fill="currentColor"
              />
              <path d="M 2 0 L 2 1 L 9 1 L 9 8 L 10 8 L 10 0 Z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect
                width="9"
                height="9"
                x="0.5"
                y="0.5"
                fill="none"
                stroke="currentColor"
              />
            </svg>
          )}
        </button>
        <button
          type="button"
          className="titlebar-button titlebar-close"
          onClick={handleClose}
          title="Cerrar"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path
              d="M 0 0 L 10 10 M 10 0 L 0 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
