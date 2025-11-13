import { useMemo, useState } from 'react';
import { useCacheLoader } from './store/cacheStore';
import { ModuleTabs, type ModuleDefinition } from './components/ModuleTabs';
import { DashboardModule } from './modules/DashboardModule';
import { PlayerSearch } from './components/PlayerSearch';
import { PlayerProfile } from './components/PlayerProfile';

const modules: ModuleDefinition[] = [
  { id: 'dashboard', label: 'Dashboard', component: DashboardModule },
  { id: 'search', label: 'Buscador', component: PlayerSearch },
  { id: 'profile', label: 'Perfil', component: PlayerProfile },
];

export default function App() {
  useCacheLoader();
  const [activeModuleId, setActiveModuleId] = useState(modules[0].id);

  const ActiveModule = useMemo(() => {
    const target = modules.find((module) => module.id === activeModuleId);
    return target?.component ?? modules[0].component;
  }, [activeModuleId]);

  return (
    <div className="app-shell">
      <ModuleTabs
        modules={modules}
        activeId={activeModuleId}
        onSelect={setActiveModuleId}
      />
      <main className="app-main">
        <ActiveModule />
      </main>
    </div>
  );
}
