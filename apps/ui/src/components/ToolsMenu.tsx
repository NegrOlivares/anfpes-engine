import { useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { usePlayerViews } from '../hooks/usePlayerViews';
import { usePreselectionStore } from '../store/preselectionStore';
import { useTacticsStore } from '../store/tacticsStore';
import { useWindowModeStore } from '../store/windowModeStore';
import { useThemeStore, themes, type ThemeId } from '../store/themeStore';
import { ExitConfirmModal } from './ExitConfirmModal';
import type { PlayerView } from '../hooks/usePlayerViews';
import type { Preselection, PlayerTag } from '../types/preselection';
import type { Tactic } from '../types/tactics';

interface GranularExportSelection {
  viewIds: Set<string>;
  preselectionIds: Set<string>;
  tacticIds: Set<string>;
}

interface ImportSelection {
  views: boolean;
  preselections: boolean;
  tactics: boolean;
  replace: boolean;
}

export function ToolsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [exportSelection, setExportSelection] = useState<GranularExportSelection>({
    viewIds: new Set(),
    preselectionIds: new Set(),
    tacticIds: new Set(),
  });
  const [importSelection, setImportSelection] = useState<ImportSelection>({
    views: false,
    preselections: false,
    tactics: false,
    replace: false,
  });
  const [expandedSections, setExpandedSections] = useState<{
    views: boolean;
    preselections: boolean;
    tactics: boolean;
  }>({
    views: false,
    preselections: false,
    tactics: false,
  });

  const { savedViews, exportViews, importViews } = usePlayerViews();
  const preselections = usePreselectionStore((state) => state.preselections);
  const availableTags = usePreselectionStore((state) => state.availableTags);
  const exportPreselections = usePreselectionStore((state) => state.exportPreselections);
  const importPreselections = usePreselectionStore((state) => state.importPreselections);
  const savedTactics = useTacticsStore((state) => state.savedTactics);
  const exportTactics = useTacticsStore((state) => state.exportTactics);
  const importTactics = useTacticsStore((state) => state.importTactics);
  const isFullscreen = useWindowModeStore((state) => state.isFullscreen);
  const setIsFullscreen = useWindowModeStore((state) => state.setIsFullscreen);
  const currentThemeId = useThemeStore((state) => state.currentThemeId);
  const setTheme = useThemeStore((state) => state.setTheme);

  const toggleSelectAll = (category: 'views' | 'preselections' | 'tactics') => {
    setExportSelection((prev) => {
      const newSelection = { ...prev };
      if (category === 'views') {
        const allSelected = savedViews.every((v) => prev.viewIds.has(v.id));
        newSelection.viewIds = allSelected
          ? new Set()
          : new Set(savedViews.map((v) => v.id));
      } else if (category === 'preselections') {
        const allSelected = preselections.every((p) => prev.preselectionIds.has(p.id));
        newSelection.preselectionIds = allSelected
          ? new Set()
          : new Set(preselections.map((p) => p.id));
      } else if (category === 'tactics') {
        const allSelected = savedTactics.every((t) => prev.tacticIds.has(t.tacticId));
        newSelection.tacticIds = allSelected
          ? new Set()
          : new Set(savedTactics.map((t) => t.tacticId));
      }
      return newSelection;
    });
  };

  const toggleItem = (category: 'views' | 'preselections' | 'tactics', id: string) => {
    setExportSelection((prev) => {
      const newSelection = { ...prev };
      if (category === 'views') {
        const newSet = new Set(prev.viewIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        newSelection.viewIds = newSet;
      } else if (category === 'preselections') {
        const newSet = new Set(prev.preselectionIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        newSelection.preselectionIds = newSet;
      } else if (category === 'tactics') {
        const newSet = new Set(prev.tacticIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        newSelection.tacticIds = newSet;
      }
      return newSelection;
    });
  };

  const handleExport = async () => {
    const data: {
      views?: PlayerView[];
      preselections?: { preselections: Preselection[]; availableTags: PlayerTag[] };
      tactics?: Tactic[];
    } = {};

    if (exportSelection.viewIds.size > 0) {
      const selectedViews = savedViews.filter((v) => exportSelection.viewIds.has(v.id));
      data.views = selectedViews;
    }

    if (exportSelection.preselectionIds.size > 0) {
      const selectedPreselections = preselections.filter((p) =>
        exportSelection.preselectionIds.has(p.id),
      );
      data.preselections = {
        preselections: selectedPreselections,
        availableTags: availableTags,
      };
    }

    if (exportSelection.tacticIds.size > 0) {
      const selectedTactics = savedTactics.filter((t) =>
        exportSelection.tacticIds.has(t.tacticId),
      );
      data.tactics = selectedTactics;
    }

    if (Object.keys(data).length === 0) {
      alert('Selecciona al menos un elemento para exportar');
      return;
    }

    const exportData = {
      metadata: {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        appName: 'ANFPES Engine',
        summary: {
          views: data.views?.length || 0,
          preselections: data.preselections?.preselections.length || 0,
          tactics: data.tactics?.length || 0,
        },
      },
      data,
    };

    // Usar el diálogo de guardado de Tauri
    try {
      const defaultFileName = `cm-export-${new Date().toISOString().split('T')[0]}.cmf`;

      const filePath = await save({
        defaultPath: defaultFileName,
        filters: [
          {
            name: 'Cesante Manager File',
            extensions: ['cmf'],
          },
          {
            name: 'All Files',
            extensions: ['*'],
          },
        ],
      });

      if (!filePath) {
        // Usuario canceló el diálogo
        return;
      }

      // Guardar el archivo
      await writeTextFile(filePath, JSON.stringify(exportData, null, 2));

      alert(
        `Exportación exitosa!\n${exportData.metadata.summary.views} vistas\n${exportData.metadata.summary.preselections} preselecciones\n${exportData.metadata.summary.tactics} planificaciones`,
      );

      setShowExportDialog(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar el archivo');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.cmf';

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        alert('No se seleccionó ningún archivo');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);

          if (!parsed.metadata || !parsed.data) {
            alert('Formato de archivo inválido');
            return;
          }

          let importedCount = 0;
          const summary = {
            views: 0,
            preselections: 0,
            tactics: 0,
          };

          if (importSelection.views && parsed.data.views) {
            importViews(parsed.data.views, importSelection.replace);
            summary.views = parsed.data.views.length;
            importedCount++;
          }
          if (importSelection.preselections && parsed.data.preselections) {
            importPreselections(parsed.data.preselections, importSelection.replace);
            summary.preselections = parsed.data.preselections.preselections?.length || 0;
            importedCount++;
          }
          if (importSelection.tactics && parsed.data.tactics) {
            importTactics(parsed.data.tactics, importSelection.replace);
            summary.tactics = parsed.data.tactics.length;
            importedCount++;
          }

          if (importedCount === 0) {
            alert('Selecciona al menos un elemento para importar');
            return;
          }

          // Cerrar diálogos primero
          setShowImportDialog(false);
          setIsOpen(false);

          // Dar tiempo a que los stores persistan y sincronicen
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Mostrar mensaje de éxito con detalles
          const details = [];
          if (summary.views > 0)
            details.push(`${summary.views} vista${summary.views > 1 ? 's' : ''}`);
          if (summary.preselections > 0)
            details.push(
              `${summary.preselections} preselección${summary.preselections > 1 ? 'es' : ''}`,
            );
          if (summary.tactics > 0)
            details.push(
              `${summary.tactics} planificación${summary.tactics > 1 ? 'es' : ''}`,
            );

          alert(
            `✅ Importación exitosa!\n\n` +
              `Importados: ${details.join(', ')}\n` +
              `Versión: ${parsed.metadata.version}\n` +
              `Fecha: ${new Date(parsed.metadata.exportedAt).toLocaleString()}\n\n` +
              `Los cambios ya están disponibles.`,
          );

          // Forzar actualización de la UI recargando la página
          window.location.reload();
        } catch (error) {
          alert(
            `Error al leer el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          );
        }
      };

      reader.onerror = () => {
        alert('Error al leer el archivo');
      };

      reader.readAsText(file);
    };

    input.click();
  };

  const handleToggleWindowMode = async () => {
    try {
      const appWindow = getCurrentWindow();

      if (isFullscreen) {
        // Salir de fullscreen sin habilitar decoraciones nativas
        await appWindow.setFullscreen(false);
        await appWindow.setResizable(true);
        setIsFullscreen(false);
      } else {
        // Entrar a fullscreen
        await appWindow.setResizable(false);
        await appWindow.setFullscreen(true);
        setIsFullscreen(true);
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Error toggling window mode:', error);
      alert('Error al cambiar el modo de ventana');
    }
  };

  return (
    <div className="tools-menu-container">
      <button
        type="button"
        className="tools-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Herramientas"
      >
        ⚙️
      </button>

      {isOpen && (
        <>
          <div className="tools-backdrop" onClick={() => setIsOpen(false)} />
          <div className="tools-menu">
            <h3>Herramientas</h3>
            <div className="tools-menu-section">
              <button
                type="button"
                className="tools-menu-item"
                onClick={() => {
                  setShowExportDialog(true);
                }}
              >
                📤 Exportar datos
              </button>
              <button
                type="button"
                className="tools-menu-item"
                onClick={() => {
                  setShowImportDialog(true);
                }}
              >
                📥 Importar datos
              </button>
            </div>

            <div className="tools-menu-section">
              <button
                type="button"
                className="tools-menu-item"
                onClick={handleToggleWindowMode}
              >
                {isFullscreen ? '🔳 Modo ventana' : '🖥️ Pantalla completa'}
              </button>
              <button
                type="button"
                className="tools-menu-item"
                onClick={() => {
                  setShowThemeDialog(true);
                  setIsOpen(false);
                }}
              >
                🎨 Cambiar tema
              </button>
            </div>

            <div className="tools-menu-section">
              <button
                type="button"
                className="tools-menu-item tools-menu-exit"
                onClick={() => {
                  setShowExitModal(true);
                  setIsOpen(false);
                }}
              >
                🚪 Salir de la aplicación
              </button>
            </div>
          </div>
        </>
      )}

      {showExitModal && <ExitConfirmModal onClose={() => setShowExitModal(false)} />}

      {showExportDialog && (
        <div className="modal-overlay">
          <div className="modal-content tools-dialog tools-dialog-large">
            <h3>Exportar Datos</h3>
            <p className="muted">Selecciona los elementos que deseas exportar:</p>

            <div className="export-category">
              <div className="export-category-header">
                <button
                  type="button"
                  className="expand-button"
                  onClick={() =>
                    setExpandedSections((prev) => ({ ...prev, views: !prev.views }))
                  }
                >
                  {expandedSections.views ? '▼' : '▶'}
                </button>
                <span className="category-title">
                  Vistas de búsqueda ({exportSelection.viewIds.size}/{savedViews.length})
                </span>
                <button
                  type="button"
                  className="select-all-button"
                  onClick={() => toggleSelectAll('views')}
                >
                  {savedViews.every((v) => exportSelection.viewIds.has(v.id))
                    ? 'Deseleccionar'
                    : 'Seleccionar'}{' '}
                  todas
                </button>
              </div>
              {expandedSections.views && (
                <div className="export-items">
                  {savedViews.length === 0 ? (
                    <p className="empty-message">No hay vistas guardadas</p>
                  ) : (
                    savedViews.map((view) => (
                      <label key={view.id} className="item-checkbox">
                        <input
                          type="checkbox"
                          checked={exportSelection.viewIds.has(view.id)}
                          onChange={() => toggleItem('views', view.id)}
                        />
                        <span className="item-name">{view.name}</span>
                        <span className="item-meta">
                          {view.filters.length} filtros, {view.visibleColumns.length}{' '}
                          columnas
                        </span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="export-category">
              <div className="export-category-header">
                <button
                  type="button"
                  className="expand-button"
                  onClick={() =>
                    setExpandedSections((prev) => ({
                      ...prev,
                      preselections: !prev.preselections,
                    }))
                  }
                >
                  {expandedSections.preselections ? '▼' : '▶'}
                </button>
                <span className="category-title">
                  Preselecciones ({exportSelection.preselectionIds.size}/
                  {preselections.length})
                </span>
                <button
                  type="button"
                  className="select-all-button"
                  onClick={() => toggleSelectAll('preselections')}
                >
                  {preselections.every((p) => exportSelection.preselectionIds.has(p.id))
                    ? 'Deseleccionar'
                    : 'Seleccionar'}{' '}
                  todas
                </button>
              </div>
              {expandedSections.preselections && (
                <div className="export-items">
                  {preselections.length === 0 ? (
                    <p className="empty-message">No hay preselecciones</p>
                  ) : (
                    preselections.map((preselection) => (
                      <label key={preselection.id} className="item-checkbox">
                        <input
                          type="checkbox"
                          checked={exportSelection.preselectionIds.has(preselection.id)}
                          onChange={() => toggleItem('preselections', preselection.id)}
                        />
                        <span className="item-name">{preselection.name}</span>
                        <span className="item-meta">
                          {preselection.playerIds.length} jugadores
                        </span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="export-category">
              <div className="export-category-header">
                <button
                  type="button"
                  className="expand-button"
                  onClick={() =>
                    setExpandedSections((prev) => ({ ...prev, tactics: !prev.tactics }))
                  }
                >
                  {expandedSections.tactics ? '▼' : '▶'}
                </button>
                <span className="category-title">
                  Planificaciones ({exportSelection.tacticIds.size}/{savedTactics.length})
                </span>
                <button
                  type="button"
                  className="select-all-button"
                  onClick={() => toggleSelectAll('tactics')}
                >
                  {savedTactics.every((t) => exportSelection.tacticIds.has(t.tacticId))
                    ? 'Deseleccionar'
                    : 'Seleccionar'}{' '}
                  todas
                </button>
              </div>
              {expandedSections.tactics && (
                <div className="export-items">
                  {savedTactics.length === 0 ? (
                    <p className="empty-message">No hay planificaciones guardadas</p>
                  ) : (
                    savedTactics.map((tactic) => (
                      <label key={tactic.tacticId} className="item-checkbox">
                        <input
                          type="checkbox"
                          checked={exportSelection.tacticIds.has(tactic.tacticId)}
                          onChange={() => toggleItem('tactics', tactic.tacticId)}
                        />
                        <span className="item-name">{tactic.name}</span>
                        <span className="item-meta">
                          {tactic.clubId || 'Sin club'} •{' '}
                          {new Date(tactic.updatedAt).toLocaleDateString()}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={handleExport}>
                Exportar selección
              </button>
              <button
                type="button"
                className="secondary-button ghost"
                onClick={() => {
                  setShowExportDialog(false);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportDialog && (
        <div className="modal-overlay">
          <div className="modal-content tools-dialog">
            <h3>Importar Datos</h3>
            <p className="muted">Selecciona qué elementos deseas importar:</p>
            <div className="export-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={importSelection.views}
                  onChange={(e) =>
                    setImportSelection((prev) => ({ ...prev, views: e.target.checked }))
                  }
                />
                <span>Vistas de búsqueda</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={importSelection.preselections}
                  onChange={(e) =>
                    setImportSelection((prev) => ({
                      ...prev,
                      preselections: e.target.checked,
                    }))
                  }
                />
                <span>Preselecciones</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={importSelection.tactics}
                  onChange={(e) =>
                    setImportSelection((prev) => ({ ...prev, tactics: e.target.checked }))
                  }
                />
                <span>Planificaciones tácticas</span>
              </label>
            </div>
            <div className="export-options">
              <label className="checkbox-label warning">
                <input
                  type="checkbox"
                  checked={importSelection.replace}
                  onChange={(e) =>
                    setImportSelection((prev) => ({ ...prev, replace: e.target.checked }))
                  }
                />
                <span>⚠️ Reemplazar datos existentes (en lugar de fusionar)</span>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={handleImport}>
                Importar
              </button>
              <button
                type="button"
                className="secondary-button ghost"
                onClick={() => {
                  setShowImportDialog(false);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showThemeDialog && (
        <div className="modal-overlay">
          <div className="modal-content tools-dialog">
            <h3>🎨 Cambiar Tema</h3>
            <p className="muted">Selecciona el tema de color para la aplicación:</p>

            <div className="theme-selector">
              {(Object.keys(themes) as ThemeId[]).map((themeId) => {
                const theme = themes[themeId];
                return (
                  <button
                    key={themeId}
                    type="button"
                    className={`theme-option ${currentThemeId === themeId ? 'active' : ''}`}
                    onClick={() => {
                      setTheme(themeId);
                      setShowThemeDialog(false);
                    }}
                  >
                    <div
                      className="theme-preview"
                      style={{
                        background: theme.colors.tabActive,
                        borderColor: theme.colors.primaryLight,
                      }}
                    />
                    <span className="theme-name">{theme.name}</span>
                    {currentThemeId === themeId && <span className="theme-check">✓</span>}
                  </button>
                );
              })}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowThemeDialog(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
