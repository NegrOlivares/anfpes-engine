import type { ComponentType } from 'react';
import type { ModuleId } from '../store/moduleStore';

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  component: ComponentType;
}

interface ModuleTabsProps {
  modules: ModuleDefinition[];
  activeId: ModuleId;
  onSelect: (id: ModuleId) => void;
}

export function ModuleTabs({ modules, activeId, onSelect }: ModuleTabsProps) {
  return (
    <nav className="module-tabs" aria-label="Modulos">
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
    </nav>
  );
}
