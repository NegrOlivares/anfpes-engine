import { useMemo } from 'react';
import { useCacheLoader } from './store/cacheStore';
import { ModuleTabs, type ModuleDefinition } from './components/ModuleTabs';
import { DashboardModule } from './modules/DashboardModule';
import { PlayerSearch } from './components/PlayerSearch';
import { PlayerProfile } from './components/PlayerProfile';
import { PreselectionModule } from './modules/PreselectionModule';
import { SimilarPlayersModule } from './modules/SimilarPlayersModule';
import { useModuleStore, MODULE_IDS } from './store/moduleStore';
import { PlayerActionsOverlay } from './components/PlayerActionsOverlay';

const modules: ModuleDefinition[] = [
  { id: MODULE_IDS.dashboard, label: 'Dashboard', component: DashboardModule },
  { id: MODULE_IDS.search, label: 'Buscador', component: PlayerSearch },
  {
    id: MODULE_IDS.preselections,
    label: 'Preselecciones',
    component: PreselectionModule,
  },
  { id: MODULE_IDS.similar, label: 'Similares', component: SimilarPlayersModule },
  { id: MODULE_IDS.profile, label: 'Perfil', component: PlayerProfile },
];

export default function App() {
  useCacheLoader();
  const activeModuleId = useModuleStore((state) => state.activeModuleId);
  const setActiveModuleId = useModuleStore((state) => state.setActiveModuleId);

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
      <PlayerActionsOverlay />
    </div>
  );
}
