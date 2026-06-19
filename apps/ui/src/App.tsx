import { useEffect, useState } from 'react';
import { useCacheLoader } from './store/cacheStore';
import { ModuleTabs, type ModuleDefinition } from './components/ModuleTabs';
import { GlossaryModal } from './components/GlossaryModal';
import { SplashScreen } from './components/SplashScreen';
import { HomeModule } from './modules/HomeModule';
import { PlayerSearch } from './components/PlayerSearch';
import { PlayerProfile } from './components/PlayerProfile';
import { PreselectionModule } from './modules/PreselectionModule';
import { ClubModule } from './modules/ClubModule';
import { SimilarPlayersModule } from './modules/SimilarPlayersModule';
import { ComparatorModule } from './modules/ComparatorModule';
import { PlanningModule } from './modules/PlanningModule';
import { useModuleStore, MODULE_IDS } from './store/moduleStore';
import { PlayerActionsOverlay } from './components/PlayerActionsOverlay';
import { useNavigationHistoryStore } from './store/navigationHistoryStore';
import { ToolsMenu } from './components/ToolsMenu';
import { TitleBar } from './components/TitleBar';
import { IdentitySetupModal } from './components/IdentitySetupModal';
import { useWindowModeStore } from './store/windowModeStore';
import { initializeTheme } from './store/themeStore';
import { useIdentityStore, type UserIdentity } from './store/identityStore';
import { getCurrentWindow } from '@tauri-apps/api/window';

const modules: ModuleDefinition[] = [
  { id: MODULE_IDS.dashboard, label: 'Home', component: HomeModule },
  { id: MODULE_IDS.search, label: 'Buscador', component: PlayerSearch },
  {
    id: MODULE_IDS.preselections,
    label: 'Preselecciones',
    component: PreselectionModule,
  },
  { id: MODULE_IDS.club, label: 'Clubes', component: ClubModule },
  { id: MODULE_IDS.similar, label: 'Similares', component: SimilarPlayersModule },
  { id: MODULE_IDS.comparator, label: 'Comparador', component: ComparatorModule },
  { id: MODULE_IDS.planning, label: 'Planificación', component: PlanningModule },
  { id: MODULE_IDS.profile, label: 'Perfil', component: PlayerProfile },
];

function getIdentityLabel(identity: UserIdentity): string {
  if (identity.mode === 'manager') {
    return `${identity.manager ?? 'DT'} - ${identity.club ?? 'Club'}`;
  }

  if (identity.mode === 'club') {
    return identity.club ?? 'Club';
  }

  return 'Espectador';
}

export default function App() {
  useCacheLoader();
  const activeModuleId = useModuleStore((state) => state.activeModuleId);
  const setActiveModuleId = useModuleStore((state) => state.setActiveModuleId);
  const navigateBack = useModuleStore((state) => state.navigateBack);
  const navigateForward = useModuleStore((state) => state.navigateForward);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const isFullscreen = useWindowModeStore((state) => state.isFullscreen);
  const setIsFullscreen = useWindowModeStore((state) => state.setIsFullscreen);
  const [isInitialized, setIsInitialized] = useState(false);
  const identity = useIdentityStore((state) => state.profile);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const mustSelectIdentity = !showSplash && !identity;
  const identityModalOpen = isIdentityModalOpen || mustSelectIdentity;

  // Initialize theme
  useEffect(() => {
    initializeTheme();
  }, []);

  // Sincronizar estado inicial con Tauri
  useEffect(() => {
    const syncInitialState = async () => {
      try {
        const appWindow = getCurrentWindow();
        const currentFullscreen = await appWindow.isFullscreen();
        setIsFullscreen(currentFullscreen);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error syncing initial fullscreen state:', error);
        setIsInitialized(true); // Continuar incluso si hay error
      }
    };
    syncInitialState();
  }, [setIsFullscreen]);

  // Initialize history with dashboard on mount
  useEffect(() => {
    const { push, history } = useNavigationHistoryStore.getState();
    if (history.length === 0) {
      push(MODULE_IDS.dashboard, {}); // Empty snapshot for dashboard
    }
  }, []);

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + Left Arrow = Back
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        navigateBack();
      }
      // Alt + Right Arrow = Forward
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        navigateForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateBack, navigateForward]);

  const closeIdentityModal = () => {
    if (!mustSelectIdentity) {
      setIsIdentityModalOpen(false);
    }
  };

  return (
    <div className={`app-shell ${isInitialized && !isFullscreen ? 'has-titlebar' : ''}`}>
      <TitleBar visible={isInitialized && !isFullscreen} />
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div className="app-header">
        <ModuleTabs
          modules={modules}
          activeId={activeModuleId}
          onSelect={setActiveModuleId}
          onNavigateBack={navigateBack}
          onNavigateForward={navigateForward}
          onOpenGlossary={() => setIsGlossaryOpen(true)}
        />
        <div className="header-actions">
          {identity && (
            <button
              type="button"
              className="identity-chip"
              onClick={() => setIsIdentityModalOpen(true)}
            >
              <strong>{getIdentityLabel(identity)}</strong>
            </button>
          )}
          <ToolsMenu />
        </div>
      </div>
      <main className="app-main">
        {modules.map((module) => {
          const Component = module.component;
          return (
            <div
              key={module.id}
              className={`module-view ${module.id === activeModuleId ? 'active' : 'inactive'}`}
            >
              <Component />
            </div>
          );
        })}
      </main>
      <PlayerActionsOverlay />
      <GlossaryModal isOpen={isGlossaryOpen} onClose={() => setIsGlossaryOpen(false)} />
      <IdentitySetupModal
        open={identityModalOpen}
        allowClose={Boolean(identity)}
        onClose={closeIdentityModal}
      />
    </div>
  );
}
