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
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, type DownloadEvent, type Update } from '@tauri-apps/plugin-updater';

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

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'installing'
  | 'error';

const UPDATE_INSTALL_NOTICE_MS = 1400;

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
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isUpdateNoticeDismissed, setIsUpdateNoticeDismissed] = useState(false);
  const mustSelectIdentity = !showSplash && !identity;
  const identityModalOpen = isIdentityModalOpen || mustSelectIdentity;
  const shouldShowUpdateNotice =
    !showSplash &&
    !isUpdateNoticeDismissed &&
    (updateStatus === 'available' ||
      updateStatus === 'downloading' ||
      updateStatus === 'installing' ||
      updateStatus === 'error');

  // Initialize theme
  useEffect(() => {
    initializeTheme();
  }, []);

  // Buscar actualizaciones al iniciar la app empaquetada.
  useEffect(() => {
    let isCancelled = false;

    const checkForUpdates = async () => {
      if (!isTauri()) return;

      try {
        setUpdateStatus('checking');
        const update = await check({ timeout: 15000 });
        if (isCancelled) return;

        if (update) {
          setAvailableUpdate(update);
          setUpdateStatus('available');
        } else {
          setUpdateStatus('idle');
        }
      } catch (error) {
        console.warn('No se pudo comprobar actualizaciones:', error);
        if (!isCancelled) setUpdateStatus('idle');
      }
    };

    void checkForUpdates();

    return () => {
      isCancelled = true;
    };
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

  const installAvailableUpdate = async () => {
    if (!availableUpdate) return;

    try {
      setUpdateStatus('downloading');
      setDownloadProgress(0);
      let downloaded = 0;
      let contentLength = 0;

      await availableUpdate.download((event: DownloadEvent) => {
        if (event.event === 'Started') {
          contentLength = event.data.contentLength ?? 0;
          downloaded = 0;
          setDownloadProgress(0);
          return;
        }

        if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          if (contentLength > 0) {
            setDownloadProgress(
              Math.min(100, Math.round((downloaded / contentLength) * 100)),
            );
          }
          return;
        }

        if (event.event === 'Finished') {
          setDownloadProgress(100);
        }
      });

      setUpdateStatus('installing');
      await new Promise((resolve) =>
        window.setTimeout(resolve, UPDATE_INSTALL_NOTICE_MS),
      );
      await availableUpdate.install();
      await relaunch();
    } catch (error) {
      console.error('No se pudo instalar la actualizacion:', error);
      setUpdateStatus('error');
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
      {shouldShowUpdateNotice && (
        <div className={`update-notice ${updateStatus}`}>
          <div>
            <strong>
              {updateStatus === 'error'
                ? 'No se pudo actualizar'
                : updateStatus === 'installing'
                  ? 'Actualizacion descargada'
                  : updateStatus === 'downloading'
                    ? 'Descargando actualizacion'
                    : 'Actualizacion disponible'}
            </strong>
            <span>
              {updateStatus === 'installing'
                ? 'La app se cerrara unos segundos y se reiniciara al terminar.'
                : availableUpdate
                  ? `Version ${availableUpdate.version}`
                  : 'Revisa tu conexion e intenta nuevamente.'}
            </span>
          </div>
          {(updateStatus === 'downloading' || updateStatus === 'installing') && (
            <div className="update-notice-progress" aria-label="Progreso de descarga">
              <span style={{ width: `${downloadProgress}%` }} />
            </div>
          )}
          <div className="update-notice-actions">
            {updateStatus === 'available' && (
              <button type="button" onClick={() => void installAvailableUpdate()}>
                Actualizar
              </button>
            )}
            {(updateStatus === 'available' || updateStatus === 'error') && (
              <button type="button" onClick={() => setIsUpdateNoticeDismissed(true)}>
                Luego
              </button>
            )}
          </div>
        </div>
      )}
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
