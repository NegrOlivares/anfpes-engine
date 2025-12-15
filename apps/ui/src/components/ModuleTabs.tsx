import type { ComponentType } from 'react';
import type { ModuleId } from '../store/moduleStore';
import { useNavigationHistoryStore } from '../store/navigationHistoryStore';

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  component: ComponentType;
}

interface ModuleTabsProps {
  modules: ModuleDefinition[];
  activeId: ModuleId;
  onSelect: (id: ModuleId) => void;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
}

export function ModuleTabs({
  modules,
  activeId,
  onSelect,
  onNavigateBack,
  onNavigateForward,
}: ModuleTabsProps) {
  const canGoBack = useNavigationHistoryStore((state) => state.canGoBack);
  const canGoForward = useNavigationHistoryStore((state) => state.canGoForward);

  return (
    <nav className="module-tabs" aria-label="Modulos">
      <div className="nav-controls">
        <button
          type="button"
          className="nav-button"
          onClick={onNavigateBack}
          disabled={!canGoBack}
          title="Atrás (Alt+←)"
          aria-label="Navegar atrás"
        >
          ←
        </button>
        <button
          type="button"
          className="nav-button"
          onClick={onNavigateForward}
          disabled={!canGoForward}
          title="Adelante (Alt+→)"
          aria-label="Navegar adelante"
        >
          →
        </button>
      </div>
      <div className="tabs-container">
        {modules.map((module) => (
          <button
            key={module.id}
            type="button"
            className={module.id === activeId ? 'active' : undefined}
            onClick={() => onSelect(module.id)}
          >
            {module.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
